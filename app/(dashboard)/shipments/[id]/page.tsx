import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import { formatEuro, formatDate, formatDateTime, toNumber, paidSum } from '@/lib/utils'
import { StatusBadge, DirectionBadge } from '@/components/ui/Badges'
import ShipmentDetailClient from '@/components/shipments/ShipmentDetailClient'

export const dynamic = 'force-dynamic'

export default async function ShipmentDetail({ params }: { params: { id: string } }) {
  const locale = getLocale()
  const tr = t(locale)
  const shipment = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: { payments: { orderBy: { createdAt: 'asc' } } },
  })
  if (!shipment) notFound()

  const history = await prisma.auditLog.findMany({
    where: { trackingNumber: shipment.trackingNumber },
    orderBy: { at: 'desc' },
    take: 20,
  })

  const paid = paidSum(shipment.payments)

  const facts: [string, string][] = [
    [tr('fact_tracking'), shipment.trackingNumber],
    [tr('fact_recipient'), shipment.recipientName || '—'],
    [tr('fact_code'), shipment.recipientCode || '—'],
    [tr('fact_route'), shipment.routeCode || '—'],
    [tr('fact_pickup'), formatDate(shipment.pickupDate)],
    [tr('fact_delivered'), formatDateTime(shipment.deliveredAt)],
    [tr('fact_sender'), shipment.sender || '—'],
    [tr('fact_products'), shipment.productCodes || '—'],
  ]

  return (
    <div>
      <Link href="/shipments" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#667079', textDecoration: 'none', marginBottom: 14 }}>
        <ChevronLeft size={14} /> {tr('back_ship')}
      </Link>

      <div className="panel animate-fade-up" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#001A21' }}>{shipment.recipientName || shipment.trackingNumber}</h1>
              <DirectionBadge direction={shipment.direction} locale={locale} />
              {shipment.isDuplicate && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#B7791F', background: 'rgba(183,121,31,0.10)', padding: '2px 8px', borderRadius: 3 }}>{locale === 'gr' ? 'ΔΙΠΛΟΤΥΠΟ' : 'DUPLICATE'}</span>
              )}
            </div>
            <p style={{ fontSize: 12.5, color: '#8A939B', marginTop: 3, fontFamily: 'monospace' }}>{shipment.trackingNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={shipment.status} locale={locale} />
            <p style={{ fontSize: 26, fontWeight: 900, color: '#001A21', marginTop: 8, lineHeight: 1 }}>{formatEuro(shipment.codAmount)}</p>
            <p style={{ fontSize: 11, color: '#A6AEB2', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tr('codAmount')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px 20px', borderTop: '1px solid #EEF1F3', paddingTop: 16 }}>
          {facts.map(([label, value]) => (
            <div key={label}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A6AEB2' }}>{label}</p>
              <p style={{ fontSize: 13, color: '#1A2226', marginTop: 2, wordBreak: 'break-word' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <ShipmentDetailClient
        id={shipment.id}
        trackingNumber={shipment.trackingNumber}
        status={shipment.status}
        statusManual={shipment.statusManual}
        codAmount={toNumber(shipment.codAmount)}
        paidSum={paid}
        notes={shipment.notes}
        payments={shipment.payments.map((p) => ({
          id: p.id,
          method: p.method,
          amount: toNumber(p.amount),
          bank: p.bank,
          chequeNumber: p.chequeNumber,
          chequeStatus: p.chequeStatus,
          paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
          source: p.source,
          createdBy: p.createdBy,
        }))}
        history={history.map((h) => ({
          id: h.id,
          at: h.at.toISOString(),
          user: h.user,
          action: h.action,
          detail: h.detail,
        }))}
      />
    </div>
  )
}
