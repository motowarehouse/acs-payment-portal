import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/Badges'
import { formatEuro, formatDate, toNumber } from '@/lib/utils'
import { AlertTriangle, HelpCircle, Copy, CheckCircle2, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ExceptionsPage() {
  const locale = getLocale()
  const tr = t(locale)

  const [exceptionShipments, shortCollections, unmatchedPayments, duplicates] = await Promise.all([
    prisma.shipment.findMany({ where: { status: 'EXCEPTION' }, include: { payments: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.shipment.findMany({ where: { status: 'PARTIALLY_PAID' }, include: { payments: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.payment.findMany({ where: { shipmentId: null }, orderBy: { createdAt: 'desc' } }),
    prisma.shipment.findMany({ where: { isDuplicate: true }, orderBy: { updatedAt: 'desc' } }),
  ])

  const total = exceptionShipments.length + shortCollections.length + unmatchedPayments.length + duplicates.length

  return (
    <div>
      <PageHeader title={tr('exc_title')} subtitle={tr('exc_sub')} />

      {total === 0 && (
        <div className="panel animate-fade-up" style={{ padding: '40px 18px', textAlign: 'center' }}>
          <CheckCircle2 size={30} color="#2F8F5B" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#256D46' }}>{tr('nothingReview')}</p>
          <p style={{ fontSize: 12.5, color: '#8A939B', marginTop: 3 }}>{tr('nothingReviewSub')}</p>
        </div>
      )}

      {exceptionShipments.length > 0 && (
        <Section icon={AlertTriangle} color="#DE1D1C" title={tr('amountExc')} count={exceptionShipments.length} subtitle={tr('amountExcSub')}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#FAFBFC' }}>{[tr('col_tracking'), tr('col_recipient'), tr('cod'), tr('col_paid'), tr('col_status')].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {exceptionShipments.map((s) => {
                const paid = s.payments.reduce((sum, p) => sum + toNumber(p.amount), 0)
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                    <td style={td}><Link href={`/shipments/${s.id}`} style={link}>{s.trackingNumber}</Link></td>
                    <td style={{ ...td, color: '#445056' }}>{s.recipientName || '—'}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{formatEuro(s.codAmount)}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#DE1D1C' }}>{formatEuro(paid)}</td>
                    <td style={td}><StatusBadge status={s.status} locale={locale} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}

      {shortCollections.length > 0 && (
        <Section icon={TrendingDown} color="#B7791F" title={tr('shortColl')} count={shortCollections.length} subtitle={tr('shortCollSub')}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#FAFBFC' }}>{[tr('col_tracking'), tr('col_recipient'), tr('cod'), tr('col_paid'), tr('col_short')].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {shortCollections.map((s) => {
                const paid = s.payments.reduce((sum, p) => sum + toNumber(p.amount), 0)
                const short = Math.max(toNumber(s.codAmount) - paid, 0)
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                    <td style={td}><Link href={`/shipments/${s.id}`} style={link}>{s.trackingNumber}</Link></td>
                    <td style={{ ...td, color: '#445056' }}>{s.recipientName || '—'}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{formatEuro(s.codAmount)}</td>
                    <td style={{ ...td, color: '#2F8F5B' }}>{formatEuro(paid)}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#B7791F' }}>{formatEuro(short)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}

      {unmatchedPayments.length > 0 && (
        <Section icon={HelpCircle} color="#0284A8" title={tr('unmatchedTitle')} count={unmatchedPayments.length} subtitle={tr('unmatchedSub')}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#FAFBFC' }}>{[tr('col_tracking'), tr('col_method'), tr('amount'), tr('col_recorded')].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {unmatchedPayments.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{p.trackingNumber}</td>
                  <td style={{ ...td, color: '#445056' }}>{p.method}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{formatEuro(p.amount)}</td>
                  <td style={{ ...td, color: '#667079' }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {duplicates.length > 0 && (
        <Section icon={Copy} color="#7C3AED" title={tr('dupTitle')} count={duplicates.length} subtitle={tr('dupSub')}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#FAFBFC' }}>{[tr('col_tracking'), tr('col_recipient'), tr('cod'), tr('col_status')].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {duplicates.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={td}><Link href={`/shipments/${s.id}`} style={link}>{s.trackingNumber}</Link></td>
                  <td style={{ ...td, color: '#445056' }}>{s.recipientName || '—'}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{formatEuro(s.codAmount)}</td>
                  <td style={td}><StatusBadge status={s.status} locale={locale} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  )
}

function Section({ icon: Icon, color, title, subtitle, count, children }: { icon: React.ElementType; color: string; title: string; subtitle: string; count: number; children: React.ReactNode }) {
  return (
    <div className="panel animate-fade-up" style={{ overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={17} color={color} strokeWidth={1.9} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{title}</p>
          <p style={{ fontSize: 11.5, color: '#8A939B', marginTop: 1 }}>{subtitle}</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}14`, padding: '3px 10px', borderRadius: 20 }}>{count}</span>
      </div>
      {children}
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '9px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }
const td: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
const link: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }
