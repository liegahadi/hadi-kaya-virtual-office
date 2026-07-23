'use client'
// PO List — browse 122 PO dengan filter+search+sort+pagination
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Search, Download, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PoFormModal } from './po-form'
import { PoDetailModal } from './po-detail-modal'

interface PO {
  id: string
  poNumber: string
  poDate: string
  status: string
  plannedTotal: number
  actualTotal: number
  totalPaid: number
  remaining: number
  displayPoNumber: string
  supplier: { name: string }
  project: { name: string; code: string | null }
  unit: { blockNumber: string } | null
  _count: { notas: number }
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200',
  UNPAID: 'bg-red-900/60 text-red-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200',
  PAID: 'bg-emerald-900/60 text-emerald-200',
  VOIDED: 'bg-slate-800 text-slate-500',
}

export function PoList() {
  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [poFormOpen, setPoFormOpen] = useState(false)
  const [detailPoId, setDetailPoId] = useState<string | null>(null)
  const perPage = 20

  const fetchPos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (projectFilter) params.set('projectId', projectFilter)
      const res = await fetch(`/api/finance/po?${params}`)
      const d = await res.json()
      if (d.success) {
        let filtered = d.data
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter((p: PO) =>
            p.poNumber.toLowerCase().includes(q) ||
            p.supplier?.name?.toLowerCase().includes(q) ||
            p.project?.name?.toLowerCase().includes(q)
          )
        }
        setTotal(filtered.length)
        setPos(filtered.slice((page - 1) * perPage, page * perPage))
      }
    } catch (err: any) {
      toast.error('Gagal load PO')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => {
      if (d.success) setProjects(d.projects || [])
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchPos() }, [statusFilter, projectFilter, page])
  useEffect(() => { setPage(1); fetchPos() }, [search])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari PO number / supplier / project..."
            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-xs h-8" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL_PAID">Partial Paid</option>
          <option value="PAID">Paid</option>
          <option value="VOIDED">Voided</option>
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-[10px]" onClick={() => setPoFormOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> PO Baru
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left p-2 text-slate-300">No PO</th>
                <th className="text-left p-2 text-slate-300">Tanggal</th>
                <th className="text-left p-2 text-slate-300">Supplier</th>
                <th className="text-left p-2 text-slate-300">Project</th>
                <th className="text-right p-2 text-slate-300">Total</th>
                <th className="text-right p-2 text-slate-300">Dibayar</th>
                <th className="text-right p-2 text-slate-300">Sisa</th>
                <th className="text-center p-2 text-slate-300">Status</th>
                <th className="text-center p-2 text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><Skeleton className="h-6 mx-auto w-32" /></td></tr>
              ) : pos.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">Tidak ada PO</td></tr>
              ) : pos.map(po => (
                <tr key={po.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={() => setDetailPoId(po.id)}>
                  <td className="p-2 font-mono text-slate-200">{po.displayPoNumber}</td>
                  <td className="p-2 text-slate-400">{new Date(po.poDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-2 text-slate-200">{po.supplier?.name}</td>
                  <td className="p-2 text-slate-400">{po.project?.name}</td>
                  <td className="p-2 text-right font-mono text-slate-200">{fmt(po.actualTotal || po.plannedTotal)}</td>
                  <td className="p-2 text-right font-mono text-emerald-400">{fmt(po.totalPaid)}</td>
                  <td className="p-2 text-right font-mono text-red-300">{fmt(po.remaining)}</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={`text-[9px] ${statusColor[po.status] || 'bg-slate-700'}`}>{po.status}</Badge>
                  </td>
                  <td className="p-2 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <a href={`/api/finance/po/${po.id}/pdf`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-6 h-6 text-blue-400 hover:bg-blue-900/30 rounded" title="Download PDF">
                      <Download className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{total} PO total • halaman {page} dari {totalPages || 1}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="h-7 border-slate-700 text-slate-300 hover:bg-slate-800">
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="h-7 border-slate-700 text-slate-300 hover:bg-slate-800">
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {poFormOpen && <PoFormModal open={poFormOpen} onClose={() => setPoFormOpen(false)} onSaved={fetchPos} />}
      <PoDetailModal poId={detailPoId} open={!!detailPoId} onClose={() => setDetailPoId(null)} />
    </div>
  )
}
