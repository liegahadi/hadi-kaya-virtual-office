'use client'
// Cost per Unit Detail Modal — click unit → detail biaya
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function UnitCostDetailModal({ unitId, open, onClose }: { unitId: string | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (unitId && open) {
      setLoading(true)
      // Fetch unit cost detail
      fetch(`/api/finance/cost-per-unit`).then(r => r.json()).then(d => {
        if (d.success) {
          const unit = d.data.find((u: any) => u.id === unitId)
          if (unit) setData(unit)
        }
      }).catch(() => {}).finally(() => setLoading(false))
    } else { setData(null) }
  }, [unitId, open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Biaya Unit {data?.blockNumber || '...'}</DialogTitle>
        </DialogHeader>
        {loading ? <Skeleton className="h-32" /> : data ? (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Project:</span> <span className="text-slate-200">{data.project?.name}</span></div>
              <div><span className="text-slate-400">Unit:</span> <span className="text-slate-200">{data.blockNumber}</span></div>
            </div>
            <Card className="p-3 bg-slate-800/50 border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Material (pemakaian):</span><span className="text-slate-200 font-mono">{fmt(data.material)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Upah Tukang:</span><span className="text-slate-200 font-mono">{fmt(data.upah)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Biaya Lain:</span><span className="text-slate-200 font-mono">{fmt(data.ops)}</span></div>
              <div className="flex justify-between border-t border-slate-600 pt-1 font-bold"><span className="text-slate-300">TOTAL:</span><span className="text-slate-100 font-mono">{fmt(data.total)}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-slate-500">RAB Benchmark:</span><span className="text-slate-500 font-mono">Rp 73.800.000</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-slate-500">Variance:</span><span className={data.total > 73800000 ? 'text-red-400' : 'text-emerald-400'}>{data.total > 73800000 ? 'OVER BUDGET' : 'UNDER BUDGET'} ({((data.total / 73800000) * 100).toFixed(0)}%)</span></div>
            </Card>
            <a href={`/api/finance/reports/unit-progress?unitId=${data.id}`} target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-blue-400 hover:text-blue-300 underline">
              Lihat Progress Report PDF →
            </a>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
