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
): ShipmentStatus {
  // Nothing to collect: inbound package, or COD is zero
  if (direction === 'INBOUND' || codAmount <= 0) {
    return paidSum > 0.01 ? 'EXCEPTION' : 'NO_COD'
  }
  if (paidSum <= 0.01) return 'AWAITING'
  if (amountsMatch(paidSum, codAmount)) return 'PAID'
  if (paidSum < codAmount) return 'PARTIALLY_PAID'
  return 'EXCEPTION' // overpaid
}
