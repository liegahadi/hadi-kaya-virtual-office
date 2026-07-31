'use client'
// PO Detail Modal — Fase 1 (with PasteImageUpload for nota + bukti transfer)
// User pain solved: paste image dari WA web (Ctrl+V), no need download dulu
//
// Features:
//   - 90vw width, 5xl max
//   - Items, notas, payments sections
//   - Catat Pembayaran inline (with paste bukti transfer)
//   - Upload Nota inline (with paste nota images)
//   - Void PO button
//   - PDF + Bundle download links

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PasteImageUpload } from '@/components/ui/paste-image-upload'
import { Download, FileStack, Edit2, Ban, CreditCard, FileText, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200', UNPAID: 'bg-red-900/60 text-red-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200', PAID: 'bg-emerald-900/60 text-emerald-200', VOIDED: 'bg-slate-800 text-slate-500',
}

export function PoDetailModal({ poId, open, onClose }: { poId: string | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Payment form state
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('TRANSFER')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [buktiTransferFiles, setBuktiTransferFiles] = useState<File[]>([])

  // Nota form state
  const [notaOpen, setNotaOpen] = useState(false)
  const [notaNumber, setNotaNumber] = useState('')
  const [notaTotal, setNotaTotal] = useState('')
  const [notaFiles, setNotaFiles] = useState<File[]>([])
  const [notaLoading, setNotaLoading] = useState(false)

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
      setData(null)
      setPayOpen(false); setPayAmount(''); setPayNotes(''); setBuktiTransferFiles([])
      setNotaOpen(false); setNotaNumber(''); setNotaTotal(''); setNotaFiles([])
    }
  }, [poId, open])

  const handlePay = async () => {
    const amt = parseInt(payAmount.replace(/\./g, '')) || 0
    if (!amt || amt <= 0) { toast.error('Jumlah pembayaran wajib'); return }
    setPayLoading(true)
    try {
      // Step 1: Create payment
      const res = await fetch('/api/finance/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId: data.id, amount: amt, method: payMethod, paidAt: payDate, notes: payNotes })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)

      const paymentId = d.data?.id

      // Step 2: Upload bukti transfer files (if any)
      if (buktiTransferFiles.length > 0 && paymentId) {
        const formData = new FormData()
        formData.set('category', 'bukti-transfer')
        formData.set('paymentId', paymentId)
        buktiTransferFiles.forEach(f => formData.append('files', f))
        const upRes = await fetch(`/api/finance/po/${data.id}/upload`, { method: 'POST', body: formData })
        const upD = await upRes.json()
        if (upD.success) {
          toast.success(`Pembayaran tercatat + ${upD.count} bukti transfer tersimpan`)
        } else {
          toast.success('Pembayaran tercatat (upload bukti gagal — coba lagi)')
        }
      } else {
        toast.success('Pembayaran tercatat')
      }

      setPayOpen(false); setPayAmount(''); setPayNotes(''); setBuktiTransferFiles([])
      reload()
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally { setPayLoading(false) }
  }

  const handleUploadNota = async () => {
    const total = parseFloat(notaTotal) || 0
    if (!total) { toast.error('Total nota wajib'); return }
    if (notaFiles.length === 0) { toast.error('Upload minimal 1 foto nota (paste dari WA)'); return }

    setNotaLoading(true)
    try {
      // Step 1: Create nota record
      const res = await fetch(`/api/finance/po/${data.id}/notas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaNumber: notaNumber || null, totalAmount: total })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)

      const newNotaId = d.data?.id

      // Step 2: Upload nota files
      const formData = new FormData()
      formData.set('category', 'nota')
      if (newNotaId) formData.set('notaId', newNotaId)
      notaFiles.forEach(f => formData.append('files', f))
      const upRes = await fetch(`/api/finance/po/${data.id}/upload`, { method: 'POST', body: formData })
      const upD = await upRes.json()
      if (upD.success) {
        toast.success(`Nota tersimpan + ${upD.count} foto terupload. PO terkunci.`)
      } else {
        toast.success('Nota tersimpan. Upload foto gagal — coba lagi nanti.')
      }

      setNotaOpen(false); setNotaNumber(''); setNotaTotal(''); setNotaFiles([])
      reload()
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally { setNotaLoading(false) }
  }

  const handleVoid = async () => {
    if (!data) return
    if (!confirm('Void PO ini? Status akan berubah menjadi VOIDED dan tidak bisa dipakai lagi.')) return
    try {
      const res = await fetch(`/api/finance/po/${data.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VOIDED' })
      })
      const d = await res.json()
      if (d.success) { toast.success('PO di-void'); setData({ ...data, status: 'VOIDED' }) }
      else throw new Error(d.error)
    } catch (err: any) { toast.error('Gagal void: ' + (err?.message || 'unknown')) }
  }

  const fmtRibuan = (n: string) => { const num = parseInt(n.replace(/\./g, '')) || 0; return num ? num.toLocaleString('id-ID') : '' }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 w-[90vw] max-w-[1400px] max-h-[90vh] overflow-y-auto dark-scrollbar p-6">
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-xl font-bold flex items-center gap-2 flex-wrap">
            {data?.displayPoNumber || 'Loading...'}
            {data && <Badge variant="outline" className={`text-[9px] ${statusColor[data.status] || 'bg-slate-700'}`}>{data.status}</Badge>}
            {data?.locked && <Badge variant="outline" className="text-[9px] border-amber-600 text-amber-400">LOCKED</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading ? <Skeleton className="h-48" /> : data ? (
          <div className="space-y-4 py-2">
            {/* Info grid */}
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

            {/* Description / Notes */}
            {data.notes && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Deskripsi / Catatan</p>
                <p className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded">{data.notes}</p>
              </div>
            )}

            {/* Items */}
            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Items ({data.items?.length || 0})</p>
              <div className="space-y-1 max-h-52 overflow-y-auto dark-scrollbar">
                {data.items?.map((it: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 p-2 bg-slate-800/50 rounded text-xs items-center">
                    <div className="col-span-5">
                      <span className="text-slate-200">{it.material?.name}</span>
                      {it.note && <span className="ml-2 text-[10px] text-violet-300 italic">[{it.note}]</span>}
                    </div>
                    <span className="col-span-2 text-slate-400 font-mono text-right">{it.qty} {it.material?.unitMeasure}</span>
                    <span className="col-span-2 text-slate-300 font-mono text-right">{fmt(it.price)}</span>
                    <span className="col-span-3 text-slate-100 font-mono font-bold text-right">{fmt(it.totalPrice)}</span>
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
                        <span className="text-slate-400">{new Date(n.notaDate || n.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <span className="text-emerald-400 font-mono">{fmt(n.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-slate-700 pt-3 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Planned Total:</span><span className="text-slate-200 font-mono">{fmt(data.plannedTotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Actual Total (Notas):</span><span className="text-slate-200 font-mono">{fmt(data.actualTotal)}</span></div>
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

            {/* Action buttons */}
            <div className="border-t border-slate-700 pt-3 space-y-2">
              {/* Primary actions */}
              <div className="flex flex-wrap gap-2">
                {data.status !== 'VOIDED' && data.status !== 'PAID' && data.remaining > 0 && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9" onClick={() => { setPayOpen(!payOpen); setPayAmount(String(data.remaining || '')) }}>
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Catat Pembayaran
                  </Button>
                )}
                {!data.locked && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-9" onClick={() => setNotaOpen(!notaOpen)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Nota
                  </Button>
                )}
                <a href={`/api/finance/po/${data.id}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-9">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> PO PDF
                  </Button>
                </a>
                <a href={`/api/finance/po/${data.id}/bundle`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-9">
                    <FileStack className="w-3.5 h-3.5 mr-1.5" /> Bundle Arsip
                  </Button>
                </a>
                {data.status !== 'VOIDED' && data.status !== 'PAID' && (
                  <Button size="sm" variant="outline" className="border-red-700 text-red-300 hover:bg-red-900/30 text-xs h-9" onClick={handleVoid}>
                    <Ban className="w-3.5 h-3.5 mr-1.5" /> Void PO
                  </Button>
                )}
              </div>

              {/* Inline payment form */}
              {payOpen && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-800/50 rounded space-y-3">
                  <p className="text-sm font-bold text-emerald-300">Catat Pembayaran untuk {data.displayPoNumber}</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">Jumlah *</Label>
                      <Input type="text" value={payAmount} onChange={e => setPayAmount(fmtRibuan(e.target.value))} placeholder="Rp" className="bg-slate-900 border-slate-700 text-slate-100 text-sm h-9 mt-1" />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Metode</Label>
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 h-9 mt-1">
                        <option value="TRANSFER">Transfer</option><option value="CASH">Cash</option><option value="GIRO">Giro</option><option value="CHEQUE">Cek</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Tanggal</Label>
                      <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="bg-slate-900 border-slate-700 text-slate-100 text-sm h-9 mt-1" />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Catatan</Label>
                      <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="opsional" className="bg-slate-900 border-slate-700 text-slate-100 text-sm h-9 mt-1" />
                    </div>
                  </div>
                  {/* PASTE BUKTI TRANSFER */}
                  <PasteImageUpload
                    onChange={setBuktiTransferFiles}
                    label="Bukti Transfer (paste dari WA web — Ctrl+V)"
                    hint="Buka WA web → right-click image bukti transfer → Copy Image → paste di sini"
                    max={5}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setPayOpen(false); setBuktiTransferFiles([]) }} className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-9">Batal</Button>
                    <Button size="sm" onClick={handlePay} disabled={payLoading} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9">
                      {payLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CreditCard className="w-3.5 h-3.5 mr-1.5" />}Bayar
                    </Button>
                  </div>
                </div>
              )}

              {/* Inline nota upload form */}
              {notaOpen && (
                <div className="p-4 bg-blue-950/20 border border-blue-800/50 rounded space-y-3">
                  <p className="text-sm font-bold text-blue-300">Upload Nota untuk {data.displayPoNumber}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs">No. Nota (opsional)</Label>
                      <Input value={notaNumber} onChange={e => setNotaNumber(e.target.value)} placeholder="Nomor nota dari toko" className="bg-slate-900 border-slate-700 text-slate-100 text-sm h-9 mt-1" />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Total Nota *</Label>
                      <Input type="text" value={notaTotal} onChange={e => setNotaTotal(fmtRibuan(e.target.value))} placeholder="Rp" className="bg-slate-900 border-slate-700 text-slate-100 text-sm h-9 mt-1" />
                    </div>
                  </div>
                  {/* PASTE NOTA IMAGES */}
                  <PasteImageUpload
                    onChange={setNotaFiles}
                    label="Foto Nota (paste dari WA web — Ctrl+V)"
                    hint="Buka WA web → right-click foto nota → Copy Image → paste di sini. Bisa multiple."
                    max={10}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setNotaOpen(false); setNotaFiles([]) }} className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-9">Batal</Button>
                    <Button size="sm" onClick={handleUploadNota} disabled={notaLoading} className="bg-blue-600 hover:bg-blue-700 text-xs h-9">
                      {notaLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}Simpan Nota
                    </Button>
                  </div>
                  {data.locked && <p className="text-xs text-amber-400">⚠ PO sudah terkunci. Upload nota tambahan tidak akan mengubah actualTotal.</p>}
                </div>
              )}

              {/* Secondary actions */}
              <div className="flex flex-wrap gap-2 items-center pt-2">
                <Button size="sm" variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-900/30 text-xs h-9"
                  onClick={() => { const n = prompt('Edit catatan PO:', data.notes || ''); if (n !== null) { fetch(`/api/finance/po/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: n }) }).then(r => r.json()).then(d => { if (d.success) { toast.success('Catatan diupdate'); setData({ ...data, notes: n }) } }) } }}>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Catatan
                </Button>
                {data.locked && <span className="text-xs text-amber-400 italic">PO terkunci (nota sudah ada)</span>}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
