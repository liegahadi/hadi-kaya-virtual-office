'use client'
// Memo Form Modal — pilih items UNPAID, buat memo pengajuan
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function MemoFormModal({ open, onClose, onSaved }: Props) {
  const [unpaidPOs, setUnpaidPOs] = useState<any[]>([])
  const [unpaidWages, setUnpaidWages] = useState<any[]>([])
  const [unpaidExpenses, setUnpaidExpenses] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [memoType, setMemoType] = useState<'W' | 'D'>('W')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/finance/po?status=UNPAID').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/finance/po?status=PARTIAL_PAID').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/finance/wages?status=UNPAID').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/finance/wages?status=PARTIAL_PAID').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/finance/expenses?status=UNPAID').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/finance/expenses?status=PARTIAL_PAID').then(r => r.json()).catch(() => ({ success: false, data: [] })),
      ]).then(([u1, p1, u2, p2, u3, p3]) => {
        const pos = [...(u1.data || []), ...(p1.data || [])]
        const wages = [...(u2.data || []), ...(p2.data || [])]
        const expenses = [...(u3.data || []), ...(p3.data || [])]
        setUnpaidPOs(pos)
        setUnpaidWages(wages)
        setUnpaidExpenses(expenses)
      })
    } else {
      setSelected(new Set())
      setSearch('')
    }
  }, [open])

  const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const selectAll = () => {
    const all = new Set<string>()
    ;[...unpaidPOs, ...unpaidWages, ...unpaidExpenses].forEach(item => all.add(item.id))
    setSelected(all)
  }
  const clearAll = () => setSelected(new Set())

  const totalSelected = [...unpaidPOs, ...unpaidWages, ...unpaidExpenses]
    .filter(i => selected.has(i.id))
    .reduce((s, i) => s + (i.remaining || i.amount || 0), 0)

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error('Pilih minimal 1 item')
      return
    }

    setLoading(true)
    const lines: any[] = []
    for (const po of unpaidPOs) {
      if (selected.has(po.id)) lines.push({ kind: 'PO', itemId: po.id, proposedAmount: po.remaining || 0 })
    }
    for (const w of unpaidWages) {
      if (selected.has(w.id)) lines.push({ kind: 'WAGE', itemId: w.id, proposedAmount: w.remaining || w.amount || 0 })
    }
    for (const e of unpaidExpenses) {
      if (selected.has(e.id)) lines.push({ kind: 'EXPENSE', itemId: e.id, proposedAmount: e.remaining || e.amount || 0 })
    }

    try {
      const res = await fetch('/api/finance/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: memoType, lines }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed')

      toast.success('Memo dibuat: ' + d.data.memoNumber)
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  const matchesSearch = (text: string) => !search || text.toLowerCase().includes(search.toLowerCase())

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-3xl max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Buat Memo Pengajuan Dana</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex gap-2 items-center">
            <Label className="text-slate-300 text-xs">Tipe:</Label>
            <select value={memoType} onChange={e => setMemoType(e.target.value as 'W' | 'D')}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100">
              <option value="W">Mingguan (W)</option>
              <option value="D">Harian (D)</option>
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari item..."
                className="pl-7 bg-slate-800 border-slate-700 text-slate-100 text-xs h-7" />
            </div>
            <Button size="sm" variant="outline" onClick={selectAll} className="h-7 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">
              Pilih Semua
            </Button>
            <Button size="sm" variant="outline" onClick={clearAll} className="h-7 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">
              Clear
            </Button>
          </div>

          {/* UNPAID POs */}
          {unpaidPOs.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Purchase Orders ({unpaidPOs.filter(p => matchesSearch(p.poNumber + p.supplier?.name)).length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto dark-scrollbar">
                {unpaidPOs.filter(p => matchesSearch(p.poNumber + p.supplier?.name)).map(po => (
                  <label key={po.id} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded cursor-pointer hover:bg-slate-800">
                    <Checkbox checked={selected.has(po.id)} onCheckedChange={() => toggleSelect(po.id)} className="border-slate-600" />
                    <span className="flex-1 text-xs text-slate-200">{po.poNumber.replace(/-/g, '/')} — {po.supplier?.name}</span>
                    <span className="text-xs font-mono text-red-300">{fmt(po.remaining || 0)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* UNPAID Wages */}
          {unpaidWages.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Upah Tukang ({unpaidWages.filter(w => matchesSearch(w.worker?.name + w.workDescription)).length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto dark-scrollbar">
                {unpaidWages.filter(w => matchesSearch(w.worker?.name + w.workDescription)).map(w => (
                  <label key={w.id} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded cursor-pointer hover:bg-slate-800">
                    <Checkbox checked={selected.has(w.id)} onCheckedChange={() => toggleSelect(w.id)} className="border-slate-600" />
                    <span className="flex-1 text-xs text-slate-200">{w.worker?.name} — {w.workDescription || 'Upah'}</span>
                    <span className="text-xs font-mono text-red-300">{fmt(w.remaining || w.amount || 0)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* UNPAID Expenses */}
          {unpaidExpenses.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Biaya Lain ({unpaidExpenses.filter(e => matchesSearch(e.description + e.recipientName + e.category)).length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto dark-scrollbar">
                {unpaidExpenses.filter(e => matchesSearch(e.description + e.recipientName + e.category)).map(e => (
                  <label key={e.id} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded cursor-pointer hover:bg-slate-800">
                    <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} className="border-slate-600" />
                    <span className="flex-1 text-xs text-slate-200">{e.category} — {e.recipientName}</span>
                    <span className="text-xs font-mono text-red-300">{fmt(e.remaining || e.amount || 0)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {unpaidPOs.length + unpaidWages.length + unpaidExpenses.length === 0 && (
            <p className="text-center text-slate-500 text-xs py-6">Tidak ada item UNPAID 🎉</p>
          )}

          <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
            <span className="text-xs text-slate-400">{selected.size} item dipilih</span>
            <div>
              <span className="text-xs text-slate-400 mr-2">Total:</span>
              <span className="font-bold text-emerald-400">{fmt(totalSelected)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Buat Memo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
