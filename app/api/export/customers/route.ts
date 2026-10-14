import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCustomerTotals } from '@/lib/customers'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Download the Customers list (per-customer COD totals) as an Excel file.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customers = await getCustomerTotals()

  const rows = customers.map((c) => ({
    'Customer': c.name,
    'Code': c.code ?? '',
    'Shipments': c.shipments,
    'COD total €': Math.round(c.cod * 100) / 100,
    'Collected €': Math.round(c.collected * 100) / 100,
    'Outstanding €': Math.round(c.outstanding * 100) / 100,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Customers')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  const filename = `Customers_${new Date().toISOString().slice(0, 10)}.xlsx`
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
