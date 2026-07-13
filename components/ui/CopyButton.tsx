'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * Small inline copy-to-clipboard button, used next to tracking numbers.
 * Shows a green check for 1.5s after a successful copy.
 */
export default function CopyButton({ text, title = 'Copy', copiedTitle = 'Copied!' }: { text: string; title?: string; copiedTitle?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for non-secure contexts / older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? copiedTitle : title}
      aria-label={copied ? copiedTitle : title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        marginLeft: 6,
        padding: 0,
        border: 'none',
        borderRadius: 5,
        background: copied ? '#E8F5EE' : 'transparent',
        cursor: 'pointer',
        color: copied ? '#2F8F5B' : '#8A939B',
        verticalAlign: 'middle',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = '#EEF6F8' }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = 'transparent' }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}
