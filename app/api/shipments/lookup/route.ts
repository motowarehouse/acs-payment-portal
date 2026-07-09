import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Look up a shipment by tracking number (used by the cheque entry form).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tracking = (searchParams.get('tracking') || '').trim()
  if (!tracking) return NextResponse.json({ error: 'Provide a tracking number.' }, { status: 400 })

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: tracking },
    include: { payments: { orderBy: { createdAt: 'asc' } } },
  })
  if (!shipment) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    shipment: {
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      recipientName: shipment.recipientName,
      codAmount: Number(shipment.codAmount),
      status: shipment.status,
      direction: shipment.direction,
      paidSum: shipment.payments.reduce((s, p) => s + Number(p.amount), 0),
    },
  })
}
