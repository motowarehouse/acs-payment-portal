'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle2, AlertTriangle, Loader2, Receipt } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { STATUS_META } from '@/lib/constants'
import { useT, useLocale } from '@/components/i18n/LocaleProvider'
import type { ShipmentStatus } from '@prisma/client'

interface Found {
  id: string
  trackingNumber: string
  recipientName: string | null
  codAmount: number
  status: ShipmentStatus
  paidSum: number
}

interface Suggestion {
  id: string
  trackingNumber: string
  recipientName: string | null
  remaining: number
}

export default function ChequeEntry() {
  const router = useRouter()
  const tr = useT()
  const locale = useLocale()
  const [tracking, setTracking] = useState('')
  const [looking, setLooking] = useState(false)
  const [found, setFound] = useState<Found | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [bank, setBank] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ trackingNumber: string; amount: number; bank: string | null } | null>(null)

  // Autocomplete over outstanding shipments (search by tracking or customer name)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSug, setShowSug] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextFetch = useRef(false)

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    if (debounce.current) clearTimeout(debounce.current)
    const q = tracking.trim()
    if (q.length < 2) {
      setSuggestions([]); setShowSug(false)
      return
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shipments/suggest?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        setSuggestions(json.suggestions ?? [])
        setShowSug((json.suggestions ?? []).length > 0)
      } catch {
        setSuggestions([]); setShowSug(false)
      }
    }, 250)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [tracking])

  function pickSuggestion(s: Suggestion) {
    skipNextFetch.current = true
    setTracking(s.trackingNumber)
    setSuggestions([]); setShowSug(false)
    lookup(s.trackingNumber)
  }

  async function lookup(value?: string) {
    const q = (value ?? tracking).trim()
    if (!q) return
    setShowSug(false)
    setLooking(true); setFound(null); setNotFound(false); setDone(null); setError(null)
    try {
      const res = await fetch(`/api/shipments/lookup?tracking=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.found) {
        setFound(json.shipment)
        const remaining = Math.max(json.shipment.codAmount - json.shipment.paidSum, 0)
        setAmount(remaining ? remaining.toFixed(2) : '')
      } else setNotFound(true)
    } catch {
      setError('Lookup failed. Please try again.')
    } finally {
      setLooking(false)
    }
  }

  async function submit(force = false) {
    setSaving(true); setError(null)
    if (force) setDuplicate(null)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: tracking.trim(), amount: Number(amount), method: 'CHEQUE', bank, chequeNumber, paymentDate: paymentDate || undefined, force }),
      })
      const json = await res.json()
      if (res.status === 409 && json.duplicate) {
        setDuplicate(json.existing)
      } else if (!res.ok) {
        setError(json.error || 'Could not save the cheque.')
      } else {
        setDuplicate(null)
        const statusName = json.status ? (locale === 'gr' ? STATUS_META[json.status as ShipmentStatus].labelGr : STATUS_META[json.status as ShipmentStatus].label) : null
        setDone(statusName ? `${tr('recordCheque')} ✓  (${statusName})` : `${tr('recordCheque')} ✓`)
        setBank(''); setChequeNumber(''); setAmount(''); setPaymentDate(''); setFound(null); setTracking('')
        router.refresh()
      }
    } catch {
      setError('Could not save the cheque. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const remaining = found ? Math.max(found.codAmount - found.paidSum, 0) : 0

  return (
    <div className="panel animate-fade-up" style={{ overflow: 'visible', maxWidth: 640 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 4, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Receipt size={19} color="#7C3AED" strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#001A21' }}>{tr('cheque_card')}</p>
          <p style={{ fontSize: 11.5, color: '#8A939B', marginTop: 1 }}>{tr('cheque_card_sub')}</p>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <label className="label-base">{tr('trackingLabel')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="input-base"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              placeholder={tr('chequeSearchPh')}
            />
            {showSug && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4, background: 'white', border: '1px solid #E0E5E8', borderRadius: 5, boxShadow: '0 6px 18px rgba(0,26,34,0.10)', overflow: 'hidden' }}>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s) }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'white', border: 'none', borderTop: '1px solid #F2F4F6', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F9FB')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <span style={{ fontSize: 12.5, color: '#1A2226', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#009BB4' }}>{s.trackingNumber}</span>
                      {'  '}{s.recipientName || '—'}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#B7791F', flexShrink: 0 }}>
                      {formatEuro(s.remaining)} {tr('remaining')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn-ghost" onClick={() => lookup()} disabled={looking} style={{ flexShrink: 0 }}>
            {looking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {tr('find')}
          </button>
        </div>

        {notFound && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(183,121,31,0.08)', border: '1px solid rgba(183,121,31,0.25)', borderRadius: 4, padding: '10px 12px' }}>
            <AlertTriangle size={14} color="#B7791F" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#8A5D18' }}>{tr('chequeNotFound')}</p>
          </div>
        )}

        {found && (
          <div style={{ marginTop: 12, background: '#FAFBFC', border: '1px solid #EEF1F3', borderRadius: 5, padding: '12px 14px' }} className="animate-fade-up">
            <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21' }}>{found.recipientName || '—'}</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <Metric label={tr('cod')} value={formatEuro(found.codAmount)} />
              <Metric label={tr('paidSoFar')} value={formatEuro(found.paidSum)} />
              <Metric label={tr('remaining')} value={formatEuro(remaining)} accent={remaining > 0 ? '#B7791F' : '#2F8F5B'} />
            </div>
          </div>
        )}

        {(found || notFound) && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="animate-fade-up">
            <div>
              <label className="label-base">{tr('bank')}</label>
              <input className="input-base" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="EUROBANK" />
            </div>
            <div>
              <label className="label-base">{tr('chequeNo')}</label>
              <input className="input-base" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} placeholder="E_92450477" />
            </div>
            <div>
              <label className="label-base">{tr('amount')}</label>
              <input className="input-base" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </div>
            <div>
              <label className="label-base">{tr('paymentDate')}</label>
              <input className="input-base" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
              <button className="btn-primary" onClick={() => submit(false)} disabled={saving || !amount}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />} {tr('recordCheque')}
              </button>
            </div>
          </div>
        )}

        {duplicate && (
          <div style={{ marginTop: 12, background: 'rgba(183,121,31,0.08)', border: '1px solid rgba(183,121,31,0.25)', borderRadius: 4, padding: '10px 12px' }} className="animate-fade-up">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color="#B7791F" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#8A5D18' }}>
                {tr('dupCheque')} — {duplicate.bank ? `${duplicate.bank}, ` : ''}{formatEuro(duplicate.amount)} ({duplicate.trackingNumber})
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn-primary" style={{ height: 32, fontSize: 11.5 }} onClick={() => submit(true)} disabled={saving}>
                {tr('saveAnyway')}
              </button>
              <button className="btn-ghost" style={{ height: 32, fontSize: 11.5 }} onClick={() => setDuplicate(null)} disabled={saving}>
                {tr('cancel')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(222,29,28,0.06)', border: '1px solid rgba(222,29,28,0.2)', borderRadius: 4, padding: '10px 12px' }}>
            <AlertTriangle size={14} color="#DE1D1C" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#B91C1B' }}>{error}</p>
          </div>
        )}
        {done && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(47,143,91,0.08)', border: '1px solid rgba(47,143,91,0.25)', borderRadius: 4, padding: '10px 12px' }}>
            <CheckCircle2 size={14} color="#2F8F5B" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#256D46' }}>{done}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A6AEB2' }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: accent || '#1A2226', marginTop: 2 }}>{value}</p>
    </div>
  )
}
