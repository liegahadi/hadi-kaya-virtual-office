'use client'
// PO Detail Modal — click row → lihat detail PO (items, payments, download PDF/bundle)
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, FileStack } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200', UNPAID: 'bg-red-900/60 text-red-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200', PAID: 'bg-emerald-900/60 text-emerald-200', VOIDED: 'bg-slate-800 text-slate-500',
}

export function PoDetailModal({ poId, open, onClose }: { poId: string | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (poId && open) {
      setLoading(true)
      fetch(`/api/finance/po/${poId}`).then(r => r.json()).then(d => {
        if (d.success) setData(d.data)
      }).catch(() => {}).finally(() => setLoading(false))
    } else { setData(null) }
  }, [poId, open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto dark-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            {data?.displayPoNumber || 'Loading...'}
            {data && <Badge variant="outline" className={`text-[9px] ${statusColor[data.status] || 'bg-slate-700'}`}>{data.status}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading ? <Skeleton className="h-48" /> : data ? (
          <div className="space-y-3 py-2">
            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Supplier:</span> <span className="text-slate-200">{data.supplier?.name}</span></div>
              <div><span className="text-slate-400">Tanggal:</span> <span className="text-slate-200">{new Date(data.poDate).toLocaleDateString('id-ID')}</span></div>
              <div><span className="text-slate-400">Project:</span> <span className="text-slate-200">{data.project?.name} ({data.project?.code})</span></div>
              <div><span className="text-slate-400">Unit:</span> <span className="text-slate-200">{data.unit?.blockNumber || 'GDG'}</span></div>
              {data.supplier?.bankName && <div><span className="text-slate-400">Bank:</span> <span className="text-slate-200">{data.supplier.bankName} {data.supplier.bankAccount}</span></div>}
              {data.receivedAt && <div><span className="text-slate-400">Diterima:</span> <span className="text-slate-200">{new Date(data.receivedAt).toLocaleDateString('id-ID')}</span></div>}
            </div>

            {/* Items */}
            <div className="border-t border-slate-700 pt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Items ({data.items?.length || 0})</p>
              <div className="space-y-1 max-h-40 overflow-y-auto dark-scrollbar">
                {data.items?.map((it: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-1.5 bg-slate-800/50 rounded text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-200">{it.material?.name}</span>
                      {it.directUse && <Badge variant="outline" className="ml-1 text-[8px] border-amber-600 text-amber-400">DU</Badge>}
                    </div>
                    <span className="text-slate-400 font-mono ml-2">{it.qty} {it.material?.unitMeasure}</span>
                    <span className="text-slate-300 font-mono ml-2">{fmt(it.price)}</span>
                    <span className="text-slate-100 font-mono font-bold ml-2">{fmt(it.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-slate-700 pt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Planned Total:</span><span className="text-slate-200 font-mono">{fmt(data.plannedTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Actual Total:</span><span className="text-slate-200 font-mono">{fmt(data.actualTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Dibayar:</span><span className="text-emerald-400 font-mono">{fmt(data.totalPaid)}</span></div>
              <div className="flex justify-between font-bold"><span className="text-slate-300">Sisa:</span><span className="text-red-300 font-mono">{fmt(data.remaining)}</span></div>
            </div>

            {/* Payments */}
            {data.payments?.length > 0 && (
              <div className="border-t border-slate-700 pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Riwayat Pembayaran ({data.payments.length})</p>
                <div className="space-y-1">
                  {data.payments.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-slate-800/50 rounded text-xs">
                      <span className="text-slate-400">{new Date(p.paidAt).toLocaleDateString('id-ID')} • {p.method}</span>
                      <span className="text-emerald-400 font-mono">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {data.notes && <div className="border-t border-slate-700 pt-2 text-xs"><span className="text-slate-400">Catatan:</span> <span className="text-slate-300">{data.notes}</span></div>}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
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
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
