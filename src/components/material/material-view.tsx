'use client'
// MaterialView — Dark theme
// Kartu stok + opname + low-stock alert + material baru form
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Package, AlertTriangle, Search, RefreshCw, Plus, Wrench } from 'lucide-react'
import { MaterialFormModal } from '../finance/material-form'
import { OpnameModal } from '../finance/opname-modal'
import { UsageFormModal } from '../finance/usage-form'
import { CategoryTracking } from './category-tracking'

type MatSubTab = 'stock' | 'tracking'

interface MaterialItem {
  id: string
  name: string
  unitMeasure: string
  minStock: number
  lastPrice: number | null
  category: { name: string } | null
  stock: { quantity: number; avgPrice: number } | null
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export function MaterialView() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [matSubTab, setMatSubTab] = useState<MatSubTab>('stock')
  const [materialFormOpen, setMaterialFormOpen] = useState(false)
  const [usageFormOpen, setUsageFormOpen] = useState(false)
  const [opnameMaterial, setOpnameMaterial] = useState<MaterialItem | null>(null)

  const fetchMaterials = async () => {
    setRefreshing(true)
    try {
      const url = `/api/finance/material${showLowStockOnly ? '?lowStock=true' : ''}${search ? `${showLowStockOnly ? '&' : '?'}q=${encodeURIComponent(search)}` : ''}`
      const res = await fetch(url)
      const d = await res.json()
      if (d.success) setMaterials(d.data)
      else throw new Error(d.error || 'Failed')
    } catch (err: any) {
      toast.error('Gagal load materials: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [showLowStockOnly])

  useEffect(() => {
    const timeout = setTimeout(fetchMaterials, 300)
    return () => clearTimeout(timeout)
  }, [search])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const lowStockCount = materials.filter(m => m.stock && m.stock.quantity <= m.minStock).length
  const totalStockValue = materials.reduce((s, m) => s + (m.stock?.quantity || 0) * (m.stock?.avgPrice || 0), 0)

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" /> Material & Gudang
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Master material + kartu stok + opname + low-stock alert</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMaterials} disabled={refreshing} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setUsageFormOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Catat Pemakaian
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setMaterialFormOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Material Baru
          </Button>
        </div>
      </div>

      {/* Sub-tab: Stock | Category Tracking */}
      <div className="flex gap-1 border-b border-slate-800 pb-1">
        <button onClick={() => setMatSubTab('stock')}
          className={`px-3 py-1.5 text-xs font-medium rounded-t border-b-2 ${matSubTab === 'stock' ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          Stok Material
        </button>
        <button onClick={() => setMatSubTab('tracking')}
          className={`px-3 py-1.5 text-xs font-medium rounded-t border-b-2 ${matSubTab === 'tracking' ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          Tracking per Pekerjaan
        </button>
      </div>

      {matSubTab === 'stock' && (
      <>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-blue-950/40 border-blue-800/50">
          <p className="text-[10px] text-blue-300 font-medium">Total Material</p>
          <p className="text-xl font-bold text-blue-200">{materials.length}</p>
        </Card>
        <Card className="p-3 bg-red-950/40 border-red-800/50">
          <p className="text-[10px] text-red-300 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </p>
          <p className="text-xl font-bold text-red-200">{lowStockCount}</p>
        </Card>
        <Card className="p-3 bg-emerald-950/40 border-emerald-800/50">
          <p className="text-[10px] text-emerald-300 font-medium">Nilai Stok (AVCO)</p>
          <p className="text-xl font-bold text-emerald-200">{fmt(totalStockValue)}</p>
        </Card>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari material..."
            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500"
          />
        </div>
        <Button
          variant={showLowStockOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={showLowStockOnly ? 'bg-red-600 hover:bg-red-700' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          {showLowStockOnly ? 'Tampilkan Semua' : 'Hanya Low Stock'}
        </Button>
      </div>

      {/* Material table */}
      <Card className="overflow-hidden bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left p-2 font-medium text-slate-300">Material</th>
                <th className="text-left p-2 font-medium text-slate-300">Kategori</th>
                <th className="text-right p-2 font-medium text-slate-300">Stok</th>
                <th className="text-right p-2 font-medium text-slate-300">Min</th>
                <th className="text-right p-2 font-medium text-slate-300">AVCO</th>
                <th className="text-right p-2 font-medium text-slate-300">Nilai</th>
                <th className="text-center p-2 font-medium text-slate-300">Status</th>
                <th className="text-center p-2 font-medium text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Tidak ada material ditemukan
                  </td>
                </tr>
              ) : (
                materials.map((m) => {
                  const qty = m.stock?.quantity || 0
                  const avgPrice = m.stock?.avgPrice || 0
                  const isLow = qty <= m.minStock
                  return (
                    <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="p-2 font-medium text-slate-100">{m.name}</td>
                      <td className="p-2 text-slate-400">
                        <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">{m.category?.name || '—'}</Badge>
                      </td>
                      <td className="p-2 text-right font-mono text-slate-200">
                        {qty.toLocaleString('id-ID')} <span className="text-slate-500">{m.unitMeasure}</span>
                      </td>
                      <td className="p-2 text-right text-slate-500 font-mono">{m.minStock.toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right font-mono text-slate-300">{fmt(avgPrice)}</td>
                      <td className="p-2 text-right font-mono font-medium text-slate-200">{fmt(qty * avgPrice)}</td>
                      <td className="p-2 text-center">
                        {isLow ? (
                          <Badge variant="destructive" className="text-[9px] bg-red-900/60 text-red-200 border-red-700">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> LOW
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] bg-emerald-900/60 text-emerald-200 border-emerald-700">OK</Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                          onClick={() => setOpnameMaterial(m)}
                        >
                          <Wrench className="w-3 h-3 mr-1" /> Opname
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}

      {matSubTab === 'tracking' && <CategoryTracking />}

      {/* MODALS */}
      {materialFormOpen && (
        <MaterialFormModal open={materialFormOpen} onClose={() => setMaterialFormOpen(false)} onSaved={fetchMaterials} />
      )}
      {usageFormOpen && (
        <UsageFormModal open={usageFormOpen} onClose={() => setUsageFormOpen(false)} onSaved={fetchMaterials} />
      )}
      {opnameMaterial && (
        <OpnameModal
          open={!!opnameMaterial}
          material={opnameMaterial}
          onClose={() => setOpnameMaterial(null)}
          onSaved={fetchMaterials}
        />
      )}
    </div>
  )
}
