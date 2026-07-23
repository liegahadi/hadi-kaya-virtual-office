'use client'
// Material Category Tracking — track usage per workItem vs RAB
// Per item pekerjaan: planned vs actual per material, detect over/under budget
// Collapsible sections per workItem
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function CategoryTracking() {
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/finance/material/category-tracking').then(r => r.json()).then(d => {
      if (d.success && d.data?.projects) {
        setProjects(d.data.projects)
        if (d.data.projects.length > 0) setProjectId(d.data.projects[0].id)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`/api/finance/material/category-tracking?projectId=${projectId}`).then(r => r.json()).then(d => {
      if (d.success) setData(d.data)
      else toast.error('Gagal load')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [projectId])

  const toggle = (wi: string) => {
    const next = new Set(expanded)
    if (next.has(wi)) next.delete(wi); else next.add(wi)
    setExpanded(next)
  }

  const statusBadge = (status: string) => {
    if (status === 'FAVORABLE') return <Badge className="bg-emerald-900/60 text-emerald-200 border-emerald-700 text-[9px]"><TrendingDown className="w-2.5 h-2.5 mr-0.5" />Hemat</Badge>
    if (status === 'UNFAVORABLE') return <Badge className="bg-red-900/60 text-red-200 border-red-700 text-[9px]"><TrendingUp className="w-2.5 h-2.5 mr-0.5" />Over</Badge>
    return <Badge className="bg-slate-700 text-slate-300 text-[9px]"><Minus className="w-2.5 h-2.5 mr-0.5" />Pas</Badge>
  }

  if (loading && !data.length) return <Skeleton className="h-64" />

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Project:</span>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </div>

      {data.length === 0 ? (
        <Card className="p-6 bg-slate-900/50 border-slate-800 text-center">
          <p className="text-xs text-slate-500">Tidak ada data. Pilih project yang punya RAB.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((wi: any, i: number) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800 overflow-hidden">
              {/* WorkItem header */}
              <button onClick={() => toggle(wi.workItem)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 text-left">
                <div className="flex items-center gap-2">
                  {expanded.has(wi.workItem) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs font-medium text-slate-200">{wi.workItem}</span>
                  <span className="text-[10px] text-slate-500">({wi.materialCount} material)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">RAB: {fmt(wi.plannedTotal)}</span>
                  <span className="text-slate-200">Actual: {fmt(wi.actualTotal)}</span>
                  <span className={`font-bold ${wi.variance > 0 ? 'text-red-400' : wi.variance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {wi.variance > 0 ? '+' : ''}{fmt(wi.variance)}
                  </span>
                  {statusBadge(wi.status)}
                </div>
              </button>

              {/* Expanded material detail */}
              {expanded.has(wi.workItem) && (
                <div className="p-3 bg-slate-900/30 border-t border-slate-800">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left p-1">Material</th>
                        <th className="text-right p-1">RAB Qty</th>
                        <th className="text-right p-1">Actual Qty</th>
                        <th className="text-right p-1">RAB Total</th>
                        <th className="text-right p-1">Actual Total</th>
                        <th className="text-right p-1">Variance</th>
                        <th className="text-center p-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wi.materials.map((m: any, j: number) => (
                        <tr key={j} className="border-b border-slate-800/50">
                          <td className="p-1 text-slate-300">{m.materialName}</td>
                          <td className="p-1 text-right font-mono text-slate-500">{m.plannedQty > 0 ? `${m.plannedQty} ${m.unitMeasure}` : '—'}</td>
                          <td className="p-1 text-right font-mono text-slate-300">{m.actualQty > 0 ? `${m.actualQty.toFixed(1)}` : '—'}</td>
                          <td className="p-1 text-right font-mono text-slate-500">{m.plannedTotal > 0 ? fmt(m.plannedTotal) : '—'}</td>
                          <td className="p-1 text-right font-mono text-slate-200">{m.actualTotal > 0 ? fmt(m.actualTotal) : '—'}</td>
                          <td className={`p-1 text-right font-mono font-bold ${m.variance > 0 ? 'text-red-400' : m.variance < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {m.variance !== 0 ? `${m.variance > 0 ? '+' : ''}${fmt(m.variance)}` : '—'}
                          </td>
                          <td className="p-1 text-center">{statusBadge(m.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        💡 Tracking per workItem: RAB (planned) vs pemakaian actual. <strong>Hemat</strong> = actual &lt; RAB. <strong>Over</strong> = actual &gt; RAB. Klik workItem untuk expand detail per material.
      </p>
    </div>
  )
}
