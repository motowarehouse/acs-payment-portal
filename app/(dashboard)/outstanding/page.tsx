import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { toNumber, formatEuro, formatDate } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/Badges'

export const dynamic = 'force-dynamic'

export default async function OutstandingPage() {
  const shipments = await prisma.shipment.findMany({
    where: { status: { in: OUTSTANDING_STATUSES } },
    include: { payments: true },
    orderBy: { pickupDate: 'asc' },
  })

  const rows = shipments
    .map((s) => {
      const paid = s.payments.reduce((a, p) => a + toNumber(p.amount), 0)
      return { s, paid, remaining: Math.max(toNumber(s.codAmount) - paid, 0) }
    })
    .sort((a, b) => b.remaining - a.remaining)

  const total = rows.reduce((a, r) => a + r.remaining, 0)

  return (
    <div>
      <PageHeader
        title="Outstanding COD"
        subtitle={`${rows.length} shipment${rows.length === 1 ? '' : 's'} still owing`}
        action={
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#B7791F', lineHeight: 1 }}>{formatEuro(total)}</p>
            <p style={{ fontSize: 11, color: '#8A939B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>total outstanding</p>
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: '40px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#256D46' }}>All caught up</p>
          <p style={{ fontSize: 12.5, color: '#8A939B', marginTop: 3 }}>Every COD shipment has been fully paid.</p>
        </div>
      ) : (
        <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {['Tracking', 'Recipient', 'Pickup', 'COD', 'Paid', 'Remaining', 'Status'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, paid, remaining }) => (
                <tr key={s.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={td}><Link href={`/shipments/${s.id}`} style={link}>{s.trackingNumber}</Link></td>
                  <td style={{ ...td, color: '#1A2226', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.recipientName || '—'}</td>
                  <td style={{ ...td, color: '#667079' }}>{formatDate(s.pickupDate)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{formatEuro(s.codAmount)}</td>
                  <td style={{ ...td, color: paid > 0 ? '#2F8F5B' : '#A6AEB2' }}>{paid > 0 ? formatEuro(paid) : '—'}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#B7791F' }}>{formatEuro(remaining)}</td>
                  <td style={td}><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }
const td: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
const link: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }
