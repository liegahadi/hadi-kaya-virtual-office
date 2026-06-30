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
  // State: null = loading, 'oauth-connected' = OK, 'oauth-not-connected' = need login, 'oauth-not-configured' = need setup, 'service-account' = legacy fallback
  const [googleStatus, setGoogleStatus] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<{ email?: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [iframeKey, setIframeKey] = useState(0) // for refresh

  // Check Google connection status
  useEffect(() => {
    if (open) {
      fetch('/api/documents/google-docs/status')
        .then(r => r.json())
        .then(d => {
          setAccountInfo(d.account)
          if (d.oauthConfigured && d.connected) {
            setGoogleStatus('oauth-connected')
          } else if (d.oauthConfigured && !d.connected) {
            setGoogleStatus('oauth-not-connected')
          } else if (d.oauthConfigured === false && d.serviceAccountConfigured) {
            setGoogleStatus('service-account')
          } else {
            setGoogleStatus('oauth-not-configured')
          }
        })
        .catch(() => setGoogleStatus('oauth-not-configured'))
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

  // Show configuration warning if Google OAuth not set up yet
  if (googleStatus === 'oauth-not-configured') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
        <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-lg" style={{ colorScheme: 'light' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-800">Setup Google OAuth</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-amber-800 mb-2">Google OAuth belum dikonfigurasi</h3>
              <p className="text-xs text-amber-700 mb-3">Untuk pakai editor Google Docs, kamu perlu:</p>
              <ol className="list-decimal list-inside text-xs text-amber-700 space-y-1.5">
                <li>Buka <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Cloud Console</a> (project yang sama dengan Service Account)</li>
                <li>Enable <strong>Google Drive API</strong> dan <strong>Google Docs API</strong> (kalau belum)</li>
                <li>Menu <strong>OAuth consent screen</strong> → User Type: External → isi nama app, email → Save</li>
                <li>Menu <strong>Credentials → Create Credentials → OAuth client ID</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Application type: <strong>Web application</strong></li>
                    <li>Authorized redirect URIs: <code className="bg-amber-100 px-1 rounded text-[10px]">https://hadi-kaya-virtual-office.vercel.app/api/auth/google/callback</code></li>
                  </ul>
                </li>
                <li>Set env vars di Vercel:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-amber-100 px-1 rounded">GOOGLE_OAUTH_CLIENT_ID</code> = Client ID dari step 4</li>
                    <li><code className="bg-amber-100 px-1 rounded">GOOGLE_OAUTH_CLIENT_SECRET</code> = Client Secret dari step 4</li>
                  </ul>
                </li>
                <li>Redeploy di Vercel</li>
                <li>Buka modal ini lagi → klik tombol <strong>"Connect Google Drive"</strong> → login dengan Google kamu</li>
              </ol>
            </div>
            <p className="text-xs text-slate-600">
              Setelah login sekali, sistem bisa auto-save semua dokumen konsumen (SK Kerja, Slip Gaji, SPR, FLPP, dll) ke Google Drive kamu.
              File tersimpan permanen, bisa di-organize per folder, dan bisa di-share ke bank.
            </p>
          </div>
          <div className="border-t bg-white px-5 py-3 flex justify-end shrink-0">
            <button onClick={onClose} className="px-4 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300">Tutup</button>
          </div>
        </div>
      </div>
    )
  }

  // Show "Connect Google Drive" prompt if OAuth configured but owner hasn't logged in yet
  if (googleStatus === 'oauth-not-connected') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
        <div className="bg-white text-slate-900 w-full max-w-md flex flex-col overflow-hidden rounded-lg" style={{ colorScheme: 'light' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-800">Connect Google Drive</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#0891b2" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 7l10 5 10-5" stroke="#0891b2" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 22V12" stroke="#0891b2" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Login Google untuk mulai</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Login sekali dengan Google account kamu. Sistem akan simpan token di database,
              lalu bisa auto-create & edit dokumen langsung di Google Docs.
              <br/><br/>
              File tersimpan di <strong>Google Drive kamu</strong> (pakai storage quota kamu 15GB).
            </p>
            <a
              href="/api/auth/google/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Google Drive
            </a>
            <p className="text-[10px] text-slate-500 mt-4">
              Dengan klik tombol di atas, kamu akan diarahkan ke halaman login Google.
              Setelah login, kamu akan kembali otomatis ke halaman ini.
            </p>
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
              {accountInfo?.email && (
                <span className="ml-2 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  📧 {accountInfo.email}
                </span>
              )}
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
