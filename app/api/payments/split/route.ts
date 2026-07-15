import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeByTracking } from '@/lib/reconcile'
import { parseAcsDate } from '@/lib/acs'
import { amountsMatch } from '@/lib/utils'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Allocation {
  trackingNumber: string
  amount: number
}

// One cheque split across several shipments.
// Safety net: the allocations MUST add up to the cheque amount exactly.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  const total = Number(body.total)
  const bank = body.bank ? String(body.bank).trim() : null
  const chequeNumber = body.chequeNumber ? String(body.chequeNumber).trim() : null
  const paymentDate = parseAcsDate(body.paymentDate) ?? new Date()

  const raw: unknown = body.allocations
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: 'No shipments selected.' }, { status: 400 })
  }
  const allocations: Allocation[] = raw.map((a: { trackingNumber?: unknown; amount?: unknown }) => ({
    trackingNumber: String(a?.trackingNumber ?? '').trim(),
    amount: Number(a?.amount),
  }))

  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: 'Enter a valid cheque amount greater than zero.' }, { status: 400 })
  }
  for (const a of allocations) {
    if (!a.trackingNumber) return NextResponse.json({ error: 'Every line needs a tracking number.' }, { status: 400 })
    if (!Number.isFinite(a.amount) || a.amount <= 0) {
      return NextResponse.json({ error: `Enter a valid amount for ${a.trackingNumber}.` }, { status: 400 })
    }
  }

  const trackings = allocations.map((a) => a.trackingNumber)
  if (new Set(trackings).size !== trackings.length) {
    return NextResponse.json({ error: 'The same shipment is selected twice.' }, { status: 400 })
  }

  // The safety net: total allocated must equal the cheque amount (to the cent).
  const allocated = allocations.reduce((s, a) => s + a.amount, 0)
  if (!amountsMatch(allocated, total)) {
    return NextResponse.json(
      { error: `Allocations (€${allocated.toFixed(2)}) do not match the cheque amount (€${total.toFixed(2)}).` },
      { status: 422 }
    )
  }

  // Duplicate-cheque guard (once for the whole cheque).
  if (chequeNumber && body.force !== true) {
    const existing = await prisma.payment.findFirst({
      where: {
        method: 'CHEQUE',
        chequeNumber: { equals: chequeNumber, mode: 'insensitive' },
        ...(bank ? { bank: { equals: bank, mode: 'insensitive' } } : {}),
      },
      select: { trackingNumber: true, amount: true, bank: true, createdAt: true },
    })
    if (existing) {
      return NextResponse.json(
        {
          duplicate: true,
          existing: {
            trackingNumber: existing.trackingNumber,
            amount: Number(existing.amount),
            bank: existing.bank,
            createdAt: existing.createdAt,
          },
        },
        { status: 409 }
      )
    }
  }

  const shipments = await prisma.shipment.findMany({
    where: { trackingNumber: { in: trackings } },
    select: { id: true, trackingNumber: true },
  })
  const byTracking = new Map(shipments.map((s) => [s.trackingNumber, s.id]))
  const missing = trackings.filter((t) => !byTracking.has(t))
  if (missing.length > 0) {
    return NextResponse.json({ error: `No shipment found for: ${missing.join(', ')}` }, { status: 400 })
  }

  await prisma.$transaction(
    allocations.map((a) =>
      prisma.payment.create({
        data: {
          method: 'CHEQUE',
          amount: a.amount,
          paymentDate,
          source: 'MANUAL_CHEQUE',
          bank,
          chequeNumber,
          chequeStatus: 'PENDING',
          trackingNumber: a.trackingNumber,
          shipmentId: byTracking.get(a.trackingNumber) ?? null,
          createdBy: session.user?.name ?? null,
        },
      })
    )
  )

  await recomputeByTracking(trackings)

  // One audit entry per shipment so each shipment's History shows its share.
  for (const a of allocations) {
    await audit({
      user: session.user?.name,
      action: 'PAYMENT_ADD',
      trackingNumber: a.trackingNumber,
      detail: `CHEQUE €${a.amount.toFixed(2)} — share of cheque ${chequeNumber ?? ''}${bank ? ` (${bank})` : ''} €${total.toFixed(2)} split across ${allocations.length} shipments`,
    })
  }

  return NextResponse.json({ ok: true, created: allocations.length })
}
