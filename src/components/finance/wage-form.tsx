'use client'
// Wage Form Modal — create wage payment (1 record = 1 termin)
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function WageFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [wageTypes, setWageTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [wageTypeId, setWageTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [workDescription, setWorkDescription] = useState('')
  const [wageDate, setWageDate] = useState(new Date().toISOString().slice(0, 10))
  const [budgetVarianceReason, setBudgetVarianceReason] = useState('')

  useEffect(() => {
    if (open) {
      fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {})
      fetch('/api/finance/workers').then(r => r.json()).then(d => { if (d.success) setWorkers(d.data) }).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (projectId) {
      fetch(`/api/units?projectId=${projectId}`).then(r => r.json()).then(d => setUnits(d.units || d.data || [])).catch(() => setUnits([]))
      fetch(`/api/finance/wage-types?projectId=${projectId}`).then(r => r.json()).then(d => { if (d.success) setWageTypes(d.data) }).catch(() => setWageTypes([]))
    } else { setUnits([]); setWageTypes([]) }
  }, [projectId])

  // Auto-fill amount from wageType price
  useEffect(() => {
    if (wageTypeId) { const wt = wageTypes.find(w => w.id === wageTypeId); if (wt) setAmount(wt.price.toLocaleString('id-ID')) }
  }, [wageTypeId])

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }
  const parseRibuan = (s: string) => parseInt(s.replace(/\./g, '')) || 0
  const selectedWageType = wageTypes.find(w => w.id === wageTypeId)
  const budget = selectedWageType?.price || 0
  const amountNum = parseRibuan(amount)
  const isOverBudget = amountNum > budget

  const handleSave = async () => {
    if (!workerId || !wageTypeId || !projectId) { toast.error('Worker, WageType, Project wajib'); return }
    if (isOverBudget && !budgetVarianceReason) { toast.error('Alasan variance wajib (amount > budget)'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/finance/wages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, wageTypeId, projectId, unitId: unitId || null, amount: amountNum, workDescription, wageDate, budgetVarianceReason: isOverBudget ? budgetVarianceReason : undefined }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success('Upah tukang tercatat')
      onSaved(); onClose()
      setAmount(''); setWorkDescription(''); setBudgetVarianceReason(''); setUnitId(''); setWorkerId(''); setWageTypeId('')
    } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader><DialogTitle className="text-slate-100">Catat Upah Tukang</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-slate-300 text-xs">Project *</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Pilih —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Unit</Label>
              <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!projectId} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 disabled:opacity-50">
                <option value="">— GDG —</option>{units.map(u => <option key={u.id} value={u.id}>{u.blockNumber}</option>)}
              </select></div>
          </div>
          <div><Label className="text-slate-300 text-xs">Tukang *</Label>
            <select value={workerId} onChange={e => setWorkerId(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
              <option value="">— Pilih Tukang —</option>{workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select></div>
          <div><Label className="text-slate-300 text-xs">Pekerjaan (WageType) *</Label>
            <select value={wageTypeId} onChange={e => setWageTypeId(e.target.value)} disabled={!projectId} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 disabled:opacity-50">
              <option value="">— Pilih —</option>{wageTypes.map(w => <option key={w.id} value={w.id}>{w.name} (Rp {w.price.toLocaleString('id-ID')})</option>)}
            </select></div>
          {budget > 0 && <p className="text-[10px] text-slate-500">Budget: Rp {budget.toLocaleString('id-ID')}</p>}
          <div><Label className="text-slate-300 text-xs">Jumlah (Rp) *</Label>
            <Input type="text" value={amount} onChange={e => setAmount(fmtRibuan(e.target.value))} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            {isOverBudget && <p className="text-[10px] text-amber-400 mt-0.5">⚠️ Amount melebihi budget! Alasan wajib.</p>}</div>
          {isOverBudget && <div><Label className="text-slate-300 text-xs">Alasan Variance *</Label>
            <Input value={budgetVarianceReason} onChange={e => setBudgetVarianceReason(e.target.value)} placeholder="e.g., Pekerjaan tambahan, harga naik" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>}
          <div><Label className="text-slate-300 text-xs">Deskripsi Pekerjaan</Label>
            <Input value={workDescription} onChange={e => setWorkDescription(e.target.value)} placeholder="e.g., Pondasi unit E1, progress 50%" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">Tanggal</Label>
            <Input type="date" value={wageDate} onChange={e => setWageDate(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
