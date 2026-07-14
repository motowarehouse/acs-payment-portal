import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ChequeEntry from '@/components/cheques/ChequeEntry'
import ChequeStatusControl from '@/components/cheques/ChequeStatusControl'
import { formatEuro, formatDate, toNumber } from '@/lib/utils'
import { Hourglass, CircleCheck, CircleX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ChequesPage() {
  const tr = t(getLocale())

  const [cheques, allCheques] = await Promise.all([
    prisma.payment.findMany({
      where: { method: 'CHEQUE' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { shipment: { select: { id: true, recipientName: true } } },
    }),
    prisma.payment.findMany({
      where: { method: 'CHEQUE' },
      select: { amount: true, chequeStatus: true, paymentDate: true, createdAt: true },
    }),
  ])

  // null = cheques saved before the lifecycle feature; they count as pending
  const pending = allCheques.filter((c) => c.chequeStatus === 'PENDING' || c.chequeStatus === null)
  const pendingTotal = pending.reduce((s, c) => s + toNumber(c.amount), 0)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const clearedMonth = allCheques
    .filter((c) => c.chequeStatus === 'CLEARED' && (c.paymentDate ?? c.createdAt) >= monthStart)
    .reduce((s, c) => s + toNumber(c.amount), 0)

  const bounced = allCheques.filter((c) => c.chequeStatus === 'BOUNCED')
  const bouncedTotal = bounced.reduce((s, c) => s + toNumber(c.amount), 0)

  return (
    <div>
      <PageHeader title={tr('cheques_title')} subtitle={tr('cheques_sub')} />

      <div className="cheques-top" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start', marginBottom: 24 }}>
        <ChequeEntry />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StatPanel
            icon={<Hourglass size={16} color="#B7791F" strokeWidth={2} />}
            iconBg="rgba(183,121,31,0.10)"
            label={tr('stat_pending')}
            value={formatEuro(pendingTotal)}
            accent="#B7791F"
            sub={`${pending.length} ${tr('stat_pending_sub')}`}
          />
          <StatPanel
            icon={<CircleCheck size={16} color="#2F8F5B" strokeWidth={2} />}
            iconBg="rgba(47,143,91,0.10)"
            label={tr('stat_cleared')}
            value={formatEuro(clearedMonth)}
            accent="#2F8F5B"
            sub={tr('stat_cleared_sub')}
          />
          <StatPanel
            icon={<CircleX size={16} color="#DE1D1C" strokeWidth={2} />}
            iconBg="rgba(222,29,28,0.08)"
            label={tr('stat_bounced')}
            value={bounced.length === 0 ? '—' : formatEuro(bouncedTotal)}
            accent={bounced.length === 0 ? '#A6AEB2' : '#DE1D1C'}
            sub={bounced.length === 0 ? tr('stat_bounced_none') : `${bounced.length} ${tr('stat_bounced_sub')}`}
          />
        </div>
      </div>

      <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{tr('recentCheques')}</p>
          {pending.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B7791F', background: 'rgba(183,121,31,0.10)', padding: '3px 10px', borderRadius: 3 }}>
              {pending.length} {tr('chequesPending')}
            </span>
          )}
        </div>
        {cheques.length === 0 ? (
          <p style={{ padding: '24px 18px', fontSize: 13, color: '#8A939B' }}>{tr('noCheques')}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {[tr('col_tracking'), tr('recipient'), tr('bank'), tr('chequeNo'), tr('amount'), tr('paymentDate'), tr('col_status')].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cheques.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>
                    {c.shipment ? (
                      <Link href={`/shipments/${c.shipment.id}`} style={{ color: '#009BB4', textDecoration: 'none', fontWeight: 700 }}>{c.trackingNumber}</Link>
                    ) : c.trackingNumber}
                  </td>
                  <td style={{ ...tdStyle, color: '#445056', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.shipment?.recipientName || '—'}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{c.bank || '—'}</td>
                  <td style={{ ...tdStyle, color: '#667079', fontFamily: 'monospace', fontSize: 12 }}>{c.chequeNumber || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{formatEuro(c.amount)}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{formatDate(c.paymentDate)}</td>
                  <td style={tdStyle}><ChequeStatusControl paymentId={c.id} status={c.chequeStatus ?? 'PENDING'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatPanel({ icon, iconBg, label, value, accent, sub }: { icon: React.ReactNode; iconBg: string; label: string; value: string; accent: string; sub: string }) {
  return (
    <div className="panel animate-fade-up" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 4, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }}>{label}</p>
        <p style={{ fontSize: 21, fontWeight: 900, color: accent, lineHeight: 1.15, marginTop: 2 }}>{value}</p>
        <p style={{ fontSize: 11.5, color: '#A6AEB2', marginTop: 2 }}>{sub}</p>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '9px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }
const tdStyle: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
