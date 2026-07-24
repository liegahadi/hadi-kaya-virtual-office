'use client'
// RAB vs Actual Comparison — sub-tab di Finance
// Compare RAB (planned) vs realisasi (actual) per workItem
// Color: green (favorable/under budget), red (unfavorable/over budget)
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function RabComparison() {
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/finance/reports/rab-comparison').then(r => r.json()).then(d => {
      if (d.success && d.data?.projects) {
        setProjects(d.data.projects)
        if (d.data.projects.length > 0) setProjectId(d.data.projects[0].id)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`/api/finance/reports/rab-comparison?projectId=${projectId}`).then(r => r.json()).then(d => {
      if (d.success) setData(d.data)
      else toast.error('Gagal load RAB comparison')
    }).catch(() => toast.error('Gagal load')).finally(() => setLoading(false))
  }, [projectId])

  if (loading && !data) {
    return <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-64" /></div>
  }

  if (!data) {
    return <div className="text-slate-400 text-sm p-4">Pilih project untuk lihat RAB vs Actual</div>
  }

  const statusBadge = (status: string) => {
    if (status === 'FAVORABLE') return <Badge className="bg-emerald-900/60 text-emerald-200 border-emerald-700 text-[9px]"><TrendingDown className="w-2.5 h-2.5 mr-0.5" />Hemat</Badge>
    if (status === 'UNFAVORABLE') return <Badge className="bg-red-900/60 text-red-200 border-red-700 text-[9px]"><TrendingUp className="w-2.5 h-2.5 mr-0.5" />Over</Badge>
    return <Badge className="bg-slate-700 text-slate-300 text-[9px]"><Minus className="w-2.5 h-2.5 mr-0.5" />Pas</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Project:</span>
        <select value={projectId} onChange={e => { setProjectId(e.target.value); setData(null) }}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </div>

      {/* Grand total summary */}
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Ringkasan: RAB vs Actual — {data.project.name}</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-slate-400">RAB (Planned)</p>
            <p className="text-sm font-bold text-slate-200">{fmt(data.grandTotal.planned)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Realisasi (Actual)</p>
            <p className="text-sm font-bold text-slate-200">{fmt(data.grandTotal.actual)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Variance</p>
            <p className={`text-sm font-bold ${data.grandTotal.variance > 0 ? 'text-red-400' : data.grandTotal.variance < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {data.grandTotal.variance > 0 ? '+' : ''}{fmt(data.grandTotal.variance)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">% Variance</p>
            <p className={`text-sm font-bold ${data.grandTotal.variance > 0 ? 'text-red-400' : data.grandTotal.variance < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {data.grandTotal.variancePercent > 0 ? '+' : ''}{data.grandTotal.variancePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Material comparison */}
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200">Material: RAB vs Pemakaian</h3>
          <div className="flex gap-3 text-[10px]">
            <span className="text-slate-400">Planned: <span className="text-slate-200 font-mono">{fmt(data.material.summary.plannedTotal)}</span></span>
            <span className="text-slate-400">Actual: <span className="text-slate-200 font-mono">{fmt(data.material.summary.actualTotal)}</span></span>
            <span className={data.material.summary.variance > 0 ? 'text-red-400' : 'text-emerald-400'}>
              Variance: <span className="font-mono">{data.material.summary.variance > 0 ? '+' : ''}{fmt(data.material.summary.variance)}</span>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto dark-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 sticky top-0">
              <tr>
                <th className="text-left p-1.5 text-slate-300">Pekerjaan</th>
                <th className="text-left p-1.5 text-slate-300">Material</th>
                <th className="text-right p-1.5 text-slate-300">RAB Qty</th>
                <th className="text-right p-1.5 text-slate-300">Actual Qty</th>
                <th className="text-right p-1.5 text-slate-300">RAB Total</th>
                <th className="text-right p-1.5 text-slate-300">Actual Total</th>
                <th className="text-right p-1.5 text-slate-300">Variance</th>
                <th className="text-center p-1.5 text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.material.rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-slate-500">Tidak ada data RAB material</td></tr>
              ) : data.material.rows.map((r: any, i: number) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="p-1.5 text-slate-300">{r.workItem}</td>
                  <td className="p-1.5 text-slate-200">{r.materialName}</td>
                  <td className="p-1.5 text-right font-mono text-slate-400">{r.plannedQty} {r.unitMeasure}</td>
                  <td className="p-1.5 text-right font-mono text-slate-300">{r.actualQty > 0 ? `${r.actualQty.toFixed(1)}` : '—'}</td>
                  <td className="p-1.5 text-right font-mono text-slate-400">{r.plannedTotal > 0 ? fmt(r.plannedTotal) : '—'}</td>
                  <td className="p-1.5 text-right font-mono text-slate-200">{r.actualTotal > 0 ? fmt(r.actualTotal) : '—'}</td>
                  <td className={`p-1.5 text-right font-mono font-bold ${r.variance > 0 ? 'text-red-400' : r.variance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {r.variance > 0 ? '+' : ''}{r.variance !== 0 ? fmt(r.variance) : '—'}
                  </td>
                  <td className="p-1.5 text-center">{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upah comparison */}
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200">Upah Tukang: RAB vs Pembayaran</h3>
          <div className="flex gap-3 text-[10px]">
            <span className="text-slate-400">Planned: <span className="text-slate-200 font-mono">{fmt(data.upah.summary.plannedTotal)}</span></span>
            <span className="text-slate-400">Actual: <span className="text-slate-200 font-mono">{fmt(data.upah.summary.actualTotal)}</span></span>
            <span className={data.upah.summary.variance > 0 ? 'text-red-400' : 'text-emerald-400'}>
              Variance: <span className="font-mono">{data.upah.summary.variance > 0 ? '+' : ''}{fmt(data.upah.summary.variance)}</span>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto dark-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 sticky top-0">
              <tr>
                <th className="text-left p-1.5 text-slate-300">Pekerjaan</th>
                <th className="text-right p-1.5 text-slate-300">Budget/Unit</th>
                <th className="text-center p-1.5 text-slate-300">Unit Dibayar</th>
                <th className="text-right p-1.5 text-slate-300">Total Planned</th>
                <th className="text-right p-1.5 text-slate-300">Total Actual</th>
                <th className="text-right p-1.5 text-slate-300">Variance</th>
                <th className="text-center p-1.5 text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upah.rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-slate-500">Tidak ada data WageType</td></tr>
              ) : data.upah.rows.map((r: any, i: number) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="p-1.5 text-slate-300 max-w-48 truncate">{r.workItem}</td>
                  <td className="p-1.5 text-right font-mono text-slate-400">{fmt(r.plannedBudget)}</td>
                  <td className="p-1.5 text-center text-slate-300">{r.unitCount}</td>
                  <td className="p-1.5 text-right font-mono text-slate-400">{fmt(r.totalPlanned)}</td>
                  <td className="p-1.5 text-right font-mono text-slate-200">{r.actualPaid > 0 ? fmt(r.actualPaid) : '—'}</td>
                  <td className={`p-1.5 text-right font-mono font-bold ${r.variance > 0 ? 'text-red-400' : r.variance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {r.variance > 0 ? '+' : ''}{r.variance !== 0 ? fmt(r.variance) : '—'}
                  </td>
                  <td className="p-1.5 text-center">{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[10px] text-slate-500">
        💡 <strong>Hemat (hijau)</strong> = actual lebih kecil dari RAB (favorable). <strong>Over (merah)</strong> = actual lebih besar dari RAB (unfavorable). <strong>Pas (abu)</strong> = belum ada realisasi atau sama persis.
      </p>
    </div>
  )
}
