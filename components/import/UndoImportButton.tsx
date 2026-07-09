'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Undo2, Loader2, Check, X } from 'lucide-react'
import { useT } from '@/components/i18n/LocaleProvider'

export default function UndoImportButton({ id }: { id: string }) {
  const router = useRouter()
  const tr = useT()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function undo() {
    setBusy(true)
    try {
      await fetch(`/api/import/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (busy) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#8A939B' }}><Loader2 size={13} className="animate-spin" /> {tr('undoing')}</span>
  }

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11.5, color: '#B91C1B' }}>{tr('undoConfirm')}</span>
        <button onClick={undo} title={tr('undo')} style={iconBtn('#DE1D1C')}><Check size={14} /></button>
        <button onClick={() => setConfirming(false)} title={tr('cancel')} style={iconBtn('#8A939B')}><X size={14} /></button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#A6AEB2', fontSize: 11.5, fontFamily: 'inherit', padding: 4 }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#DE1D1C')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#A6AEB2')}
    >
      <Undo2 size={13} /> {tr('undo')}
    </button>
  )
}

const iconBtn = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 3, border: `1px solid ${color}`,
  background: 'white', color, cursor: 'pointer', padding: 0,
})
