'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const OCEAN: React.CSSProperties = {
  background: `
    repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 8px),
    linear-gradient(160deg, #001A21 0%, #003E47 100%)
  `,
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', { username, password, redirect: false })

    if (res?.error) {
      setError('Invalid username or password.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        ...OCEAN,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-up">
        {/* Logo + wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 20px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}
          >
            <Image
              src="/mwh-logo.png"
              alt="Motowarehouse"
              width={180}
              height={70}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: '0.22em',
              color: '#72D6E5',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            ACS Payment Reconciliation
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 5, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0F0F0' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#001A21', letterSpacing: '0.04em' }}>Sign In</p>
            <p style={{ fontSize: 11, color: '#A6AEB2', marginTop: 2 }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(222,29,28,0.06)',
                  border: '1px solid rgba(222,29,28,0.2)',
                  borderRadius: 3,
                  padding: '8px 12px',
                }}
              >
                <AlertCircle size={13} color="#DE1D1C" strokeWidth={2} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#DE1D1C' }}>{error}</p>
              </div>
            )}

            <div>
              <label className="label-base">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-base"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="label-base">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  style={{ paddingRight: 42 }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#A6AEB2',
                    display: 'flex',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ height: 42, marginTop: 4 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 20, letterSpacing: '0.04em' }}>
          K.S. Kyprianou Moto Warehouse Ltd
        </p>
      </div>
    </div>
  )
}
