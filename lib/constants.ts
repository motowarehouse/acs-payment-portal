import type { ShipmentStatus, PaymentMethod, Direction } from '@prisma/client'

// ── Status metadata: colour + bilingual labels ──────────────────────
export const STATUS_META: Record<
  ShipmentStatus,
  { label: string; labelGr: string; color: string; bg: string }
> = {
  AWAITING:       { label: 'Awaiting',        labelGr: 'Σε αναμονή',    color: '#B7791F', bg: 'rgba(183,121,31,0.10)' },
  PARTIALLY_PAID: { label: 'Partially paid',  labelGr: 'Μερική πληρωμή', color: '#0284A8', bg: 'rgba(10,185,213,0.12)' },
  PAID:           { label: 'Paid',            labelGr: 'Πληρώθηκε',      color: '#2F8F5B', bg: 'rgba(47,143,91,0.12)' },
  RETURNED:       { label: 'Returned',        labelGr: 'Επιστροφή',      color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  EXCEPTION:      { label: 'Exception',       labelGr: 'Προς έλεγχο',    color: '#DE1D1C', bg: 'rgba(222,29,28,0.10)' },
  NO_COD:         { label: 'No COD',          labelGr: 'Χωρίς αντικαταβολή', color: '#8A939B', bg: 'rgba(138,147,155,0.10)' },
}

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; labelGr: string; color: string }
> = {
  ACS:    { label: 'Cash/Visa (ACS)', labelGr: 'Μετρητά/Κάρτα (ACS)', color: '#0284A8' },
  CASH:   { label: 'Cash',            labelGr: 'Μετρητά',            color: '#2F8F5B' },
  VISA:   { label: 'Visa',            labelGr: 'Κάρτα',              color: '#1D4ED8' },
  CHEQUE: { label: 'Cheque',          labelGr: 'Επιταγή',            color: '#7C3AED' },
}

export const DIRECTION_META: Record<Direction, { label: string; labelGr: string }> = {
  OUTBOUND: { label: 'Outbound', labelGr: 'Εξερχόμενη' },
  INBOUND:  { label: 'Inbound',  labelGr: 'Εισερχόμενη' },
}

// Statuses that count as "still owed money"
export const OUTSTANDING_STATUSES: ShipmentStatus[] = ['AWAITING', 'PARTIALLY_PAID']

// Our own station / customer code, used to detect direction
export const OUR_CUSTOMER_CODE = '2NC831810'
export const OUR_NAME_HINT = 'KYPRIANOU'
