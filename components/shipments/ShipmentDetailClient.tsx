'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Loader2, Save, RotateCcw, Undo2 } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { STATUS_META, PAYMENT_METHOD_META } from '@/lib/constants'
import { MethodBadge } from '@/components/ui/Badges'
import type { ShipmentStatus, PaymentMethod } from '@prisma/client'

interface PaymentDTO {
  id: string
  method: PaymentMethod
  amount: number
  bank: string | null
  chequeNumber: string | null
  paymentDate: string | null
  source: string
  createdBy: string | null
}

interface Props {
  id: string
  trackingNumber: string
  status: ShipmentStatus
  statusManual: boolean
  codAmount: number
  paidSum: number
  notes: string | null
  payments: PaymentDTO[]
}

const SELECTABLE: ShipmentStatus[] = ['AWAITING', 'PARTIALLY_PAID', 'PAID', 'RETURNED', 'EXCEPTION', 'NO_COD']

export default function ShipmentDetailClient(props: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState(props.notes ?? '')

  // add-payment form
  const [adding, setAdding] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [amount, setAmount] = useState('')

  async function patch(body: object) {
    setBusy(true)
    try {
      await fetch(`/api/shipments/${props.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function deletePayment(pid: string) {
    setBusy(true)
    try {
      await fetch(`/api/payments/${pid}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function addPayment() {
    if (!amount || Number(amount) <= 0) return
    setBusy(true)
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: props.trackingNumber, amount: Number(amount), method }),
      })
      setAmount('')
      setAdding(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const remaining = Math.max(props.codAmount - props.paidSum, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
      {/* Payments panel */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>Payments</p>
          <button className="btn-ghost" style={{ height: 30, fontSize: 11 }} onClick={() => setAdding((v) => !v)}>
            <Plus size={13} /> Add payment
          </button>
        </div>

        {adding && (
          <div style={{ padding: '14px 18px', background: '#FAFBFC', borderBottom: '1px solid #EEF1F3', display: 'flex', gap: 10, alignItems: 'flex-end' }} className="animate-fade-up">
            <div style={{ flex: 1 }}>
              <label className="label-base">Method</label>
              <select className="input-base" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {(['CASH', 'VISA', 'ACS', 'CHEQUE'] as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_META[m].label}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label className="label-base">Amount (€)</label>
              <input className="input-base" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </div>
            <button className="btn-primary" style={{ height: 40 }} onClick={addPayment} disabled={busy || !amount}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
            </button>
          </div>
        )}

        {props.payments.length === 0 ? (
          <p style={{ padding: '22px 18px', fontSize: 13, color: '#8A939B' }}>No payments recorded for this shipment yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {props.payments.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #F2F4F6' }}>
                  <td style={{ padding: '11px 18px' }}><MethodBadge method={p.method} /></td>
                  <td style={{ padding: '11px 8px', fontSize: 13, fontWeight: 700, color: '#1A2226' }}>{formatEuro(p.amount)}</td>
                  <td style={{ padding: '11px 8px', fontSize: 12, color: '#667079' }}>
                    {p.method === 'CHEQUE' && (p.chequeNumber || p.bank)
                      ? `${p.bank ?? ''} ${p.chequeNumber ?? ''}`.trim()
                      : p.source === 'IMPORT' ? 'ACS import' : p.createdBy || 'manual'}
                  </td>
                  <td style={{ padding: '11px 8px', fontSize: 12, color: '#667079' }}>{formatDate(p.paymentDate)}</td>
                  <td style={{ padding: '11px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => deletePayment(p.id)}
                      disabled={busy}
                      title="Remove payment"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C7CC', padding: 4, display: 'inline-flex' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#DE1D1C')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#C0C7CC')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ padding: '12px 18px', borderTop: '1px solid #EEF1F3', display: 'flex', justifyContent: 'space-between', background: '#FAFBFC' }}>
          <span style={{ fontSize: 12, color: '#667079' }}>Paid {formatEuro(props.paidSum)} of {formatEuro(props.codAmount)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: remaining > 0 ? '#B7791F' : '#2F8F5B' }}>
            {remaining > 0 ? `${formatEuro(remaining)} remaining` : 'Settled'}
          </span>
        </div>
      </div>

      {/* Status + notes panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B', marginBottom: 10 }}>Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SELECTABLE.map((s) => {
              const active = props.status === s
              const m = STATUS_META[s]
              return (
                <button
                  key={s}
                  onClick={() => !active && patch({ status: s })}
                  disabled={busy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 4, cursor: active ? 'default' : 'pointer',
                    border: `1px solid ${active ? m.color : '#E7EAED'}`,
                    background: active ? m.bg : 'white',
                    fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 700 : 400,
                    color: active ? m.color : '#445056', textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color }} />
                  {m.label}
                </button>
              )
            })}
          </div>
          {props.statusManual && (
            <button className="btn-ghost" style={{ marginTop: 10, width: '100%', height: 32, fontSize: 11 }} onClick={() => patch({ clearOverride: true })} disabled={busy}>
              <RotateCcw size={12} /> Clear manual override
            </button>
          )}
          <p style={{ fontSize: 11, color: '#A6AEB2', marginTop: 8, lineHeight: 1.4 }}>
            {props.statusManual ? 'Manually set. Auto-reconciliation is paused for this shipment.' : 'Set automatically from payments.'}
          </p>
        </div>

        <div className="panel" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B', marginBottom: 10 }}>Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="input-base"
            style={{ height: 'auto', padding: 10, resize: 'vertical', lineHeight: 1.4 }}
            placeholder="Add a note…"
          />
          <button className="btn-ghost" style={{ marginTop: 8, width: '100%', height: 34 }} onClick={() => patch({ notes })} disabled={busy}>
            <Save size={13} /> Save note
          </button>
        </div>
      </div>
    </div>
  )
}
