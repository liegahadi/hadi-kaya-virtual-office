'use client'
// Payment Modal — partial per-recipient, bank override
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  recipient: { name: string; type: string; amount: number; refId?: string }
}

export function PaymentModal({ open, onClose, onSaved, recipient }: Props) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('TRANSFER')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && recipient) {
      setAmount(recipient.amount.toLocaleString('id-ID'))
    }
  }, [open, recipient])

  const formatRibuan = (n: string) => {
    const num = parseInt(n.replace(/\./g, '')) || 0
    return num ? num.toLocaleString('id-ID') : ''
  }
  const parseRibuan = (s: string) => parseInt(s.replace(/\./g, '')) || 0

  const handleSave = async () => {
    const amt = parseRibuan(amount)
    if (amt <= 0) {
      toast.error('Amount harus > 0')
      return
    }
    if (!recipient.refId) {
      toast.error('Tidak ada refId (entity ID) untuk recipient ini')
      return
    }

    setLoading(true)
    try {
      // Determine which kind of payment based on recipient.type
      let body: any = {
        amount: amt,
        method,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
        bankHolder: bankHolder || undefined,
        paidAt,
        notes,
      }
      if (recipient.type === 'Material') body.poId = recipient.refId
      else if (recipient.type === 'Upah') body.wagePaymentId = recipient.refId
      else body.expenseId = recipient.refId

      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed')

      toast.success('Pembayaran tercatat')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Bayar: {recipient?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-slate-800/50 p-2 rounded text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Penerima:</span>
              <span className="text-slate-200 font-medium">{recipient?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tipe:</span>
              <span className="text-slate-300">{recipient?.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Outstanding:</span>
              <span className="text-red-300 font-mono">Rp {(recipient?.amount || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs">Jumlah Bayar (Rp) *</Label>
            <Input type="text" value={amount} onChange={e => setAmount(formatRibuan(e.target.value))}
              className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            <p className="text-[10px] text-slate-500 mt-0.5">Bisa partial (kurang dari outstanding)</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-slate-300 text-xs">Metode</Label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="TRANSFER">Transfer</option>
                <option value="CASH">Cash</option>
                <option value="GIRO">Giro</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Tanggal Bayar</Label>
              <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            </div>
          </div>

          {method === 'TRANSFER' && (
            <div className="space-y-2 border-t border-slate-700 pt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Bank Override (opsional)</p>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Nama Bank"
                className="bg-slate-800 border-slate-700 text-slate-100 text-xs h-7" />
              <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="No. Rekening"
                className="bg-slate-800 border-slate-700 text-slate-100 text-xs h-7" />
              <Input value={bankHolder} onChange={e => setBankHolder(e.target.value)} placeholder="Atas Nama"
                className="bg-slate-800 border-slate-700 text-slate-100 text-xs h-7" />
            </div>
          )}

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
            Bayar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
