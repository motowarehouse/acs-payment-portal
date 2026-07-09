import * as XLSX from 'xlsx'
import type { Direction } from '@prisma/client'
import { OUR_NAME_HINT } from './constants'

// ─── Header aliases ─────────────────────────────────────────────────
// We map columns by their header text (trimmed) so a change in column
// order does not break the import.

const SHIPMENT_HEADERS = {
  tracking:       ['αριθμος αποδεικτικου', 'αριθμός αποδεικτικού'],
  pickupDate:     ['ημ/νια παραλαβης', 'ημ/νια παραλαβής'],
  route:          ['απο/προς', 'από/προς'],
  receiverPerson: ['παραλαβων', 'παραλαβών'],
  recipient:      ['παραληπτης', 'παραλήπτης'],
  deliveredAt:    ['ημ. ωρα', 'ημ. ώρα'],
  pieces:         ['τεμαχια', 'τεμάχια'],
  weight:         ['βαρος', 'βάρος'],
  customer:       ['πελατης', 'πελάτης'],
  sender:         ['αποστολεας', 'αποστολέας'],
  products:       ['προιοντα', 'προϊοντα', 'προϊόντα'],
  cod:            ['ποσο αντικαταβολης', 'ποσό αντικαταβολής'],
  reason:         ['αιτια', 'αιτία'],
  remarks:        ['παρατηρησεις', 'παρατηρήσεις'],
}

const PAYMENT_HEADERS = {
  awb:          ['acs awb number'],
  sender:       ['sender'],
  recipient:    ['recipient'],
  pickupDate:   ['pick up date', 'pickup date'],
  deliveryDate: ['delivery date'],
  amount:       ['amount euro €', 'amount euro', 'amount'],
  ref1:         ['customer reference 1'],
  ref2:         ['customer reference 2'],
}

function norm(v: unknown): string {
  return String(v ?? '').trim().toLowerCase()
}

/** Locate the header row and build a name→columnIndex map. */
function mapColumns(
  rows: unknown[][],
  aliases: Record<string, string[]>,
): { headerRow: number; cols: Record<string, number> } | null {
  const wantedFirst = Object.values(aliases)[0] // first field's aliases
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r] || []
    const normed = row.map(norm)
    // header row is the one containing the first field's alias
    if (wantedFirst.some((a) => normed.includes(a))) {
      const cols: Record<string, number> = {}
      for (const [field, opts] of Object.entries(aliases)) {
        const idx = normed.findIndex((cell) => opts.includes(cell))
        if (idx >= 0) cols[field] = idx
      }
      return { headerRow: r, cols }
    }
  }
  return null
}

// ─── Date parsing ───────────────────────────────────────────────────

/** Parse "dd/MM/yyyy" or "dd/MM/yyyy HH:mm:ss" or a JS Date into a Date. */
export function parseAcsDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const s = String(value).trim()
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (m) {
    const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = m
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss),
    )
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/** Parse a money value like "157.00", "1.277,00", 41, "" → number. */
export function parseAmount(value: unknown): number {
  if (value == null || value === '') return 0
  if (typeof value === 'number') return value
  let s = String(value).trim()
  if (!s) return 0
  // European format "1.277,00" → strip thousands dots, comma→dot
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

/** Extract a leading numeric customer code, e.g. "3771-XRYSANTHOS" → "3771". */
export function parseRecipientCode(recipient: string | null): string | null {
  if (!recipient) return null
  const m = recipient.trim().match(/^(\d{1,6})\s*-/)
  return m ? m[1] : null
}

// ─── Types ──────────────────────────────────────────────────────────

export interface ParsedShipment {
  trackingNumber: string
  pickupDate: Date | null
  deliveredAt: Date | null
  routeCode: string | null
  direction: Direction
  recipientName: string | null
  recipientCode: string | null
  receiverPerson: string | null
  sender: string | null
  productCodes: string | null
  codAmount: number
  pieces: number | null
  weight: number | null
  reason: string | null
  remarks: string | null
  raw: Record<string, unknown>
}

export interface ParsedPayment {
  trackingNumber: string
  amount: number
  pickupDate: Date | null
  deliveryDate: Date | null
  recipient: string | null
  raw: Record<string, unknown>
}

// ─── Direction detection ────────────────────────────────────────────

function detectDirection(sender: string | null, recipient: string | null, route: string | null): Direction {
  const s = norm(sender)
  const r = norm(recipient)
  const hint = OUR_NAME_HINT.toLowerCase()
  if (r.includes(hint)) return 'INBOUND'
  if (s.includes(hint)) return 'OUTBOUND'
  // Fall back to the route code: "XX-NI" ends at our Nicosia depot → inbound
  const rt = norm(route)
  if (/-ni$/.test(rt) && !/^ni-/.test(rt)) return 'INBOUND'
  return 'OUTBOUND'
}

// ─── Parsers ────────────────────────────────────────────────────────

function readSheet(buffer: Buffer): unknown[][] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true })
}

export function parseShipmentFile(buffer: Buffer): {
  rows: ParsedShipment[]
  error?: string
} {
  const rows = readSheet(buffer)
  const mapped = mapColumns(rows, SHIPMENT_HEADERS)
  if (!mapped || mapped.cols.tracking == null) {
    return { rows: [], error: 'Could not find the shipment header row (Αριθμός Αποδεικτικού). Is this the shipment export?' }
  }
  const { headerRow, cols } = mapped
  const out: ParsedShipment[] = []

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] || []
    const get = (field: string): unknown => (cols[field] != null ? row[cols[field]] : undefined)
    const tracking = String(get('tracking') ?? '').trim()
    if (!tracking) continue // skip blank / total rows

    const recipient = String(get('recipient') ?? '').trim() || null
    const sender = String(get('sender') ?? '').trim() || null
    const route = String(get('route') ?? '').trim() || null

    out.push({
      trackingNumber: tracking,
      pickupDate: parseAcsDate(get('pickupDate')),
      deliveredAt: parseAcsDate(get('deliveredAt')),
      routeCode: route,
      direction: detectDirection(sender, recipient, route),
      recipientName: recipient,
      recipientCode: parseRecipientCode(recipient),
      receiverPerson: String(get('receiverPerson') ?? '').trim() || null,
      sender,
      productCodes: String(get('products') ?? '').trim() || null,
      codAmount: parseAmount(get('cod')),
      pieces: Number.isFinite(Number(get('pieces'))) ? Number(get('pieces')) : null,
      weight: Number.isFinite(Number(get('weight'))) ? Number(get('weight')) : null,
      reason: String(get('reason') ?? '').trim() || null,
      remarks: String(get('remarks') ?? '').trim() || null,
      raw: buildRaw(rows[headerRow], row),
    })
  }
  return { rows: out }
}

export function parsePaymentFile(buffer: Buffer): {
  rows: ParsedPayment[]
  error?: string
} {
  const rows = readSheet(buffer)
  const mapped = mapColumns(rows, PAYMENT_HEADERS)
  if (!mapped || mapped.cols.awb == null) {
    return { rows: [], error: 'Could not find the payment header row (ACS AWB NUMBER). Is this the Notification of Payment file?' }
  }
  const { headerRow, cols } = mapped
  const out: ParsedPayment[] = []

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] || []
    const get = (field: string): unknown => (cols[field] != null ? row[cols[field]] : undefined)
    const awb = String(get('awb') ?? '').trim()
    // AWB rows are all-digits; skip the "Σύνολο" total row and blanks
    if (!awb || !/^\d{6,}$/.test(awb)) continue

    out.push({
      trackingNumber: awb,
      amount: parseAmount(get('amount')),
      pickupDate: parseAcsDate(get('pickupDate')),
      deliveryDate: parseAcsDate(get('deliveryDate')),
      recipient: String(get('recipient') ?? '').trim() || null,
      raw: buildRaw(rows[headerRow], row),
    })
  }
  return { rows: out }
}

function buildRaw(header: unknown[] | undefined, row: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  if (!header) return obj
  header.forEach((h, i) => {
    const key = String(h ?? `col${i}`).trim() || `col${i}`
    const val = row[i]
    obj[key] = val instanceof Date ? val.toISOString() : val
  })
  return obj
}
