'use client'
// Wage List — browse 58 wage payments
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Search, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WageFormModal } from './wage-form'

interface Wage {
  id: string
  amount: number
  fullTaskBudget: number
  workDescription: string | null
  status: string
  wageDate: string
  totalPaid: number
  remaining: number
  worker: { name: string }
  wageType: { name: string }
  project: { name: string; code: string | null }
  unit: { blockNumber: string } | null
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200',
  UNPAID: 'bg-red-900/60 text-red-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200',
  PAID: 'bg-emerald-900/60 text-emerald-200',
}

export function WageList() {
  const [wages, setWages] = useState<Wage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [wageFormOpen, setWageFormOpen] = useState(false)

  const fetchWages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/finance/wages?${params}`)
      const d = await res.json()
      if (d.success) {
        let filtered = d.data
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter((w: Wage) =>
            w.worker?.name?.toLowerCase().includes(q) ||
            w.workDescription?.toLowerCase().includes(q) ||
            w.wageType?.name?.toLowerCase().includes(q)
          )
        }
        setWages(filtered.slice(0, 50))
      }
    } catch { toast.error('Gagal load wages') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWages() }, [statusFilter])
  useEffect(() => { const t = setTimeout(fetchWages, 300); return () => clearTimeout(t) }, [search])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari tukang / pekerjaan..."
            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-xs h-8" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL_PAID">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      <Card className="overflow-hidden bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left p-2 text-slate-300">Tanggal</th>
                <th className="text-left p-2 text-slate-300">Tukang</th>
                <th className="text-left p-2 text-slate-300">Pekerjaan</th>
                <th className="text-left p-2 text-slate-300">Unit</th>
                <th className="text-right p-2 text-slate-300">Amount</th>
                <th className="text-right p-2 text-slate-300">Budget</th>
                <th className="text-right p-2 text-slate-300">Dibayar</th>
                <th className="text-center p-2 text-slate-300">Status</th>
                <th className="text-center p-2 text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><Skeleton className="h-6 mx-auto w-32" /></td></tr>
              ) : wages.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">Tidak ada upah</td></tr>
              ) : wages.map(w => (
                <tr key={w.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="p-2 text-slate-400">{new Date(w.wageDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                  <td className="p-2 text-slate-200">{w.worker?.name}</td>
                  <td className="p-2 text-slate-300 max-w-40 truncate">{w.workDescription || w.wageType?.name}</td>
                  <td className="p-2 text-slate-400">{w.unit?.blockNumber || 'GDG'}</td>
                  <td className="p-2 text-right font-mono text-slate-200">{fmt(w.amount)}</td>
                  <td className="p-2 text-right font-mono text-slate-500">{fmt(w.fullTaskBudget)}</td>
                  <td className="p-2 text-right font-mono text-emerald-400">{fmt(w.totalPaid)}</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={`text-[9px] ${statusColor[w.status] || 'bg-slate-700'}`}>{w.status}</Badge>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={async () => { if (!confirm('Hapus upah ini?')) return; try { await fetch(`/api/finance/wages/${w.id}`, { method: 'DELETE' }); toast.success('Upah dihapus'); fetchWages(); } catch { toast.error('Gagal hapus'); } }}
                      className="text-red-400 hover:bg-red-900/30 rounded p-1" title="Hapus">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[10px] text-slate-500">{wages.length} upah ditampilkan (max 50)</p>
      {wageFormOpen && <WageFormModal open={wageFormOpen} onClose={() => setWageFormOpen(false)} onSaved={fetchWages} />}
    </div>
  )
}
