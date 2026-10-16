import type { Direction, ShipmentStatus } from '@prisma/client'
import { amountsMatch } from './utils'

/**
 * Pure status calculation from a shipment's COD and the sum of its payments.
 * Does NOT consider manual overrides or RETURNED — the caller guards those.
 */
export function computeStatus(
  codAmount: number,
  direction: Direction,
  paidSum: number,
  delivered = false,
): ShipmentStatus {
  // Nothing to collect: inbound package, or COD is zero
  if (direction === 'INBOUND' || codAmount <= 0) {
    if (paidSum > 0.01) return 'EXCEPTION'
    // An inbound package with a delivery timestamp has reached us
    return direction === 'INBOUND' && delivered ? 'RECEIVED' : 'NO_COD'
  }
  if (paidSum <= 0.01) return 'AWAITING'
  if (amountsMatch(paidSum, codAmount)) return 'PAID'
  if (paidSum < codAmount) return 'PARTIALLY_PAID'
  return 'EXCEPTION' // overpaid
}
