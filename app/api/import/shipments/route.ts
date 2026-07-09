import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseShipmentFile } from '@/lib/acs'
import { computeStatus } from '@/lib/status'
import { recomputeShipment } from '@/lib/reconcile'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Run async work in bounded-concurrency chunks to avoid exhausting the pool.
async function inChunks<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }

  const buffer = Buffer.from(await (file as File).arrayBuffer())
  const { rows, error } = parseShipmentFile(buffer)
  if (error) return NextResponse.json({ error }, { status: 422 })
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No shipment rows found in the file.' }, { status: 422 })
  }

  // Duplicate tracking numbers within THIS file
  const counts = new Map<string, number>()
  for (const row of rows) counts.set(row.trackingNumber, (counts.get(row.trackingNumber) || 0) + 1)
  const duplicateTracking = Array.from(counts.entries()).filter(([, n]) => n > 1).map(([tn]) => tn)
  const dupSet = new Set(duplicateTracking)

  const batch = await prisma.importBatch.create({
    data: {
      type: 'SHIPMENTS',
      filename: (file as File).name || 'shipments.xlsx',
      uploadedBy: session.user?.name ?? null,
      totalRows: rows.length,
    },
  })

  // ── One query to find which of these already exist, and whether they have
  //    payments / a manual status (so we know how to set the status). ──
  const trackingNumbers = rows.map((r) => r.trackingNumber)
  const existing = await prisma.shipment.findMany({
    where: { trackingNumber: { in: trackingNumbers } },
    select: {
      id: true,
      trackingNumber: true,
      statusManual: true,
      status: true,
      _count: { select: { payments: true } },
    },
  })
  const existingByTracking = new Map(existing.map((s) => [s.trackingNumber, s]))

  const createData: Prisma.ShipmentCreateManyInput[] = []
  const updates: { id: string; data: Prisma.ShipmentUncheckedUpdateInput }[] = []
  const recomputeIds: string[] = []

  for (const row of rows) {
    const common = {
      pickupDate: row.pickupDate,
      deliveredAt: row.deliveredAt,
      routeCode: row.routeCode,
      direction: row.direction,
      recipientName: row.recipientName,
      recipientCode: row.recipientCode,
      receiverPerson: row.receiverPerson,
      sender: row.sender,
      productCodes: row.productCodes,
      codAmount: row.codAmount,
      pieces: row.pieces,
      weight: row.weight,
      reason: row.reason,
      remarks: row.remarks,
      isDuplicate: dupSet.has(row.trackingNumber),
      raw: row.raw as Prisma.InputJsonValue,
      importBatchId: batch.id,
    }

    const ex = existingByTracking.get(row.trackingNumber)
    if (!ex) {
      // New tracking number → insert, with an initial status computed from scratch
      createData.push({
        trackingNumber: row.trackingNumber,
        originBatchId: batch.id,
        status: computeStatus(row.codAmount, row.direction, 0),
        ...common,
      })
    } else if (ex._count.payments > 0) {
      // Has payments → update descriptive fields; recompute status afterwards
      updates.push({ id: ex.id, data: common })
      recomputeIds.push(ex.id)
    } else {
      // No payments → safe to set status directly, unless manually overridden / returned
      const keepStatus = ex.statusManual || ex.status === 'RETURNED'
      updates.push({
        id: ex.id,
        data: keepStatus ? common : { ...common, status: computeStatus(row.codAmount, row.direction, 0) },
      })
    }
  }

  // Bulk insert new rows
  if (createData.length > 0) {
    await prisma.shipment.createMany({ data: createData })
  }
  // Parallel (chunked) updates for changed rows
  await inChunks(updates, 25, (u) => prisma.shipment.update({ where: { id: u.id }, data: u.data }))
  // Recompute only shipments that actually have payments
  await inChunks(recomputeIds, 25, (id) => recomputeShipment(id))

  const notes = duplicateTracking.length > 0 ? `Duplicate tracking numbers in file: ${duplicateTracking.join(', ')}` : null
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      createdCount: createData.length,
      updatedCount: updates.length,
      duplicateCount: duplicateTracking.length,
      notes,
    },
  })

  const outbound = rows.filter((r) => r.direction === 'OUTBOUND')
  const withCod = outbound.filter((r) => r.codAmount > 0)

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    totalRows: rows.length,
    created: createData.length,
    updated: updates.length,
    outbound: outbound.length,
    inbound: rows.length - outbound.length,
    codShipments: withCod.length,
    codTotal: withCod.reduce((s, r) => s + r.codAmount, 0),
    duplicates: duplicateTracking,
  })
}
