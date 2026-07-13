import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ChequeEntry from '@/components/cheques/ChequeEntry'
import ChequeStatusControl from '@/components/cheques/ChequeStatusControl'
import { formatEuro, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ChequesPage() {
  const tr = t(getLocale())
  const cheques = await prisma.payment.findMany({
    where: { method: 'CHEQUE' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { shipment: { select: { id: true, recipientName: true } } },
  })

  // null = cheques saved before the lifecycle feature; they count as pending
  const pendingCount = await prisma.payment.count({ where: { method: 'CHEQUE', OR: [{ chequeStatus: 'PENDING' }, { chequeStatus: null }] } })

  return (
    <div>
      <PageHeader title={tr('cheques_title')} subtitle={tr('cheques_sub')} />

      <ChequeEntry />

      <div className="panel animate-fade-up" style={{ marginTop: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{tr('recentCheques')}</p>
          {pendingCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B7791F', background: 'rgba(183,121,31,0.10)', padding: '3px 10px', borderRadius: 3 }}>
              {pendingCount} {tr('chequesPending')}
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
                  <td style={{ ...tdStyle, color: '#445056' }}>{c.shipment?.recipientName || '—'}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{c.bank || '—'}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{c.chequeNumber || '—'}</td>
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

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '9px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }
const tdStyle: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
