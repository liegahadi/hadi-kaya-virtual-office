'use client'
// PO Form Modal — Fase 1 (simplified per user's verbatim spec)
//
// 5 FIELDS ONLY (user locked this):
//   1. Nama toko (supplier dropdown)
//   2. Blok + unit rumah (split dropdowns)
//   3. Deskripsi (free text)
//   4. Material list:
//      - Material name (dropdown)
//      - Item Pekerjaan (dropdown from WageType / free text — for analisa vs RAB)
//      - Qty per item
//      - Harga satuan
//   5. Total (auto-sum)
//
// REMOVED per user pain "gajah di kardus":
//   - directUse checkbox (too complex)
//   - Import from RAB (move to Fase 3)
//   - planned vs actual display
//
// MODAL SIZE per user explicit demand:
//   - w-[90vw] max-w-[1600px] max-h-[90vh] p-6
//   - text-sm (14px), 2-column form, table-style items

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Material { id: string; name: string; unitMeasure: string }
interface Supplier { id: string; name: string }
interface Project { id: string; name: string; code: string | null }
interface Unit { id: string; blockNumber: string }
interface WageType { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

interface POItem {
  materialId: string
  workItem: string      // NEW: item pekerjaan per line (for analisa vs RAB)
  qty: string
  price: string
}

function parseBlokUnit(blockNumber: string): { blok: string; unitNum: string } {
  const m = blockNumber.match(/^([A-Za-z]+)(\d+)$/)
  if (!m) return { blok: blockNumber, unitNum: '' }
  return { blok: m[1].toUpperCase(), unitNum: m[2] }
}

export function PoFormModal({ open, onClose, onSaved }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [wageTypes, setWageTypes] = useState<WageType[]>([])  // For workItem dropdown
  const [loading, setLoading] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [blok, setBlok] = useState('')
  const [unitId, setUnitId] = useState('')
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')  // NEW field: deskripsi
  const [items, setItems] = useState<POItem[]>([
    { materialId: '', workItem: '', qty: '', price: '' },
  ])

  // Fetch all reference data when modal opens
  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch('/api/finance/suppliers').then(r => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/finance/projects').then(r => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/finance/material').then(r => r.json()).catch(() => ({ success: false, data: [] })),
    ]).then(([sup, proj, mat]) => {
      if (sup.success) setSuppliers(sup.data || [])
      if (proj.success) setProjects(proj.data || [])
      if (mat.success) setMaterials(mat.data || [])
    }).catch(console.error)
  }, [open])

  // When project changes, fetch units + wageTypes (for workItem dropdown)
  useEffect(() => {
    if (!projectId) {
      setUnits([]); setWageTypes([]); setBlok(''); setUnitId('')
      return
    }
    Promise.all([
      fetch(`/api/units?projectId=${projectId}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`/api/finance/wage-types?projectId=${projectId}`).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([u, wt]) => {
      const uList = u.units || u.data || []
      setUnits(uList)
      if (wt.success) setWageTypes(wt.data || [])
    }).catch(() => { setUnits([]); setWageTypes([]) })
    setBlok(''); setUnitId('')
  }, [projectId])

  const blokList = useMemo(() => {
    const set = new Set<string>()
    units.forEach(u => { const b = parseBlokUnit(u.blockNumber).blok; if (b) set.add(b) })
    return Array.from(set).sort()
  }, [units])

  const unitsInBlok = useMemo(() => {
    if (!blok) return []
    return units.filter(u => parseBlokUnit(u.blockNumber).blok === blok)
  }, [units, blok])

  const destinationLabel = useMemo(() => {
    if (!blok) return 'GDG (Stok Gudang)'
    if (!unitId) return `Akumulasi Blok ${blok}`
    const u = units.find(x => x.id === unitId)
    return u ? `Unit ${u.blockNumber}` : `Blok ${blok}`
  }, [blok, unitId, units])

  const formatRibuan = (n: string) => {
    const num = parseInt(n.replace(/\./g, '')) || 0
    return num ? num.toLocaleString('de-DE') : ''
  }
  const parseRibuan = (s: string) => s.replace(/\./g, '')

  const addItem = () => setItems([...items, { materialId: '', workItem: '', qty: '', price: '' }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof POItem, val: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: val }
    setItems(updated)
  }

  const plannedTotal = items.reduce((s, it) =>
    s + (parseInt(parseRibuan(it.qty)) || 0) * (parseInt(parseRibuan(it.price)) || 0), 0)

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
          // Notes gabung description + workItem context (since PO table has notes, not description field)
          notes: description || null,
          items: validItems.map(it => ({
            materialId: it.materialId,
            qty: parseInt(parseRibuan(it.qty)) || 0,
            price: parseInt(parseRibuan(it.price)) || 0,
            // Save workItem as note per item (POItem.note field)
            note: it.workItem || null,
            directUse: false,  // Always false in simplified form
          })),
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed')

      toast.success('PO berhasil dibuat: ' + d.data.poNumber.replace(/-/g, '/'))
      onSaved()
      onClose()
      // Reset form
      setSupplierId(''); setProjectId(''); setBlok(''); setUnitId(''); setDescription('')
      setItems([{ materialId: '', workItem: '', qty: '', price: '' }])
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 w-[90vw] max-w-[1600px] max-h-[90vh] overflow-y-auto dark-scrollbar p-6">
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-xl font-bold">Buat Purchase Order Baru</DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            Isi 5 hal: toko, blok/unit, deskripsi, material list, total otomatis.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ===== SECTION 1: Header Info — 2 columns ===== */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Nama Toko / Supplier *</Label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                  className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
                  <option value="">— Pilih Toko —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Belum ada supplier. Tambah di Pengaturan → Supplier.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Project *</Label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
                  <option value="">— Pilih Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
                {projects.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Belum ada project. Tambah di Pengaturan → Project.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Blok (opsional)</Label>
                  <select value={blok} onChange={e => { setBlok(e.target.value); setUnitId('') }} disabled={!projectId}
                    className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 disabled:opacity-50">
                    <option value="">— GDG (gudang) —</option>
                    {blokList.map(b => <option key={b} value={b}>Blok {b}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Unit (opsional)</Label>
                  <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!blok}
                    className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 disabled:opacity-50">
                    <option value="">— Akumulasi Blok {blok || '...'} —</option>
                    {unitsInBlok.map(u => <option key={u.id} value={u.id}>Unit {u.blockNumber}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Tanggal PO</Label>
                <Input type="date" value={poDate} onChange={e => setPoDate(e.target.value)}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100 text-sm" />
              </div>
            </div>
          </div>

          {/* Destination indicator */}
          <div className="px-4 py-2.5 bg-blue-950/40 border border-blue-800 rounded-md text-sm text-blue-200">
            <span className="font-semibold">Tujuan PO:</span> {destinationLabel}
            {blok && !unitId && (
              <span className="ml-2 text-amber-300 text-xs">— material masuk stok gudang, ditandai untuk blok {blok}</span>
            )}
          </div>

          {/* ===== SECTION 2: Deskripsi ===== */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Deskripsi PO *</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Pondasi + kamar mandi unit E1, pasir + semen"
              className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100 text-sm" />
            <p className="text-xs text-slate-500 mt-1">
              Deskripsi bebas — untuk kasih konteks apa yang dibeli di PO ini.
            </p>
          </div>

          {/* ===== SECTION 3: Items — table style, lega ===== */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-200 text-sm font-bold">Material List ({items.length})</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-8 text-xs border-slate-600 text-slate-300 hover:bg-slate-800">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Material
              </Button>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-16 gap-2 px-3 py-2 bg-slate-800/60 rounded-t-md text-xs font-semibold text-slate-400">
              <div className="col-span-5">Material</div>
              <div className="col-span-4">Item Pekerjaan</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Harga Satuan</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>
            {/* Note: Tailwind doesn't have col-span-16 by default. Use inline grid template */}
            <style>{`
              .grid-cols-16 { grid-template-columns: repeat(16, minmax(0, 1fr)); }
            `}</style>

            <div className="space-y-1 max-h-[35vh] overflow-y-auto dark-scrollbar border-x border-b border-slate-800 rounded-b-md">
              {items.map((it, i) => {
                const subtotal = (parseInt(parseRibuan(it.qty)) || 0) * (parseInt(parseRibuan(it.price)) || 0)
                return (
                  <div key={i} className="grid grid-cols-16 gap-2 items-center px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 border-b border-slate-800 last:border-0">
                    <select value={it.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)}
                      className="col-span-5 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100">
                      <option value="">— Pilih Material —</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unitMeasure})</option>)}
                    </select>
                    {/* Item Pekerjaan — dropdown from WageType + free text fallback */}
                    <input
                      list={`workitems-${projectId || 'default'}`}
                      value={it.workItem}
                      onChange={e => updateItem(i, 'workItem', e.target.value)}
                      placeholder="Item pekerjaan..."
                      className="col-span-4 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100"
                    />
                    <datalist id={`workitems-${projectId || 'default'}`}>
                      {wageTypes.map(w => <option key={w.id} value={w.name} />)}
                    </datalist>
                    <Input type="text" value={it.qty} onChange={e => updateItem(i, 'qty', formatRibuan(e.target.value))}
                      placeholder="0" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-sm text-right h-9" />
                    <Input type="text" value={it.price} onChange={e => updateItem(i, 'price', formatRibuan(e.target.value))}
                      placeholder="0" className="col-span-3 bg-slate-900 border-slate-700 text-slate-100 text-sm text-right h-9" />
                    <div className="col-span-2 text-right text-sm text-slate-300 font-mono">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="col-span-1 h-9 text-red-400 hover:bg-red-900/30 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end mt-3 text-sm">
              <span className="text-slate-400 mr-3 self-center">Total:</span>
              <span className="font-bold text-emerald-400 text-base">Rp {plannedTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800 text-sm h-10 px-5">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-sm h-10 px-5">
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Simpan PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
