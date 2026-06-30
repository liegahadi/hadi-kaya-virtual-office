'use client'
// COMBINED DOC DOWNLOAD MODAL
// Modal for downloading SK Kerja + Slip Gaji as real .docx file
// User downloads .docx → opens in Google Docs / Word → edits → saves → uploads back
//
// Flow:
// 1. Pick template (10 styles)
// 2. Click "Download .docx" → API fills placeholders with form data → returns filled .docx
// 3. Open .docx in Google Docs (user uploads to Drive first) or Word
import React, { useState } from 'react'
import { X, Download, FileText, ChevronLeft, Search, ExternalLink, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BerkasState } from '@/lib/berkas/types'

interface CombinedDocDownloadModalProps {
  open: boolean
  onClose: () => void
  state: BerkasState
}

interface TemplateInfo {
  id: string
  name: string
  category: string
  description: string
  filePath: string
}

const TEMPLATES: TemplateInfo[] = [
  { id: 'formal', name: 'Standard Formal', category: 'Umum', description: 'Format formal standar - kop surat dengan border, tabel rapih', filePath: '/templates/combined/template-formal.docx' },
  { id: 'modern', name: 'Modern Tech', category: 'Tech/Startup', description: 'Layout modern dengan accent biru, cocok untuk perusahaan teknologi', filePath: '/templates/combined/template-modern.docx' },
  { id: 'pemerintah', name: 'Instansi Pemerintah', category: 'Pemerintahan', description: 'Format khas surat dinas pemerintahan', filePath: '/templates/combined/template-pemerintah.docx' },
  { id: 'bank', name: 'Bank / Keuangan', category: 'Perbankan', description: 'Format untuk karyawan bank dengan kop surat formal navy', filePath: '/templates/combined/template-bank.docx' },
  { id: 'rs', name: 'Rumah Sakit', category: 'Kesehatan', description: 'Format untuk karyawan RS dengan kop medis merah', filePath: '/templates/combined/template-rs.docx' },
  { id: 'mining', name: 'Pertambangan', category: 'Mining', description: 'Format karyawan tambang dengan header coklat', filePath: '/templates/combined/template-mining.docx' },
  { id: 'hotel', name: 'Perhotelan', category: 'Hospitality', description: 'Format karyawan hotel dengan style elegan italic', filePath: '/templates/combined/template-hotel.docx' },
  { id: 'retail', name: 'Retail / Supermarket', category: 'Retail', description: 'Format karyawan retail dengan accent oranye', filePath: '/templates/combined/template-retail.docx' },
  { id: 'konstruksi', name: 'Konstruksi', category: 'Konstruksi', description: 'Format karyawan konstruksi dengan header dark', filePath: '/templates/combined/template-konstruksi.docx' },
  { id: 'informal', name: 'Warung / Toko / Kafe (Informal)', category: 'Informal', description: 'Format sederhana untuk warung, toko sembako, kafe kecil - pakai "Upah" bukan "Gaji"', filePath: '/templates/combined/template-informal.docx' },
]

const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))]

export function CombinedDocDownloadModal({ open, onClose, state }: CombinedDocDownloadModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  async function handleDownload(template: TemplateInfo) {
    setDownloading(true)
    setDownloaded(false)
    try {
      // Fetch template file from public folder
      const templateRes = await fetch(template.filePath)
      if (!templateRes.ok) throw new Error('Gagal load template file')
      const templateBlob = await templateRes.blob()

      // Build form data for API
      const fd = new FormData()
      fd.append('template', templateBlob, `template-${template.id}.docx`)
      fd.append('docType', 'combined')  // new docType for combined SK+Slip
      fd.append('state', JSON.stringify(state))

      // Call fill-docx-template API
      const res = await fetch('/api/documents/fill-docx-template', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }

      const filledBlob = await res.blob()
      const url = URL.createObjectURL(filledBlob)
      const a = document.createElement('a')
      a.href = url
      const fileName = `SK_Slip_Gaji_${state.applicant.fullName || 'Konsumen'}_${template.id}_${new Date().toISOString().split('T')[0]}.docx`
      a.download = fileName
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setDownloaded(true)
      setSelectedTemplate(template)
      toast.success(`Template "${template.name}" berhasil di-download (.docx)!`)
    } catch (err) {
      toast.error('Gagal download: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setDownloading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white text-slate-900 w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden" style={{ colorScheme: 'light' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-800">
              Download SK Kerja + Slip Gaji (.docx)
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {/* Info banner */}
          <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-[11px] text-cyan-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Cara pakai:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Pilih template sesuai jenis tempat kerja konsumen</li>
                <li>Klik <strong>"Download .docx"</strong> — file Word terisi otomatis dengan data form (SK + 7 Slip Gaji)</li>
                <li>Buka file di <strong>Google Docs</strong> (upload ke Google Drive → klik kanan → Open with → Google Docs) atau <strong>Microsoft Word</strong></li>
                <li>Edit kop surat (paste logo, ubah layout) sesuai perusahaan</li>
                <li>Simpan & kirim ke bank</li>
              </ol>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mb-4 flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari template..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-cyan-500 text-slate-900"
              />
            </div>
            <div className="text-sm text-slate-600">
              {filteredTemplates.length} dari {TEMPLATES.length} template
            </div>
          </div>

          {/* Category filter */}
          <div className="mb-4 flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-3 py-1 text-xs rounded-full border',
                activeCategory === 'all'
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500'
              )}
            >
              Semua
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border',
                  activeCategory === cat
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map(template => {
              const isDownloaded = downloaded && selectedTemplate?.id === template.id
              return (
                <div
                  key={template.id}
                  className={cn(
                    'bg-white border rounded-lg p-4 flex flex-col',
                    isDownloaded ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{template.name}</h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{template.category}</span>
                    </div>
                    {isDownloaded && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3 mb-3 flex-1">{template.description}</p>
                  <button
                    onClick={() => handleDownload(template)}
                    disabled={downloading}
                    className={cn(
                      'w-full text-xs px-3 py-2 rounded flex items-center justify-center gap-1.5 disabled:opacity-50',
                      isDownloaded
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    )}
                  >
                    {downloading && selectedTemplate?.id === template.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : isDownloaded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Download lagi
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Download .docx
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Tidak ada template yang cocok.</p>
            </div>
          )}

          {/* After download: instructions */}
          {downloaded && selectedTemplate && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded-lg">
              <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> File .docx berhasil di-download!
              </h3>
              <p className="text-[11px] text-emerald-700 mb-3">Sekarang buka file di Google Docs atau Word untuk edit:</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 bg-white border border-emerald-300 rounded text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Google Drive
                </a>
                <a
                  href="https://docs.google.com/document/u/0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 bg-white border border-emerald-300 rounded text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Google Docs
                </a>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2">
                💡 Di Google Drive: klik <strong>"+ New → File upload"</strong> → pilih file .docx yang baru di-download → klik kanan → <strong>"Open with → Google Docs"</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-white px-5 py-3 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            📄 File berisi: <strong>SK Kerja (1 halaman) + 7 Slip Gaji</strong> (6 bulan ke belakang + current) — kop surat sama semua
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
