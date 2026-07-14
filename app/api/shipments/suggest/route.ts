import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toNumber, paidSum } from '@/lib/utils'
import { OUTSTANDING_STATUSES } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Live search of OUTSTANDING shipments by tracking number or recipient name.
// Used by the cheque entry autocomplete.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  const shipments = await prisma.shipment.findMany({
    where: {
      status: { in: OUTSTANDING_STATUSES },
      OR: [
        { trackingNumber: { contains: q, mode: 'insensitive' } },
        { recipientName: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: { payments: true },
    orderBy: { pickupDate: 'asc' },
    take: 8,
  })

  const suggestions = shipments.map((s) => {
    const paid = paidSum(s.payments)
    return {
      id: s.id,
      trackingNumber: s.trackingNumber,
      recipientName: s.recipientName,
      remaining: Math.max(toNumber(s.codAmount) - paid, 0),
    }
  })

  return NextResponse.json({ suggestions })
}
