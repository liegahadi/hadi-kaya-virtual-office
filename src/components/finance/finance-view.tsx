'use client'
// FinanceView — Layout A per PRD section 25.7
// Dark theme (match app default). Fix: text-slate-100/300 di bg slate-900/800
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Wallet, TrendingDown, AlertTriangle, Package, Wrench, FileText, Plus, RefreshCw, ArrowUpRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PoFormModal } from './po-form'
import { MemoFormModal } from './memo-form'
import { PaymentModal } from './payment-modal'

interface DashboardData {
  kpi: {
    totalKeluarBlnIni: number
    outstandingMaterial: number
    outstandingUpah: number
    outstandingOps: number
    totalOutstanding: number
  }
  cashflow: Array<{ month: string; material: number; upah: number; ops: number }>
  outstanding: {
    perPenerima: Array<{ name: string; type: string; amount: number; bankAccount?: string | null; refId?: string }>
    perKategori: Array<{ category: string; amount: number; count: number }>
  }
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function FinanceView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [poFormOpen, setPoFormOpen] = useState(false)
  const [memoFormOpen, setMemoFormOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentRecipient, setPaymentRecipient] = useState<{ name: string; type: string; amount: number; refId?: string } | null>(null)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/finance/dashboard')
      const d = await res.json()
      if (d.success) setData(d.data)
      else throw new Error(d.error || 'Failed')
    } catch (err: any) {
      toast.error('Gagal load dashboard: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePayClick = (p: { name: string; type: string; amount: number; refId?: string }) => {
    setPaymentRecipient(p)
    setPaymentOpen(true)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-slate-400">Failed to load dashboard data.</div>
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" /> Finance Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Cashflow + Outstanding hutang belum dibayar</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Total Keluar Bln Ini"
          value={fmt(data.kpi.totalKeluarBlnIni)}
          icon={<TrendingDown className="w-4 h-4" />}
          color="blue"
        />
        <KpiTile
          label="Outstanding Material"
          value={fmt(data.kpi.outstandingMaterial)}
          icon={<Package className="w-4 h-4" />}
          color="amber"
        />
        <KpiTile
          label="Outstanding Upah"
          value={fmt(data.kpi.outstandingUpah)}
          icon={<Wrench className="w-4 h-4" />}
          color="purple"
        />
        <KpiTile
          label="Outstanding Ops"
          value={fmt(data.kpi.outstandingOps)}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="red"
        />
      </div>

      {/* Total outstanding badge */}
      <Card className="p-4 bg-gradient-to-r from-red-950/50 to-orange-950/50 border-red-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-red-300 font-medium">Total Hutang Belum Dibayar</p>
            <p className="text-2xl font-bold text-red-200">{fmt(data.kpi.totalOutstanding)}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-400/60" />
        </div>
      </Card>

      {/* CASHFLOW 6 BULAN */}
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Cashflow 6 Bulan Terakhir</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.cashflow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
            <Tooltip
              formatter={(v: number) => fmt(v)}
              contentStyle={{ fontSize: 11, borderRadius: 6, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="material" stackId="a" fill="#3b82f6" name="Material" />
            <Bar dataKey="upah" stackId="a" fill="#10b981" name="Upah" />
            <Bar dataKey="ops" stackId="a" fill="#6b7280" name="Ops" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* OUTSTANDING TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Per Penerima */}
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-200">Outstanding per Penerima</h3>
            <span className="text-[10px] text-slate-400">{data.outstanding.perPenerima.length} item</span>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 dark-scrollbar">
            {data.outstanding.perPenerima.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Tidak ada hutang belum dibayar 🎉</p>
            ) : (
              data.outstanding.perPenerima.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.type}
                      {p.bankAccount ? ` • ${p.bankAccount}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-bold text-red-300">{fmt(p.amount)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300"
                      onClick={() => handlePayClick(p)}
                    >
                      Bayar
                      <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Per Kategori */}
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Outstanding per Kategori</h3>
          <div className="space-y-2">
            {data.outstanding.perKategori.map((k, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-300">{k.category}</span>
                  <span className="text-[10px] text-slate-400">{k.count} item</span>
                </div>
                <p className="text-base font-bold text-slate-100">{fmt(k.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPoFormOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Buat PO Baru
        </Button>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setMemoFormOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Buat Memo Pengajuan
        </Button>
        <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => window.open('/api/finance/reports/monthly', '_blank')}>
          <FileText className="w-3.5 h-3.5 mr-1.5" /> Laporan Bulanan
        </Button>
        <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => window.open('/api/finance/reports/annual', '_blank')}>
          <FileText className="w-3.5 h-3.5 mr-1.5" /> Laporan Tahunan
        </Button>
      </div>

      {/* MODALS */}
      {poFormOpen && <PoFormModal open={poFormOpen} onClose={() => setPoFormOpen(false)} onSaved={fetchData} />}
      {memoFormOpen && <MemoFormModal open={memoFormOpen} onClose={() => setMemoFormOpen(false)} onSaved={fetchData} />}
      {paymentOpen && paymentRecipient && (
        <PaymentModal
          open={paymentOpen}
          onClose={() => { setPaymentOpen(false); setPaymentRecipient(null) }}
          onSaved={fetchData}
          recipient={paymentRecipient}
        />
      )}
    </div>
  )
}

function KpiTile({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'blue' | 'amber' | 'purple' | 'red' }) {
  const colorClasses = {
    blue: 'bg-blue-950/40 border-blue-800/50 text-blue-300',
    amber: 'bg-amber-950/40 border-amber-800/50 text-amber-300',
    purple: 'bg-purple-950/40 border-purple-800/50 text-purple-300',
    red: 'bg-red-950/40 border-red-800/50 text-red-300',
  }
  return (
    <Card className={`p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-slate-300 opacity-90">{label}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <p className="text-base lg:text-lg font-bold text-slate-100">{value}</p>
    </Card>
  )
}
