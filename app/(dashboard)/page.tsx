import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import { toNumber, formatEuro, paidSum } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import { CheckCircle2, Circle, Upload, Receipt, AlertTriangle, ArrowRight, PackageSearch, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TodayPage() {
  const tr = t(getLocale())
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [shipImportToday, payImportToday, chequesToday, exceptionCount, unmatchedCount, dupCount, shortCount, outstanding, collectedToday] =
    await Promise.all([
      prisma.importBatch.count({ where: { type: 'SHIPMENTS', uploadedAt: { gte: startOfToday } } }),
      prisma.importBatch.count({ where: { type: 'PAYMENTS', uploadedAt: { gte: startOfToday } } }),
      prisma.payment.count({ where: { method: 'CHEQUE', createdAt: { gte: startOfToday } } }),
      prisma.shipment.count({ where: { status: 'EXCEPTION' } }),
      prisma.payment.count({ where: { shipmentId: null } }),
      prisma.shipment.count({ where: { isDuplicate: true } }),
      prisma.shipment.count({ where: { status: 'PARTIALLY_PAID' } }),
      prisma.shipment.findMany({ where: { status: { in: OUTSTANDING_STATUSES } }, include: { payments: true } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfToday } } }),
    ])

  const reviewCount = exceptionCount + unmatchedCount + dupCount + shortCount
  const outstandingTotal = outstanding.reduce((sum, s) => {
    const paid = paidSum(s.payments)
    return sum + Math.max(toNumber(s.codAmount) - paid, 0)
  }, 0)

  const steps = [
    { icon: PackageSearch, title: tr('step_shipments'), desc: tr('step_shipments_d'), done: shipImportToday > 0, state: shipImportToday > 0 ? tr('done') : tr('todo'), href: '/import', cta: tr('nav_import') },
    { icon: Wallet, title: tr('step_payments'), desc: tr('step_payments_d'), done: payImportToday > 0, state: payImportToday > 0 ? tr('done') : tr('todo'), href: '/import', cta: tr('nav_import') },
    { icon: Receipt, title: tr('step_cheques'), desc: tr('step_cheques_d'), done: chequesToday > 0, optional: true, state: chequesToday > 0 ? `${chequesToday} ${tr('enteredToday')}` : tr('optional'), href: '/cheques', cta: tr('nav_cheques') },
    { icon: AlertTriangle, title: tr('step_review'), desc: tr('step_review_d'), done: reviewCount === 0, state: reviewCount === 0 ? tr('done') : `${reviewCount} ${tr('needReview')}`, href: '/exceptions', cta: tr('open'), warn: reviewCount > 0 },
  ]

  return (
    <div>
      <PageHeader title={tr('today_title')} subtitle={tr('today_sub')} />

      {/* Two quick figures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        <MiniStat label={tr('kpi_outstanding')} value={formatEuro(outstandingTotal)} accent="#B7791F" href="/outstanding" cta={tr('viewOutstanding')} />
        <MiniStat label={tr('collectedToday')} value={formatEuro(toNumber(collectedToday._sum.amount))} accent="#2F8F5B" />
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((s, i) => {
          const Icon = s.icon
          const accent = s.done ? '#2F8F5B' : s.warn ? '#DE1D1C' : '#009BB4'
          return (
            <div key={i} className="panel animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', animationDelay: `${i * 0.05}s` }}>
              <div style={{ flexShrink: 0 }}>
                {s.done ? <CheckCircle2 size={26} color="#2F8F5B" /> : <Circle size={26} color={s.warn ? '#DE1D1C' : '#C7CFD4'} />}
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 4, background: `${accent}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={accent} strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#001A21' }}>
                  <span style={{ color: '#A6AEB2', marginRight: 6 }}>{i + 1}.</span>{s.title}
                </p>
                <p style={{ fontSize: 12, color: '#8A939B', marginTop: 2 }}>{s.desc}</p>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: accent, background: `${accent}14`, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{s.state}</span>
              <Link href={s.href} className="btn-ghost" style={{ textDecoration: 'none', height: 34, flexShrink: 0 }}>
                {s.cta} <ArrowRight size={13} />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniStat({ label, value, accent, href, cta }: { label: string; value: string; accent: string; href?: string; cta?: string }) {
  return (
    <div className="panel animate-fade-up" style={{ padding: '16px 18px' }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A939B' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color: accent, marginTop: 6, lineHeight: 1 }}>{value}</p>
      {href && cta && (
        <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#009BB4', textDecoration: 'none', marginTop: 10 }}>
          {cta} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}
