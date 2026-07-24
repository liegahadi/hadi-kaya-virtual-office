'use client'
// Memo List — browse 44 memos
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Memo {
  id: string
  memoNumber: string
  memoDate: string
  status: string
  notes: string | null
  totalAmount: number
  _count: { lines: number }
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200',
  PROPOSED: 'bg-blue-900/60 text-blue-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200',
  COMPLETED: 'bg-emerald-900/60 text-emerald-200',
  VOIDED: 'bg-slate-800 text-slate-500',
}

export function MemoList() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailMemoId, setDetailMemoId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchMemos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/finance/memos?${params}`)
      const d = await res.json()
      if (d.success) {
        let filtered = d.data
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter((m: Memo) => m.memoNumber?.toLowerCase().includes(q))
        }
        setMemos(filtered)
      }
    } catch { toast.error('Gagal load memos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMemos() }, [statusFilter])
  useEffect(() => { const t = setTimeout(fetchMemos, 300); return () => clearTimeout(t) }, [search])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari memo number..."
            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-xs h-8" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Status</option>
          <option value="PROPOSED">Proposed</option>
          <option value="PARTIAL_PAID">Partial</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <Card className="overflow-hidden bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left p-2 text-slate-300">No Memo</th>
                <th className="text-left p-2 text-slate-300">Tanggal</th>
                <th className="text-right p-2 text-slate-300">Items</th>
                <th className="text-right p-2 text-slate-300">Total</th>
                <th className="text-center p-2 text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><Skeleton className="h-6 mx-auto w-32" /></td></tr>
              ) : memos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Tidak ada memo</td></tr>
              ) : memos.map(m => (
                <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={async () => {
                  setDetailMemoId(m.id); setDetailLoading(true)
                  try { const res = await fetch(`/api/finance/memos/${m.id}`); const d = await res.json(); if (d.success) setDetailData(d.data) } catch {}
                  finally { setDetailLoading(false) }
                }}>
                  <td className="p-2 font-mono text-slate-200">{m.memoNumber}</td>
                  <td className="p-2 text-slate-400">{new Date(m.memoDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-2 text-right text-slate-300">{m._count?.lines || 0}</td>
                  <td className="p-2 text-right font-mono text-slate-200">{fmt(m.totalAmount)}</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={`text-[9px] ${statusColor[m.status] || 'bg-slate-700'}`}>{m.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[10px] text-slate-500">{memos.length} memo</p>

      {/* Detail Modal */}
      <Dialog open={!!detailMemoId} onOpenChange={() => { setDetailMemoId(null); setDetailData(null) }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto dark-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{detailData?.memoNumber || 'Loading...'}</DialogTitle>
          </DialogHeader>
          {detailLoading ? <Skeleton className="h-32" /> : detailData ? (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Tanggal:</span> <span className="text-slate-200">{new Date(detailData.memoDate).toLocaleDateString('id-ID')}</span></div>
                <div><span className="text-slate-400">Status:</span> <Badge variant="outline" className={`text-[9px] ${statusColor[detailData.status] || 'bg-slate-700'}`}>{detailData.status}</Badge></div>
              </div>
              {detailData.notes && <p className="text-xs text-slate-400">Notes: {detailData.notes}</p>}
              <div className="border-t border-slate-700 pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Items ({detailData.lines?.length || 0})</p>
                <div className="space-y-1 max-h-60 overflow-y-auto dark-scrollbar">
                  {detailData.lines?.map((line: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-slate-800/50 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="text-slate-300">{line.kind}</span>
                        {line.itemDetail?.poNumber && <span className="text-slate-400 ml-1">— {line.itemDetail.poNumber.replace(/-/g, '/')}</span>}
                        {line.itemDetail?.worker?.name && <span className="text-slate-400 ml-1">— {line.itemDetail.worker.name}</span>}
                        {line.itemDetail?.recipientName && <span className="text-slate-400 ml-1">— {line.itemDetail.recipientName}</span>}
                        {line.itemDetail?.description && <span className="text-slate-500 ml-1 truncate">{line.itemDetail.description}</span>}
                      </div>
                      <span className="text-slate-200 font-mono ml-2">{fmt(line.itemDetail?.plannedTotal || line.itemDetail?.amount || 0)}</span>
                      <Badge variant="outline" className={`text-[8px] ml-2 ${line.status === 'PAID' ? 'bg-emerald-900/60 text-emerald-200' : 'bg-slate-700 text-slate-300'}`}>{line.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
