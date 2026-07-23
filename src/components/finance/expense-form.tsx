'use client'
// Expense Form Modal — create other expense
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['SALARY', 'FUEL', 'NOTARY', 'SLF', 'KWH', 'DP_REFUND', 'REIMBURSE', 'TAKSASI', 'RAP', 'MARKETING', 'OPERASIONAL_KANTOR', 'KOMISI', 'BIAYA_NOTARIS', 'HUTANG', 'KASBON', 'PBB', 'PPH', 'LAINNYA', 'OTHER']

export function ExpenseFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('LAINNYA')
  const [recipientName, setRecipientName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [paymentCycle, setPaymentCycle] = useState('ONETIME')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => { if (open) { fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {}) } }, [open])

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }
  const parseRibuan = (s: string) => parseInt(s.replace(/\./g, '')) || 0

  const handleSave = async () => {
    if (!recipientName || !amount || !description) { toast.error('Penerima, jumlah, deskripsi wajib'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, recipientName, amount: parseRibuan(amount), description, projectId: projectId || null, paymentCycle, expenseDate }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success('Biaya tercatat')
      onSaved(); onClose()
      setRecipientName(''); setAmount(''); setDescription(''); setProjectId('')
    } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader><DialogTitle className="text-slate-100">Catat Biaya Lain</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-slate-300 text-xs">Kategori *</Label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><Label className="text-slate-300 text-xs">Project</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Global —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
          </div>
          <div><Label className="text-slate-300 text-xs">Penerima *</Label>
            <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nama penerima" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">Jumlah (Rp) *</Label>
            <Input type="text" value={amount} onChange={e => setAmount(fmtRibuan(e.target.value))} placeholder="0" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div><Label className="text-slate-300 text-xs">Deskripsi *</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., SLF unit E4" className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-slate-300 text-xs">Siklus</Label>
              <select value={paymentCycle} onChange={e => setPaymentCycle(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="ONETIME">Sekali</option><option value="WEEKLY">Mingguan</option><option value="MONTHLY">Bulanan</option>
              </select></div>
            <div><Label className="text-slate-300 text-xs">Tanggal</Label>
              <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
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
