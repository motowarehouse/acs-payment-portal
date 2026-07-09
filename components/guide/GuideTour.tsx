'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Check, Home, LayoutDashboard, Upload, Receipt, PackageSearch, Wallet, AlertTriangle, Users } from 'lucide-react'
import { useT } from '@/components/i18n/LocaleProvider'
import type { TKey } from '@/lib/i18n'

const W = 900
const H = 520
const NAV_X = 148
const DURATION = 4200

type Screen = 'home' | 'import' | 'cheques' | 'exceptions'
interface Step {
  screen: Screen
  cap: TKey
  cx: number
  cy: number
  click?: boolean
  file1?: boolean
  file2?: boolean
  chequeFound?: boolean
  allGreen?: boolean
}

// Cursor coordinates are in stage space (0..900 × 0..520). The main screen
// starts at x = NAV_X (148), so on-screen targets are 148 + their offset.
const STEPS: Step[] = [
  { screen: 'home', cap: 'g_intro', cx: 480, cy: 300 },
  { screen: 'home', cap: 'g_open_import', cx: 74, cy: 132, click: true },
  { screen: 'import', cap: 'g_drop_file1', cx: 342, cy: 205, click: true },
  { screen: 'import', cap: 'g_file1_done', cx: 342, cy: 205, file1: true },
  { screen: 'import', cap: 'g_drop_file2', cx: 686, cy: 205, click: true, file1: true },
  { screen: 'import', cap: 'g_file2_done', cx: 686, cy: 205, file1: true, file2: true },
  { screen: 'cheques', cap: 'g_cheque', cx: 812, cy: 150, click: true },
  { screen: 'cheques', cap: 'g_cheque_record', cx: 280, cy: 398, click: true, chequeFound: true },
  { screen: 'exceptions', cap: 'g_review', cx: 470, cy: 235 },
  { screen: 'home', cap: 'g_done', cx: 480, cy: 300, allGreen: true },
]

const NAV = [
  { key: 'home', y: 80, screen: 'home' as Screen | null },
  { key: 'dashboard', y: 106, screen: null },
  { key: 'import', y: 132, screen: 'import' as Screen | null },
  { key: 'cheques', y: 158, screen: 'cheques' as Screen | null },
  { key: 'shipments', y: 184, screen: null },
  { key: 'outstanding', y: 210, screen: null },
  { key: 'exceptions', y: 236, screen: 'exceptions' as Screen | null },
  { key: 'customers', y: 262, screen: null },
]
const NAV_LABEL: Record<string, TKey> = {
  home: 'nav_home', dashboard: 'nav_dashboard', import: 'nav_import', cheques: 'nav_cheques',
  shipments: 'nav_shipments', outstanding: 'nav_outstanding', exceptions: 'nav_exceptions', customers: 'nav_customers',
}

export default function GuideTour() {
  const tr = useT()
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const s = STEPS[step]
  const last = STEPS.length - 1

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W))
    ro.observe(el)
    setScale(el.clientWidth / W)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) return
    if (step >= last) { setPlaying(false); return }
    const id = setTimeout(() => setStep((v) => Math.min(v + 1, last)), DURATION)
    return () => clearTimeout(id)
  }, [playing, step, last])

  const restart = useCallback(() => { setStep(0); setPlaying(true) }, [])
  const toggle = useCallback(() => {
    if (step >= last) { restart(); return }
    setPlaying((v) => !v)
  }, [step, last, restart])

  return (
    <div style={{ maxWidth: W }}>
      {/* Scaling wrapper: inner is a fixed 900×520 stage scaled to fit */}
      <div ref={wrapRef} style={{ position: 'relative', width: '100%', aspectRatio: `${W} / ${H}`, borderRadius: 8, overflow: 'hidden', border: '1px solid #E1E5E8', boxShadow: '0 12px 40px rgba(0,26,33,0.12)', background: '#F2F4F6' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, transformOrigin: '0 0', transform: `scale(${scale})` }}>
          {/* Sidebar (SVG) */}
          <svg viewBox={`0 0 ${NAV_X} ${H}`} width={NAV_X} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
            <defs>
              <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#001A21" /><stop offset="1" stopColor="#003E47" /></linearGradient>
            </defs>
            <rect x="0" y="0" width={NAV_X} height={H} fill="url(#ocean)" />
            <text x="18" y="40" fill="#FFFFFF" fontSize="14" fontWeight="800" fontFamily="Lato, sans-serif">Motowarehouse</text>
            <text x="18" y="55" fill="#72D6E5" fontSize="7.5" letterSpacing="1.6" fontFamily="Lato, sans-serif">ACS PAYMENTS</text>
            {NAV.map((n) => {
              const active = n.screen === s.screen
              return (
                <g key={n.key}>
                  {active && <rect x="8" y={n.y - 13} width={NAV_X - 16} height="24" rx="3" fill="rgba(0,155,180,0.28)" />}
                  {active && <rect x="8" y={n.y - 13} width="2" height="24" fill="#009BB4" />}
                  <circle cx="20" cy={n.y} r="3" fill={active ? '#72D6E5' : 'rgba(255,255,255,0.35)'} />
                  <text x="32" y={n.y + 4} fill={active ? '#FFFFFF' : 'rgba(255,255,255,0.55)'} fontSize="11" fontWeight={active ? '700' : '400'} fontFamily="Lato, sans-serif">{tr(NAV_LABEL[n.key])}</text>
                </g>
              )
            })}
          </svg>

          {/* Main screen */}
          <div style={{ position: 'absolute', left: NAV_X, top: 0, width: W - NAV_X, height: H }}>
            <Screens step={s} tr={tr} />
          </div>

          {/* Cursor */}
          <Cursor x={s.cx} y={s.cy} click={s.click} />

          {/* Caption */}
          <div style={{ position: 'absolute', left: 32, right: 32, bottom: 22 }}>
            <div style={{ background: 'rgba(0,26,33,0.92)', color: 'white', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#72D6E5', background: 'rgba(114,214,229,0.15)', padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>{tr('g_step')} {step + 1}/{STEPS.length}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{tr(s.cap)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <button className="btn-primary" onClick={toggle} style={{ minWidth: 118 }}>
          {step >= last ? <><RotateCcw size={14} /> {tr('g_restart')}</> : playing ? <><Pause size={14} /> {tr('g_pause')}</> : <><Play size={14} /> {tr('g_play')}</>}
        </button>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => { setStep(i); setPlaying(false) }} aria-label={`${tr('g_step')} ${i + 1}`}
              style={{ flex: 1, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, background: i <= step ? '#009BB4' : '#DDE3E7', transition: 'background 0.2s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Cursor({ x, y, click }: { x: number; y: number; click?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transition: 'left 1s cubic-bezier(0.16,1,0.3,1), top 1s cubic-bezier(0.16,1,0.3,1)', zIndex: 20, pointerEvents: 'none' }}>
      {click && <span key={`${x},${y}`} style={{ position: 'absolute', left: -14, top: -12, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,155,180,0.35)', animation: 'guideRipple 0.9s ease-out' }} />}
      <svg width="26" height="26" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}>
        <path d="M5 3 L5 19 L9.5 14.5 L12.5 21 L15 20 L12 13.5 L18 13.5 Z" fill="#FFFFFF" stroke="#001A21" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <style>{`@keyframes guideRipple { 0% { transform: scale(0.3); opacity: 0.8 } 100% { transform: scale(1.6); opacity: 0 } }`}</style>
    </div>
  )
}

// ── Mock screens ─────────────────────────────────────────────────
function Screens({ step, tr }: { step: Step; tr: (k: TKey) => string }) {
  const pad: React.CSSProperties = { padding: '18px 20px', height: '100%', boxSizing: 'border-box' }
  if (step.screen === 'home') {
    const rows: TKey[] = ['step_shipments', 'step_payments', 'step_cheques', 'step_review']
    return (
      <div style={pad}>
        <p style={titleS}>{tr('today_title')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {rows.map((r, i) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #E7EAED', borderRadius: 6, padding: '11px 14px' }}>
              {step.allGreen ? <Check size={18} color="#2F8F5B" strokeWidth={3} /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #C7CFD4', flexShrink: 0 }} />}
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#243' }}><span style={{ color: '#A6AEB2', marginRight: 6 }}>{i + 1}.</span>{tr(r)}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: step.allGreen ? '#2F8F5B' : '#B7791F', background: step.allGreen ? 'rgba(47,143,91,0.12)' : 'rgba(183,121,31,0.12)', padding: '3px 9px', borderRadius: 10, whiteSpace: 'nowrap' }}>{step.allGreen ? tr('done') : tr('todo')}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (step.screen === 'import') {
    const boxes = [{ t: tr('file1_title'), done: step.file1, res: '12 new · 240 updated' }, { t: tr('file2_title'), done: step.file2, res: '18 matched' }]
    return (
      <div style={pad}>
        <p style={titleS}>{tr('import_title')}</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {boxes.map((b, i) => (
            <div key={i} style={{ flex: 1, background: 'white', border: '1px solid #E7EAED', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #EEF1F3', fontSize: 11.5, fontWeight: 700, color: '#001A21' }}>{b.t}</div>
              <div style={{ margin: 12, border: `1.5px dashed ${b.done ? '#2F8F5B' : '#C7CFD4'}`, borderRadius: 5, padding: '22px 10px', textAlign: 'center', background: b.done ? 'rgba(47,143,91,0.05)' : '#FAFBFC' }}>
                {b.done ? <><Check size={22} color="#2F8F5B" strokeWidth={3} /><p style={{ fontSize: 11.5, fontWeight: 700, color: '#2F8F5B', marginTop: 6 }}>{b.res}</p></> : <><Upload size={22} color="#009BB4" /><p style={{ fontSize: 11, color: '#8A939B', marginTop: 6 }}>Excel .xlsx</p></>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (step.screen === 'cheques') {
    return (
      <div style={pad}>
        <p style={titleS}>{tr('cheques_title')}</p>
        <div style={{ background: 'white', border: '1px solid #E7EAED', borderRadius: 6, padding: 14, marginTop: 12 }}>
          <p style={miniLabel}>{tr('trackingLabel')}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 34, border: '1px solid #E1E5E8', borderRadius: 4, background: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: '#243' }}>9601869524</div>
            <div style={{ height: 34, borderRadius: 4, border: '1px solid #009BB4', color: '#009BB4', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', padding: '0 16px' }}>{tr('find')}</div>
          </div>
          {step.chequeFound && (
            <div style={{ marginTop: 12 }}>
              <div style={{ background: '#FAFBFC', border: '1px solid #EEF1F3', borderRadius: 5, padding: 10, display: 'flex', gap: 18 }}>
                {[[tr('cod'), '668,00'], [tr('paidSoFar'), '0,00'], [tr('remaining'), '668,00']].map(([l, v], i) => (
                  <div key={i}><p style={miniLabel}>{l}</p><p style={{ fontSize: 13, fontWeight: 700, color: i === 2 ? '#B7791F' : '#243', marginTop: 2 }}>€{v}</p></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                {[tr('bank'), tr('chequeNo'), tr('amount'), tr('paymentDate')].map((f) => (
                  <div key={f}><p style={miniLabel}>{f}</p><div style={{ height: 28, border: '1px solid #E1E5E8', borderRadius: 4, background: 'white', marginTop: 3 }} /></div>
                ))}
              </div>
              <div style={{ marginTop: 12, height: 34, width: 160, borderRadius: 4, background: '#009BB4', color: 'white', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Receipt size={13} /> {tr('recordCheque')}</div>
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div style={pad}>
      <p style={titleS}>{tr('exc_title')}</p>
      <div style={{ background: 'white', border: '1px solid #E7EAED', borderRadius: 6, overflow: 'hidden', marginTop: 12 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #EEF1F3', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} color="#B7791F" /><span style={{ fontSize: 12, fontWeight: 700, color: '#001A21' }}>{tr('shortColl')}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#B7791F', background: 'rgba(183,121,31,0.12)', padding: '2px 9px', borderRadius: 10 }}>2</span>
        </div>
        {[['9603343676', 'G&M TSAGGARAS', '€41,00'], ['9520854545', 'XRISOSTOMOU', '€30,00']].map((r) => (
          <div key={r[0]} style={{ display: 'flex', gap: 14, padding: '10px 14px', borderTop: '1px solid #F2F4F6', fontSize: 12 }}>
            <span style={{ fontFamily: 'monospace', color: '#009BB4', fontWeight: 700 }}>{r[0]}</span>
            <span style={{ flex: 1, color: '#445056' }}>{r[1]}</span>
            <span style={{ fontWeight: 700, color: '#B7791F' }}>{r[2]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const titleS: React.CSSProperties = { fontSize: 17, fontWeight: 900, color: '#001A21' }
const miniLabel: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A6AEB2' }
