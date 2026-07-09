import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/ui/PageHeader'
import ChequeEntry from '@/components/cheques/ChequeEntry'
import { formatEuro, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ChequesPage() {
  const cheques = await prisma.payment.findMany({
    where: { method: 'CHEQUE' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { shipment: { select: { recipientName: true } } },
  })

  return (
    <div>
      <PageHeader
        title="Cheques"
        subtitle="Record cheque payments that arrive physically with the ACS cheque list."
      />

      <ChequeEntry />

      <div className="panel animate-fade-up" style={{ marginTop: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>Recent cheques</p>
        </div>
        {cheques.length === 0 ? (
          <p style={{ padding: '24px 18px', fontSize: 13, color: '#8A939B' }}>No cheques recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {['Tracking', 'Recipient', 'Bank', 'Cheque no.', 'Amount', 'Date'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cheques.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{c.trackingNumber}</td>
                  <td style={{ ...tdStyle, color: '#445056' }}>{c.shipment?.recipientName || '—'}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{c.bank || '—'}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{c.chequeNumber || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{formatEuro(c.amount)}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{formatDate(c.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '9px 16px', fontSize: 10.5, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B',
}
const tdStyle: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
