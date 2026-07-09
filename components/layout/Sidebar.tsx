'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Home,
  Upload,
  Receipt,
  PackageSearch,
  Wallet,
  AlertTriangle,
  Users,
  LogOut,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { useT } from '@/components/i18n/LocaleProvider'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import type { TKey } from '@/lib/i18n'

const NAV: { href: string; icon: React.ElementType; key: TKey }[] = [
  { href: '/',            icon: Home,            key: 'nav_home' },
  { href: '/dashboard',   icon: LayoutDashboard, key: 'nav_dashboard' },
  { href: '/import',      icon: Upload,          key: 'nav_import' },
  { href: '/cheques',     icon: Receipt,         key: 'nav_cheques' },
  { href: '/shipments',   icon: PackageSearch,   key: 'nav_shipments' },
  { href: '/outstanding', icon: Wallet,          key: 'nav_outstanding' },
  { href: '/exceptions',  icon: AlertTriangle,   key: 'nav_exceptions' },
  { href: '/customers',   icon: Users,           key: 'nav_customers' },
]

const OCEAN: React.CSSProperties = {
  background: `
    repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 8px),
    linear-gradient(180deg, #001A21 0%, #003E47 100%)
  `,
}

export default function Sidebar() {
  const path = usePathname()
  const tr = useT()

  return (
    <aside
      style={{
        ...OCEAN,
        position: 'fixed',
        inset: '0 auto 0 0',
        zIndex: 40,
        width: 248,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 8,
        }}
      >
        <Image
          src="/mwh-logo.png"
          alt="Motowarehouse"
          width={160}
          height={48}
          style={{ objectFit: 'contain', objectPosition: 'left' }}
          priority
        />
        <p
          style={{
            fontSize: 9,
            fontWeight: 400,
            letterSpacing: '0.18em',
            color: '#72D6E5',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {tr('brandSub')}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, icon: Icon, key }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={
                {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 3,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'white' : 'rgba(255,255,255,0.55)',
                  background: active ? 'rgba(0,155,180,0.25)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
                  borderLeft: active ? '2px solid #009BB4' : '2px solid transparent',
                } as React.CSSProperties
              }
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{tr(key)}</span>
              {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <a
          href="/ACS_Portal_User_Manual.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={
            {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 3,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              transition: 'color 0.15s',
              marginBottom: 2,
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = 'white'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'
          }}
        >
          <BookOpen size={15} strokeWidth={1.5} />
          <span>{tr('nav_manual')}</span>
        </a>
        <LanguageToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={
            {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 3,
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
              marginTop: 4,
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = 'white'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
          }}
        >
          <LogOut size={15} strokeWidth={1.5} />
          <span>{tr('signOut')}</span>
        </button>
      </div>
    </aside>
  )
}
