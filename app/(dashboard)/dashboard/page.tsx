import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import { toNumber, formatEuro, formatDateTime, paidSum } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import StatCards, { type Stat } from '@/components/dashboard/StatCards'
import StatusChart, { type Slice } from '@/components/dashboard/StatusChart'
import type { ShipmentStatus } from '@prisma/client'
import { ArrowRight, Upload } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const tr = t(getLocale())
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [statusGroups, outstandingShipments, collectedAgg, exceptionCount, unmatchedCount, paidTodayAgg, recentBatches] =
    await Promise.all([
      prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.shipment.findMany({ where: { status: { in: OUTSTANDING_STATUSES } }, include: { payments: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.shipment.count({ where: { status: 'EXCEPTION' } }),
      prisma.payment.count({ where: { shipmentId: null } }),
      prisma.payment.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { createdAt: { gte: startOfToday } } }),
      prisma.importBatch.findMany({ orderBy: { uploadedAt: 'desc' }, take: 5 }),
    ])

  const outstandingTotal = outstandingShipments.reduce((sum, s) => {
    const paid = paidSum(s.payments)
    return sum + Math.max(toNumber(s.codAmount) - paid, 0)
  }, 0)
  const awaitingCount = statusGroups.find((g) => g.status === 'AWAITING')?._count._all ?? 0

  const stats: Stat[] = [
    { key: 'outstanding', label: tr('kpi_outstanding'), value: outstandingTotal, format: 'euro', accent: '#B7791F', icon: 'wallet' },
    { key: 'awaiting', label: tr('kpi_awaiting'), value: awaitingCount, format: 'number', accent: '#009BB4', icon: 'clock' },
    { key: 'collected', label: tr('kpi_collected'), value: toNumber(collectedAgg._sum.amount), format: 'euro', accent: '#2F8F5B', icon: 'check' },
    { key: 'exceptions', label: tr('kpi_review'), value: exceptionCount + unmatchedCount, format: 'number', accent: '#DE1D1C', icon: 'alert' },
  ]
  const slices: Slice[] = statusGroups.map((g) => ({ status: g.status as ShipmentStatus, count: g._count._all }))

  return (
    <div>
      <PageHeader
        title={tr('dash_title')}
        subtitle={tr('dash_sub')}
        action={
          <Link href="/import" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Upload size={14} /> {tr('importFiles')}
          </Link>
        }
      />

      <StatCards stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="panel animate-fade-up" style={{ padding: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21', marginBottom: 14 }}>{tr('shipmentStatus')}</p>
          <StatusChart data={slices} />
        </div>

        <div className="panel animate-fade-up" style={{ padding: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21', marginBottom: 4 }}>{tr('todaysRecon')}</p>
          <p style={{ fontSize: 11.5, color: '#8A939B', marginBottom: 14 }}>{tr('sinceMidnight')}</p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 30, fontWeight: 900, color: '#2F8F5B', lineHeight: 1 }}>{paidTodayAgg._count._all}</p>
              <p style={{ fontSize: 11, color: '#8A939B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{tr('payments')}</p>
            </div>
            <div>
              <p style={{ fontSize: 30, fontWeight: 900, color: '#001A21', lineHeight: 1 }}>{formatEuro(toNumber(paidTodayAgg._sum.amount))}</p>
              <p style={{ fontSize: 11, color: '#8A939B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{tr('collectedToday')}</p>
            </div>
          </div>
          <Link href="/outstanding" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#009BB4', textDecoration: 'none' }}>
            {tr('viewOutstanding')} <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{tr('recentActivity')}</p>
          <Link href="/import" style={{ fontSize: 12, color: '#009BB4', textDecoration: 'none', fontWeight: 700 }}>{tr('nav_import')}</Link>
        </div>
        {recentBatches.length === 0 ? (
          <div style={{ padding: '28px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#8A939B' }}>{tr('noImportsYet')}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {recentBatches.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={{ padding: '11px 18px', fontSize: 12.5, fontWeight: 700, color: '#445056' }}>
                    {b.type === 'SHIPMENTS' ? tr('nav_shipments') : tr('payments')}
                  </td>
                  <td style={{ padding: '11px 8px', fontSize: 12, color: '#8A939B', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.filename}</td>
                  <td style={{ padding: '11px 8px', fontSize: 12, color: '#667079' }}>
                    {b.type === 'SHIPMENTS'
                      ? `${b.createdCount} new, ${b.updatedCount} updated`
                      : `${b.matchedCount} matched, ${b.unmatchedCount} unmatched`}
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: 12, color: '#A6AEB2', textAlign: 'right' }}>{formatDateTime(b.uploadedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
