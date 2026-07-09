import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parsePaymentFile } from '@/lib/acs'
import { recomputeByTracking } from '@/lib/reconcile'
import { amountsMatch } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }

  const buffer = Buffer.from(await (file as File).arrayBuffer())
  const { rows, error } = parsePaymentFile(buffer)
  if (error) return NextResponse.json({ error }, { status: 422 })
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No payment rows found in the file.' }, { status: 422 })
  }

  const batch = await prisma.importBatch.create({
    data: {
      type: 'PAYMENTS',
      filename: (file as File).name || 'payments.xls',
      uploadedBy: session.user?.name ?? null,
      totalRows: rows.length,
    },
  })

  let matched = 0
  let unmatched = 0
  let skipped = 0
  const unmatchedList: { trackingNumber: string; amount: number; recipient: string | null }[] = []

  for (const row of rows) {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: row.trackingNumber },
      select: { id: true },
    })

    // Skip an exact re-import of the same payment line
    const dup = await prisma.payment.findFirst({
      where: {
        trackingNumber: row.trackingNumber,
        source: 'IMPORT',
        amount: row.amount,
        deliveryDate: row.deliveryDate ?? undefined,
      },
      select: { id: true },
    })
    if (dup) {
      skipped++
      continue
    }

    await prisma.payment.create({
      data: {
        method: 'ACS',
        amount: row.amount,
        deliveryDate: row.deliveryDate,
        paymentDate: row.deliveryDate,
        source: 'IMPORT',
        trackingNumber: row.trackingNumber,
        shipmentId: shipment?.id ?? null,
        importBatchId: batch.id,
        createdBy: session.user?.name ?? null,
      },
    })

    if (shipment) matched++
    else {
      unmatched++
      unmatchedList.push({ trackingNumber: row.trackingNumber, amount: row.amount, recipient: row.recipient })
    }
  }

  await recomputeByTracking(rows.map((r) => r.trackingNumber))

  // Flag amount mismatches for a helpful summary (exceptions surface separately)
  const affected = await prisma.shipment.findMany({
    where: { trackingNumber: { in: rows.map((r) => r.trackingNumber) } },
    include: { payments: true },
  })
  let mismatches = 0
  for (const s of affected) {
    const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    if (s.direction === 'OUTBOUND' && Number(s.codAmount) > 0 && !amountsMatch(paid, Number(s.codAmount)) && paid > 0) {
      mismatches++
    }
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      matchedCount: matched,
      unmatchedCount: unmatched,
      notes:
        unmatchedList.length > 0
          ? `Unmatched AWBs: ${unmatchedList.map((u) => u.trackingNumber).join(', ')}`
          : null,
    },
  })

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    totalRows: rows.length,
    matched,
    unmatched,
    skipped,
    mismatches,
    paidTotal: rows.reduce((s, r) => s + r.amount, 0),
    unmatchedList,
  })
}
