'use client'
// Construction Schedule (Gantt Chart) + Unit Completion %
// Sub-tab di Finance: visual timeline pekerjaan per unit
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, FileText, Camera } from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  NOT_STARTED: 'bg-slate-700 text-slate-400', STARTED: 'bg-blue-900/60 text-blue-200',
  IN_PROGRESS: 'bg-amber-900/60 text-amber-200', DONE: 'bg-emerald-900/60 text-emerald-200',
}
const barColor: Record<string, string> = {
  NOT_STARTED: 'bg-slate-700', STARTED: 'bg-blue-600', IN_PROGRESS: 'bg-amber-600', DONE: 'bg-emerald-600',
}

export function ConstructionSchedule() {
  const [data, setData] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/finance/construction-schedule${projectId ? `?projectId=${projectId}` : ''}`).then(r => r.json()).then(d => {
      if (d.success) setData(d.data)
    }).catch(() => toast.error('Gagal load schedule')).finally(() => setLoading(false))
  }, [projectId])

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

      {/* Summary tiles */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-2 bg-slate-900/50 border-slate-800 text-center">
          <p className="text-[9px] text-slate-400">Total Unit</p>
          <p className="text-lg font-bold text-slate-200">{data.length}</p>
        </Card>
        <Card className="p-2 bg-emerald-950/40 border-emerald-800/50 text-center">
          <p className="text-[9px] text-emerald-300">Selesai 100%</p>
          <p className="text-lg font-bold text-emerald-200">{data.filter(d => d.completionPercent === 100).length}</p>
        </Card>
        <Card className="p-2 bg-amber-950/40 border-amber-800/50 text-center">
          <p className="text-[9px] text-amber-300">Sedang Berjalan</p>
          <p className="text-lg font-bold text-amber-200">{data.filter(d => d.completionPercent > 0 && d.completionPercent < 100).length}</p>
        </Card>
        <Card className="p-2 bg-slate-800/50 border-slate-700 text-center">
          <p className="text-[9px] text-slate-400">Belum Mulai</p>
          <p className="text-lg font-bold text-slate-500">{data.filter(d => d.completionPercent === 0).length}</p>
        </Card>
      </div>

      {/* Gantt per unit */}
      <div className="space-y-2">
        {data.map((unit) => (
          <Card key={unit.unitId} className="bg-slate-900/50 border-slate-800 overflow-hidden">
            {/* Unit header */}
            <button
              onClick={() => setExpandedUnit(expandedUnit === unit.unitId ? null : unit.unitId)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/40 text-left"
            >
              {expandedUnit === unit.unitId ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">{unit.blockNumber}</span>
                  <Badge variant="outline" className="text-[8px] border-slate-600 text-slate-400">{unit.project?.code}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {/* Progress bar */}
                  <div className="flex-1 h-2 bg-slate-700 rounded overflow-hidden">
                    <div className={`h-full rounded ${unit.completionPercent === 100 ? 'bg-emerald-600' : unit.completionPercent > 0 ? 'bg-amber-600' : 'bg-slate-600'}`} style={{ width: `${unit.completionPercent}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{unit.completionPercent}%</span>
                  <span className="text-[10px] text-slate-500">{unit.completedTasks}/{unit.totalTasks} pekerjaan</span>
                </div>
              </div>
            </button>

            {/* Expanded: Gantt tasks */}
            {expandedUnit === unit.unitId && (
              <div className="border-t border-slate-800 p-3 space-y-1">
                {unit.tasks.map((task: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-[9px] font-bold w-5 text-center text-slate-500">#{task.order}</span>
                    <span className="flex-1 text-slate-300 truncate">{task.workItem}</span>
                    {/* Mini progress bar */}
                    <div className="w-24 h-1.5 bg-slate-700 rounded overflow-hidden">
                      <div className={`h-full rounded ${barColor[task.status]}`} style={{ width: `${task.percent}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-500 w-8 text-right">{task.percent}%</span>
                    <Badge variant="outline" className={`text-[8px] ${statusColor[task.status]}`}>{task.status.replace('_', ' ')}</Badge>
                    {task.paidAmount > 0 && <span className="text-[9px] font-mono text-emerald-400 w-20 text-right">{fmt(task.paidAmount)}</span>}
                  </div>
                ))}
                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-[10px] h-7" onClick={() => window.open(`/api/finance/reports/unit-progress?unitId=${unit.unitId}`, '_blank')}>
                    <FileText className="w-3 h-3 mr-1" /> Progress Report PDF
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {data.length === 0 && <p className="text-center text-slate-500 text-sm py-8">Tidak ada data</p>}
      </div>
    </div>
  )
}
