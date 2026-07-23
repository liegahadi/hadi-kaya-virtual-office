'use client'
// Bulk Payment Modal — select multiple outstanding items → pay all at once
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

interface OutstandingItem {
  name: string
  type: string
  amount: number
  bankAccount?: string | null
  refId?: string
}

export function BulkPaymentModal({ open, onClose, onSaved, items }: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  items: OutstandingItem[]
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [method, setMethod] = useState('TRANSFER')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { if (open) setSelected(new Set()) }, [open])

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.type.toLowerCase().includes(search.toLowerCase()))
  const totalSelected = filtered.filter((_, i) => selected.has(i)).reduce((s, item) => s + item.amount, 0)

  const toggle = (idx: number) => { const next = new Set(selected); next.has(idx) ? next.delete(idx) : next.add(idx); setSelected(next) }
  const selectAll = () => { setSelected(new Set(filtered.map((_, i) => i))) }
  const clearAll = () => setSelected(new Set())

  const handlePay = async () => {
    if (selected.size === 0) { toast.error('Pilih minimal 1 item'); return }
    setLoading(true)
    try {
      const payItems = filtered.filter((_, i) => selected.has(i)).map(item => ({
        type: item.type === 'Material' ? 'PO' : item.type === 'Upah' ? 'WAGE' : 'EXPENSE',
        id: item.refId || '',
        amount: item.amount,
      }))
      const res = await fetch('/api/finance/bulk-pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payItems, method, paidAt }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success(`${d.data.paymentsCreated} pembayaran tercatat`)
      onSaved(); onClose()
    } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader><DialogTitle className="text-slate-100">Bulk Payment ({selected.size} dipilih)</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..." className="pl-7 bg-slate-800 border-slate-700 text-slate-100 text-xs h-7" />
            </div>
            <Button size="sm" variant="outline" onClick={selectAll} className="h-7 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">Pilih Semua</Button>
            <Button size="sm" variant="outline" onClick={clearAll} className="h-7 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-800">Clear</Button>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto dark-scrollbar">
            {filtered.map((item, i) => (
              <label key={i} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded cursor-pointer hover:bg-slate-800">
                <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} className="border-slate-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate">{item.name}</p>
                  <p className="text-[9px] text-slate-500">{item.type}{item.bankAccount ? ` • ${item.bankAccount}` : ''}</p>
                </div>
                <span className="text-xs font-mono text-red-300">{fmt(item.amount)}</span>
              </label>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Dipilih:</span>
              <span className="font-bold text-emerald-400">{fmt(totalSelected)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-slate-300 text-xs">Metode</Label>
                <select value={method} onChange={e => setMethod(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                  <option value="TRANSFER">Transfer</option><option value="CASH">Cash</option><option value="GIRO">Giro</option>
                </select></div>
              <div><Label className="text-slate-300 text-xs">Tanggal</Label>
                <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" /></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handlePay} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}Bayar {selected.size} Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
