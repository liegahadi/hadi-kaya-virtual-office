'use client'
// PO Form Modal — Iterasi 10 (start from scratch)
// Spec dari user:
//   - Modal 90% lebar layar (w-[90vw] max-w-[1600px])
//   - Layout LEGA: text-sm (14px), padding p-6, maks 2 kolom form
//   - Project pakai /api/finance/projects langsung (bukan dashboard/stats)
//   - Blok + Unit split: blok=akumulasi, blok+unit=spesifik, kosong=GDG
//   - Import RAB: tombol besar, jelasin kalau kosong
import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Loader2, FileDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Material { id: string; name: string; unitMeasure: string }
interface Supplier { id: string; name: string }
interface Project { id: string; name: string; code: string | null }
interface Unit { id: string; blockNumber: string }

function parseBlokUnit(blockNumber: string): { blok: string; unitNum: string } {
  const m = blockNumber.match(/^([A-Za-z]+)(\d+)$/)
  if (!m) return { blok: blockNumber, unitNum: '' }
  return { blok: m[1].toUpperCase(), unitNum: m[2] }
}

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
  const [rabLines, setRabLines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [blok, setBlok] = useState('')
  const [unitId, setUnitId] = useState('')
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ materialId: string; qty: string; price: string; directUse: boolean }>>([
    { materialId: '', qty: '', price: '', directUse: false },
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

  // When project changes, fetch units + RAB lines for this project
  useEffect(() => {
    if (!projectId) {
      setUnits([]); setRabLines([]); setBlok(''); setUnitId('')
      return
    }
    Promise.all([
      fetch(`/api/units?projectId=${projectId}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`/api/finance/rab-editor?projectId=${projectId}&type=material`).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([u, rab]) => {
      const uList = u.units || u.data || []
      setUnits(uList)
      const rabList = rab.success && rab.data && rab.data[0]?.lines ? rab.data[0].lines : []
      setRabLines(rabList)
    }).catch(() => { setUnits([]); setRabLines([]) })
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
    if (!unitId) return `Akumulasi Blok ${blok} (semua unit di blok ${blok})`
    const u = units.find(x => x.id === unitId)
    return u ? `Unit ${u.blockNumber}` : `Blok ${blok}`
  }, [blok, unitId, units])

  // RAB workItems (unique list) for import dropdown
  const rabWorkItems = useMemo(() => {
    const set = new Set<string>()
    rabLines.forEach(l => { if (l.workItem) set.add(l.workItem) })
    return Array.from(set).sort()
  }, [rabLines])

  const [selectedWorkItem, setSelectedWorkItem] = useState('')

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

  const handleImportRAB = async () => {
    if (!selectedWorkItem) { toast.error('Pilih pekerjaan dulu'); return }
    if (!supplierId) { toast.error('Pilih toko/supplier dulu'); return }
    if (rabLines.length === 0) { toast.error('RAB Material kosong untuk project ini. Isi dulu di Pengaturan → RAB Material.'); return }

    try {
      // Get supplier-material mapping
      const mapRes = await fetch('/api/finance/supplier-material')
      const mapData = await mapRes.json()
      const supplierMappings = mapData.success ? mapData.data.filter((m: any) => m.supplierId === supplierId) : []

      const rabLinesForWork = rabLines.filter((l: any) => l.workItem === selectedWorkItem)
      let newItems: any[] = []

      if (supplierMappings.length > 0) {
        // Filter: only materials mapped to this supplier
        newItems = rabLinesForWork.filter((l: any) => {
          const material = materials.find(m =>
            m.name.toLowerCase().includes(l.materialName.toLowerCase()) ||
            l.materialName.toLowerCase().includes(m.name.toLowerCase())
          )
          if (!material) return false
          return supplierMappings.some((sm: any) => sm.materialId === material.id)
        }).map((l: any) => {
          const material = materials.find(m =>
            m.name.toLowerCase().includes(l.materialName.toLowerCase()) ||
            l.materialName.toLowerCase().includes(m.name.toLowerCase())
          )
          const mapping = supplierMappings.find((sm: any) => sm.materialId === material?.id)
          return {
            materialId: material?.id || '',
            qty: String(l.quantity),
            price: String(mapping?.defaultPrice || l.unitPrice),
            directUse: false
          }
        })
      } else {
        // No mapping — import all, owner can edit prices
        newItems = rabLinesForWork.map((l: any) => {
          const material = materials.find(m =>
            m.name.toLowerCase().includes(l.materialName.toLowerCase()) ||
            l.materialName.toLowerCase().includes(m.name.toLowerCase())
          )
          return {
            materialId: material?.id || '',
            qty: String(l.quantity),
            price: String(l.unitPrice),
            directUse: false
          }
        }).filter((it: any) => it.materialId)
      }

      if (newItems.length === 0) {
        toast.error(`Tidak ada material match. Cek: (1) Material di master material, (2) Mapping di Pengaturan → Material-Toko.`)
        return
      }
      setItems([...items.filter(it => it.materialId || it.qty || it.price), ...newItems])
      toast.success(`Imported ${newItems.length} items dari RAB: ${selectedWorkItem}`)
      setSelectedWorkItem('')
    } catch (err: any) { toast.error('Gagal import: ' + (err?.message || 'unknown')) }
  }

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

    let finalNotes = notes
    if (blok && !unitId) {
      finalNotes = `[Akumulasi Blok ${blok}]${notes ? ' ' + notes : ''}`
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
          notes: finalNotes,
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
      setSupplierId(''); setProjectId(''); setBlok(''); setUnitId(''); setNotes('')
      setItems([{ materialId: '', qty: '', price: '', directUse: false }])
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
            Pilih supplier + project + blok/unit, lalu tambah material manual atau import dari RAB.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ===== SECTION 1: Header Info — 2 columns, lega ===== */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Supplier / Toko *</Label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                  className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
                  <option value="">— Pilih Supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Belum ada supplier. Tambah di tab Pengaturan → Supplier.
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
                    <AlertCircle className="w-3 h-3" /> Belum ada project. Tambah di tab Pengaturan → Project.
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
              <span className="ml-2 text-amber-300 text-xs">— material masuk stok gudang tapi ditandai untuk blok {blok}</span>
            )}
          </div>

          {/* ===== SECTION 2: Import dari RAB ===== */}
          {projectId && (
            <div className="p-4 bg-violet-950/30 border border-violet-800 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-violet-200">Import Material dari RAB</p>
                  <p className="text-xs text-violet-400">
                    {rabLines.length === 0
                      ? 'RAB Material kosong untuk project ini. Isi dulu di Pengaturan → RAB Material.'
                      : `${rabWorkItems.length} kategori pekerjaan tersedia, ${rabLines.length} material di RAB.`
                    }
                    {!supplierId && ' Pilih supplier dulu.'}
                  </p>
                </div>
              </div>
              {rabLines.length > 0 && (
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <Label className="text-violet-300 text-xs">Pilih Pekerjaan</Label>
                    <select value={selectedWorkItem} onChange={e => setSelectedWorkItem(e.target.value)} disabled={!supplierId}
                      className="w-full mt-1.5 bg-slate-800 border border-violet-700 rounded-md px-3 py-2 text-sm text-slate-100 disabled:opacity-50">
                      <option value="">— Pilih Pekerjaan —</option>
                      {rabWorkItems.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <Button onClick={handleImportRAB} disabled={!selectedWorkItem || !supplierId}
                    className="bg-violet-600 hover:bg-violet-700 text-sm h-10 disabled:opacity-30">
                    <FileDown className="w-4 h-4 mr-1.5" /> Import ke Items
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ===== SECTION 3: Items — table style, lega ===== */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-200 text-sm font-bold">Items Material ({items.length})</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-8 text-xs border-slate-600 text-slate-300 hover:bg-slate-800">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Item Kosong
              </Button>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-800/60 rounded-t-md text-xs font-semibold text-slate-400">
              <div className="col-span-5">Material</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Harga Satuan</div>
              <div className="col-span-1 text-center">DU</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-1 max-h-[35vh] overflow-y-auto dark-scrollbar border-x border-b border-slate-800 rounded-b-md">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 border-b border-slate-800 last:border-0">
                  <select value={it.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)}
                    className="col-span-5 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100">
                    <option value="">— Pilih Material —</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unitMeasure})</option>)}
                  </select>
                  <Input type="text" value={it.qty} onChange={e => updateItem(i, 'qty', formatRibuan(e.target.value))}
                    placeholder="0" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-sm text-right h-9" />
                  <Input type="text" value={it.price} onChange={e => updateItem(i, 'price', formatRibuan(e.target.value))}
                    placeholder="0" className="col-span-3 bg-slate-900 border-slate-700 text-slate-100 text-sm text-right h-9" />
                  <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-slate-400 cursor-pointer">
                    <Checkbox checked={it.directUse} onCheckedChange={(v) => updateItem(i, 'directUse', v)} className="h-4 w-4 border-slate-600" />
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="col-span-1 h-9 text-red-400 hover:bg-red-900/30 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-3 text-sm">
              <span className="text-slate-400 mr-3 self-center">Planned Total:</span>
              <span className="font-bold text-emerald-400 text-base">Rp {plannedTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* ===== SECTION 4: Catatan ===== */}
          <div>
            <Label className="text-slate-300 text-sm font-medium">Catatan (opsional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..."
              className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100 text-sm" />
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
