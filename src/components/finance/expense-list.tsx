'use client'
// Expense List — browse 94 other expenses
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

interface Expense {
  id: string
  amount: number
  description: string
  recipientName: string
  category: string
  status: string
  expenseDate: string
  totalPaid: number
  remaining: number
  project: { name: string; code: string | null } | null
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-700 text-slate-200',
  UNPAID: 'bg-red-900/60 text-red-200',
  PARTIAL_PAID: 'bg-amber-900/60 text-amber-200',
  PAID: 'bg-emerald-900/60 text-emerald-200',
}

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [projectFilter, setProjectFilter] = useState('')

  const categories = ['SALARY', 'FUEL', 'NOTARY', 'SLF', 'KWH', 'DP_REFUND', 'REIMBURSE', 'TAKSASI', 'RAP', 'MARKETING', 'OPERASIONAL_KANTOR', 'KOMISI', 'BIAYA_NOTARIS', 'HUTANG', 'KASBON', 'PBB', 'PPH', 'LAINNYA', 'OTHER']

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (projectFilter) params.set('projectId', projectFilter)
      const res = await fetch(`/api/finance/expenses?${params}`)
      const d = await res.json()
      if (d.success) {
        let filtered = d.data
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter((e: Expense) =>
            e.description?.toLowerCase().includes(q) ||
            e.recipientName?.toLowerCase().includes(q) ||
            e.category?.toLowerCase().includes(q)
          )
        }
        setExpenses(filtered.slice(0, 50))
      }
    } catch { toast.error('Gagal load expenses') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchExpenses() }, [statusFilter, categoryFilter, projectFilter])
  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setProjects(d.projects || []) }).catch(() => {})
  }, [])
  useEffect(() => { const t = setTimeout(fetchExpenses, 300); return () => clearTimeout(t) }, [search])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari description / penerima / kategori..."
            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-xs h-8" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL_PAID">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </div>

      <Card className="overflow-hidden bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left p-2 text-slate-300">Tanggal</th>
                <th className="text-left p-2 text-slate-300">Kategori</th>
                <th className="text-left p-2 text-slate-300">Unit/Blok</th>
                <th className="text-left p-2 text-slate-300">Deskripsi</th>
                <th className="text-right p-2 text-slate-300">Amount</th>
                <th className="text-right p-2 text-slate-300">Dibayar</th>
                <th className="text-center p-2 text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8"><Skeleton className="h-6 mx-auto w-32" /></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Tidak ada expense</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="p-2 text-slate-400">{new Date(e.expenseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                  <td className="p-2"><Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">{e.category}</Badge></td>
                  <td className="p-2 text-slate-400">{e.project?.code || '-'}</td>
                  <td className="p-2 text-slate-300 max-w-48 truncate">{e.description}</td>
                  <td className="p-2 text-right font-mono text-slate-200">{fmt(e.amount)}</td>
                  <td className="p-2 text-right font-mono text-emerald-400">{fmt(e.totalPaid)}</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={`text-[9px] ${statusColor[e.status] || 'bg-slate-700'}`}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[10px] text-slate-500">{expenses.length} expense ditampilkan (max 50)</p>
    </div>
  )
}
