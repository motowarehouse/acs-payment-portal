'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_META } from '@/lib/constants'
import type { ShipmentStatus } from '@prisma/client'

export interface Slice {
  status: ShipmentStatus
  count: number
}

export default function StatusChart({ data }: { data: Slice[] }) {
  const rows = data.filter((d) => d.count > 0)
  const total = rows.reduce((s, d) => s + d.count, 0)

  if (total === 0) {
    return <p style={{ fontSize: 12.5, color: '#8A939B', padding: '30px 0', textAlign: 'center' }}>No shipments yet.</p>
  }

  const chartData = rows.map((d) => ({
    name: STATUS_META[d.status].label,
    value: d.count,
    color: STATUS_META[d.status].color,
  }))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 150, height: 150, position: 'relative', flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [`${v}`, n]}
              contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #E7EAED' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#001A21', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 9.5, color: '#8A939B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>shipments</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {chartData.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#445056', flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2226' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
