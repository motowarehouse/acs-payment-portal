'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, RotateCcw } from 'lucide-react'
import { useT, useLocale } from '@/components/i18n/LocaleProvider'
import type { ChequeStatus } from '@prisma/client'

const META: Record<ChequeStatus, { color: string; bg: string; en: string; gr: string }> = {
  PENDING: { color: '#B7791F', bg: 'rgba(183,121,31,0.10)', en: 'Pending', gr: 'Εκκρεμεί' },
  CLEARED: { color: '#2F8F5B', bg: 'rgba(47,143,91,0.10)', en: 'Cleared', gr: 'Εξοφλήθηκε' },
  BOUNCED: { color: '#DE1D1C', bg: 'rgba(222,29,28,0.10)', en: 'Bounced', gr: 'Ακάλυπτη' },
}

/** Pill + quick actions to move a cheque between PENDING / CLEARED / BOUNCED. */
export default function ChequeStatusControl({ paymentId, status }: { paymentId: string; status: ChequeStatus }) {
  const router = useRouter()
  const tr = useT()
  const locale = useLocale()
  const [busy, setBusy] = useState(false)

  async function set(next: ChequeStatus) {
    setBusy(true)
    try {
      await fetch(`/api/payments/${paymentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chequeStatus: next }) })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const m = META[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: m.bg, padding: '2px 8px', borderRadius: 3, textDecoration: status === 'BOUNCED' ? 'line-through' : 'none' }}>
        {locale === 'gr' ? m.gr : m.en}
      </span>
      {status === 'PENDING' ? (
        <>
          <button onClick={() => set('CLEARED')} disabled={busy} title={tr('markCleared')} style={btn('#2F8F5B')}><Check size={12} /></button>
          <button onClick={() => set('BOUNCED')} disabled={busy} title={tr('markBounced')} style={btn('#DE1D1C')}><X size={12} /></button>
        </>
      ) : (
        <button onClick={() => set('PENDING')} disabled={busy} title={tr('markPending')} style={btn('#8A939B')}><RotateCcw size={11} /></button>
      )}
    </span>
  )
}

const btn = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 22, height: 22, borderRadius: 3, border: `1px solid ${color}`,
  background: 'white', color, cursor: 'pointer', padding: 0, flexShrink: 0,
})
