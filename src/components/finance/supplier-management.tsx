'use client'
// Supplier Management — list, add, edit suppliers
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Edit2, Search } from 'lucide-react'

interface Supplier { id: string; name: string; phone?: string | null; contactPerson?: string | null; bankName?: string | null; bankAccount?: string | null; bankHolder?: string | null; _count?: { purchaseOrders: number } }

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', contactPerson: '', bankName: '', bankAccount: '', bankHolder: '' })

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/suppliers${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      const d = await res.json()
      if (d.success) setSuppliers(d.data)
    } catch { toast.error('Gagal load suppliers') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSuppliers() }, [])
  useEffect(() => { const t = setTimeout(fetchSuppliers, 300); return () => clearTimeout(t) }, [search])

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', contactPerson: '', bankName: '', bankAccount: '', bankHolder: '' }); setEditOpen(true) }
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', contactPerson: s.contactPerson || '', bankName: s.bankName || '', bankAccount: s.bankAccount || '', bankHolder: s.bankHolder || '' }); setEditOpen(true) }

  const handleSave = async () => {
    if (!form.name) { toast.error('Nama wajib'); return }
    try {
      const url = editing ? `/api/finance/suppliers/${editing.id}` : '/api/finance/suppliers'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success(editing ? 'Supplier diupdate' : 'Supplier dibuat')
      setEditOpen(false); fetchSuppliers()
    } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari supplier..." className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-xs h-8" />
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Supplier Baru</Button>
      </div>

      <Card className="overflow-hidden bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left p-2 text-slate-300">Nama</th>
                <th className="text-left p-2 text-slate-300">Kontak</th>
                <th className="text-left p-2 text-slate-300">Bank</th>
                <th className="text-left p-2 text-slate-300">No. Rek</th>
                <th className="text-center p-2 text-slate-300">PO</th>
                <th className="text-center p-2 text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8"><Skeleton className="h-6 mx-auto w-32" /></td></tr>
              : suppliers.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-500">Tidak ada supplier</td></tr>
              : suppliers.map(s => (
                <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="p-2 text-slate-200 font-medium">{s.name}</td>
                  <td className="p-2 text-slate-400">{s.contactPerson || '-'} {s.phone ? `(${s.phone})` : ''}</td>
                  <td className="p-2 text-slate-400">{s.bankName || '-'}</td>
                  <td className="p-2 text-slate-400 font-mono">{s.bankAccount || '-'}</td>
                  <td className="p-2 text-center text-slate-300">{s._count?.purchaseOrders || 0}</td>
                  <td className="p-2 text-center"><Button size="sm" variant="ghost" className="h-6 text-blue-400 hover:bg-blue-900/30" onClick={() => openEdit(s)}><Edit2 className="w-3 h-3" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[10px] text-slate-500">{suppliers.length} supplier</p>

      {editOpen && (
        <Dialog open={editOpen} onOpenChange={() => setEditOpen(false)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
            <DialogHeader><DialogTitle className="text-slate-100">{editing ? 'Edit Supplier' : 'Supplier Baru'}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label className="text-slate-300 text-xs">Nama *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-slate-300 text-xs">Kontak Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
                <div><Label className="text-slate-300 text-xs">Telp</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-slate-300 text-xs">Bank</Label><Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="BCA/Mandiri/BNI" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
                <div><Label className="text-slate-300 text-xs">No. Rekening</Label><Input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
              </div>
              <div><Label className="text-slate-300 text-xs">Atas Nama</Label><Input value={form.bankHolder} onChange={e => setForm({ ...form, bankHolder: e.target.value })} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
