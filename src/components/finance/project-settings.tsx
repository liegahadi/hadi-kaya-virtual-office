'use client'
// Pengaturan — 7 sub-tabs: Project, Unit, Worker, WageType, RAB Material, Material-Supplier, Code
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Plus, Trash2, Save } from 'lucide-react'

type SettingsTab = 'project' | 'unit' | 'worker' | 'wagetype' | 'rabmaterial' | 'mapping' | 'code'

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'project', label: 'Project' },
  { id: 'unit', label: 'Unit' },
  { id: 'worker', label: 'Tukang' },
  { id: 'wagetype', label: 'RAB Upah' },
  { id: 'rabmaterial', label: 'RAB Material' },
  { id: 'mapping', label: 'Material-Toko' },
  { id: 'code', label: 'Kode Project' },
]

export function ProjectSettings() {
  const [tab, setTab] = useState<SettingsTab>('project')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-slate-800 pb-1 overflow-x-auto dark-scrollbar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t border-b-2 whitespace-nowrap ${tab === t.id ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'project' && <ProjectManagement />}
      {tab === 'unit' && <UnitManagement />}
      {tab === 'worker' && <WorkerManagement />}
      {tab === 'wagetype' && <WageTypeEditor />}
      {tab === 'rabmaterial' && <RABMaterialEditor />}
      {tab === 'mapping' && <MaterialSupplierMapping />}
      {tab === 'code' && <ProjectCodeEditor />}
    </div>
  )
}

function ProjectManagement() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(''); const [code, setCode] = useState(''); const [brandName, setBrandName] = useState('')
  const fetchProjects = async () => { setLoading(true); try { const res = await fetch('/api/finance/projects'); const d = await res.json(); if (d.success) setProjects(d.data) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchProjects() }, [])
  const handleAdd = async () => { if (!name) { toast.error('Nama wajib'); return }; try { const res = await fetch('/api/finance/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, code, brandName }) }); const d = await res.json(); if (!d.success) throw new Error(d.error); toast.success('Project dibuat'); setName(''); setCode(''); setBrandName(''); fetchProjects() } catch (e: any) { toast.error('Gagal: ' + e.message) } }
  return (
    <div className="space-y-3">
      <Card className="p-3 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Tambah Project Baru</h3>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-slate-300 text-xs">Nama *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Permata Muntai" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">Kode</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g., PM" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">Brand</Label><Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g., Permata" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 mt-2 text-xs" onClick={handleAdd}><Plus className="w-3 h-3 mr-1" />Tambah</Button>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-800/80"><tr><th className="text-left p-2 text-slate-300">Nama</th><th className="text-left p-2 text-slate-300">Kode</th><th className="text-left p-2 text-slate-300">Brand</th><th className="text-center p-2 text-slate-300">Status</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={4} className="text-center py-4"><Skeleton className="h-6 mx-auto w-32" /></td></tr> : projects.map(p => <tr key={p.id} className="border-b border-slate-800"><td className="p-2 text-slate-200">{p.name}</td><td className="p-2 text-slate-400 font-mono">{p.code || '-'}</td><td className="p-2 text-slate-400">{p.brandName}</td><td className="p-2 text-center"><Badge variant="outline" className="text-[9px]">{p.status}</Badge></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  )
}

function UnitManagement() {
  const [units, setUnits] = useState<any[]>([]); const [projects, setProjects] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState(''); const [blockNumber, setBlockNumber] = useState('')
  const fetchUnits = async () => { setLoading(true); try { const res = await fetch('/api/finance/units'); const d = await res.json(); if (d.success) setUnits(d.data) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchUnits(); fetch('/api/finance/projects').then(r => r.json()).then(d => { if (d.success) setProjects(d.data) }).catch(() => {}) }, [])
  const handleAdd = async () => { if (!projectId || !blockNumber) { toast.error('Project + Blok wajib'); return }; try { const res = await fetch('/api/finance/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, blockNumber }) }); const d = await res.json(); if (!d.success) throw new Error(d.error); toast.success('Unit dibuat'); setBlockNumber(''); fetchUnits() } catch (e: any) { toast.error('Gagal: ' + e.message) } }
  return (
    <div className="space-y-3">
      <Card className="p-3 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Tambah Unit Baru</h3>
        <div className="flex gap-2">
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 flex-1"><option value="">— Pilih Project —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}</select>
          <Input value={blockNumber} onChange={e => setBlockNumber(e.target.value)} placeholder="e.g., E7" className="w-32 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={handleAdd}><Plus className="w-3 h-3 mr-1" />Tambah</Button>
        </div>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-800/80"><tr><th className="text-left p-2 text-slate-300">Blok/Unit</th><th className="text-left p-2 text-slate-300">Project</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={2} className="text-center py-4"><Skeleton className="h-6 mx-auto w-32" /></td></tr> : units.map(u => <tr key={u.id} className="border-b border-slate-800"><td className="p-2 text-slate-200 font-mono">{u.blockNumber}</td><td className="p-2 text-slate-400">{u.project?.name}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  )
}

function WorkerManagement() {
  const [workers, setWorkers] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [name, setName] = useState(''); const [bankName, setBankName] = useState(''); const [bankAccount, setBankAccount] = useState('')
  const fetchWorkers = async () => { setLoading(true); try { const res = await fetch('/api/finance/workers'); const d = await res.json(); if (d.success) setWorkers(d.data) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchWorkers() }, [])
  const handleAdd = async () => { if (!name) { toast.error('Nama wajib'); return }; try { const res = await fetch('/api/finance/workers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, defaultBankName: bankName, defaultBankAccount: bankAccount }) }); const d = await res.json(); if (!d.success) throw new Error(d.error); toast.success('Tukang dibuat'); setName(''); setBankName(''); setBankAccount(''); fetchWorkers() } catch (e: any) { toast.error('Gagal: ' + e.message) } }
  return (
    <div className="space-y-3">
      <Card className="p-3 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Tambah Tukang</h3>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-slate-300 text-xs">Nama *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama tukang" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">Bank</Label><Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="BCA" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">No. Rek</Label><Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="0410..." className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 mt-2 text-xs" onClick={handleAdd}><Plus className="w-3 h-3 mr-1" />Tambah</Button>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-800/80"><tr><th className="text-left p-2 text-slate-300">Nama</th><th className="text-left p-2 text-slate-300">Bank</th><th className="text-left p-2 text-slate-300">No. Rek</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={3} className="text-center py-4"><Skeleton className="h-6 mx-auto w-32" /></td></tr> : workers.map(w => <tr key={w.id} className="border-b border-slate-800"><td className="p-2 text-slate-200">{w.name}</td><td className="p-2 text-slate-400">{w.defaultBankName || '-'}</td><td className="p-2 text-slate-400 font-mono">{w.defaultBankAccount || '-'}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  )
}

function WageTypeEditor() {
  const [projects, setProjects] = useState<any[]>([]); const [projectId, setProjectId] = useState(''); const [wageTypes, setWageTypes] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [name, setName] = useState(''); const [price, setPrice] = useState('')
  useEffect(() => { fetch('/api/finance/projects').then(r => r.json()).then(d => { if (d.success) setProjects(d.data) }).catch(() => {}) }, [])
  useEffect(() => { if (projectId) { setLoading(true); fetch(`/api/finance/rab-editor?projectId=${projectId}&type=upah`).then(r => r.json()).then(d => { if (d.success) setWageTypes(d.data) }).catch(() => {}).finally(() => setLoading(false)) } else { setWageTypes([]) } }, [projectId])
  const fmt = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }
  const parse = (s: string) => parseInt(s.replace(/\./g, '')) || 0
  const handleAdd = async () => { if (!name || !projectId) { toast.error('Project + Nama wajib'); return }; try { const res = await fetch('/api/finance/rab-editor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'wagetype', projectId, name, price: parse(price) }) }); const d = await res.json(); if (!d.success) throw new Error(d.error); toast.success('Pekerjaan ditambah'); setName(''); setPrice(''); fetch(`/api/finance/rab-editor?projectId=${projectId}&type=upah`).then(r => r.json()).then(d => { if (d.success) setWageTypes(d.data) }) } catch (e: any) { toast.error('Gagal: ' + e.message) } }
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center"><span className="text-xs text-slate-400">Project:</span><select value={projectId} onChange={e => setProjectId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100"><option value="">— Pilih —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      {projectId && (
        <>
          <Card className="p-3 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Tambah Pekerjaan (RAB Upah)</h3>
            <div className="flex gap-2"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama pekerjaan" className="flex-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /><Input type="text" value={price} onChange={e => setPrice(fmt(e.target.value))} placeholder="Harga" className="w-32 bg-slate-800 border-slate-700 text-slate-100 text-xs" /><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={handleAdd}><Plus className="w-3 h-3 mr-1" />Tambah</Button></div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <table className="w-full text-xs"><thead className="bg-slate-800/80"><tr><th className="text-left p-2 text-slate-300">Pekerjaan</th><th className="text-right p-2 text-slate-300">Harga</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={2} className="text-center py-4"><Skeleton className="h-6 mx-auto w-32" /></td></tr> : wageTypes.map(w => <tr key={w.id} className="border-b border-slate-800"><td className="p-2 text-slate-200">{w.name}</td><td className="p-2 text-right font-mono text-emerald-400">Rp {w.price.toLocaleString('id-ID')}</td></tr>)}</tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}

function RABMaterialEditor() {
  const [projects, setProjects] = useState<any[]>([]); const [projectId, setProjectId] = useState(''); const [rabLines, setRabLines] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  const [workItem, setWorkItem] = useState(''); const [materialName, setMaterialName] = useState(''); const [qty, setQty] = useState(''); const [unitMeasure, setUnitMeasure] = useState('Pcs'); const [unitPrice, setUnitPrice] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())  // bulk delete checkboxes
  const [deleting, setDeleting] = useState(false)
  useEffect(() => { fetch('/api/finance/projects').then(r => r.json()).then(d => { if (d.success) setProjects(d.data) }).catch(() => {}) }, [])
  const fetchLines = () => {
    if (!projectId) { setRabLines([]); return }
    setLoading(true)
    fetch(`/api/finance/rab-editor?projectId=${projectId}&type=material`).then(r => r.json()).then(d => { if (d.success && d.data[0]?.lines) setRabLines(d.data[0].lines); else setRabLines([]) }).catch(() => setRabLines([])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchLines(); setSelected(new Set()) }, [projectId])
  const fmt = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }; const parse = (s: string) => parseInt(s.replace(/\./g, '')) || 0
  const handleAdd = async () => { if (!workItem || !materialName || !projectId) { toast.error('Tahapan + Material wajib'); return }; try { const res = await fetch('/api/finance/rab-editor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'rabline', projectId, workItem, materialName, quantity: parseFloat(qty) || 0, unitMeasure, unitPrice: parse(unitPrice) }) }); const d = await res.json(); if (!d.success) throw new Error(d.error); toast.success('Material ditambah'); setWorkItem(''); setMaterialName(''); setQty(''); setUnitPrice(''); fetchLines() } catch (e: any) { toast.error('Gagal: ' + e.message) } }

  // Single delete
  const handleDeleteOne = async (id: string) => {
    if (!confirm('Hapus material ini?')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/finance/rab-editor', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success('Material dihapus')
      // remove from selection if it was there
      const next = new Set(selected); next.delete(id); setSelected(next)
      fetchLines()
    } catch (e: any) { toast.error('Gagal hapus: ' + e.message) } finally { setDeleting(false) }
  }

  // Bulk delete
  const handleDeleteBulk = async () => {
    if (selected.size === 0) { toast.error('Pilih minimal 1 material dengan checkbox'); return }
    if (!confirm(`Hapus ${selected.size} material terpilih?`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/finance/rab-editor', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selected) }) })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success(`${d.deleted} material dihapus`)
      setSelected(new Set())
      fetchLines()
    } catch (e: any) { toast.error('Gagal hapus bulk: ' + e.message) } finally { setDeleting(false) }
  }

  const toggleSelect = (id: string) => { const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); setSelected(next) }
  const selectAllInGroup = (ids: string[]) => { const next = new Set(selected); const allSelected = ids.every(id => next.has(id)); if (allSelected) ids.forEach(id => next.delete(id)); else ids.forEach(id => next.add(id)); setSelected(next) }
  const selectAll = () => { const all = new Set<string>(); rabLines.forEach(l => all.add(l.id)); setSelected(all) }
  const clearAll = () => setSelected(new Set())

  // Group lines by workItem
  const grouped: Record<string, any[]> = rabLines.reduce((acc, l) => { if (!acc[l.workItem]) acc[l.workItem] = []; acc[l.workItem].push(l); return acc }, {} as Record<string, any[]>)
  const workItems = Object.keys(grouped).sort()
  const grandTotal = rabLines.reduce((s, l) => s + (l.totalPrice || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center"><span className="text-xs text-slate-400">Project:</span><select value={projectId} onChange={e => setProjectId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100"><option value="">— Pilih —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      {projectId && (
        <>
          <Card className="p-3 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Tambah Material (RAB Material)</h3>
            <div className="grid grid-cols-5 gap-1">
              <Input value={workItem} onChange={e => setWorkItem(e.target.value)} placeholder="Tahapan / Kategori" className="bg-slate-800 border-slate-700 text-slate-100 text-[10px]" />
              <Input value={materialName} onChange={e => setMaterialName(e.target.value)} placeholder="Material" className="bg-slate-800 border-slate-700 text-slate-100 text-[10px]" />
              <Input type="text" value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty" className="bg-slate-800 border-slate-700 text-slate-100 text-[10px]" />
              <Input value={unitMeasure} onChange={e => setUnitMeasure(e.target.value)} placeholder="Satuan" className="bg-slate-800 border-slate-700 text-slate-100 text-[10px]" />
              <Input type="text" value={unitPrice} onChange={e => setUnitPrice(fmt(e.target.value))} placeholder="Harga" className="bg-slate-800 border-slate-700 text-slate-100 text-[10px]" />
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 mt-2 text-xs" onClick={handleAdd}><Plus className="w-3 h-3 mr-1" />Tambah</Button>
          </Card>

          {/* Bulk action bar */}
          {rabLines.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border border-slate-800 rounded">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-400">{selected.size} dipilih dari {rabLines.length} material</span>
                <Button size="sm" variant="outline" onClick={selectAll} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">Pilih Semua</Button>
                <Button size="sm" variant="outline" onClick={clearAll} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">Clear</Button>
              </div>
              <Button size="sm" variant="destructive" onClick={handleDeleteBulk} disabled={deleting || selected.size === 0} className="h-6 text-[10px] bg-red-700 hover:bg-red-800">
                <Trash2 className="w-3 h-3 mr-1" />Hapus {selected.size > 0 ? `(${selected.size})` : 'Pilihan'}
              </Button>
            </div>
          )}

          {/* Grouped display by workItem */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto dark-scrollbar pr-1">
            {loading ? <Skeleton className="h-32" /> : workItems.length === 0 ? (
              <Card className="p-6 bg-slate-900/50 border-slate-800 text-center">
                <p className="text-xs text-slate-400">Belum ada material di RAB. Tambahkan lewat form di atas.</p>
              </Card>
            ) : workItems.map(wi => {
              const lines = grouped[wi]
              const subtotal = lines.reduce((s: number, l: any) => s + (l.totalPrice || 0), 0)
              const ids = lines.map((l: any) => l.id)
              const allSelected = ids.every((id: string) => selected.has(id))
              return (
                <Card key={wi} className="bg-slate-900/50 border-slate-800 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={allSelected} onCheckedChange={() => selectAllInGroup(ids)} className="border-slate-500" />
                      <span className="text-sm font-bold text-emerald-400">{wi}</span>
                      <span className="text-[10px] text-slate-400">({lines.length} material)</span>
                    </div>
                    <span className="text-xs font-mono text-slate-300">Subtotal: Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/30"><tr>
                      <th className="text-left p-2 text-slate-400 w-8"></th>
                      <th className="text-left p-2 text-slate-400">Material</th>
                      <th className="text-right p-2 text-slate-400">Qty</th>
                      <th className="text-right p-2 text-slate-400">Harga</th>
                      <th className="text-right p-2 text-slate-400">Total</th>
                      <th className="text-center p-2 text-slate-400 w-12">Aksi</th>
                    </tr></thead>
                    <tbody>
                      {lines.map((l: any) => (
                        <tr key={l.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                          <td className="p-2"><Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} className="border-slate-500" /></td>
                          <td className="p-2 text-slate-200">{l.materialName}</td>
                          <td className="p-2 text-right text-slate-400">{l.quantity} {l.unitMeasure}</td>
                          <td className="p-2 text-right font-mono text-slate-400">Rp {l.unitPrice?.toLocaleString('id-ID') || 0}</td>
                          <td className="p-2 text-right font-mono text-slate-300">Rp {l.totalPrice?.toLocaleString('id-ID') || 0}</td>
                          <td className="p-2 text-center"><button onClick={() => handleDeleteOne(l.id)} disabled={deleting} className="text-red-400 hover:bg-red-900/30 rounded p-1 disabled:opacity-30"><Trash2 className="w-3 h-3" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )
            })}
          </div>

          {/* Grand total */}
          {rabLines.length > 0 && (
            <Card className="p-3 bg-slate-900/50 border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold">Grand Total ({workItems.length} kategori, {rabLines.length} material)</span>
              <span className="text-lg font-bold text-emerald-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function MaterialSupplierMapping() {
  const [mappings, setMappings] = useState<any[]>([]); const [suppliers, setSuppliers] = useState<any[]>([]); const [materials, setMaterials] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [supplierId, setSupplierId] = useState(''); const [materialId, setMaterialId] = useState(''); const [defaultPrice, setDefaultPrice] = useState('')
  const fetchAll = async () => { setLoading(true); try { const [m, s, mat] = await Promise.all([fetch('/api/finance/supplier-material').then(r => r.json()), fetch('/api/finance/suppliers').then(r => r.json()), fetch('/api/finance/material').then(r => r.json())]); if (m.success) setMappings(m.data); if (s.success) setSuppliers(s.data); if (mat.success) setMaterials(mat.data) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchAll() }, [])
  const fmt = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }; const parse = (s: string) => parseInt(s.replace(/\./g, '')) || 0
  const handleAdd = async () => { if (!supplierId || !materialId) { toast.error('Supplier + Material wajib'); return }; try { const res = await fetch('/api/finance/supplier-material', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierId, materialId, defaultPrice: parse(defaultPrice) || null }) }); const d = await res.json(); if (!d.success) throw new Error(d.error); toast.success('Mapping ditambah'); setSupplierId(''); setMaterialId(''); setDefaultPrice(''); fetchAll() } catch (e: any) { toast.error('Gagal: ' + e.message) } }
  const handleDelete = async (id: string) => { try { await fetch(`/api/finance/supplier-material/${id}`, { method: 'DELETE' }); toast.success('Mapping dihapus'); fetchAll() } catch { toast.error('Gagal hapus') } }
  return (
    <div className="space-y-3">
      <Card className="p-3 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Tambah Mapping (Toko → Material)</h3>
        <div className="grid grid-cols-3 gap-2">
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100"><option value="">— Toko —</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select value={materialId} onChange={e => setMaterialId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100"><option value="">— Material —</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <div className="flex gap-1"><Input type="text" value={defaultPrice} onChange={e => setDefaultPrice(fmt(e.target.value))} placeholder="Harga default" className="bg-slate-800 border-slate-700 text-slate-100 text-xs" /><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={handleAdd}><Plus className="w-3 h-3" /></Button></div>
        </div>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden max-h-96 overflow-y-auto dark-scrollbar">
        <table className="w-full text-xs"><thead className="bg-slate-800/80 sticky top-0"><tr><th className="text-left p-2 text-slate-300">Toko</th><th className="text-left p-2 text-slate-300">Material</th><th className="text-right p-2 text-slate-300">Harga Default</th><th className="text-center p-2 text-slate-300">Aksi</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={4} className="text-center py-4"><Skeleton className="h-6 mx-auto w-32" /></td></tr> : mappings.map(m => <tr key={m.id} className="border-b border-slate-800"><td className="p-2 text-slate-200">{m.supplier?.name}</td><td className="p-2 text-slate-300">{m.material?.name}</td><td className="p-2 text-right font-mono text-slate-400">{m.defaultPrice ? 'Rp ' + m.defaultPrice.toLocaleString('id-ID') : '-'}</td><td className="p-2 text-center"><button onClick={() => handleDelete(m.id)} className="text-red-400 hover:bg-red-900/30 rounded p-1"><Trash2 className="w-3 h-3" /></button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  )
}

function ProjectCodeEditor() {
  const [projects, setProjects] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState<string | null>(null)
  const fetchProjects = async () => { setLoading(true); try { const res = await fetch('/api/finance/projects'); const d = await res.json(); if (d.success) setProjects(d.data) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchProjects() }, [])
  const updateCode = async (id: string, code: string) => { setSaving(id); try { await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }); toast.success(`Code updated: ${code}`) } catch { toast.error('Gagal') } finally { setSaving(null) } }
  if (loading) return <Skeleton className="h-48" />
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-800">
      <h3 className="text-sm font-bold text-slate-200 mb-1">Kode Project</h3>
      <p className="text-[10px] text-slate-400 mb-3">Kode dipakai untuk generate nomor PO. Set kode untuk setiap project.</p>
      <div className="space-y-2">{projects.map(p => <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded"><span className="flex-1 text-xs text-slate-200">{p.name}</span><Input value={p.code || ''} onChange={e => setProjects(projects.map(pp => pp.id === p.id ? { ...pp, code: e.target.value.toUpperCase() } : pp))} placeholder="A16" className="w-24 bg-slate-900 border-slate-700 text-slate-100 text-xs h-7 font-mono" maxLength={5} /><Button size="sm" variant="outline" disabled={saving === p.id} onClick={() => updateCode(p.id, p.code || '')} className="h-7 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700"><Save className="w-3 h-3 mr-1" />{saving === p.id ? '...' : 'Simpan'}</Button></div>)}</div>
    </Card>
  )
}
