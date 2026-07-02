'use client'
// COMPACT TEMPLATE BUTTON + POPOVER - For action bar
// Shows a small button in the action bar; clicking opens a popover with full template UI
import React, { useRef, useState, useEffect } from 'react'
import { Upload, FileText, Download, Loader2, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TemplatePopoverProps {
  docType: 'sk-kerja' | 'slip-gaji'
  templateDataUrl: string | null
  onTemplateUpload: (dataUrl: string | null) => void
}

const SAMPLE_LINKS: Record<string, string> = {
  'sk-kerja': '/templates/samples/template-SK-Kerja.docx',
  'slip-gaji': '/templates/samples/template-Slip-Gaji.docx',
}

const LABELS: Record<string, string> = {
  'sk-kerja': 'SK Kerja',
  'slip-gaji': 'Slip Gaji',
}

const PLACEHOLDERS: Record<string, Array<{ tag: string; desc: string }>> = {
  'sk-kerja': [
    { tag: '{nama}', desc: 'Nama lengkap pemohon' },
    { tag: '{nik}', desc: 'NIK KTP' },
    { tag: '{tempat_lahir}', desc: 'Tempat lahir' },
    { tag: '{tanggal_lahir}', desc: 'Tanggal lahir (1 Januari 1990)' },
    { tag: '{jabatan}', desc: 'Jabatan' },
    { tag: '{perusahaan}', desc: 'Nama perusahaan' },
    { tag: '{alamat_perusahaan}', desc: 'Alamat perusahaan' },
    { tag: '{gaji}', desc: 'Gaji per bulan (Rp. ...,-)' },
    { tag: '{lama_bekerja}', desc: 'Lama bekerja (tahun)' },
    { tag: '{tanggal}', desc: 'Tanggal dokumen' },
    { tag: '{kota}', desc: 'Kota (Pangkalpinang)' },
    { tag: '{atasan}', desc: 'Nama atasan' },
    { tag: '{nip_atasan}', desc: 'NIP atasan' },
  ],
  'slip-gaji': [
    { tag: '{nama}', desc: 'Nama karyawan' },
    { tag: '{nik}', desc: 'NIK' },
    { tag: '{jabatan}', desc: 'Jabatan' },
    { tag: '{perusahaan}', desc: 'Perusahaan' },
    { tag: '{periode}', desc: 'Periode slip (Januari 2025)' },
    { tag: '{tanggal_terima}', desc: 'Tanggal terima gaji' },
    { tag: '{gaji_pokok}', desc: 'Gaji pokok (Rp. ...,-)' },
    { tag: '{total_tunjangan_tetap}', desc: 'Total tunjangan tetap' },
    { tag: '{total_tunjangan_variabel}', desc: 'Total tunjangan variabel' },
    { tag: '{total_potongan}', desc: 'Total potongan' },
    { tag: '{gaji_kotor}', desc: 'Gaji kotor' },
    { tag: '{gaji_bersih}', desc: 'Gaji diterima (bersih)' },
    { tag: '{#tunjangan_tetap}...{/tunjangan_tetap}', desc: 'Loop tunjangan tetap ({label}, {amount})' },
    { tag: '{#tunjangan_variabel}...{/tunjangan_variabel}', desc: 'Loop tunjangan variabel' },
    { tag: '{#potongan}...{/potongan}', desc: 'Loop potongan' },
    { tag: '{#slips}...{/slips}', desc: 'Loop 7 slip (auto 6 bln ke belakang + 1 depan)' },
  ],
}

export function TemplatePopover({ docType, templateDataUrl, onTemplateUpload }: TemplatePopoverProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isUploaded = !!templateDataUrl
  const label = LABELS[docType]

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error('File harus .docx (Word document)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File terlalu besar (max 5MB)')
      return
    }
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
      onTemplateUpload(dataUrl)
      toast.success(`Template ${label} berhasil diupload!`)
    } catch {
      toast.error('Gagal upload template')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    onTemplateUpload(null)
    toast.info(`Template ${label} dihapus`)
  }

  function handleDownloadSample() {
    const link = document.createElement('a')
    link.href = SAMPLE_LINKS[docType]
    link.download = docType === 'sk-kerja' ? 'template-SK-Kerja.docx' : 'template-Slip-Gaji.docx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="relative">
      {/* Compact button in action bar */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors h-8',
          isUploaded
            ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
        )}
        title={isUploaded ? `Template ${label} terupload - klik untuk edit` : `Upload template ${label}`}
      >
        <FileText className="w-3 h-3" />
        <span>{label}</span>
        {isUploaded ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute top-full mt-1 right-0 z-50 w-80 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-xl p-3 space-y-2.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              <h4 className="text-xs font-bold">Template {label} (.docx)</h4>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status */}
          {isUploaded ? (
            <div className="flex items-center gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="flex-1 text-[10px] text-emerald-700 dark:text-emerald-300">Template terupload & siap dipakai</span>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Upload template .docx dari perusahaan tempat kerja konsumen. Setiap perusahaan bisa punya template berbeda (kop surat, layout, logo). Sistem akan isi otomatis dengan data dari form.
            </p>
          )}

          {/* Upload area */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-cyan-500/30 rounded-md p-3 text-center cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                <span className="text-[10px] text-muted-foreground">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-4 h-4 text-cyan-500 mb-0.5" />
                <p className="text-[10px] font-medium">
                  {isUploaded ? 'Ganti template' : 'Klik untuk upload .docx'}
                </p>
                <p className="text-[9px] text-muted-foreground">Word document</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={handleDownloadSample}
              className="flex-1 text-[10px] px-2 py-1.5 rounded border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3" /> Sample
            </button>
            <button
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className={cn(
                'flex-1 text-[10px] px-2 py-1.5 rounded border flex items-center justify-center gap-1',
                showPlaceholders
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-foreground'
                  : 'border-slate-400/40 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <Info className="w-3 h-3" /> Placeholders
            </button>
            {isUploaded && (
              <button
                onClick={handleRemove}
                className="text-[10px] px-2 py-1.5 rounded border border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Placeholder list */}
          {showPlaceholders && (
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700/40">
              <p className="text-[9px] text-slate-500 mb-1 font-bold uppercase">Placeholder tersedia:</p>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {PLACEHOLDERS[docType].map(ph => (
                  <div key={ph.tag} className="flex gap-2 text-[9px] leading-tight">
                    <code className="text-cyan-600 dark:text-cyan-400 font-mono shrink-0">{ph.tag}</code>
                    <span className="text-muted-foreground">{ph.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-amber-600/80 dark:text-amber-400/70 mt-1.5 leading-relaxed">
                Tip: Download sample → edit di Word/Google Docs (ganti kop surat, layout, logo) → upload ulang.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
