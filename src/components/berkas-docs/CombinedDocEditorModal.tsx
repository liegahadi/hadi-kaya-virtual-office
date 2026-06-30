'use client'
// COMBINED DOC EDITOR MODAL (Google Docs API + Service Account)
// REAL Google Docs editor embedded inside our system
//
// Flow:
// 1. User picks template (.docx files in /public/templates/combined/)
// 2. Click "Create Google Doc" → POST /api/documents/google-docs/create
//    → Server uploads .docx to Drive, converts to Google Doc, fills placeholders,
//      sets "anyone with link can edit" permission
// 3. Embed Google Doc in iframe (https://docs.google.com/document/d/{id}/edit?rm=minimal)
//    — User edits directly in Google Docs editor (inside our modal)
//    — Changes auto-save to Google Drive
// 4. "Download .docx" button → GET /api/documents/google-docs/[id]/download
//    → Server exports Google Doc as .docx via Drive API
import React, { useState, useEffect } from 'react'
import { X, Download, FileText, ChevronLeft, Search, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BerkasState } from '@/lib/berkas/types'

interface CombinedDocEditorModalProps {
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

interface CreatedDoc {
  docId: string
  fileName: string
  editUrl: string
  embedUrl: string
  downloadUrl: string
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

export function CombinedDocEditorModal({ open, onClose, state }: CombinedDocEditorModalProps) {
  const [view, setView] = useState<'templates' | 'editor'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [createdDoc, setCreatedDoc] = useState<CreatedDoc | null>(null)
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [iframeKey, setIframeKey] = useState(0) // for refresh

  // Check if Google Service Account is configured
  useEffect(() => {
    if (open) {
      fetch('/api/documents/google-docs/status')
        .then(r => r.json())
        .then(d => setGoogleConfigured(d.configured))
        .catch(() => setGoogleConfigured(false))
    }
  }, [open])

  // Create a Google Doc from template + form data
  async function handleCreateDoc(template: TemplateInfo) {
    setCreating(true)
    setSelectedTemplate(template)
    try {
      const res = await fetch('/api/documents/google-docs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templatePath: template.filePath,
          state,
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || `HTTP ${res.status}`)

      setCreatedDoc({
        docId: d.docId,
        fileName: d.fileName,
        editUrl: d.editUrl,
        embedUrl: d.embedUrl,
        downloadUrl: d.downloadUrl,
      })
      setView('editor')
      toast.success(`Google Doc berhasil dibuat dari template "${template.name}"!`)
    } catch (err) {
      toast.error('Gagal buat Google Doc: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setCreating(false)
    }
  }

  // Download as .docx
  async function handleDownload() {
    if (!createdDoc) return
    setDownloading(true)
    try {
      const res = await fetch(createdDoc.downloadUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${createdDoc.fileName}.docx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Dokumen berhasil di-download (.docx)!')
    } catch (err) {
      toast.error('Gagal download: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setDownloading(false)
    }
  }

  // Back to template picker
  function handleBackToTemplates() {
    setView('templates')
    setCreatedDoc(null)
    setSelectedTemplate(null)
  }

  // Refresh iframe (if user wants to reload the Google Doc)
  function handleRefreshIframe() {
    setIframeKey(k => k + 1)
  }

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  if (!open) return null

  // Show configuration warning if Google Service Account is not set
  if (googleConfigured === false) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
        <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-lg" style={{ colorScheme: 'light' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-800">Setup Google Service Account</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-amber-800 mb-2">Google Service Account belum dikonfigurasi</h3>
              <p className="text-xs text-amber-700 mb-3">Untuk pakai editor Google Docs, kamu perlu:</p>
              <ol className="list-decimal list-inside text-xs text-amber-700 space-y-1">
                <li>Buat Google Cloud Project di <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.cloud.google.com</a></li>
                <li>Enable <strong>Google Drive API</strong> dan <strong>Google Docs API</strong></li>
                <li>Buat <strong>Service Account</strong> → download JSON credentials</li>
                <li>Set env vars di Vercel:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> = email service account</li>
                    <li><code className="bg-amber-100 px-1 rounded">GOOGLE_PRIVATE_KEY</code> = private key (dengan \n untuk newlines)</li>
                  </ul>
                </li>
                <li>Redeploy di Vercel</li>
              </ol>
            </div>
            <p className="text-xs text-slate-600">
              Setelah dikonfigurasi, fitur ini akan langsung jalan. Service Account akan membuat Google Doc baru untuk setiap konsumen,
              isi placeholder otomatis, dan user bisa edit langsung di editor Google Docs yang di-embed di sistem ini.
            </p>
          </div>
          <div className="border-t bg-white px-5 py-3 flex justify-end shrink-0">
            <button onClick={onClose} className="px-4 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300">Tutup</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white text-slate-900 w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden" style={{ colorScheme: 'light' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            {view === 'editor' && (
              <button
                onClick={handleBackToTemplates}
                className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                title="Kembali ke pilihan template"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-800">
                Editor Google Docs (SK Kerja + Slip Gaji)
                {selectedTemplate && view === 'editor' && (
                  <span className="ml-2 text-xs font-normal text-slate-500">· {selectedTemplate.name}</span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'editor' && createdDoc && (
              <>
                <button
                  onClick={handleRefreshIframe}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                  title="Refresh editor"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <a
                  href={createdDoc.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 flex items-center gap-1.5"
                  title="Buka di Google Docs (tab baru)"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Docs
                </a>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {downloading ? 'Exporting...' : 'Download .docx'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Tutup">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Picker View */}
        {view === 'templates' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            <div className="p-4 border-b bg-white">
              <div className="flex gap-3 items-center mb-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari template..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-cyan-500 text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">{filteredTemplates.length} dari {TEMPLATES.length} template</div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={cn('px-3 py-1 text-xs rounded-full border', activeCategory === 'all' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500')}
                >Semua</button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn('px-3 py-1 text-xs rounded-full border', activeCategory === cat ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500')}
                  >{cat}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateDoc(template)}
                    disabled={creating}
                    className="group bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-cyan-500 hover:shadow-md transition-all disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-cyan-600">{template.name}</h3>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{template.category}</span>
                      </div>
                      {creating && selectedTemplate?.id === template.id ? (
                        <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-300 group-hover:text-cyan-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{template.description}</p>
                    <div className="mt-3 text-[10px] text-cyan-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {creating && selectedTemplate?.id === template.id ? 'Membuat Google Doc...' : 'Klik untuk buat & edit di Google Docs →'}
                    </div>
                  </button>
                ))}
              </div>
              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">Tidak ada template yang cocok.</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-white text-[11px] text-slate-600 space-y-1">
              <p>📄 <strong>1 file = SK Kerja + 7 Slip Gaji</strong> (kop surat sama, langsung rapi)</p>
              <p>🎨 Klik template → buka Google Doc baru (auto-isi data form) → edit langsung di Google Docs (font, ukuran, layout, paste logo) → download .docx</p>
            </div>
          </div>
        )}

        {/* Editor View (Google Docs embedded) */}
        {view === 'editor' && createdDoc && (
          <div className="flex-1 overflow-hidden bg-slate-100">
            <iframe
              key={iframeKey}
              src={createdDoc.embedUrl}
              className="w-full h-full border-0"
              title="Google Docs Editor"
              allow="fullscreen"
            />
          </div>
        )}
      </div>
    </div>
  )
}
