'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PackageSearch,
  Wallet,
} from 'lucide-react'
import { formatEuro } from '@/lib/utils'

type Kind = 'shipments' | 'payments'

interface ShipmentResult {
  ok: true
  totalRows: number
  created: number
  updated: number
  outbound: number
  inbound: number
  codShipments: number
  codTotal: number
  duplicates: string[]
}

interface PaymentResult {
  ok: true
  totalRows: number
  matched: number
  unmatched: number
  skipped: number
  mismatches: number
  paidTotal: number
  unmatchedList: { trackingNumber: string; amount: number; recipient: string | null }[]
}

export default function ImportClient() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <UploadCard
        kind="shipments"
        icon={PackageSearch}
        title="File 1 — Shipments"
        subtitle="ΑΝΑΖΗΤΗΣΗ ΑΠΟΣΤΟΛΩΝ · daily ACS export"
        accept=".xlsx,.xls"
        endpoint="/api/import/shipments"
      />
      <UploadCard
        kind="payments"
        icon={Wallet}
        title="File 2 — Cash / Visa payments"
        subtitle="ACS Notification of Payment"
        accept=".xls,.xlsx"
        endpoint="/api/import/payments"
      />
    </div>
  )
}

function UploadCard({
  kind,
  icon: Icon,
  title,
  subtitle,
  accept,
  endpoint,
}: {
  kind: Kind
  icon: React.ElementType
  title: string
  subtitle: string
  accept: string
  endpoint: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ShipmentResult | PaymentResult | null>(null)
  const [filename, setFilename] = useState<string | null>(null)

  async function upload(file: File) {
    setBusy(true)
    setError(null)
    setResult(null)
    setFilename(file.name)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Import failed.')
      } else {
        setResult(json)
        router.refresh()
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel animate-fade-up" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #EEF1F3', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 4, background: 'rgba(0,155,180,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color="#009BB4" strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#001A21' }}>{title}</p>
          <p style={{ fontSize: 11.5, color: '#8A939B', marginTop: 1 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f && !busy) upload(f)
          }}
          style={{
            border: `1.5px dashed ${dragOver ? '#009BB4' : '#D3DADF'}`,
            background: dragOver ? 'rgba(0,155,180,0.04)' : '#FAFBFC',
            borderRadius: 5,
            padding: '30px 20px',
            textAlign: 'center',
            cursor: busy ? 'default' : 'pointer',
            transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {busy ? (
            <Loader2 size={26} color="#009BB4" className="animate-spin" style={{ margin: '0 auto' }} />
          ) : (
            <UploadCloud size={26} color="#009BB4" strokeWidth={1.6} style={{ margin: '0 auto' }} />
          )}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#445056', marginTop: 10 }}>
            {busy ? 'Importing…' : 'Drop file here or click to browse'}
          </p>
          <p style={{ fontSize: 11, color: '#A6AEB2', marginTop: 3 }}>Excel file ({accept})</p>
          {filename && !busy && (
            <p style={{ fontSize: 11, color: '#667079', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <FileSpreadsheet size={12} /> {filename}
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ''
          }}
        />

        {error && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(222,29,28,0.06)', border: '1px solid rgba(222,29,28,0.2)', borderRadius: 4, padding: '10px 12px' }}>
            <AlertTriangle size={14} color="#DE1D1C" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#B91C1B' }}>{error}</p>
          </div>
        )}

        {result && kind === 'shipments' && <ShipmentSummary r={result as ShipmentResult} />}
        {result && kind === 'payments' && <PaymentSummary r={result as PaymentResult} />}
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F2F4F6' }}>
      <span style={{ fontSize: 12, color: '#667079' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent || '#1A2226' }}>{value}</span>
    </div>
  )
}

function ShipmentSummary({ r }: { r: ShipmentResult }) {
  return (
    <div style={{ marginTop: 14 }} className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <CheckCircle2 size={14} color="#2F8F5B" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#2F8F5B' }}>Imported successfully</span>
      </div>
      <Row label="Rows processed" value={String(r.totalRows)} />
      <Row label="New / updated" value={`${r.created} / ${r.updated}`} />
      <Row label="Outbound / inbound" value={`${r.outbound} / ${r.inbound}`} />
      <Row label="COD shipments to collect" value={String(r.codShipments)} accent="#009BB4" />
      <Row label="COD total" value={formatEuro(r.codTotal)} accent="#009BB4" />
      {r.duplicates.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(183,121,31,0.08)', border: '1px solid rgba(183,121,31,0.25)', borderRadius: 4, padding: '10px 12px' }}>
          <AlertTriangle size={14} color="#B7791F" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#8A5D18' }}>
            {r.duplicates.length} duplicate tracking number{r.duplicates.length > 1 ? 's' : ''} in this file: {r.duplicates.join(', ')}. Flagged for review.
          </p>
        </div>
      )}
    </div>
  )
}

function PaymentSummary({ r }: { r: PaymentResult }) {
  return (
    <div style={{ marginTop: 14 }} className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <CheckCircle2 size={14} color="#2F8F5B" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#2F8F5B' }}>Payments processed</span>
      </div>
      <Row label="Rows processed" value={String(r.totalRows)} />
      <Row label="Matched to a shipment" value={String(r.matched)} accent="#2F8F5B" />
      <Row label="Unmatched" value={String(r.unmatched)} accent={r.unmatched ? '#DE1D1C' : '#1A2226'} />
      {r.skipped > 0 && <Row label="Skipped (already imported)" value={String(r.skipped)} />}
      <Row label="Amount mismatches" value={String(r.mismatches)} accent={r.mismatches ? '#B7791F' : '#1A2226'} />
      <Row label="Total collected" value={formatEuro(r.paidTotal)} accent="#009BB4" />
      {r.unmatchedList.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(222,29,28,0.06)', border: '1px solid rgba(222,29,28,0.2)', borderRadius: 4, padding: '10px 12px' }}>
          <AlertTriangle size={14} color="#DE1D1C" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#B91C1B' }}>
            {r.unmatchedList.length} payment{r.unmatchedList.length > 1 ? 's' : ''} had no matching shipment. See the Exceptions page.
          </p>
        </div>
      )}
    </div>
  )
}
