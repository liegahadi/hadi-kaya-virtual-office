'use client'
// Cost per Unit Ranking — sub-tab di Finance
// Biaya per unit (material + upah + ops), ranking termahal-termurah
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Download } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function CostPerUnit() {
  const [data, setData] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/finance/cost-per-unit${projectId ? `?projectId=${projectId}` : ''}`).then(r => r.json()).then(d => {
      if (d.success) setData(d.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [projectId])

  const maxTotal = Math.max(...data.map(d => d.total), 1)

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Project:</span>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </div>

      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Biaya per Unit (urut termahal)</h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto dark-scrollbar">
          {data.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Tidak ada data</p>
          ) : data.map((u, i) => (
            <div key={u.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
              <span className="text-[10px] font-bold w-6 text-center text-slate-400">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-200">{u.blockNumber}</span>
                  <Badge variant="outline" className="text-[8px] border-slate-600 text-slate-400">{u.project?.code || '-'}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500">
                  <span>M: {fmt(u.material)}</span>
                  <span>U: {fmt(u.upah)}</span>
                  <span>O: {fmt(u.ops)}</span>
                </div>
                {/* Bar chart */}
                <div className="h-1.5 bg-slate-700 rounded mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded ${u.total > maxTotal * 0.7 ? 'bg-red-500' : u.total > maxTotal * 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(u.total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-100 ml-2 whitespace-nowrap">{fmt(u.total)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <a href="/api/finance/export?type=po&format=csv" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700">
          <Download className="w-3 h-3" /> Export PO (CSV)
        </a>
        <a href="/api/finance/export?type=wages&format=csv" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700">
          <Download className="w-3 h-3" /> Export Upah (CSV)
        </a>
        <a href="/api/finance/export?type=expenses&format=csv" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700">
          <Download className="w-3 h-3" /> Export Biaya Lain (CSV)
        </a>
      </div>
    </div>
  )
}
