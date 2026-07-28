'use client'
// PO Detail Modal — click row → lihat detail PO (items, payments, notas, download PDF/bundle)
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, FileStack, Edit2, Ban, CreditCard, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200', UNPAID: 'bg-red-900/60 text-red-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200', PAID: 'bg-emerald-900/60 text-emerald-200', VOIDED: 'bg-slate-800 text-slate-500',
}

export function PoDetailModal({ poId, open, onClose }: { poId: string | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('TRANSFER')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  const reload = () => {
    if (poId) {
      fetch(`/api/finance/po/${poId}`).then(r => r.json()).then(d => {
        if (d.success) setData(d.data)
      }).catch(() => {})
    }
  }

  useEffect(() => {
    if (poId && open) {
      setLoading(true)
      fetch(`/api/finance/po/${poId}`).then(r => r.json()).then(d => {
        if (d.success) setData(d.data)
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setData(null); setPayOpen(false); setPayAmount(''); setPayNotes('')
    }
  }, [poId, open])

  const handlePay = async () => {
    const amt = parseInt(payAmount.replace(/\./g, '')) || 0
    if (!amt || amt <= 0) { toast.error('Jumlah pembayaran wajib'); return }
    setPayLoading(true)
    try {
      const res = await fetch('/api/finance/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId: data.id, amount: amt, method: payMethod, paidAt: payDate, notes: payNotes })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      toast.success('Pembayaran tercatat')
      setPayOpen(false); setPayAmount(''); setPayNotes('')
      reload()
    } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) } finally { setPayLoading(false) }
  }

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }

  const handleVoid = async () => {
    if (!data) return
    if (!confirm('Void PO ini? Status akan berubah menjadi VOIDED dan tidak bisa dipakai lagi.')) return
    try {
      const res = await fetch(`/api/finance/po/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'VOIDED' }) })
      const d = await res.json()
      if (d.success) { toast.success('PO di-void'); setData({ ...data, status: 'VOIDED' }) }
      else throw new Error(d.error)
    } catch (err: any) { toast.error('Gagal void: ' + (err?.message || 'unknown')) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-5xl max-h-[92vh] overflow-y-auto dark-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-lg flex items-center gap-2 flex-wrap">
            {data?.displayPoNumber || 'Loading...'}
            {data && <Badge variant="outline" className={`text-[9px] ${statusColor[data.status] || 'bg-slate-700'}`}>{data.status}</Badge>}
            {data?.locked && <Badge variant="outline" className="text-[9px] border-amber-600 text-amber-400">LOCKED</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading ? <Skeleton className="h-48" /> : data ? (
          <div className="space-y-4 py-2">
            {/* Info grid — 4 cols */}
            <div className="grid grid-cols-4 gap-3 p-3 bg-slate-800/30 rounded border border-slate-700 text-xs">
              <div><p className="text-slate-400">Supplier</p><p className="text-slate-100 font-medium">{data.supplier?.name || '-'}</p></div>
              <div><p className="text-slate-400">Tanggal PO</p><p className="text-slate-100 font-medium">{new Date(data.poDate).toLocaleDateString('id-ID')}</p></div>
              <div><p className="text-slate-400">Project</p><p className="text-slate-100 font-medium">{data.project?.name} ({data.project?.code})</p></div>
              <div><p className="text-slate-400">Unit / Tujuan</p><p className="text-slate-100 font-medium">
                {data.unit?.blockNumber ? `Unit ${data.unit.blockNumber}` : (
                  data.notes?.startsWith('[Akumulasi Blok') ? data.notes.split(']')[0].replace('[', '') : 'GDG (Stok Gudang)'
                )}
              </p></div>
              {data.supplier?.bankName && <div><p className="text-slate-400">Bank Supplier</p><p className="text-slate-100 font-medium">{data.supplier.bankName} {data.supplier.bankAccount}</p></div>}
              {data.receivedAt && <div><p className="text-slate-400">Diterima</p><p className="text-slate-100 font-medium">{new Date(data.receivedAt).toLocaleDateString('id-ID')}</p></div>}
              <div><p className="text-slate-400">Total Items</p><p className="text-slate-100 font-medium">{data.items?.length || 0}</p></div>
              <div><p className="text-slate-400">Total Notas</p><p className="text-slate-100 font-medium">{data.notas?.length || 0}</p></div>
            </div>

            {/* Items */}
            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Items ({data.items?.length || 0})</p>
              <div className="space-y-1 max-h-52 overflow-y-auto dark-scrollbar">
                {data.items?.map((it: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 p-2 bg-slate-800/50 rounded text-xs items-center">
                    <div className="col-span-6">
                      <span className="text-slate-200">{it.material?.name}</span>
                      {it.directUse && <Badge variant="outline" className="ml-1 text-[8px] border-amber-600 text-amber-400">DU</Badge>}
                    </div>
                    <span className="col-span-2 text-slate-400 font-mono text-right">{it.qty} {it.material?.unitMeasure}</span>
                    <span className="col-span-2 text-slate-300 font-mono text-right">{fmt(it.price)}</span>
                    <span className="col-span-2 text-slate-100 font-mono font-bold text-right">{fmt(it.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas */}
            {data.notas && data.notas.length > 0 && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Notas ({data.notas.length})</p>
                <div className="space-y-1">
                  {data.notas.map((n: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-200">{n.notaNumber || `Nota #${i + 1}`}</span>
                        <span className="text-slate-400">{new Date(n.receivedAt || n.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <span className="text-emerald-400 font-mono">{fmt(n.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals — 2 cols */}
            <div className="border-t border-slate-700 pt-3 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Planned Total:</span><span className="text-slate-200 font-mono">{fmt(data.plannedTotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Actual Total:</span><span className="text-slate-200 font-mono">{fmt(data.actualTotal)}</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Dibayar:</span><span className="text-emerald-400 font-mono">{fmt(data.totalPaid)}</span></div>
                <div className="flex justify-between font-bold"><span className="text-slate-300">Sisa:</span><span className="text-red-300 font-mono">{fmt(data.remaining)}</span></div>
              </div>
            </div>

            {/* Payments */}
            {data.payments?.length > 0 && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Riwayat Pembayaran ({data.payments.length})</p>
                <div className="space-y-1">
                  {data.payments.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">{new Date(p.paidAt).toLocaleDateString('id-ID')} • {p.method}</span>
                        {p.notes && <span className="text-slate-500 italic">{p.notes}</span>}
                      </div>
                      <span className="text-emerald-400 font-mono">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {data.notes && <div className="border-t border-slate-700 pt-3 text-xs"><span className="text-slate-400">Catatan:</span> <span className="text-slate-300">{data.notes}</span></div>}

            {/* Action buttons — primary + secondary */}
            <div className="border-t border-slate-700 pt-3 space-y-2">
              {/* Primary actions */}
              <div className="flex flex-wrap gap-2">
                {data.status !== 'VOIDED' && data.status !== 'PAID' && data.remaining > 0 && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => { setPayOpen(!payOpen); setPayAmount(String(data.remaining || '')) }}>
                    <CreditCard className="w-3 h-3 mr-1" /> Catat Pembayaran
                  </Button>
                )}
                <a href={`/api/finance/po/${data.id}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs">
                    <Download className="w-3 h-3 mr-1" /> PO PDF
                  </Button>
                </a>
                <a href={`/api/finance/po/${data.id}/bundle`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs">
                    <FileStack className="w-3 h-3 mr-1" /> Bundle Arsip
                  </Button>
                </a>
                {data.status !== 'VOIDED' && data.status !== 'PAID' && (
                  <Button size="sm" variant="outline" className="border-red-700 text-red-300 hover:bg-red-900/30 text-xs" onClick={handleVoid}>
                    <Ban className="w-3 h-3 mr-1" /> Void PO
                  </Button>
                )}
              </div>

              {/* Inline payment form */}
              {payOpen && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/50 rounded space-y-2">
                  <p className="text-[10px] text-emerald-300 font-bold uppercase">Catat Pembayaran untuk {data.displayPoNumber}</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div><Label className="text-slate-300 text-[10px]">Jumlah *</Label>
                      <Input type="text" value={payAmount} onChange={e => setPayAmount(fmtRibuan(e.target.value))} placeholder="Rp" className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-7" />
                    </div>
                    <div><Label className="text-slate-300 text-[10px]">Metode</Label>
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 h-7">
                        <option value="TRANSFER">Transfer</option><option value="CASH">Cash</option><option value="GIRO">Giro</option><option value="CHEQUE">Cek</option>
                      </select>
                    </div>
                    <div><Label className="text-slate-300 text-[10px]">Tanggal</Label>
                      <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-7" />
                    </div>
                    <div><Label className="text-slate-300 text-[10px]">Catatan</Label>
                      <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="opsional" className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-7" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setPayOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-7">Batal</Button>
                    <Button size="sm" onClick={handlePay} disabled={payLoading} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7">
                      {payLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}Bayar
                    </Button>
                  </div>
                </div>
              )}

              {/* Secondary actions: edit notes + add nota */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm" variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-900/30 text-xs"
                  onClick={() => { const n = prompt('Edit catatan PO:', data.notes || ''); if (n !== null) { fetch(`/api/finance/po/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: n }) }).then(r => r.json()).then(d => { if (d.success) { toast.success('Catatan diupdate'); setData({ ...data, notes: n }) } }) } }}>
                  <Edit2 className="w-3 h-3 mr-1" /> Edit Catatan
                </Button>
                {!data.locked && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-700 rounded">
                    <input type="text" placeholder="No. Nota" id={`nota-num-${data.id}`} className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100" />
                    <input type="number" placeholder="Total" id={`nota-total-${data.id}`} className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-100" />
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-300 hover:bg-blue-900/30 text-xs h-7"
                      onClick={async () => {
                        const num = (document.getElementById(`nota-num-${data.id}`) as HTMLInputElement)?.value
                        const total = parseFloat((document.getElementById(`nota-total-${data.id}`) as HTMLInputElement)?.value || '0')
                        if (!total) { toast.error('Total nota wajib'); return }
                        try {
                          const res = await fetch(`/api/finance/po/${data.id}/notas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notaNumber: num, totalAmount: total }) })
                          const d = await res.json()
                          if (d.success) { toast.success('Nota tersimpan. PO terkunci.'); onClose(); }
                          else throw new Error(d.error)
                        } catch (err: any) { toast.error('Gagal: ' + (err?.message || 'unknown')) }
                      }}>
                      + Nota
                    </Button>
                  </div>
                )}
                {data.locked && <span className="text-[10px] text-amber-400 italic">PO terkunci (nota sudah ada) — item tidak bisa diedit</span>}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
