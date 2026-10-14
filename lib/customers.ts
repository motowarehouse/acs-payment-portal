import { prisma } from '@/lib/prisma'
import { toNumber, paidSum } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'

export interface CustomerAgg {
  key: string
  name: string
  code: string | null
  shipments: number
  cod: number
  collected: number
  outstanding: number
}

/** Per-customer COD totals, grouped by customer code (or name when no code). Largest outstanding first. */
export async function getCustomerTotals(): Promise<CustomerAgg[]> {
  // Only outbound COD shipments concern customer balances
  const shipments = await prisma.shipment.findMany({
    where: { direction: 'OUTBOUND', codAmount: { gt: 0 } },
    include: { payments: true },
  })

  const map = new Map<string, CustomerAgg>()

  for (const s of shipments) {
    const key = s.recipientCode || (s.recipientName || 'Unknown').trim().toUpperCase()
    const paid = paidSum(s.payments)
    const cod = toNumber(s.codAmount)
    const outstanding = OUTSTANDING_STATUSES.includes(s.status) ? Math.max(cod - paid, 0) : 0

    const existing = map.get(key)
    if (existing) {
      existing.shipments += 1
      existing.cod += cod
      existing.collected += paid
      existing.outstanding += outstanding
      if (!existing.name && s.recipientName) existing.name = s.recipientName
    } else {
      map.set(key, {
        key,
        name: s.recipientName || 'Unknown',
        code: s.recipientCode,
        shipments: 1,
        cod,
        collected: paid,
        outstanding,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding || b.cod - a.cod)
}
