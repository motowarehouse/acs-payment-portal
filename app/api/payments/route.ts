import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeByTracking } from '@/lib/reconcile'
import { parseAcsDate } from '@/lib/acs'
import type { PaymentMethod } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Add a manual payment line (cheque by default, or a manual cash/visa split).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  const trackingNumber = String(body.trackingNumber ?? '').trim()
  const amount = Number(body.amount)
  const method = (body.method as PaymentMethod) || 'CHEQUE'

  if (!trackingNumber) return NextResponse.json({ error: 'Tracking number is required.' }, { status: 400 })
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Enter a valid amount greater than zero.' }, { status: 400 })

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    select: { id: true },
  })

  const payment = await prisma.payment.create({
    data: {
      method,
      amount,
      paymentDate: parseAcsDate(body.paymentDate) ?? new Date(),
      source: method === 'CHEQUE' ? 'MANUAL_CHEQUE' : 'MANUAL',
      bank: body.bank ? String(body.bank).trim() : null,
      chequeNumber: body.chequeNumber ? String(body.chequeNumber).trim() : null,
      reference: body.reference ? String(body.reference).trim() : null,
      trackingNumber,
      shipmentId: shipment?.id ?? null,
      createdBy: session.user?.name ?? null,
    },
  })

  await recomputeByTracking([trackingNumber])

  const updated = shipment
    ? await prisma.shipment.findUnique({ where: { id: shipment.id }, select: { status: true } })
    : null

  return NextResponse.json({
    ok: true,
    payment,
    matched: !!shipment,
    status: updated?.status ?? null,
  })
}
