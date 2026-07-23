'use client'
// MaterialView — Kartu stok + opname + low-stock alert
// Per PRD section 25.5 (Material SOP) + 25.7 S9 (separate tab)
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Package, AlertTriangle, Search, RefreshCw, Plus, Wrench } from 'lucide-react'

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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> Material & Gudang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Master material + kartu stok + opname + low-stock alert</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMaterials} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Material Baru
          </Button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-[10px] text-blue-700 font-medium">Total Material</p>
          <p className="text-xl font-bold text-blue-800">{materials.length}</p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-[10px] text-red-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </p>
          <p className="text-xl font-bold text-red-800">{lowStockCount}</p>
        </Card>
        <Card className="p-3 bg-emerald-50 border-emerald-200">
          <p className="text-[10px] text-emerald-700 font-medium">Nilai Stok (AVCO)</p>
          <p className="text-xl font-bold text-emerald-800">{fmt(totalStockValue)}</p>
        </Card>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari material..."
            className="pl-9"
          />
        </div>
        <Button
          variant={showLowStockOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={showLowStockOnly ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          {showLowStockOnly ? 'Tampilkan Semua' : 'Hanya Low Stock'}
        </Button>
      </div>

      {/* Material table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="text-left p-2 font-medium text-slate-700">Material</th>
                <th className="text-left p-2 font-medium text-slate-700">Kategori</th>
                <th className="text-right p-2 font-medium text-slate-700">Stok</th>
                <th className="text-right p-2 font-medium text-slate-700">Min Stock</th>
                <th className="text-right p-2 font-medium text-slate-700">AVCO</th>
                <th className="text-right p-2 font-medium text-slate-700">Nilai</th>
                <th className="text-center p-2 font-medium text-slate-700">Status</th>
                <th className="text-center p-2 font-medium text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada material ditemukan
                  </td>
                </tr>
              ) : (
                materials.map((m) => {
                  const qty = m.stock?.quantity || 0
                  const avgPrice = m.stock?.avgPrice || 0
                  const isLow = qty <= m.minStock
                  return (
                    <tr key={m.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-800">{m.name}</td>
                      <td className="p-2 text-slate-600">
                        <Badge variant="outline" className="text-[9px]">{m.category?.name || '—'}</Badge>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {qty.toLocaleString('id-ID')} <span className="text-slate-400">{m.unitMeasure}</span>
                      </td>
                      <td className="p-2 text-right text-slate-500 font-mono">{m.minStock.toLocaleString('id-ID')}</td>
                      <td className="p-2 text-right font-mono">{fmt(avgPrice)}</td>
                      <td className="p-2 text-right font-mono font-medium">{fmt(qty * avgPrice)}</td>
                      <td className="p-2 text-center">
                        {isLow ? (
                          <Badge variant="destructive" className="text-[9px]">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> LOW
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] bg-emerald-100 text-emerald-700">OK</Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => toast.info('Opname modal akan datang di iterasi berikutnya')}
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

      <p className="text-[10px] text-slate-400 pt-2">
        💡 Phase D v1: read-only material list + low-stock alert. Form input (material baru + opname + usage) akan datang di iterasi berikutnya.
      </p>
    </div>
  )
}
