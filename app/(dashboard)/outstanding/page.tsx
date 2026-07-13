import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import { toNumber, formatEuro, paidSum, daysSince } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import OutstandingTable from '@/components/outstanding/OutstandingTable'

export const dynamic = 'force-dynamic'

export default async function OutstandingPage() {
  const locale = getLocale()
  const tr = t(locale)

  const shipments = await prisma.shipment.findMany({
    where: { status: { in: OUTSTANDING_STATUSES } },
    include: { payments: true },
    orderBy: { pickupDate: 'asc' },
  })

  // Oldest first — the longest-owed COD is what needs chasing.
  const rows = shipments
    .map((s) => {
      const paid = paidSum(s.payments)
      return {
        id: s.id,
        trackingNumber: s.trackingNumber,
        recipientName: s.recipientName,
        pickupDate: s.pickupDate ? s.pickupDate.toISOString() : null,
        days: daysSince(s.pickupDate),
        cod: toNumber(s.codAmount),
        paid,
        remaining: Math.max(toNumber(s.codAmount) - paid, 0),
        status: s.status,
      }
    })
    .sort((a, b) => b.days - a.days)

  const total = rows.reduce((a, r) => a + r.remaining, 0)

  return (
    <div>
      <PageHeader
        title={tr('out_title')}
        subtitle={`${rows.length} ${rows.length === 1 ? tr('out_sub_one') : tr('out_sub_many')}`}
        action={
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#B7791F', lineHeight: 1 }}>{formatEuro(total)}</p>
            <p style={{ fontSize: 11, color: '#8A939B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tr('totalOutstanding')}</p>
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: '40px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#256D46' }}>{tr('allCaught')}</p>
          <p style={{ fontSize: 12.5, color: '#8A939B', marginTop: 3 }}>{tr('allCaughtSub')}</p>
        </div>
      ) : (
        <OutstandingTable rows={rows} />
      )}
    </div>
  )
}
