import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeByTracking } from '@/lib/reconcile'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Undo an import.
//  - PAYMENTS: delete the payment lines this import created, then recompute.
//  - SHIPMENTS: delete only shipments this import CREATED that have no payments
//    (updated rows and rows that already have payments are left untouched).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const batch = await prisma.importBatch.findUnique({ where: { id: params.id } })
  if (!batch) return NextResponse.json({ error: 'Import not found.' }, { status: 404 })

  if (batch.type === 'PAYMENTS') {
    const payments = await prisma.payment.findMany({
      where: { importBatchId: batch.id },
      select: { trackingNumber: true },
    })
    const trackings = payments.map((p) => p.trackingNumber)
    await prisma.payment.deleteMany({ where: { importBatchId: batch.id } })
    await recomputeByTracking(trackings)
    await prisma.importBatch.delete({ where: { id: batch.id } })
    await audit({ user: session.user?.name, action: 'IMPORT_UNDO', detail: `Payments import "${batch.filename}" undone — ${payments.length} payment line(s) removed` })
    return NextResponse.json({ ok: true, type: 'PAYMENTS', removed: payments.length })
  }

  // SHIPMENTS
  const created = await prisma.shipment.findMany({
    where: { originBatchId: batch.id },
    include: { _count: { select: { payments: true } } },
  })
  const deletable = created.filter((s) => s._count.payments === 0)
  const kept = created.length - deletable.length

  await prisma.shipment.deleteMany({ where: { id: { in: deletable.map((s) => s.id) } } })
  await prisma.importBatch.delete({ where: { id: batch.id } })
  await audit({ user: session.user?.name, action: 'IMPORT_UNDO', detail: `Shipments import "${batch.filename}" undone — ${deletable.length} removed, ${kept} kept (had payments)` })

  return NextResponse.json({
    ok: true,
    type: 'SHIPMENTS',
    removed: deletable.length,
    kept, // shipments left because they already have payments
  })
}
