import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeByTracking } from '@/lib/reconcile'
import { audit } from '@/lib/audit'
import type { ChequeStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Delete a payment line (correction) and recompute the shipment.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payment = await prisma.payment.findUnique({ where: { id: params.id } })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  await prisma.payment.delete({ where: { id: params.id } })
  await recomputeByTracking([payment.trackingNumber])

  await audit({
    user: session.user?.name,
    action: 'PAYMENT_DELETE',
    trackingNumber: payment.trackingNumber,
    detail: `${payment.method} €${Number(payment.amount).toFixed(2)}${payment.chequeNumber ? ` (cheque ${payment.chequeNumber})` : ''} deleted`,
  })

  return NextResponse.json({ ok: true })
}

// Update a cheque's lifecycle status (PENDING → CLEARED / BOUNCED) and recompute.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const chequeStatus = body?.chequeStatus as ChequeStatus | undefined
  if (!chequeStatus || !['PENDING', 'CLEARED', 'BOUNCED'].includes(chequeStatus)) {
    return NextResponse.json({ error: 'Invalid cheque status.' }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({ where: { id: params.id } })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  if (payment.method !== 'CHEQUE') return NextResponse.json({ error: 'Only cheque payments have a cheque status.' }, { status: 400 })

  const updated = await prisma.payment.update({
    where: { id: params.id },
    data: { chequeStatus },
  })
  await recomputeByTracking([payment.trackingNumber])

  await audit({
    user: session.user?.name,
    action: 'CHEQUE_STATUS',
    trackingNumber: payment.trackingNumber,
    detail: `Cheque ${payment.chequeNumber ?? ''} €${Number(payment.amount).toFixed(2)} → ${chequeStatus}`,
  })

  return NextResponse.json({ ok: true, payment: updated })
}
