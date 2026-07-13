import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeShipment } from '@/lib/reconcile'
import { audit } from '@/lib/audit'
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

  const user = session.user?.name
  if (body.clearOverride === true) {
    await audit({ user, action: 'STATUS_CHANGE', trackingNumber: shipment.trackingNumber, detail: 'Manual status override cleared (back to automatic)' })
  } else if (body.status && body.status !== shipment.status) {
    await audit({ user, action: 'STATUS_CHANGE', trackingNumber: shipment.trackingNumber, detail: `Status ${shipment.status} → ${body.status} (manual)` })
  }
  if (body.notes !== undefined && (body.notes || null) !== shipment.notes) {
    await audit({ user, action: 'NOTES_EDIT', trackingNumber: shipment.trackingNumber, detail: 'Notes updated' })
  }

  const updated = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: { payments: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json({ ok: true, shipment: updated })
}
