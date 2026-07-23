'use client'
// Material Form Modal — create new material + init stock
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

interface Category { id: string; name: string }

export function MaterialFormModal({ open, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [unitMeasure, setUnitMeasure] = useState('Pcs')
  const [minStock, setMinStock] = useState('')
  const [lastPrice, setLastPrice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/finance/material/usage').then(r => r.json()).catch(() => ({ success: false, data: [] }))
      // Fetch categories via material list (workaround — no /categories endpoint yet)
      fetch('/api/finance/material?_=' + Date.now()).then(r => r.json()).then(d => {
        if (d.success) {
          const cats = new Map<string, string>()
          d.data.forEach((m: any) => {
            if (m.category) cats.set(m.category.id, m.category.name)
          })
          setCategories(Array.from(cats.entries()).map(([id, name]) => ({ id, name })))
        }
      }).catch(() => setCategories([]))
    }
  }, [open])

  const formatRibuan = (n: string) => {
    const num = parseInt(n.replace(/\./g, '')) || 0
    return num ? num.toLocaleString('id-ID') : ''
  }

  const handleSave = async () => {
    if (!name || !unitMeasure) {
      toast.error('Nama + Satuan wajib')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/finance/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          categoryId: categoryId || null,
          unitMeasure,
          minStock: parseInt(minStock.replace(/\./g, '')) || 0,
          lastPrice: parseInt(lastPrice.replace(/\./g, '')) || null,
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed')

      toast.success('Material dibuat: ' + name)
      onSaved()
      onClose()
      setName(''); setCategoryId(''); setUnitMeasure('Pcs'); setMinStock(''); setLastPrice('')
    } catch (err: any) {
      toast.error('Gagal: ' + (err?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Material Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-slate-300 text-xs">Nama Material *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Semen Tiga Roda"
              className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-slate-300 text-xs">Kategori</Label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100">
                <option value="">— Tidak ada —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Satuan *</Label>
              <Input value={unitMeasure} onChange={e => setUnitMeasure(e.target.value)} placeholder="Pcs/zak/kg"
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-slate-300 text-xs">Min Stock (alert)</Label>
              <Input type="text" value={minStock} onChange={e => setMinStock(formatRibuan(e.target.value))} placeholder="0"
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Harga Acuan (Rp)</Label>
              <Input type="text" value={lastPrice} onChange={e => setLastPrice(formatRibuan(e.target.value))} placeholder="0"
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
