'use client'
// Expense Form Modal — BULK ENTRY (multiple expenses sekaligus, seperti PO form)
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['SALARY', 'FUEL', 'NOTARY', 'SLF', 'KWH', 'DP_REFUND', 'REIMBURSE', 'TAKSASI', 'RAP', 'MARKETING', 'OPERASIONAL_KANTOR', 'KOMISI', 'BIAYA_NOTARIS', 'HUTANG', 'KASBON', 'PBB', 'PPH', 'LAINNYA', 'OTHER']

interface ExpenseItem { category: string; recipientName: string; amount: string; description: string }

export function ExpenseFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [paymentCycle, setPaymentCycle] = useState('ONETIME')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<ExpenseItem[]>([{ category: 'LAINNYA', recipientName: '', amount: '', description: '' }])

  useEffect(() => { if (open) { fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {}) } }, [open])

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }
  const parseRibuan = (s: string) => parseInt(s.replace(/\./g, '')) || 0

  const addItem = () => setItems([...items, { category: 'LAINNYA', recipientName: '', amount: '', description: '' }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof ExpenseItem, val: string) => { const u = [...items]; u[i] = { ...u[i], [field]: val }; setItems(u) }

  const totalAmount = items.reduce((s, it) => s + parseRibuan(it.amount), 0)

  const handleSave = async () => {
    const validItems = items.filter(it => it.recipientName && it.amount && it.description)
    if (validItems.length === 0) { toast.error('Minimal 1 item lengkap (penerima, jumlah, deskripsi)'); return }
    setLoading(true)
    let successCount = 0
    for (const it of validItems) {
      try {
        const res = await fetch('/api/finance/expenses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: it.category, recipientName: it.recipientName, amount: parseRibuan(it.amount), description: it.description, projectId: projectId || null, paymentCycle, expenseDate }),
        })
        const d = await res.json()
        if (d.success) successCount++
      } catch {}
    }
    toast.success(`${successCount} biaya tercatat`)
    onSaved(); onClose()
    setItems([{ category: 'LAINNYA', recipientName: '', amount: '', description: '' }]); setProjectId('')
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader><DialogTitle className="text-slate-100">Catat Biaya Lain (Bulk Entry)</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-slate-300 text-xs">Project</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Global —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Siklus</Label>
              <select value={paymentCycle} onChange={e => setPaymentCycle(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="ONETIME">Sekali</option><option value="WEEKLY">Mingguan</option><option value="MONTHLY">Bulanan</option>
              </select></div>
            <div><Label className="text-slate-300 text-xs">Tanggal</Label>
              <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2"><Label className="text-slate-300 text-xs font-bold">Items Biaya</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800"><Plus className="w-3 h-3 mr-1" />Tambah</Button></div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto dark-scrollbar">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center bg-slate-800/50 p-1.5 rounded">
                  <select value={it.category} onChange={e => updateItem(i, 'category', e.target.value)} className="col-span-3 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Input value={it.recipientName} onChange={e => updateItem(i, 'recipientName', e.target.value)} placeholder="Penerima" className="col-span-3 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Input type="text" value={it.amount} onChange={e => updateItem(i, 'amount', fmtRibuan(e.target.value))} placeholder="Rp" className="col-span-2 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Deskripsi" className="col-span-3 bg-slate-900 border-slate-700 text-slate-100 text-[10px] h-7" />
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="col-span-1 h-7 text-red-400 hover:bg-red-900/30 p-0"><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 text-xs">
              <span className="text-slate-400 mr-2">Total:</span>
              <span className="font-bold text-amber-400">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-amber-600 hover:bg-amber-700">{loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}Simpan {items.filter(it => it.recipientName && it.amount).length} Biaya</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
