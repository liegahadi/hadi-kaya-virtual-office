'use client'
// Opname Modal — stock adjustment with reason (audit log mandatory)
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MaterialItem {
  id: string
  name: string
  unitMeasure: string
  stock: { quantity: number; avgPrice: number } | null
}

interface Props {
  open: boolean
  material: MaterialItem
  onClose: () => void
  onSaved: () => void
}

export function OpnameModal({ open, material, onClose, onSaved }: Props) {
  const [adjustType, setAdjustType] = useState<'SET' | 'DELTA'>('SET')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const currentQty = material?.stock?.quantity || 0

  const handleSave = async () => {
    if (!reason.trim()) {
      toast.error('Alasan wajib (audit log)')
      return
    }
    const val = parseFloat(qty.replace(/\./g, '').replace(',', '.')) || 0
    let delta = 0
    if (adjustType === 'SET') {
      delta = val - currentQty
    } else {
      delta = val
    }
    if (delta === 0) {
      toast.error('Tidak ada perubahan')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/finance/material/stock/${material.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deltaQty: delta,
          reason,
          type: 'OPNAME',
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed')

      toast.success(`Stok diupdate: ${currentQty} → ${d.data.newQty}`)
      onSaved()
      onClose()
      setQty(''); setReason('')
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
          <DialogTitle className="text-slate-100">Stok Opname: {material?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-slate-800/50 p-2 rounded text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Stok Saat Ini:</span>
              <span className="text-slate-200 font-mono">{currentQty.toLocaleString('id-ID')} {material?.unitMeasure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AVCO:</span>
              <span className="text-slate-300 font-mono">Rp {(material?.stock?.avgPrice || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs">Mode</Label>
            <div className="flex gap-1 mt-1">
              <Button size="sm" variant={adjustType === 'SET' ? 'default' : 'outline'} onClick={() => setAdjustType('SET')}
                className={adjustType === 'SET' ? 'bg-emerald-600 h-7 text-[10px]' : 'border-slate-700 text-slate-300 hover:bg-slate-800 h-7 text-[10px]'}>
                Set Stok Baru
              </Button>
              <Button size="sm" variant={adjustType === 'DELTA' ? 'default' : 'outline'} onClick={() => setAdjustType('DELTA')}
                className={adjustType === 'DELTA' ? 'bg-emerald-600 h-7 text-[10px]' : 'border-slate-700 text-slate-300 hover:bg-slate-800 h-7 text-[10px]'}>
                Tambah/Kurang (delta)
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs">
              {adjustType === 'SET' ? 'Stok Baru (hasil opname)' : 'Delta (+ tambah / − kurang)'}
            </Label>
            <Input type="text" value={qty} onChange={e => setQty(e.target.value)}
              placeholder={adjustType === 'SET' ? `${currentQty}` : '0 (atau -5 untuk kurang)'}
              className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
          </div>

          <div>
            <Label className="text-slate-300 text-xs">Alasan (WAJIB — audit log) *</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="e.g., Hasil opname fisik tanggal X, selisih karena rusak/hilang"
              className="mt-1 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Simpan Opname
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
