import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toNumber, paidSum, daysSince } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Download the Outstanding COD list as an Excel file.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shipments = await prisma.shipment.findMany({
    where: { status: { in: OUTSTANDING_STATUSES } },
    include: { payments: true },
    orderBy: { pickupDate: 'asc' },
  })

  const rows = shipments
    .map((s) => {
      const paid = paidSum(s.payments)
      return {
        'Tracking': s.trackingNumber,
        'Recipient': s.recipientName ?? '',
        'Pickup date': s.pickupDate ? s.pickupDate.toISOString().slice(0, 10) : '',
        'Days outstanding': daysSince(s.pickupDate),
        'COD €': toNumber(s.codAmount),
        'Paid €': paid,
        'Remaining €': Math.max(toNumber(s.codAmount) - paid, 0),
        'Status': s.status,
      }
    })
    .sort((a, b) => b['Days outstanding'] - a['Days outstanding'])

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 14 }, { wch: 36 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 16 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Outstanding COD')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  const filename = `Outstanding_COD_${new Date().toISOString().slice(0, 10)}.xlsx`
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
