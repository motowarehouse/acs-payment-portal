import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import ImportClient from '@/components/import/ImportClient'
import UndoImportButton from '@/components/import/UndoImportButton'
import { formatDateTime } from '@/lib/utils'
import { PackageSearch, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const tr = t(getLocale())
  const batches = await prisma.importBatch.findMany({ orderBy: { uploadedAt: 'desc' }, take: 12 })

  return (
    <div>
      <PageHeader title={tr('import_title')} subtitle={tr('import_sub')} />

      <ImportClient />

      <div className="panel animate-fade-up" style={{ marginTop: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{tr('recentImports')}</p>
        </div>
        {batches.length === 0 ? (
          <p style={{ padding: '24px 18px', fontSize: 13, color: '#8A939B' }}>{tr('noImportsYet')}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {[tr('col_type'), tr('col_file'), tr('col_when'), tr('col_by'), tr('col_result'), ''].map((h, i) => (
                  <th key={i} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#445056' }}>
                      {b.type === 'SHIPMENTS' ? <PackageSearch size={13} color="#009BB4" /> : <Wallet size={13} color="#009BB4" />}
                      {b.type === 'SHIPMENTS' ? tr('nav_shipments') : tr('payments')}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#667079', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.filename}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{formatDateTime(b.uploadedAt)}</td>
                  <td style={{ ...tdStyle, color: '#667079' }}>{b.uploadedBy || '—'}</td>
                  <td style={tdStyle}>
                    {b.type === 'SHIPMENTS'
                      ? `${b.createdCount} new, ${b.updatedCount} updated${b.duplicateCount ? `, ${b.duplicateCount} dup` : ''}`
                      : `${b.matchedCount} matched${b.unmatchedCount ? `, ${b.unmatchedCount} unmatched` : ''}`}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><UndoImportButton id={b.id} /></td>
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
