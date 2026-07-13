import Link from 'next/link'
import { formatEuro, formatDate, toNumber, paidSum } from '@/lib/utils'
import { StatusBadge, DirectionBadge } from '@/components/ui/Badges'
import CopyButton from '@/components/ui/CopyButton'
import { t, type Locale } from '@/lib/i18n'
import type { Shipment, Payment } from '@prisma/client'
import { Upload } from 'lucide-react'

type Row = Shipment & { payments: Payment[] }

export default function ShipmentsTable({ shipments, locale = 'en', filtered = false }: { shipments: Row[]; locale?: Locale; filtered?: boolean }) {
  const tr = t(locale)

  if (shipments.length === 0) {
    return (
      <div className="panel" style={{ padding: '40px 18px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#8A939B' }}>{filtered ? tr('noMatch') : tr('ship_empty')}</p>
        {!filtered && (
          <Link href="/import" className="btn-primary" style={{ textDecoration: 'none', marginTop: 14, display: 'inline-flex' }}>
            <Upload size={14} /> {tr('goToImport')}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#FAFBFC' }}>
            {[tr('col_tracking'), tr('col_recipient'), tr('col_dir'), tr('col_pickup'), tr('col_cod'), tr('col_paid'), tr('col_status')].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => {
            const paid = paidSum(s.payments)
            return (
              <tr key={s.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <Link href={`/shipments/${s.id}`} style={{ fontFamily: 'monospace', fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }}>
                    {s.trackingNumber}
                  </Link>
                  <CopyButton text={s.trackingNumber} title={tr('copyTracking')} copiedTitle={tr('copied')} />
                </td>
                <td style={{ ...tdStyle, color: '#1A2226', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.recipientName || '—'}</td>
                <td style={tdStyle}><DirectionBadge direction={s.direction} locale={locale} /></td>
                <td style={{ ...tdStyle, color: '#667079' }}>{formatDate(s.pickupDate)}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{toNumber(s.codAmount) > 0 ? formatEuro(s.codAmount) : '—'}</td>
                <td style={{ ...tdStyle, color: paid > 0 ? '#2F8F5B' : '#A6AEB2', fontWeight: paid > 0 ? 700 : 400 }}>{paid > 0 ? formatEuro(paid) : '—'}</td>
                <td style={tdStyle}><StatusBadge status={s.status} locale={locale} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', fontSize: