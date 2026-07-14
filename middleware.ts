import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * In-memory rate limiting (fixed window per IP).
 * Suits the single-instance Railway deployment: counters reset on redeploy
 * and are per-instance, which is fine for a 2-user internal portal.
 *
 * - Login attempts (POST /api/auth/callback/credentials): 10 per 10 minutes.
 *   Stops password brute-forcing.
 * - All other /api requests: 300 per minute. Generous enough for the
 *   autocomplete + normal use, stops runaway scripts and scraping.
 */

type Bucket = { count: number; resetAt: number }
const hits = new Map<string, Bucket>()

const LOGIN = { limit: 10, windowMs: 10 * 60_000 }
const API = { limit: 300, windowMs: 60_000 }

function take(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const b = hits.get(key)
  if (!b || now >= b.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  b.count += 1
  if (b.count > limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) }
  return { ok: true, retryAfter: 0 }
}

function sweep() {
  if (hits.size < 5000) return
  const now = Date.now()
  for (const [k, b] of hits) {
    if (now >= b.resetAt) hits.delete(k)
  }
}

export function middleware(req: NextRequest) {
  sweep()

  const ip =
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.ip ||
    'unknown'

  const isLoginAttempt =
    req.method === 'POST' && req.nextUrl.pathname.startsWith('/api/auth/callback/credentials')

  const cfg = isLoginAttempt ? LOGIN : API
  const key = `${isLoginAttempt ? 'login' : 'api'}:${ip}`

  const res = take(key, cfg.limit, cfg.windowMs)
  if (!res.ok) {
    return NextResponse.json(
      {
        error: isLoginAttempt
          ? 'Too many login attempts. Please wait a few minutes and try again.'
          : 'Too many requests. Please slow down.',
      },
      { status: 429, headers: { 'Retry-After': String(res.retryAfter) } }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
