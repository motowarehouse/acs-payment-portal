'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Download } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badges'
import CopyButton from '@/components/ui/CopyButton'
import { useT, useLocale } from '@/components/i18n/LocaleProvider'
import type { ShipmentStatus } from '@prisma/client'

export interface OutstandingRow {
  id: string
  trackingNumber: string
  recipientName: string | null
  pickupDate: string | null
  days: number
  cod: number
  paid: number
  remaining: number
  status: ShipmentStatus
}

/** Colour for the aging band: grey <14, amber 14–30, red >30 days. */
function ageColor(days: number): { color: string; bg: string } {
  if (days > 30) return { color: '#DE1D1C', bg: 'rgba(222,29,28,0.08)' }
  if (days >= 14) return { color: '#B7791F', bg: 'rgba(183,121,31,0.10)' }
  return { color: '#667079', bg: 'transparent' }
}

export default function OutstandingTable({ rows }: { rows: OutstandingRow[] }) {
  const tr = useT()
  const locale = useLocale()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (r) =>
        r.trackingNumber.toLowerCase().includes(needle) ||
        (r.recipientName ?? '').toLowerCase().includes(needle)
    )
  }, [rows, q])

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} color="#A6AEB2" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-base"
            style={{ paddingLeft: 32 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr('searchPlaceholder')}
          />
        </div>
        <a href="/api/export/outstanding" className="btn-ghost" style={{ textDecoration: 'none', flexShrink: 0, height: 40, display: 'inline-flex', alignItems: 'center' }}>
          <Download size={14} /> {tr('exportExcel')}
        </a>
      </div>

      <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: '28px 18px', fontSize: 13, color: '#8A939B', textAlign: 'center' }}>{tr('noMatch')}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {[tr('col_tracking'), tr('col_recipient'), tr('col_pickup'), tr('col_days'), tr('cod'), tr('col_paid'), tr('remaining'), tr('col_status')].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const age = ageColor(r.days)
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <Link href={`/shipments/${r.id}`} style={link}>{r.trackingNumber}</Link>
                      <CopyButton text={r.trackingNumber} title={tr('copyTracking')} copiedTitle={tr('copied')} />
                    </td>
                    <td style={{ ...td, color: '#1A2226', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.recipientName || '—'}</td>
                    <td style={{ ...td, color: '#667079' }}>{formatDate(r.pickupDate)}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: age.color, background: age.bg, padding: '2px 8px', borderRadius: 3 }}>
                        {r.days}
                      </span>
                    </td>
                    <td style={{ ...td, fontWeight: 700 }}>{formatEuro(r.cod)}</td>
                    <td style={{ ...td, color: r.paid > 0 ? '#2F8F5B' : '#A6AEB2' }}>{r.paid > 0 ? formatEuro(r.paid) : '—'}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#B7791F' }}>{formatEuro(r.remaining)}</td>
                    <td style={td}><StatusBadge status={r.status} locale={locale} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }
const td: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
const link: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }
