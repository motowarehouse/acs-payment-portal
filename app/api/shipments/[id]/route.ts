import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeShipment } from '@/lib/reconcile'
import type { ShipmentStatus, Direction } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  const shipment = await prisma.shipment.findUnique({ where: { id: params.id } })
  if (!shipment) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 })

  const data: {
    status?: ShipmentStatus
    statusManual?: boolean
    direction?: Direction
    notes?: string | null
  } = {}

  if (body.clearOverride === true) {
    data.statusManual = false
  } else if (body.status) {
    data.status = body.status as ShipmentStatus
    data.statusManual = true
  }

  if (body.direction) data.direction = body.direction as Direction
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null

  await prisma.shipment.update({ where: { id: params.id }, data })

  // If the override was cleared or direction changed, recompute from payments.
  if (body.clearOverride === true || body.direction) {
    await recomputeShipment(params.id)
  }

  const updated = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: { payments: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json({ ok: true, shipment: updated })
}
