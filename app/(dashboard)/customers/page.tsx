import Link from 'next/link'
import { Download } from 'lucide-react'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import { formatEuro } from '@/lib/utils'
import { getCustomerTotals } from '@/lib/customers'
import PageHeader from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const tr = t(getLocale())
  const customers = await getCustomerTotals()
  const totals = customers.reduce(
    (t, c) => ({ cod: t.cod + c.cod, collected: t.collected + c.collected, outstanding: t.outstanding + c.outstanding }),
    { cod: 0, collected: 0, outstanding: 0 },
  )

  return (
    <div>
      <PageHeader
        title={tr('cust_title')}
        subtitle={`${customers.length} ${tr('cust_sub')}`}
        action={
          customers.length > 0 && (
            <a href="/api/export/customers" className="btn-ghost" style={{ textDecoration: 'none', flexShrink: 0, height: 40, display: 'inline-flex', alignItems: 'center' }}>
              <Download size={14} /> {tr('exportExcel')}
            </a>
          )
        }
      />

      {customers.length === 0 ? (
        <div className="panel" style={{ padding: '40px 18px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#8A939B' }}>{tr('cust_empty')}</p>
        </div>
      ) : (
        <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {[tr('col_customer'), tr('col_code'), tr('col_shipments'), tr('col_codtotal'), tr('col_collected'), tr('col_outstanding')].map((h, i) => (
                  <th key={h} style={{ ...th, textAlign: i < 2 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.key} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={{ ...td, fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link href={`/shipments?q=${encodeURIComponent(c.code || c.name)}`} style={{ color: '#1A2226', textDecoration: 'none' }}>{c.name}</Link>
                  </td>
                  <td style={{ ...td, color: '#8A939B', fontFamily: 'monospace', fontSize: 12 }}>{c.code || '—'}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#667079' }}>{c.shipments}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{formatEuro(c.cod)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#2F8F5B' }}>{formatEuro(c.collected)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: c.outstanding > 0 ? '#B7791F' : '#A6AEB2' }}>{c.outstanding > 0 ? formatEuro(c.outstanding) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #E7EAED', background: '#FAFBFC' }}>
                <td style={{ ...td, fontWeight: 700 }} colSpan={3}>{tr('total')}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 900 }}>{formatEuro(totals.cod)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: '#2F8F5B' }}>{formatEuro(totals.collected)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: '#B7791F' }}>{formatEuro(totals.outstanding)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 16px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B' }
const td: React.CSSProperties = { padding: '11px 16px', fontSize: 12.5, color: '#1A2226' }
