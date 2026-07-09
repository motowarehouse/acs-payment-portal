import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeByTracking } from '@/lib/reconcile'

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

  return NextResponse.json({ ok: true })
}
