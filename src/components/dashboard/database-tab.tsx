'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, Search, FileText, Users, Package, DollarSign, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Category = 'berkas' | 'marketing' | 'material' | 'finance'

interface BerkasRow {
  id: string
  name: string
  blockLetter?: string | null
  houseNumber?: string | null
  bankName?: string | null
  stage: string
  whatsappNumber?: string | null
  _count?: { documents: number; googleDocs: number; historyLogs: number }
  hasOrphanDocs?: boolean
  createdAt: string
}

interface MarketingRow {
  id: string
  name: string
  role: string
  _count?: { customers: number }
  customers?: Array<{ name: string; stage: string }>
}

interface MaterialRow {
  id: string
  name: string
  unit?: string | null
  stock?: number | null
  price?: number | null
  supplierName?: string | null
}

interface FinanceRow {
  id: string
  type: string
  amount: number
  status: string
  description?: string | null
  createdAt: string
}

export function DatabaseTab() {
  const [category, setCategory] = useState<Category>('berkas')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [berkasRows, setBerkasRows] = useState<BerkasRow[]>([])
  const [marketingRows, setMarketingRows] = useState<MarketingRow[]>([])
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([])
  const [financeRows, setFinanceRows] = useState<FinanceRow[]>([])
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (category === 'berkas') {
        const res = await fetch(`/api/database-explorer/berkas?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        if (data.success) setBerkasRows(data.data)
        else toast.error(data.error || 'Gagal memuat data berkas')
      } else if (category === 'marketing') {
        const res = await fetch(`/api/database-explorer/marketing?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        if (data.success) setMarketingRows(data.data)
        else toast.error(data.error || 'Gagal memuat data marketing')
      } else if (category === 'material') {
        const res = await fetch(`/api/database-explorer/material?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        if (data.success) setMaterialRows(data.data)
        else toast.error(data.error || 'Gagal memuat data material')
      } else if (category === 'finance') {
        const res = await fetch(`/api/database-explorer/finance?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        if (data.success) setFinanceRows(data.data)
        else toast.error(data.error || 'Gagal memuat data finance')
      }
    } catch (err) {
      console.error('DatabaseTab load error:', err)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    const t = setTimeout(loadData, 300)
    return () => clearTimeout(t)
  }, [loadData])

  const categories: Array<{ id: Category; label: string; icon: any; color: string }> = [
    { id: 'berkas', label: 'Berkas', icon: FileText, color: 'text-blue-400' },
    { id: 'marketing', label: 'Marketing', icon: Users, color: 'text-purple-400' },
    { id: 'material', label: 'Material', icon: Package, color: 'text-orange-400' },
    { id: 'finance', label: 'Finance', icon: DollarSign, color: 'text-green-400' },
  ]

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Database Explorer</h2>
          <Badge variant="secondary" className="text-xs">Read-only</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setSelectedRow(null) }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              category === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            )}
          >
            <cat.icon className={cn('w-4 h-4', category !== cat.id && cat.color)} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`Cari di ${category}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <Card className="lg:col-span-2 overflow-hidden">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Memuat...</div>
            ) : category === 'berkas' ? (
              <BerkasList rows={berkasRows} onSelect={setSelectedRow} selectedId={selectedRow?.id} />
            ) : category === 'marketing' ? (
              <MarketingList rows={marketingRows} onSelect={setSelectedRow} selectedId={selectedRow?.id} />
            ) : category === 'material' ? (
              <MaterialList rows={materialRows} onSelect={setSelectedRow} selectedId={selectedRow?.id} />
            ) : (
              <FinanceList rows={financeRows} onSelect={setSelectedRow} selectedId={selectedRow?.id} />
            )}
          </ScrollArea>
        </Card>

        {/* Detail */}
        <Card className="overflow-hidden">
          <ScrollArea className="h-full">
            {selectedRow ? (
              <DetailView row={selectedRow} category={category} />
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Pilih baris untuk lihat detail
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// BERKAS LIST
// ============================================================
function BerkasList({ rows, onSelect, selectedId }: { rows: BerkasRow[]; onSelect: (r: BerkasRow) => void; selectedId?: string }) {
  if (rows.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Tidak ada data konsumen</div>
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => {
        const block = (r.blockLetter || '') + (r.houseNumber || '') || '-'
        const docCount = (r._count?.documents || 0) + (r._count?.googleDocs || 0)
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className={cn(
              'w-full text-left p-4 hover:bg-muted/50 transition-colors',
              selectedId === r.id && 'bg-primary/10'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{r.name}</span>
                  {r.hasOrphanDocs && (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span>Blok {block}</span>
                  {r.bankName && <span>{r.bankName}</span>}
                  <span className="uppercase">{r.stage}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{docCount} berkas</Badge>
                {r._count?.historyLogs ? (
                  <Badge variant="outline">{r._count.historyLogs} logs</Badge>
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// MARKETING LIST
// ============================================================
function MarketingList({ rows, onSelect, selectedId }: { rows: MarketingRow[]; onSelect: (r: MarketingRow) => void; selectedId?: string }) {
  if (rows.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Tidak ada data marketing agent</div>
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className={cn(
            'w-full text-left p-4 hover:bg-muted/50 transition-colors',
            selectedId === r.id && 'bg-primary/10'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground mt-1 uppercase">{r.role}</div>
            </div>
            <Badge variant="outline">{r._count?.customers || 0} konsumen</Badge>
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================
// MATERIAL LIST
// ============================================================
function MaterialList({ rows, onSelect, selectedId }: { rows: MaterialRow[]; onSelect: (r: MaterialRow) => void; selectedId?: string }) {
  if (rows.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Tidak ada data material</div>
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className={cn(
            'w-full text-left p-4 hover:bg-muted/50 transition-colors',
            selectedId === r.id && 'bg-primary/10'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {r.supplierName || '-'} {r.unit && `• ${r.unit}`}
              </div>
            </div>
            <div className="text-right">
              {r.stock !== null && r.stock !== undefined && (
                <div className="text-sm font-medium">Stok: {r.stock}</div>
              )}
              {r.price !== null && r.price !== undefined && (
                <div className="text-xs text-muted-foreground">Rp {r.price.toLocaleString('id-ID')}</div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================
// FINANCE LIST
// ============================================================
function FinanceList({ rows, onSelect, selectedId }: { rows: FinanceRow[]; onSelect: (r: FinanceRow) => void; selectedId?: string }) {
  if (rows.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Tidak ada data finance</div>
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className={cn(
            'w-full text-left p-4 hover:bg-muted/50 transition-colors',
            selectedId === r.id && 'bg-primary/10'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium capitalize">{r.type}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {r.description || '-'} • {new Date(r.createdAt).toLocaleDateString('id-ID')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Rp {r.amount.toLocaleString('id-ID')}</div>
              <Badge variant="outline" className="mt-1 text-xs">{r.status}</Badge>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================
// DETAIL VIEW
// ============================================================
function DetailView({ row, category }: { row: any; category: Category }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-base mb-1">Detail Record</h3>
        <p className="text-xs text-muted-foreground">ID: {row.id}</p>
      </div>

      <div className="space-y-2">
        {Object.entries(row).map(([key, value]) => {
          if (key === 'id' || key === '_count') return null
          if (typeof value === 'object' && value !== null) return null
          return (
            <div key={key} className="flex justify-between gap-2 text-sm border-b border-border/50 pb-1">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-medium text-right break-all">{String(value ?? '-')}</span>
            </div>
          )
        })}
      </div>

      {row._count && (
        <div>
          <h4 className="text-sm font-medium mb-2">Relasi</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(row._count).map(([k, v]) => (
              <Badge key={k} variant="secondary">{k}: {v as number}</Badge>
            ))}
          </div>
        </div>
      )}

      {category === 'berkas' && row.hasOrphanDocs && (
        <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 text-yellow-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Orphan Documents Detected</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Konsumen ini memiliki GoogleDoc dengan customerId=NULL (file Drive tanpa link konsumen).
          </p>
        </div>
      )}
    </div>
  )
}
