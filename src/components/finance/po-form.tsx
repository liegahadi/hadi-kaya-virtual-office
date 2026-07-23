'use client'
// PO Form Modal — dark theme, multi-item, directUse checkbox
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Material { id: string; name: string; unitMeasure: string }
interface Supplier { id: string; name: string }
interface Project { id: string; name: string; code: string | null }
interface Unit { id: string; blockNumber: string }

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function PoFormModal({ open, onClose, onSaved }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ materialId: string; qty: string; price: string; directUse: boolean }>>([
    { materialId: '', qty: '', price: '', directUse: false },
  ])

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/finance/suppliers').then(r => r.json()),
        fetch('/api/dashboard/stats').then(r => r.json()),
        fetch('/api/finance/material').then(r => r.json()),
      ]).then(([sup, stats, mat]) => {
        if (sup.success) setSuppliers(sup.data)
        if (stats.success) {
          setProjects(stats.projects || [])
        }
        if (mat.success) setMaterials(mat.data)
      }).catch(console.error)
    }
  }, [open])

  // Load units when project changes
  useEffect(() => {
    if (projectId) {
      fetch(`/api/units?projectId=${projectId}`).then(r => r.json()).then(d => {
        if (d.success || d.units) setUnits(d.units || d.data || [])
      }).catch(() => setUnits([]))
    } else {
      setUnits([])
    }
  }, [projectId])

  const formatRibuan = (n: string) => {
    const num = parseInt(n.replace(/\./g, '')) || 0
    return num ? num.toLocaleString('de-DE') : ''
  }
  const parseRibuan = (s: string) => s.replace(/\./g, '')

  const addItem = () => setItems([...items, { materialId: '', qty: '', price: '', directUse: false }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, val: any) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: val }
    setItems(updated)
  }

  const plannedTotal = items.reduce((s, it) => s + (parseInt(parseRibuan(it.qty)) || 0) * (parseInt(parseRibuan(it.price)) || 0), 0)

  const handleSave = async () => {
    if (!supplierId || !projectId) {
      toast.error('Supplier + Project wajib')
      return
    }
    const validItems = items.filter(it => it.materialId && it.qty && it.price)
    if (validItems.length === 0) {
      toast.error('Minimal 1 item material')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/finance/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          projectId,
          unitId: unitId || null,
          poDate,
          notes,
          items: validItems.map(it => ({
            materialId: it.materialId,
            qty: parseInt(parseRibuan(it.qty)) || 0,
            price: parseInt(parseRibuan(it.price)) || 0,
            directUse: it.directUse,
          })),
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed')

      toast.success('PO berhasil dibuat: ' + d.data.poNumber.replace(/-/g, '/'))
      onSaved()
      onClose()
      // Reset form
      setSupplierId(''); setProjectId(''); setUnitId(''); setNotes('')
      setItems([{ materialId: '', qty: '', price: '', directUse: false }])
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-3xl max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Buat Purchase Order Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Top row: supplier, project, unit, date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs">Supplier *</Label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Pilih Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Project *</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Pilih Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Unit (kosongkan = GDG/stok gudang)</Label>
              <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!projectId}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 disabled:opacity-50">
                <option value="">— GDG (stok gudang) —</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.blockNumber}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Tanggal PO</Label>
              <Input type="date" value={poDate} onChange={e => setPoDate(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300 text-xs font-bold">Items Material</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">
                <Plus className="w-3 h-3 mr-1" /> Tambah Item
              </Button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto dark-scrollbar">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center bg-slate-800/50 p-1.5 rounded">
                  <select value={it.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)}
                    className="col-span-5 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100">
                    <option value="">— Material —</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unitMeasure})</option>)}
                  </select>
                  <Input type="text" value={it.qty} onChange={e => updateItem(i, 'qty', formatRibuan(e.target.value))}
                    placeholder="Qty" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Input type="text" value={it.price} onChange={e => updateItem(i, 'price', formatRibuan(e.target.value))}
                    placeholder="Harga" className="col-span-3 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <label className="col-span-1 flex items-center gap-0.5 text-[9px] text-slate-400 cursor-pointer">
                    <Checkbox checked={it.directUse} onCheckedChange={(v) => updateItem(i, 'directUse', v)} className="h-3 w-3 border-slate-600" />
                    <span title="Direct use (skip stok, auto-Usage ke unit)">DU</span>
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="col-span-1 h-7 text-red-400 hover:bg-red-900/30 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-2 text-xs">
              <span className="text-slate-400 mr-2">Planned Total:</span>
              <span className="font-bold text-emerald-400">Rp {plannedTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs">Catatan</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan (opsional)"
              className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Simpan PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
