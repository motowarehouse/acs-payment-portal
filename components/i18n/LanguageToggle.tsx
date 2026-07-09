'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from './LocaleProvider'
import type { Locale } from '@/lib/i18n'

export default function LanguageToggle() {
  const router = useRouter()
  const locale = useLocale()

  function set(next: Locale) {
    if (next === locale) return
    // 1 year cookie
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  const opts: { code: Locale; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'gr', label: 'ΕΛ' },
  ]

  return (
    <div style={{ display: 'flex', gap: 4, padding: '6px 12px 2px' }}>
      {opts.map((o) => {
        const active = o.code === locale
        return (
          <button
            key={o.code}
            onClick={() => set(o.code)}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 3,
              border: `1px solid ${active ? 'rgba(0,155,180,0.6)' : 'rgba(255,255,255,0.12)'}`,
              background: active ? 'rgba(0,155,180,0.25)' : 'transparent',
              color: active ? 'white' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
