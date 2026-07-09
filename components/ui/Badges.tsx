import type { ShipmentStatus, PaymentMethod, Direction } from '@prisma/client'
import { STATUS_META, PAYMENT_METHOD_META, DIRECTION_META } from '@/lib/constants'

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 22,
        padding: '0 9px',
        borderRadius: 3,
        background: m.bg,
        color: m.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

export function MethodBadge({ method }: { method: PaymentMethod }) {
  const m = PAYMENT_METHOD_META[method]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: '0 8px',
        borderRadius: 3,
        background: `${m.color}14`,
        color: m.color,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  )
}

export function DirectionBadge({ direction }: { direction: Direction }) {
  const m = DIRECTION_META[direction]
  const out = direction === 'OUTBOUND'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: '0 8px',
        borderRadius: 3,
        background: out ? 'rgba(0,155,180,0.10)' : 'rgba(107,114,128,0.10)',
        color: out ? '#007D8E' : '#6B7280',
        fontSize: 10.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  )
}
