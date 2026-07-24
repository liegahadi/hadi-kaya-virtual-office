'use client'
// Material Usage Form — catat pemakaian material (auto-decrement stock + AVCO snapshot)
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Material { id: string; name: string; unitMeasure: string; stock?: { quantity: number; avgPrice: number } | null }
interface Project { id: string; name: string; code: string | null }
interface Unit { id: string; blockNumber: string }

export function UsageFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [usedAt, setUsedAt] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<Array<{ materialId: string; qty: string; workItem: string }>>([{ materialId: '', qty: '', workItem: '' }])

  useEffect(() => {
    if (open) {
      fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {})
      fetch('/api/finance/material').then(r => r.json()).then(d => { if (d.success) setMaterials(d.data) }).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (projectId) { fetch(`/api/units?projectId=${projectId}`).then(r => r.json()).then(d => { setUnits(d.units || d.data || []) }).catch(() => setUnits([])) }
    else setUnits([])
  }, [projectId])

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('de-DE') : '' }
  const parseRibuan = (s: string) => s.replace(/\./g, '')

  const addItem = () => setItems([...items, { materialId: '', qty: '', workItem: '' }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, val: any) => { const u = [...items]; u[i] = { ...u[i], [field]: val }; setItems(u) }

  const handleSave = async () => {
    if (!projectId) { toast.error('Project wajib'); return }
    const validItems = items.filter(it => it.materialId && it.qty)
    if (!validItems.length) { toast.error('Minimal 1 item'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/finance/material/usage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, unitId: unitId || null, usedAt, items: validItems.map(it => ({ materialId: it.materialId, qty: parseInt(parseRibuan(it.qty)) || 0, workItem: it.workItem || null })) }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success('Pemakaian material tercatat')
      onSaved(); onClose()
      setItems([{ materialId: '', qty: '', workItem: '' }]); setUnitId('')
    } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader><DialogTitle className="text-slate-100">Catat Pemakaian Material</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-slate-300 text-xs">Project *</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Pilih —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Unit</Label>
              <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!projectId} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 disabled:opacity-50">
                <option value="">— GDG —</option>{units.map(u => <option key={u.id} value={u.id}>{u.blockNumber}</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Tanggal</Label>
              <Input type="date" value={usedAt} onChange={e => setUsedAt(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          </div>
          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2"><Label className="text-slate-300 text-xs font-bold">Items</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800"><Plus className="w-3 h-3 mr-1" />Tambah</Button></div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto dark-scrollbar">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center bg-slate-800/50 p-1.5 rounded">
                  <select value={it.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)} className="col-span-5 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100">
                    <option value="">— Material —</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} (stok: {m.stock?.quantity || 0})</option>)}
                  </select>
                  <Input type="text" value={it.qty} onChange={e => updateItem(i, 'qty', fmtRibuan(e.target.value))} placeholder="Qty" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Input type="text" value={it.workItem} onChange={e => updateItem(i, 'workItem', e.target.value)} placeholder="Pekerjaan" className="col-span-4 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="col-span-1 h-7 text-red-400 hover:bg-red-900/30 p-0"><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
