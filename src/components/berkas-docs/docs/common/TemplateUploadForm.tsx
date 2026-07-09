'use client'
// TEMPLATE UPLOAD FORM - For SK Kerja & Slip Gaji
// User uploads .docx template with placeholders, system fills with form data
// Each workplace can have its OWN template → different layout per company
import React, { useRef, useState } from 'react'
import { Upload, FileText, Download, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TemplateUploadFormProps {
  docType: 'sk-kerja' | 'slip-gaji'
  templateDataUrl: string | null  // base64 data URL of uploaded .docx
  onTemplateUpload: (dataUrl: string | null) => void
}

const SAMPLE_LINKS: Record<string, string> = {
  'sk-kerja': '/templates/samples/template-SK-Kerja.docx',
  'slip-gaji': '/templates/samples/template-Slip-Gaji.docx',
}

const TITLES: Record<string, string> = {
  'sk-kerja': 'Template SK Kerja (.docx)',
  'slip-gaji': 'Template Slip Gaji (.docx)',
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
    { tag: '{#tunjangan_tetap}...{/}', desc: 'Loop tunjangan tetap ({label}, {amount})' },
    { tag: '{#tunjangan_variabel}...{/}', desc: 'Loop tunjangan variabel' },
    { tag: '{#potongan}...{/}', desc: 'Loop potongan' },
    { tag: '{#slips}...{/slips}', desc: 'Loop 7 slip (auto-generate 6 bln ke belakang + 1 depan)' },
  ],
}

export function TemplateUploadForm({ docType, templateDataUrl, onTemplateUpload }: TemplateUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const isUploaded = !!templateDataUrl

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
      toast.success(`Template ${docType === 'sk-kerja' ? 'SK Kerja' : 'Slip Gaji'} berhasil diupload!`)
    } catch (err) {
      toast.error('Gagal upload template')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    onTemplateUpload(null)
    toast.info('Template dihapus')
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
    <div className={cn(
      'space-y-3 p-3 rounded-lg border',
      isUploaded ? 'border-cyan-700/40 bg-cyan-950/10' : 'border-cyan-500/30 bg-cyan-950/5'
    )}>
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
          <FileText className="w-3 h-3" /> {TITLES[docType]}
        </h4>
        {isUploaded && (
          <span className="flex items-center gap-1 text-[9px] text-emerald-400">
            <CheckCircle2 className="w-2.5 h-2.5" /> Siap
          </span>
        )}
      </div>

      {!isUploaded ? (
        <div className="space-y-2">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-cyan-500/30 rounded-lg p-4 text-center cursor-pointer hover:bg-cyan-950/20 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <p className="text-[10px] text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                <p className="text-[10px] font-medium">Klik untuk upload .docx</p>
                <p className="text-[8px] text-muted-foreground">Template dari Word/Google Docs</p>
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

          <div className="flex gap-1">
            <button
              onClick={handleDownloadSample}
              className="flex-1 text-[9px] px-2 py-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20 flex items-center justify-center gap-1"
            >
              <Download className="w-2.5 h-2.5" /> Sample Template
            </button>
            <button
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="flex-1 text-[9px] px-2 py-1 rounded border border-slate-500/30 text-slate-400 hover:bg-slate-950/20 flex items-center justify-center gap-1"
            >
              <Info className="w-2.5 h-2.5" /> Placeholders
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground leading-relaxed">
            Upload template .docx dari perusahaan tempat kerja konsumen. Setiap perusahaan bisa punya template berbeda (kop surat, layout, dll). Sistem akan isi otomatis dengan data dari form.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/20 border border-emerald-700/30">
            <FileText className="w-3 h-3 text-emerald-400" />
            <span className="flex-1 text-[10px] text-emerald-300 truncate">Template terupload</span>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground"
            >
              Ganti
            </button>
            <button
              onClick={handleRemove}
              className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 hover:bg-red-950/20"
            >
              Hapus
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <button
            onClick={() => setShowPlaceholders(!showPlaceholders)}
            className="text-[9px] text-slate-400 hover:text-foreground flex items-center gap-1"
          >
            <Info className="w-2.5 h-2.5" /> Lihat daftar placeholders
          </button>
        </div>
      )}

      {showPlaceholders && (
        <div className="mt-2 p-2 rounded bg-slate-950/40 border border-slate-700/40">
          <p className="text-[8px] text-slate-400 mb-1.5 font-bold uppercase">Placeholder yang tersedia:</p>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {PLACEHOLDERS[docType].map(ph => (
              <div key={ph.tag} className="flex gap-2 text-[9px]">
                <code className="text-cyan-400 font-mono shrink-0">{ph.tag}</code>
                <span className="text-muted-foreground">{ph.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-amber-400/70 mt-1.5 leading-relaxed">
            Tip: Download sample template, edit di Word/Google Docs (ganti kop surat, layout, logo), lalu upload ulang.
          </p>
        </div>
      )}
    </div>
  )
}
