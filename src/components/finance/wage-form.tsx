'use client'
// Wage Form Modal — BULK ENTRY (multiple wages sekaligus)
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface WageItem { workerId: string; wageTypeId: string; amount: string; workDescription: string }

export function WageFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [wageTypes, setWageTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [wageDate, setWageDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<WageItem[]>([{ workerId: '', wageTypeId: '', amount: '', workDescription: '' }])

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

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }
  const parseRibuan = (s: string) => parseInt(s.replace(/\./g, '')) || 0

  const addItem = () => setItems([...items, { workerId: '', wageTypeId: '', amount: '', workDescription: '' }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof WageItem, val: string) => {
    const u = [...items]; u[i] = { ...u[i], [field]: val }
    // Auto-fill amount from wageType price
    if (field === 'wageTypeId') {
      const wt = wageTypes.find(w => w.id === val)
      if (wt) u[i].amount = wt.price.toLocaleString('id-ID')
    }
    setItems(u)
  }

  const totalAmount = items.reduce((s, it) => s + parseRibuan(it.amount), 0)

  const handleSave = async () => {
    if (!projectId) { toast.error('Project wajib'); return }
    const validItems = items.filter(it => it.workerId && it.wageTypeId && it.amount)
    if (validItems.length === 0) { toast.error('Minimal 1 item lengkap'); return }
    setLoading(true)
    let successCount = 0
    for (const it of validItems) {
      const wt = wageTypes.find(w => w.id === it.wageTypeId)
      const budget = wt?.price || 0
      const amountNum = parseRibuan(it.amount)
      try {
        const res = await fetch('/api/finance/wages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId: it.workerId, wageTypeId: it.wageTypeId, projectId, unitId: unitId || null, amount: amountNum, workDescription: it.workDescription, wageDate }),
        })
        const d = await res.json()
        if (d.success) successCount++
      } catch {}
    }
    toast.success(`${successCount} upah tercatat`)
    onSaved(); onClose()
    setItems([{ workerId: '', wageTypeId: '', amount: '', workDescription: '' }]); setUnitId('')
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader><DialogTitle className="text-slate-100">Catat Upah Tukang (Bulk Entry)</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-slate-300 text-xs">Project *</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Pilih —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Unit</Label>
              <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!projectId} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 disabled:opacity-50">
                <option value="">— GDG —</option>{units.map(u => <option key={u.id} value={u.id}>{u.blockNumber}</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Tanggal</Label>
              <Input type="date" value={wageDate} onChange={e => setWageDate(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2"><Label className="text-slate-300 text-xs font-bold">Items Upah</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800"><Plus className="w-3 h-3 mr-1" />Tambah</Button></div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto dark-scrollbar">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center bg-slate-800/50 p-1.5 rounded">
                  <select value={it.workerId} onChange={e => updateItem(i, 'workerId', e.target.value)} className="col-span-3 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100">
                    <option value="">— Tukang —</option>{workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <select value={it.wageTypeId} onChange={e => updateItem(i, 'wageTypeId', e.target.value)} disabled={!projectId} className="col-span-4 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100 disabled:opacity-50">
                    <option value="">— Pekerjaan —</option>{wageTypes.map(w => <option key={w.id} value={w.id}>{w.name.substring(0, 25)} (Rp {w.price.toLocaleString('id-ID')})</option>)}
                  </select>
                  <Input type="text" value={it.amount} onChange={e => updateItem(i, 'amount', fmtRibuan(e.target.value))} placeholder="Rp" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Input value={it.workDescription} onChange={e => updateItem(i, 'workDescription', e.target.value)} placeholder="Deskripsi" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="col-span-1 h-7 text-red-400 hover:bg-red-900/30 p-0"><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 text-xs">
              <span className="text-slate-400 mr-2">Total:</span>
              <span className="font-bold text-purple-400">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">{loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}Simpan {items.filter(it => it.workerId && it.wageTypeId && it.amount).length} Upah</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
