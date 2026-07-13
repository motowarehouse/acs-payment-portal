import type { ShipmentStatus } from '@prisma/client'
import { prisma } from './prisma'
import { toNumber } from './utils'
import { computeStatus } from './status'

export { computeStatus }

/**
 * Recompute and persist a single shipment's status from its payment lines.
 * Respects manual overrides and the RETURNED state (both left untouched).
 * Returns the resulting status.
 */
export async function recomputeShipment(shipmentId: string): Promise<ShipmentStatus | null> {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { payments: true },
  })
  if (!shipment) return null

  if (shipment.statusManual || shipment.status === 'RETURNED') {
    return shipment.status
  }

  // Bounced cheques no longer count toward the COD.
  const paidSum = shipment.payments
    .filter((p) => p.chequeStatus !== 'BOUNCED')
    .reduce((sum, p) => sum + toNumber(p.amount), 0)
  const next = computeStatus(toNumber(shipment.codAmount), shipment.direction, paidSum)

  if (next !== shipment.status) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: next },
    })
  }
  return next
}

/** Recompute every shipment referenced by a set of tracking numbers. */
export async function recomputeByTracking(trackingNumbers: string[]): Promise<void> {
  const unique = Array.from(new Set(trackingNumbers))
  const shipments = await prisma.shipment.findMany({
    where: { trackingNumber: { in: unique } },
    select: { id: true },
  })
  for (const s of shipments) {
    await recomputeShipment(s.id)
  }
}
