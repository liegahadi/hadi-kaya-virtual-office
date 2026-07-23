'use client'
// Cash Flow Forecast — plan pekerjaan untuk unit(s), compute total kas needed
// User picks: project, units, workItems (e.g., "Pondasi sampai Atap")
// System computes: material per workItem (from RAB) + upah per workItem (from WageType)
// + supplier suggestions + grand total for selected units
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Calculator, ChevronDown, ChevronRight } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function CashForecast() {
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [availableWorkItems, setAvailableWorkItems] = useState<string[]>([])
  const [selectedWorkItems, setSelectedWorkItems] = useState<Set<string>>(new Set())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/finance/forecast').then(r => r.json()).then(d => {
      if (d.success && d.data?.projects) setProjects(d.data.projects)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`/api/finance/forecast?projectId=${projectId}`).then(r => r.json()).then(d => {
      if (d.success) {
        setAvailableWorkItems(d.data.availableWorkItems)
        setSelectedWorkItems(new Set(d.data.availableWorkItems)) // select all by default
        setData(d.data)
      }
    }).catch(() => toast.error('Gagal load forecast')).finally(() => setLoading(false))
  }, [projectId])

  const toggleWorkItem = (wi: string) => {
    const next = new Set(selectedWorkItems)
    if (next.has(wi)) next.delete(wi); else next.add(wi)
    setSelectedWorkItems(next)
  }

  const selectAll = () => setSelectedWorkItems(new Set(availableWorkItems))
  const selectNone = () => setSelectedWorkItems(new Set())

  const toggleExpand = (wi: string) => {
    const next = new Set(expandedItems)
    if (next.has(wi)) next.delete(wi); else next.add(wi)
    setExpandedItems(next)
  }

  const computeForecast = () => {
    if (!projectId || selectedWorkItems.size === 0) { toast.error('Pilih project + minimal 1 pekerjaan'); return }
    setLoading(true)
    const wiParam = Array.from(selectedWorkItems).join(',')
    fetch(`/api/finance/forecast?projectId=${projectId}&workItems=${encodeURIComponent(wiParam)}`).then(r => r.json()).then(d => {
      if (d.success) setData(d.data)
      else toast.error('Gagal compute')
    }).catch(() => toast.error('Gagal')).finally(() => setLoading(false))
  }

  if (loading && !data) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      {/* Project selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Project:</span>
        <select value={projectId} onChange={e => { setProjectId(e.target.value); setData(null) }}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">— Pilih Project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </div>

      {projectId && availableWorkItems.length > 0 && (
        <>
          {/* WorkItem selector */}
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200">Pilih Pekerjaan (Work Items)</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAll} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">Pilih Semua</Button>
                <Button size="sm" variant="outline" onClick={selectNone} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">Clear</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
              {availableWorkItems.map(wi => (
                <label key={wi} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded cursor-pointer hover:bg-slate-800 text-xs">
                  <Checkbox checked={selectedWorkItems.has(wi)} onCheckedChange={() => toggleWorkItem(wi)} className="border-slate-600" />
                  <span className="text-slate-300 truncate">{wi}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={computeForecast} disabled={loading}>
                <Calculator className="w-3.5 h-3.5 mr-1.5" /> Hitung Forecast
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Forecast result */}
      {data && data.workItems && (
        <>
          {/* Summary */}
          <Card className="p-4 bg-gradient-to-r from-blue-950/50 to-emerald-950/50 border-blue-800/50">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Forecast Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><p className="text-[10px] text-slate-400">Material per Unit</p><p className="text-sm font-bold text-slate-100">{fmt(data.summary.totalMaterialPerUnit)}</p></div>
              <div><p className="text-[10px] text-slate-400">Upah per Unit</p><p className="text-sm font-bold text-slate-100">{fmt(data.summary.totalUpahPerUnit)}</p></div>
              <div><p className="text-[10px] text-slate-400">Total per Unit</p><p className="text-sm font-bold text-slate-100">{fmt(data.summary.totalPerUnit)}</p></div>
              <div><p className="text-[10px] text-slate-400">Jumlah Unit</p><p className="text-sm font-bold text-slate-100">{data.summary.unitCount} unit</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">GRAND TOTAL (semua unit):</span>
                <span className="text-lg font-bold text-emerald-400">{fmt(data.summary.grandTotal)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Unit: {data.units.join(', ')}</p>
            </div>
          </Card>

          {/* Detail per workItem */}
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-3">Detail per Pekerjaan</h3>
            <div className="space-y-2">
              {data.workItems.map((wi: any, i: number) => (
                <div key={i} className="border border-slate-700 rounded overflow-hidden">
                  {/* WorkItem header (clickable to expand) */}
                  <button onClick={() => toggleExpand(wi.workItem)}
                    className="w-full flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 text-left">
                    <div className="flex items-center gap-2">
                      {expandedItems.has(wi.workItem) ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      <span className="text-xs font-medium text-slate-200">{wi.workItem}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">M: {fmt(wi.materialTotal)}</span>
                      <span className="text-slate-400">U: {fmt(wi.upah)}</span>
                      <span className="text-slate-100 font-bold">{fmt(wi.subtotal)}</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expandedItems.has(wi.workItem) && (
                    <div className="p-3 bg-slate-900/50 space-y-2">
                      {/* Material items */}
                      {wi.material.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Material ({wi.material.length})</p>
                          <div className="space-y-1">
                            {wi.material.map((m: any, j: number) => (
                              <div key={j} className="flex items-center justify-between text-[10px] p-1 bg-slate-800/30 rounded">
                                <span className="text-slate-300">{m.materialName}</span>
                                <span className="text-slate-400 font-mono">{m.qty} {m.unitMeasure}</span>
                                <span className="text-slate-400 font-mono">{fmt(m.unitPrice)}</span>
                                <span className="text-slate-200 font-mono font-bold">{fmt(m.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supplier suggestions */}
                      {wi.supplierSuggestions.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Supplier (dari PO sebelumnya)</p>
                          <div className="space-y-1">
                            {wi.supplierSuggestions.map((s: any, j: number) => (
                              <div key={j} className="flex items-center justify-between text-[10px] p-1 bg-slate-800/30 rounded">
                                <span className="text-slate-300">{s.material}</span>
                                <span className="text-slate-400">→ {s.supplier}</span>
                                <span className="text-slate-400 font-mono">{s.lastPrice > 0 ? fmt(s.lastPrice) : '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upah */}
                      {wi.upah > 0 && (
                        <div className="flex items-center justify-between text-[10px] p-1 bg-purple-900/30 rounded">
                          <span className="text-purple-300">Upah: {wi.upahName}</span>
                          <span className="text-purple-200 font-mono font-bold">{fmt(wi.upah)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <p className="text-[10px] text-slate-500">
            💡 Forecast dihitung dari RAB Material (planned) + RAB Upah Tukang (WageType.price). Supplier suggestions dari PO sebelumnya yang beli material yang sama. Klik workItem untuk expand detail material + supplier.
          </p>
        </>
      )}
    </div>
  )
}
