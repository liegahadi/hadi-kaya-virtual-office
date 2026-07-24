'use client'
// Material Dashboard — Stock Value + Top Materials + Category Breakdown
// Sub-tab di Material
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export function StockValueDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/finance/material/stock-value').then(r => r.json()).then(d => { if (d.success) setData(d.data) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-64" />
  if (!data) return <p className="text-slate-400 text-sm p-4">Gagal load data</p>

  return (
    <div className="space-y-3">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-emerald-950/40 border-emerald-800/50">
          <p className="text-[10px] text-emerald-300 font-medium">Total Nilai Stok</p>
          <p className="text-xl font-bold text-emerald-200">{fmt(data.totalValue)}</p>
        </Card>
        <Card className="p-3 bg-blue-950/40 border-blue-800/50">
          <p className="text-[10px] text-blue-300 font-medium">Total Qty (all unit)</p>
          <p className="text-xl font-bold text-blue-200">{data.totalQty.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-3 bg-purple-950/40 border-purple-800/50">
          <p className="text-[10px] text-purple-300 font-medium">Jumlah Material</p>
          <p className="text-xl font-bold text-purple-200">{data.materialCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Pie chart per category */}
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 mb-2">Nilai Stok per Kategori</h3>
          {data.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => e.name}>
                  {data.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 10, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-slate-500 text-center py-8">Tidak ada data</p>}
        </Card>

        {/* Top 10 materials by value */}
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 mb-2">Top 10 Material Termahal</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto dark-scrollbar">
            {data.topMaterials.map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded text-xs">
                <span className="text-[9px] font-bold w-4 text-center text-slate-400">#{i + 1}</span>
                <span className="flex-1 text-slate-200 truncate">{m.name}</span>
                <span className="text-slate-400 font-mono">{m.qty}</span>
                <span className="text-slate-100 font-mono font-bold">{fmt(m.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
