import { prisma } from '@/lib/prisma'
import type { Prisma, ShipmentStatus, Direction } from '@prisma/client'
import { getLocale } from '@/lib/locale'
import { t } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import FilterBar from '@/components/shipments/FilterBar'
import ShipmentsTable from '@/components/shipments/ShipmentsTable'

export const dynamic = 'force-dynamic'

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; direction?: string; q?: string }
}) {
  const locale = getLocale()
  const tr = t(locale)
  const where: Prisma.ShipmentWhereInput = {}

  if (searchParams.status) where.status = searchParams.status as ShipmentStatus
  if (searchParams.direction) where.direction = searchParams.direction as Direction
  if (searchParams.q) {
    const q = searchParams.q.trim()
    where.OR = [
      { trackingNumber: { contains: q, mode: 'insensitive' } },
      { recipientName: { contains: q, mode: 'insensitive' } },
      { recipientCode: { contains: q, mode: 'insensitive' } },
    ]
  }
  const filtered = Boolean(searchParams.status || searchParams.direction || searchParams.q)

  const shipments = await prisma.shipment.findMany({
    where,
    include: { payments: true },
    orderBy: [{ pickupDate: 'desc' }, { createdAt: 'desc' }],
    take: 300,
  })

  return (
    <div>
      <PageHeader title={tr('ship_title')} subtitle={`${shipments.length} ${tr('ship_shown')}`} />
      <FilterBar />
      <ShipmentsTable shipments={shipments} locale={locale} filtered={filtered} />
    </div>
  )
}
