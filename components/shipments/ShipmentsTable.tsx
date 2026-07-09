import Link from 'next/link'
import { formatEuro, formatDate, toNumber } from '@/lib/utils'
import { StatusBadge, DirectionBadge } from '@/components/ui/Badges'
import type { Shipment, Payment } from '@prisma/client'

type Row = Shipment & { payments: Payment[] }

export default function ShipmentsTable({ shipments }: { shipments: Row[] }) {
  if (shipments.length === 0) {
    return (
      <div className="panel" style={{ padding: '36px 18px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#8A939B' }}>No shipments match these filters.</p>
      </div>
    )
  }

  return (
    <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#FAFBFC' }}>
            {['Tracking', 'Recipient', 'Dir.', 'Pickup', 'COD', 'Paid', 'Status'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => {
            const paid = s.payments.reduce((sum, p) => sum + toNumber(p.amount), 0)
            return (
              <tr key={s.id} style={{ borderTop: '1px solid #F2F4F6' }} className="hover:bg-[#FAFBFC]">
                <td style={tdStyle}>
                  <Link href={`/shipments/${s.id}`} style={{ fontFamily: 'monospace', fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }}>
                    {s.trackingNumber}
                  </Link>
                </td>
                <td style={{ ...tdStyle, color: '#1A2226', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.recipientName || '—'}</td>
                <td style={tdStyle}><DirectionBadge direction={s.direction} /></td>
                <td style={{ ...tdStyle, color: '#667079' }}>{formatDate(s.pickupDate)}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{toNumber(s.codAmount) > 0 ? formatEuro(s.codAmount) : '—'}</td>
                <td style={{ ...tdStyle, color: paid > 0 ? '#2F8F5B' : '#A6AEB2', fontWeight: paid > 0 ? 700 : 400 }}>{paid > 0 ? formatEuro(paid) : '—'}</td>
                <td style={tdStyle}><StatusBadge status={s.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 16px', fontSize: 10.5, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B',
}
const tdStyle: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
