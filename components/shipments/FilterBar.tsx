'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { STATUS_META } from '@/lib/constants'
import type { ShipmentStatus } from '@prisma/client'

const STATUSES = Object.keys(STATUS_META) as ShipmentStatus[]

export default function FilterBar() {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`/shipments?${params.toString()}`)
  }

  const status = sp.get('status') ?? ''
  const direction = sp.get('direction') ?? ''
  const hasFilters = status || direction || sp.get('q')

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
        <Search size={14} color="#A6AEB2" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="input-base"
          style={{ paddingLeft: 32 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply({ q })}
          placeholder="Search tracking number or recipient…"
        />
      </div>

      <select className="input-base" style={{ width: 170 }} value={status} onChange={(e) => apply({ status: e.target.value })}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_META[s].label}</option>
        ))}
      </select>

      <select className="input-base" style={{ width: 150 }} value={direction} onChange={(e) => apply({ direction: e.target.value })}>
        <option value="">All directions</option>
        <option value="OUTBOUND">Outbound</option>
        <option value="INBOUND">Inbound</option>
      </select>

      <button className="btn-ghost" onClick={() => apply({ q })}>Apply</button>
      {hasFilters && (
        <button
          className="btn-ghost"
          onClick={() => { setQ(''); router.push('/shipments') }}
          title="Clear filters"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  )
}
