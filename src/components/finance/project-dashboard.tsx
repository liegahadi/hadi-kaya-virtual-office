'use client'
// Project Dashboard — 1 halaman per project: summary cost + RAB + unit ranking + suppliers + timeline
// Plus per-unit detail: biaya breakdown material/upah/ops + status
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function ProjectDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [projectData, setProjectData] = useState<any>(null)
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [unitData, setUnitData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    setSelectedUnit(null); setUnitData(null)

    // Fetch project summary (via cost-per-unit filtered by project)
    Promise.all([
      fetch(`/api/finance/cost-per-unit?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/finance/reports/rab-comparison?projectId=${projectId}`).then(r => r.json()),
    ]).then(([cost, rab]) => {
      const project = projects.find(p => p.id === projectId)
      const totalCost = cost.success ? cost.data.reduce((s: number, u: any) => s + u.total, 0) : 0
      const totalMaterial = cost.success ? cost.data.reduce((s: number, u: any) => s + u.material, 0) : 0
      const totalUpah = cost.success ? cost.data.reduce((s: number, u: any) => s + u.upah, 0) : 0
      const totalOps = cost.success ? cost.data.reduce((s: number, u: any) => s + u.ops, 0) : 0

      setProjectData({
        project,
        summary: { totalMaterial, totalUpah, totalOps, totalCost },
        units: cost.success ? cost.data : [],
        rab: rab.success ? rab.data : null,
      })
      setUnits(cost.success ? cost.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [projectId])

  // Fetch unit detail when selected
  useEffect(() => {
    if (!selectedUnit || !projectId) return
    fetch(`/api/finance/cost-per-unit?projectId=${projectId}`).then(r => r.json()).then(d => {
      if (d.success) {
        const unit = d.data.find((u: any) => u.id === selectedUnit)
        setUnitData(unit)
      }
    }).catch(() => {})
  }, [selectedUnit, projectId])

  if (loading && !projectData) return <Skeleton className="h-96" />

  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Project:</span>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">— Pilih Project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
        {projectId && (
          <a href={`/api/finance/reports/project?projectId=${projectId}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-7">
              <Download className="w-3 h-3 mr-1" /> PDF
            </Button>
          </a>
        )}
      </div>

      {projectData && (
        <>
          {/* Project Summary */}
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-2">{projectData.project?.name} ({projectData.project?.code})</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="text-center"><p className="text-[10px] text-slate-400">Material</p><p className="text-sm font-bold text-slate-200">{fmt(projectData.summary.totalMaterial)}</p></div>
              <div className="text-center"><p className="text-[10px] text-slate-400">Upah</p><p className="text-sm font-bold text-slate-200">{fmt(projectData.summary.totalUpah)}</p></div>
              <div className="text-center"><p className="text-[10px] text-slate-400">Ops</p><p className="text-sm font-bold text-slate-200">{fmt(projectData.summary.totalOps)}</p></div>
              <div className="text-center bg-emerald-950/40 rounded p-1"><p className="text-[10px] text-emerald-400">Total Cost</p><p className="text-sm font-bold text-emerald-300">{fmt(projectData.summary.totalCost)}</p></div>
            </div>
          </Card>

          {/* RAB vs Actual summary */}
          {projectData.rab && (
            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 mb-2">RAB vs Actual</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center"><p className="text-[10px] text-slate-400">RAB Planned</p><p className="text-sm font-bold text-slate-200">{fmt(projectData.rab.grandTotal.planned)}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-400">Actual</p><p className="text-sm font-bold text-slate-200">{fmt(projectData.rab.grandTotal.actual)}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-400">Variance</p><p className={`text-sm font-bold ${projectData.rab.grandTotal.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{projectData.rab.grandTotal.variance > 0 ? '+' : ''}{fmt(projectData.rab.grandTotal.variance)}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-400">% Var</p><p className={`text-sm font-bold ${projectData.rab.grandTotal.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{projectData.rab.grandTotal.variancePercent.toFixed(1)}%</p></div>
              </div>
            </Card>
          )}

          {/* Units table */}
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Biaya per Unit ({units.length} unit)</h3>
            <div className="overflow-x-auto max-h-64 overflow-y-auto dark-scrollbar">
              <table className="w-full text-xs">
                <thead className="bg-slate-800/80 sticky top-0">
                  <tr>
                    <th className="text-left p-1.5 text-slate-300">Unit</th>
                    <th className="text-right p-1.5 text-slate-300">Material</th>
                    <th className="text-right p-1.5 text-slate-300">Upah</th>
                    <th className="text-right p-1.5 text-slate-300">Ops</th>
                    <th className="text-right p-1.5 text-slate-300">Total</th>
                    <th className="text-center p-1.5 text-slate-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u: any) => (
                    <tr key={u.id} className={`border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer ${selectedUnit === u.id ? 'bg-blue-900/30' : ''}`}
                      onClick={() => setSelectedUnit(u.id)}>
                      <td className="p-1.5 text-slate-200 font-medium">{u.blockNumber}</td>
                      <td className="p-1.5 text-right font-mono text-slate-400">{fmt(u.material)}</td>
                      <td className="p-1.5 text-right font-mono text-slate-400">{fmt(u.upah)}</td>
                      <td className="p-1.5 text-right font-mono text-slate-400">{fmt(u.ops)}</td>
                      <td className="p-1.5 text-right font-mono text-slate-100 font-bold">{fmt(u.total)}</td>
                      <td className="p-1.5 text-center">
                        {selectedUnit === u.id ? <Badge variant="outline" className="text-[8px] border-blue-600 text-blue-400">Dipilih</Badge> : <span className="text-[9px] text-slate-500">klik</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Selected unit detail */}
          {unitData && (
            <Card className="p-4 bg-blue-950/30 border-blue-800/50">
              <h3 className="text-sm font-bold text-blue-200 mb-2">Detail Unit {unitData.blockNumber}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div><p className="text-[10px] text-slate-400">Material</p><p className="text-sm font-bold text-slate-200">{fmt(unitData.material)}</p></div>
                <div><p className="text-[10px] text-slate-400">Upah</p><p className="text-sm font-bold text-slate-200">{fmt(unitData.upah)}</p></div>
                <div><p className="text-[10px] text-slate-400">Ops</p><p className="text-sm font-bold text-slate-200">{fmt(unitData.ops)}</p></div>
                <div className="bg-emerald-950/40 rounded p-1"><p className="text-[10px] text-emerald-400">Total</p><p className="text-sm font-bold text-emerald-300">{fmt(unitData.total)}</p></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">💡 Detail lebih lengkap (RAB vs actual per workItem untuk unit ini) ada di sub-tab "RAB vs Actual" — filter by project.</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
