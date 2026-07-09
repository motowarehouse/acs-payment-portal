import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseShipmentFile } from '@/lib/acs'
import { recomputeByTracking } from '@/lib/reconcile'

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
  const { rows, error } = parseShipmentFile(buffer)
  if (error) return NextResponse.json({ error }, { status: 422 })
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No shipment rows found in the file.' }, { status: 422 })
  }

  // ── Detect duplicate tracking numbers within THIS file ──
  const counts = new Map<string, number>()
  for (const row of rows) counts.set(row.trackingNumber, (counts.get(row.trackingNumber) || 0) + 1)
  const duplicateTracking = Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([t]) => t)
  const dupSet = new Set(duplicateTracking)

  const batch = await prisma.importBatch.create({
    data: {
      type: 'SHIPMENTS',
      filename: (file as File).name || 'shipments.xlsx',
      uploadedBy: session.user?.name ?? null,
      totalRows: rows.length,
    },
  })

  let created = 0
  let updated = 0

  for (const row of rows) {
    const existing = await prisma.shipment.findUnique({
      where: { trackingNumber: row.trackingNumber },
      select: { id: true },
    })

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
      raw: row.raw as object,
      importBatchId: batch.id,
    }

    if (existing) {
      // Update descriptive fields only; status is recomputed afterwards
      // and manual overrides / RETURNED are respected there.
      await prisma.shipment.update({ where: { id: existing.id }, data: common })
      updated++
    } else {
      await prisma.shipment.create({
        data: { trackingNumber: row.trackingNumber, ...common },
      })
      created++
    }
  }

  // Recompute statuses (handles new AWAITING/NO_COD and any pre-existing payments)
  await recomputeByTracking(rows.map((r) => r.trackingNumber))

  const notes =
    duplicateTracking.length > 0
      ? `Duplicate tracking numbers in file: ${duplicateTracking.join(', ')}`
      : null

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      createdCount: created,
      updatedCount: updated,
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
    created,
    updated,
    outbound: outbound.length,
    inbound: rows.length - outbound.length,
    codShipments: withCod.length,
    codTotal: withCod.reduce((s, r) => s + r.codAmount, 0),
    duplicates: duplicateTracking,
  })
}
