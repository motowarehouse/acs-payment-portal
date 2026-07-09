'use client'

import { useEffect, useRef, useState } from 'react'
import { Wallet, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

export interface Stat {
  key: string
  label: string
  value: number
  format: 'number' | 'euro'
  accent: string
  icon: 'wallet' | 'clock' | 'check' | 'alert'
}

const ICONS = { wallet: Wallet, clock: Clock, check: CheckCircle2, alert: AlertTriangle }

function useCountUp(target: number, duration = 850) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setValue((1 - Math.pow(1 - t, 3)) * target)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return value
}

function fmt(v: number, format: 'number' | 'euro') {
  if (format === 'euro') {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
  }
  return Math.round(v).toString()
}

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
      {stats.map((s, i) => (
        <Card key={s.key} stat={s} delay={`${i * 0.06}s`} />
      ))}
    </div>
  )
}

function Card({ stat, delay }: { stat: Stat; delay: string }) {
  const count = useCountUp(stat.value)
  const Icon = ICONS[stat.icon]
  return (
    <div className="panel animate-fade-up" style={{ overflow: 'hidden', animationDelay: delay }}>
      <div style={{ height: 3, background: stat.accent }} />
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A939B', marginBottom: 8 }}>{stat.label}</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: '#001A21', lineHeight: 1, letterSpacing: '-0.01em' }}>{fmt(count, stat.format)}</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 4, background: `${stat.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={stat.accent} strokeWidth={1.9} />
        </div>
      </div>
    </div>
  )
}
