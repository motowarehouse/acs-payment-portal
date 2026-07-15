'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle2, AlertTriangle, Loader2, Receipt, X, Scale } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { useT } from '@/components/i18n/LocaleProvider'

interface Suggestion {
  id: string
  trackingNumber: string
  recipientName: string | null
  remaining: number
}

interface SelectedRow extends Suggestion {
  alloc: string // editable allocation, kept as text for typing
}

export default function ChequeEntry() {
  const router = useRouter()
  const tr = useT()

  // search
  const [tracking, setTracking] = useState('')
  const [looking, setLooking] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSug, setShowSug] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextFetch = useRef(false)

  // selection (one cheque can cover several shipments of the same client)
  const [selected, setSelected] = useState<SelectedRow[]>([])

  // cheque details
  const [bank, setBank] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [total, setTotal] = useState('')
  const totalTouched = useRef(false)
  const [paymentDate, setPaymentDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ trackingNumber: string; amount: number; bank: string | null } | null>(null)

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

  const allocSum = selected.reduce((s, r) => s + (Number(r.alloc) || 0), 0)
  const totalNum = Number(total) || 0
  const diff = totalNum - allocSum
  const matches = selected.length > 0 && totalNum > 0 && Math.abs(diff) < 0.01

  function syncTotal(rows: SelectedRow[]) {
    if (!totalTouched.current) {
      const sum = rows.reduce((s, r) => s + (Number(r.alloc) || 0), 0)
      setTotal(sum > 0 ? sum.toFixed(2) : '')
    }
  }

  function addRow(s: Suggestion) {
    skipNextFetch.current = true
    setTracking('')
    setSuggestions([]); setShowSug(false)
    setNotFound(false); setDone(null); setError(null)
    setSelected((prev) => {
      if (prev.some((r) => r.id === s.id)) return prev
      const rows = [...prev, { ...s, alloc: s.remaining > 0 ? s.remaining.toFixed(2) : '' }]
      syncTotal(rows)
      return rows
    })
  }

  function removeRow(id: string) {
    setSelected((prev) => {
      const rows = prev.filter((r) => r.id !== id)
      syncTotal(rows)
      return rows
    })
  }

  function setAlloc(id: string, value: string) {
    setSelected((prev) => {
      const rows = prev.map((r) => (r.id === id ? { ...r, alloc: value } : r))
      syncTotal(rows)
      return rows
    })
  }

  async function lookup() {
    const q = tracking.trim()
    if (!q) return
    setShowSug(false)
    setLooking(true); setNotFound(false); setDone(null); setError(null)
    try {
      const res = await fetch(`/api/shipments/lookup?tracking=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.found) {
        addRow({
          id: json.shipment.id,
          trackingNumber: json.shipment.trackingNumber,
          recipientName: json.shipment.recipientName,
          remaining: Math.max(json.shipment.codAmount - json.shipment.paidSum, 0),
        })
      } else {
        setNotFound(true)
      }
    } catch {
      setError('Lookup failed. Please try again.')
    } finally {
      setLooking(false)
    }
  }

  function resetAll() {
    setSelected([]); setBank(''); setChequeNumber(''); setTotal(''); setPaymentDate('')
    setTracking(''); setNotFound(false); setDuplicate(null)
    totalTouched.current = false
  }

  async function submit(force = false) {
    setSaving(true); setError(null)
    if (force) setDuplicate(null)
    try {
      let res: Response
      if (selected.length > 0) {
        res = await fetch('/api/payments/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bank,
            chequeNumber,
            paymentDate: paymentDate || undefined,
            total: Number(total),
            allocations: selected.map((r) => ({ trackingNumber: r.trackingNumber, amount: Number(r.alloc) })),
            force,
          }),
        })
      } else {
        // Cheque for a shipment that isn't imported yet → recorded unmatched (Exceptions)
        res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber: tracking.trim(), amount: Number(total), method: 'CHEQUE', bank, chequeNumber, paymentDate: paymentDate || undefined, force }),
        })
      }
      const json = await res.json()
      if (res.status === 409 && json.duplicate) {
        setDuplicate(json.existing)
      } else if (!res.ok) {
        setError(json.error || 'Could not save the cheque.')
      } else {
        setDone(`${tr('recordCheque')} ✓`)
        resetAll()
        router.refresh()
      }
    } catch {
      setError('Could not save the cheque. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const showForm = selected.length > 0 || notFound
  const canSave = selected.length > 0 ? matches && !saving : !saving && totalNum > 0

  return (
    <div className="panel animate-fade-up" style={{ overflow: 'visible' }}>
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
            <Search size={15} color="#A6AEB2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="input-base"
              style={{ paddingLeft: 36 }}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              placeholder={tr('chequeSearchPh')}
            />
            {showSug && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4, background: 'white', border: '1px solid #E0E5E8', borderRadius: 5, boxShadow: '0 6px 18px rgba(0,26,34,0.10)', maxHeight: 220, overflowY: 'auto' }}>
                {suggestions.map((s) => {
                  const already = selected.some((r) => r.id === s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={already}
                      onMouseDown={(e) => { e.preventDefault(); if (!already) addRow(s) }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'white', border: 'none', borderTop: '1px solid #F2F4F6', cursor: already ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', opacity: already ? 0.45 : 1 }}
                      onMouseEnter={(e) => { if (!already) e.currentTarget.style.background = '#F0F9FB' }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <span style={{ fontSize: 12.5, color: '#1A2226', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#009BB4' }}>{s.trackingNumber}</span>
                        {'  '}{s.recipientName || '—'}
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#B7791F', flexShrink: 0 }}>
                        {already ? tr('alreadyAdded') : `${formatEuro(s.remaining)} ${tr('remaining')}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button className="btn-ghost" onClick={() => lookup()} disabled={looking} style={{ flexShrink: 0 }}>
            {looking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {tr('find')}
          </button>
        </div>
        {!showForm && (
          <p style={{ fontSize: 11.5, color: '#A6AEB2', marginTop: 8 }}>{tr('chequeSearchHint2')}</p>
        )}

        {notFound && selected.length === 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(183,121,31,0.08)', border: '1px solid rgba(183,121,31,0.25)', borderRadius: 4, padding: '10px 12px' }}>
            <AlertTriangle size={14} color="#B7791F" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#8A5D18' }}>{tr('chequeNotFound')}</p>
          </div>
        )}

        {selected.length > 0 && (
          <div style={{ marginTop: 14 }} className="animate-fade-up">
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A939B', marginBottom: 6 }}>
              {tr('selShipments')} ({selected.length})
            </p>
            <div style={{ border: '1px solid #EEF1F3', borderRadius: 5, overflow: 'hidden' }}>
              {selected.map((r, i) => {
                const over = (Number(r.alloc) || 0) > r.remaining + 0.009
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderTop: i > 0 ? '1px solid #F2F4F6' : 'none', background: i % 2 ? '#FAFBFC' : 'white' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#009BB4' }}>{r.trackingNumber}</span>
                        <span style={{ color: '#445056' }}>{'  '}{r.recipientName || '—'}</span>
                      </p>
                      <p style={{ fontSize: 11, color: over ? '#B7791F' : '#A6AEB2', marginTop: 1 }}>
                        {formatEuro(r.remaining)} {tr('remaining')}{over ? ` — ${tr('overRemaining')}` : ''}
                      </p>
                    </div>
                    <input
                      className="input-base"
                      style={{ width: 100, height: 32, fontSize: 12.5, textAlign: 'right' }}
                      value={r.alloc}
                      onChange={(e) => setAlloc(r.id, e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                    <button onClick={() => removeRow(r.id)} title={tr('removeRow')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C7CC', padding: 4, display: 'inline-flex', flexShrink: 0 }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#DE1D1C')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#C0C7CC')}>
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11.5, color: '#A6AEB2', marginTop: 6 }}>{tr('addMoreHint')}</p>
          </div>
        )}

        {showForm && (
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
              <label className="label-base">{tr('chequeTotal')}</label>
              <input className="input-base" value={total} onChange={(e) => { totalTouched.current = true; setTotal(e.target.value) }} inputMode="decimal" placeholder="0.00" />
            </div>
            <div>
              <label className="label-base">{tr('paymentDate')}</label>
              <input className="input-base" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>

            {selected.length > 0 && totalNum > 0 && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 4, background: matches ? 'rgba(47,143,91,0.08)' : diff > 0 ? 'rgba(183,121,31,0.08)' : 'rgba(222,29,28,0.07)', border: `1px solid ${matches ? 'rgba(47,143,91,0.25)' : diff > 0 ? 'rgba(183,121,31,0.25)' : 'rgba(222,29,28,0.22)'}` }}>
                <Scale size={14} color={matches ? '#2F8F5B' : diff > 0 ? '#B7791F' : '#DE1D1C'} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: matches ? '#256D46' : diff > 0 ? '#8A5D18' : '#B91C1B' }}>
                  {matches
                    ? `${tr('allocOk')} — ${formatEuro(totalNum)}`
                    : diff > 0
                      ? `${tr('allocLeft')}: ${formatEuro(diff)}`
                      : `${tr('allocOver')}: ${formatEuro(-diff)}`}
                </p>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', marginTop: 2 }}>
              <button className="btn-primary" onClick={() => submit(false)} disabled={!canSave}>
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
