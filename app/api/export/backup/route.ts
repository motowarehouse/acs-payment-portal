import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/utils'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Full data backup: every shipment, payment and import batch in one workbook.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [shipments, payments, batches] = await Promise.all([
    prisma.shipment.findMany({ orderBy: { pickupDate: 'asc' } }),
    prisma.payment.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.importBatch.findMany({ orderBy: { uploadedAt: 'asc' } }),
  ])

  const shipmentRows = shipments.map((s) => ({
    'Tracking': s.trackingNumber,
    'Direction': s.direction,
    'Recipient': s.recipientName ?? '',
    'Recipient code': s.recipientCode ?? '',
    'Sender': s.sender ?? '',
    'Route': s.routeCode ?? '',
    'Pickup date': s.pickupDate ? s.pickupDate.toISOString().slice(0, 10) : '',
    'Delivered at': s.deliveredAt ? s.deliveredAt.toISOString() : '',
    'COD €': toNumber(s.codAmount),
    'Status': s.status,
    'Manual status': s.statusManual ? 'YES' : '',
    'Duplicate flag': s.isDuplicate ? 'YES' : '',
    'Notes': s.notes ?? '',
  }))

  const paymentRows = payments.map((p) => ({
    'Tracking': p.trackingNumber,
    'Method': p.method,
    'Amount €': toNumber(p.amount),
    'Payment date': p.paymentDate ? p.paymentDate.toISOString().slice(0, 10) : '',
    'Source': p.source,
    'Bank': p.bank ?? '',
    'Cheque no.': p.chequeNumber ?? '',
    'Cheque status': p.chequeStatus ?? '',
    'Matched': p.shipmentId ? 'YES' : 'NO',
    'Entered by': p.createdBy ?? '',
    'Entered at': p.createdAt.toISOString(),
  }))

  const batchRows = batches.map((b) => ({
    'Type': b.type,
    'Filename': b.filename,
    'Uploaded at': b.uploadedAt.toISOString(),
    'Uploaded by': b.uploadedBy ?? '',
    'Rows': b.totalRows,
    'Created': b.createdCount,
    'Updated': b.updatedCount,
    'Matched': b.matchedCount,
    'Unmatched': b.unmatchedCount,
    'Duplicates': b.duplicateCount,
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shipmentRows), 'Shipments')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payments')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(batchRows), 'Imports')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  const filename = `ACS_Portal_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
