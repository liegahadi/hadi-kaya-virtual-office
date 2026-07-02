// SLIP GAJI FORM - Editable form for gaji pokok, tunjangan, potongan, kop surat
import React from 'react'
import { BerkasState } from '@/lib/berkas/types'

interface SlipItem { label: string; amount: number }

export function SlipGajiForm({ state, onUpdate }: {
  state: BerkasState
  onUpdate: (field: string, val: any) => void
}) {
  const a = state.applicant as any
  const gajiPokok = a.gajiPokok || 0
  const tunjanganTetap: SlipItem[] = a.tunjanganTetap || []
  const tunjanganVariabel: SlipItem[] = a.tunjanganVariabel || []
  const potongan: SlipItem[] = a.potongan || []

  const addItem = (field: string) => {
    const current = (a[field] || []) as SlipItem[]
    onUpdate(field, [...current, { label: '', amount: 0 }])
  }
  const updateItem = (field: string, idx: number, key: 'label' | 'amount', val: any) => {
    const current = (a[field] || []) as SlipItem[]
    const updated = [...current]
    updated[idx] = { ...updated[idx], [key]: key === 'amount' ? parseInt(val) || 0 : val }
    onUpdate(field, updated)
  }
  const removeItem = (field: string, idx: number) => {
    const current = (a[field] || []) as SlipItem[]
    onUpdate(field, current.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/10">
      <h4 className="text-[10px] font-bold text-emerald-400 uppercase mb-2">Form Slip Gaji</h4>

      {/* Gaji Pokok */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-muted-foreground">Gaji Pokok</label>
          <input type="number" value={gajiPokok} onChange={e => onUpdate('gajiPokok', parseInt(e.target.value) || 0)}
            className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">Tanggal Terima Gaji (tanggal)</label>
          <input type="number" min="1" max="31" value={a.tanggalTerimaGaji || '25'} onChange={e => onUpdate('tanggalTerimaGaji', e.target.value)}
            placeholder="25" className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
        </div>
      </div>

      {/* Tunjangan Tetap */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-muted-foreground">Tunjangan Tetap</span>
          <button onClick={() => addItem('tunjanganTetap')} className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400">+ Tambah</button>
        </div>
        {tunjanganTetap.map((t, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input value={t.label} onChange={e => updateItem('tunjanganTetap', i, 'label', e.target.value)}
              placeholder="Nama tunjangan" className="flex-1 bg-background/50 border border-border rounded px-2 py-1 text-[10px]" />
            <input type="number" value={t.amount} onChange={e => updateItem('tunjanganTetap', i, 'amount', e.target.value)}
              placeholder="Jumlah" className="w-24 bg-background/50 border border-border rounded px-2 py-1 text-[10px]" />
            <button onClick={() => removeItem('tunjanganTetap', i)} className="text-red-400 text-[10px] px-1">✕</button>
          </div>
        ))}
      </div>

      {/* Tunjangan Variabel */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-muted-foreground">Tunjangan Variabel</span>
          <button onClick={() => addItem('tunjanganVariabel')} className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400">+ Tambah</button>
        </div>
        {tunjanganVariabel.map((t, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input value={t.label} onChange={e => updateItem('tunjanganVariabel', i, 'label', e.target.value)}
              placeholder="Nama tunjangan" className="flex-1 bg-background/50 border border-border rounded px-2 py-1 text-[10px]" />
            <input type="number" value={t.amount} onChange={e => updateItem('tunjanganVariabel', i, 'amount', e.target.value)}
              placeholder="Jumlah" className="w-24 bg-background/50 border border-border rounded px-2 py-1 text-[10px]" />
            <button onClick={() => removeItem('tunjanganVariabel', i)} className="text-red-400 text-[10px] px-1">✕</button>
          </div>
        ))}
      </div>

      {/* Potongan */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-muted-foreground">Potongan</span>
          <button onClick={() => addItem('potongan')} className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400">+ Tambah</button>
        </div>
        {potongan.map((p, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input value={p.label} onChange={e => updateItem('potongan', i, 'label', e.target.value)}
              placeholder="Nama potongan (BPJS, Pajak, dll)" className="flex-1 bg-background/50 border border-border rounded px-2 py-1 text-[10px]" />
            <input type="number" value={p.amount} onChange={e => updateItem('potongan', i, 'amount', e.target.value)}
              placeholder="Jumlah" className="w-24 bg-background/50 border border-border rounded px-2 py-1 text-[10px]" />
            <button onClick={() => removeItem('potongan', i)} className="text-red-400 text-[10px] px-1">✕</button>
          </div>
        ))}
      </div>

      {/* Kop Surat Editor */}
      <div>
        <label className="text-[9px] text-muted-foreground">Kop Surat (bisa paste dari Word/Google Docs, termasuk logo)</label>
        <textarea value={a.kopSurat || ''} onChange={e => onUpdate('kopSurat', e.target.value)}
          placeholder="Paste kop surat perusahaan di sini (dari Word/Google Docs)..."
          className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs min-h-[60px]" />
        <p className="text-[8px] text-muted-foreground mt-0.5">Tip: Copy dari Word/Google Docs → paste di sini. Logo & formatting akan ikut.</p>
      </div>
    </div>
  )
}
