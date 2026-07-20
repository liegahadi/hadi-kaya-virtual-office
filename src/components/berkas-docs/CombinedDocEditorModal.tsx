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
import { X, Download, FileText, ChevronLeft, Search, ExternalLink, Loader2, AlertCircle, RefreshCw, Plus, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BerkasState, ApplicantData, JobType } from '@/lib/berkas/types'
import { LogoGenerator } from '@/components/berkas-docs/LogoGenerator'

interface CombinedDocEditorModalProps {
  open: boolean
  onClose: () => void
  state: BerkasState
  customerId?: string
  onUpdate?: (field: keyof ApplicantData, val: any) => void  // For Slip Gaji form edits
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
  { id: '01', name: 'Standard Formal', category: 'Umum', description: 'Layout standar formal - font Times New Roman, tab stops rapih', filePath: '/templates/combined/template-01.docx' },
  { id: '02', name: 'Modern Minimalis', category: 'Umum', description: 'Layout modern minimalis - font Arial', filePath: '/templates/combined/template-02.docx' },
  { id: '03', name: 'Sederhana', category: 'Warung/UMKM', description: 'Sangat sederhana - cocok untuk warung, warkop. Font Calibri', filePath: '/templates/combined/template-03.docx' },
  { id: '04', name: 'Kop Boxed', category: 'Warung/UMKM', description: 'Layout dengan kotak kop - font Tahoma. Untuk toko sembako', filePath: '/templates/combined/template-04.docx' },
  { id: '05', name: 'Accent Hijau', category: 'Kafe/Restoran', description: 'Accent hijau segar - font Georgia. Untuk kafe/restoran', filePath: '/templates/combined/template-05.docx' },
  { id: '06', name: 'Accent Oranye', category: 'Jasa Service', description: 'Accent oranye energik - font Verdana. Untuk bengkel/jasa', filePath: '/templates/combined/template-06.docx' },
  { id: '07', name: 'Formal Double Border', category: 'Perusahaan', description: 'Formal dengan border ganda - font Cambria. Untuk CV/PT', filePath: '/templates/combined/template-07.docx' },
  { id: '08', name: 'Accent Ungu', category: 'Jasa Beauty', description: 'Accent ungu - font Arial. Untuk salon/barbershop', filePath: '/templates/combined/template-08.docx' },
  { id: '09', name: 'Simple Underline', category: 'Personal', description: 'Simple dengan underline - font Times New Roman. Untuk perorangan', filePath: '/templates/combined/template-09.docx' },
  { id: '10', name: 'Accent Coklat', category: 'Toko', description: 'Accent coklat tanah - font Georgia. Untuk toko bangunan', filePath: '/templates/combined/template-10.docx' },
  { id: '11', name: 'Gradient Oranye-Kuning', category: 'Warung/UMKM', description: 'Gradient oranye-kuning - font Calibri. Untuk warung makan', filePath: '/templates/combined/template-11.docx' },
  { id: '12', name: 'Klasik Italic', category: 'Hotel', description: 'Klasik italic - font Georgia. Untuk hotel/penginapan', filePath: '/templates/combined/template-12.docx' },
  { id: '13', name: 'Accent Merah', category: 'Kafe/Restoran', description: 'Accent merah - font Arial. Untuk rumah makan', filePath: '/templates/combined/template-13.docx' },
  { id: '14', name: 'Minimal No Color', category: 'Jasa Service', description: 'Minimal tanpa warna - font Tahoma. Untuk jasa service', filePath: '/templates/combined/template-14.docx' },
  { id: '15', name: 'Accent Navy', category: 'Perbankan', description: 'Accent navy biru - font Calibri. Untuk bank/keuangan', filePath: '/templates/combined/template-15.docx' },
  { id: '16', name: 'Accent Cyan', category: 'Jasa Service', description: 'Accent cyan - font Arial. Untuk jasa service AC/elektronik', filePath: '/templates/combined/template-16.docx' },
  { id: '17', name: 'Accent Pink', category: 'Jasa Beauty', description: 'Accent pink - font Georgia. Untuk MUA/jasa kecantikan', filePath: '/templates/combined/template-17.docx' },
  { id: '18', name: 'Accent Dark Gold', category: 'Konstruksi', description: 'Accent dark gold - font Cambria. Untuk konstruksi', filePath: '/templates/combined/template-18.docx' },
  { id: '19', name: 'Accent Forest Green', category: 'Agribisnis', description: 'Accent forest green - font Times New Roman. Untuk pertanian', filePath: '/templates/combined/template-19.docx' },
  { id: '20', name: 'Accent Burgundy', category: 'Fashion', description: 'Accent burgundy - font Georgia. Untuk fashion/konveksi', filePath: '/templates/combined/template-20.docx' },
  { id: '21', name: 'Warung Sembako', category: 'Warung/UMKM', description: 'Khusus warung sembako - sederhana, pakai "Upah"', filePath: '/templates/combined/template-21.docx' },
  { id: '22', name: 'Toko Kelontong', category: 'Warung/UMKM', description: 'Khusus toko kelontong - accent coklat', filePath: '/templates/combined/template-22.docx' },
  { id: '23', name: 'Kafe Coffee Shop', category: 'Kafe/Restoran', description: 'Khusus kafe/coffee shop - accent hijau italic', filePath: '/templates/combined/template-23.docx' },
  { id: '24', name: 'Barbershop Salon', category: 'Jasa', description: 'Khusus barbershop/salon - accent dark elegant', filePath: '/templates/combined/template-24.docx' },
  { id: '25', name: 'Laundry', category: 'Jasa', description: 'Khusus laundry - accent biru muda', filePath: '/templates/combined/template-25.docx' },
  { id: '26', name: 'Online Shop', category: 'Online', description: 'Khusus online shop - accent ungu modern', filePath: '/templates/combined/template-26.docx' },
  { id: '27', name: 'Pabrik Manufaktur', category: 'Perusahaan', description: 'Khusus pabrik - accent dark, shift kerja', filePath: '/templates/combined/template-27.docx' },
  { id: '28', name: 'Minimarket Franchise', category: 'Retail', description: 'Khusus minimarket/franchise - accent merah', filePath: '/templates/combined/template-28.docx' },
  { id: '29', name: 'Startup Tech', category: 'Tech', description: 'Khusus startup - accent ungu casual', filePath: '/templates/combined/template-29.docx' },
  { id: '30', name: 'CV Profesional', category: 'Perusahaan', description: 'Khusus CV profesional - accent navy double border', filePath: '/templates/combined/template-30.docx' },
]

const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))]

// Helper: format number dengan titik ribuan (1000000 → "1.000.000")
function formatRibuan(n: number | string): string {
  const num = typeof n === "string" ? parseInt(n.replace(/\./g, "")) || 0 : n || 0
  if (!num) return ""
  return num.toLocaleString("de-DE")
}

// Helper: parse "1.000.000" → 1000000
function parseRibuan(s: string): number {
  return parseInt((s || "").replace(/\./g, "")) || 0
}

export function CombinedDocEditorModal({ open, onClose, state, customerId, onUpdate }: CombinedDocEditorModalProps) {
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
          customerId,
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

  // === SLIP GAJI PER BULAN (7 set) ===
  // State: 7 bulan, masing-masing dengan gaji pokok, tunjangan, potongan, bonus
  // IMPORTANT: Hooks harus dipanggil SEBELUM early return (React rules of hooks)
  const a = state.applicant as any
  const now = new Date()
  const bulanList: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 15)
    bulanList.push(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))
  }

  // Initialize slip data per bulan (dari state existing atau default)
  const [slipBulanan, setSlipBulanan] = useState<Array<{
    bulan: string
    tanggalTerima: number
    modePeriode: 'bulan-periode' | 'plus-1-bulan'
    gajiPokok: number
    tunjangan: Array<{ label: string; amount: number }>
    potongan: Array<{ label: string; amount: number }>
    bonus: Array<{ label: string; amount: number }>
  }>>(() => {
    const existing = a.slipBulanan
    if (existing && Array.isArray(existing) && existing.length === 7) return existing
    // Default: pakai data global
    const gajiPokokDefault = a.gajiPokok || a.monthlyIncome || 0
    const tunjanganDefault = a.tunjanganTetap || []
    const potonganDefault = a.potongan || []
    const bonusDefault = a.tunjanganVariabel || []
    const tanggalDefault = a.tanggalTerimaGaji ? parseInt(a.tanggalTerimaGaji) : 25
    return bulanList.map(bulan => ({
      bulan,
      tanggalTerima: tanggalDefault,
      modePeriode: 'bulan-periode' as const,
      gajiPokok: gajiPokokDefault,
      tunjangan: [...tunjanganDefault],
      potongan: [...potonganDefault],
      bonus: [...bonusDefault],
    }))
  })

  const [expandedBulan, setExpandedBulan] = useState<number>(0) // index bulan yang terbuka
  const [wirausahaMode, setWirausahaMode] = useState<'formbox' | 'ai'>('formbox') // default: formbox manual

  // Helper: update slip per bulan
  const updateSlipBulan = (idx: number, field: string, val: any) => {
    setSlipBulanan(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: val }
      return updated
    })
  }

  // Helper: add/remove/update items per bulan
  const addSlipItemBulan = (idx: number, type: 'tunjangan' | 'potongan' | 'bonus') => {
    setSlipBulanan(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [type]: [...updated[idx][type], { label: '', amount: 0 }] }
      return updated
    })
  }
  const updateSlipItemBulan = (idx: number, type: 'tunjangan' | 'potongan' | 'bonus', itemIdx: number, key: 'label' | 'amount', val: any) => {
    setSlipBulanan(prev => {
      const updated = [...prev]
      const items = [...updated[idx][type]]
      items[itemIdx] = { ...items[itemIdx], [key]: key === 'amount' ? parseInt(val) || 0 : val }
      updated[idx] = { ...updated[idx], [type]: items }
      return updated
    })
  }
  const removeSlipItemBulan = (idx: number, type: 'tunjangan' | 'potongan' | 'bonus', itemIdx: number) => {
    setSlipBulanan(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [type]: updated[idx][type].filter((_, i) => i !== itemIdx) }
      return updated
    })
  }

  // Apply bulan pertama ke semua bulan (copy data)
  const applyToAllBulan = () => {
    setSlipBulanan(prev => {
      const first = prev[0]
      return prev.map(slip => ({
        ...first,
        bulan: slip.bulan, // keep original bulan name
      }))
    })
    toast.success('Data bulan pertama diterapkan ke semua bulan!')
  }

  // Auto-calc per bulan
  const calcTotal = (slip: typeof slipBulanan[0]) => {
    const totalTunjangan = slip.tunjangan.reduce((s, t) => s + (t.amount || 0), 0)
    const totalPotongan = slip.potongan.reduce((s, p) => s + (p.amount || 0), 0)
    const totalBonus = slip.bonus.reduce((s, b) => s + (b.amount || 0), 0)
    const gajiKotor = slip.gajiPokok + totalTunjangan + totalBonus
    const gajiBersih = gajiKotor - totalPotongan
    return { totalTunjangan, totalPotongan, totalBonus, gajiKotor, gajiBersih }
  }

  const fmt = (n: number) => 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'

  // Sync slipBulanan ke state.applicant (untuk engine saat create doc)
  useEffect(() => {
    if (onUpdate) {
      onUpdate('slipBulanan' as keyof ApplicantData, slipBulanan as any)
      // Also sync global fields untuk backward compat dengan template-filler
      const first = slipBulanan[0]
      if (first) {
        onUpdate('gajiPokok' as keyof ApplicantData, first.gajiPokok as any)
        onUpdate('tunjanganTetap' as keyof ApplicantData, first.tunjangan as any)
        onUpdate('tunjanganVariabel' as keyof ApplicantData, first.bonus as any)
        onUpdate('potongan' as keyof ApplicantData, first.potongan as any)
        onUpdate('tanggalTerimaGaji' as keyof ApplicantData, String(first.tanggalTerima) as any)
      }
    }
  }, [slipBulanan])

  // === CACHE DOC ID per customer ===
  // Saat modal buka, cek apakah sudah ada Google Doc ID untuk customer ini
  useEffect(() => {
    if (open && customerId) {
      // Cek dari uploadedFiles (passed via state)
      const cachedDocId = (state.applicant as any).combinedDocId
      if (cachedDocId && !createdDoc) {
        // Ada cached doc — langsung buka editor
        setCreatedDoc({
          docId: cachedDocId,
          fileName: `SK_Slip_Gaji_${state.applicant.fullName || 'Konsumen'}`,
          editUrl: `https://docs.google.com/document/d/${cachedDocId}/edit`,
          embedUrl: `https://docs.google.com/document/d/${cachedDocId}/edit?rm=minimal&embedded=true`,
          downloadUrl: `/api/documents/google-docs/${cachedDocId}/download`,
        })
        setView('editor')
      }
    }
  }, [open, customerId])

  // Save doc ID ke state saat create doc berhasil
  const handleCreateDocCached = async (template: TemplateInfo) => {
    await handleCreateDoc(template)
    // Cache doc ID ke state
    if (createdDoc && onUpdate) {
      onUpdate('combinedDocId' as keyof ApplicantData, createdDoc.docId as any)
    }
  }

  // Early return AFTER all hooks (React rules of hooks)
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
              Klik tombol di atas → login Google → otomatis kembali ke halaman ini.
              <br/>
              <strong>Penting:</strong> Setelah login, refresh halaman ini (tekan F5) lalu buka modal lagi.
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
                  className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5 font-medium"
                  title="Buka di Google Docs (tab baru) - full editor dengan semua fitur"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Docs (Full Editor)
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

        {/* Template Picker View — auto-switch: karyawan → templates, wirausaha → AI/Formbox */}
        {view === 'templates' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {/* WIRAUSAHA: Toggle AI vs Formbox */}
            {state.applicant.jobType === JobType.ENTREPRENEUR ? (
              <>
              <div className="flex gap-1 p-2 bg-white border-b shrink-0">
                <button onClick={() => setWirausahaMode('formbox')}
                  className={cn('flex-1 px-3 py-1.5 rounded text-xs font-medium', wirausahaMode === 'formbox' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600')}>
                  📝 Formbox Manual
                </button>
                <button onClick={() => setWirausahaMode('ai')}
                  className={cn('flex-1 px-3 py-1.5 rounded text-xs font-medium', wirausahaMode === 'ai' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600')}>
                  🤖 AI Generate
                </button>
              </div>
              {wirausahaMode === 'formbox' ? (
                <WirausahaFormboxPanel state={state} customerId={customerId} onDocCreated={(doc) => {
                  setCreatedDoc(doc)
                  setView('editor')
                }} />
              ) : (
                <WirausahaAiPanel state={state} customerId={customerId} onDocCreated={(doc) => {
                  setCreatedDoc(doc)
                  setView('editor')
                }} />
              )}
              </>
            ) : (
            <>
            {/* KARYAWAN: Slip Gaji Per Bulan Form + Template Picker (side-by-side) */}
            <div className="flex flex-1 overflow-hidden min-h-0">
            <div className="w-[400px] border-r border-slate-200 bg-white overflow-y-auto shrink-0">
              <div className="p-3 border-b bg-emerald-50 sticky top-0 z-10">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Form Slip Gaji (7 Bulan)
                </h3>
                <p className="text-[10px] text-emerald-700 mt-0.5">Isi per bulan. Total auto-calc. Pilih template di kanan → generate.</p>
              </div>

              <div className="p-2 space-y-2">
                {slipBulanan.map((slip, idx) => {
                  const total = calcTotal(slip)
                  const isExpanded = expandedBulan === idx
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Accordion Header */}
                      <button
                        onClick={() => setExpandedBulan(isExpanded ? -1 : idx)}
                        className={cn('w-full flex items-center justify-between p-2 text-left transition-colors',
                          isExpanded ? 'bg-emerald-100' : 'bg-slate-50 hover:bg-slate-100')}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center',
                            isExpanded ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')}>{idx + 1}</span>
                          <span className="text-xs font-medium text-slate-800">{slip.bulan}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700">{fmt(total.gajiBersih)}</span>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="p-2 space-y-2 bg-white">
                          {/* Apply to All button — only on first bulan */}
                          {idx === 0 && (
                            <button
                              onClick={applyToAllBulan}
                              className="w-full py-1.5 px-2 bg-blue-50 border border-blue-300 rounded text-[10px] font-medium text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Apply ke Semua Bulan
                            </button>
                          )}
                          {/* Tanggal Terima + Mode Periode */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[9px] font-medium text-slate-500">Tgl Terima (1-31)</label>
                              <input type="number" min="1" max="31" value={slip.tanggalTerima}
                                onChange={e => updateSlipBulan(idx, 'tanggalTerima', parseInt(e.target.value) || 25)}
                                className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                              <label className="text-[9px] font-medium text-slate-500">Mode Periode</label>
                              <select value={slip.modePeriode}
                                onChange={e => updateSlipBulan(idx, 'modePeriode', e.target.value)}
                                className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500">
                                <option value="bulan-periode">Bulan Periode</option>
                                <option value="plus-1-bulan">+1 Bulan Periode</option>
                              </select>
                            </div>
                          </div>

                          {/* Gaji Pokok */}
                          <div>
                            <label className="text-[9px] font-medium text-slate-500">Gaji Pokok (Rp)</label>
                            <input type="text" value={formatRibuan(slip.gajiPokok)}
                              onChange={e => updateSlipBulan(idx, 'gajiPokok', parseRibuan(e.target.value))}
                              className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500" />
                          </div>

                          {/* Tunjangan */}
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] font-bold text-slate-600">Tunjangan</span>
                              <button onClick={() => addSlipItemBulan(idx, 'tunjangan')} className="text-[9px] text-emerald-600 hover:text-emerald-700">+ Tambah</button>
                            </div>
                            {slip.tunjangan.map((t, i) => (
                              <div key={i} className="flex gap-1 mb-0.5">
                                <input value={t.label} onChange={e => updateSlipItemBulan(idx, 'tunjangan', i, 'label', e.target.value)}
                                  placeholder="Nama" className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                                <input type="text" value={formatRibuan(t.amount)} onChange={e => updateSlipItemBulan(idx, 'tunjangan', i, 'amount', String(parseRibuan(e.target.value)))}
                                  placeholder="Rp" className="w-24 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                                <button onClick={() => removeSlipItemBulan(idx, 'tunjangan', i)} className="text-red-500 text-[10px]">✕</button>
                              </div>
                            ))}
                          </div>

                          {/* Bonus */}
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] font-bold text-slate-600">Bonus</span>
                              <button onClick={() => addSlipItemBulan(idx, 'bonus')} className="text-[9px] text-emerald-600 hover:text-emerald-700">+ Tambah</button>
                            </div>
                            {slip.bonus.map((b, i) => (
                              <div key={i} className="flex gap-1 mb-0.5">
                                <input value={b.label} onChange={e => updateSlipItemBulan(idx, 'bonus', i, 'label', e.target.value)}
                                  placeholder="Nama" className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                                <input type="text" value={formatRibuan(b.amount)} onChange={e => updateSlipItemBulan(idx, 'bonus', i, 'amount', String(parseRibuan(e.target.value)))}
                                  placeholder="Rp" className="w-24 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                                <button onClick={() => removeSlipItemBulan(idx, 'bonus', i)} className="text-red-500 text-[10px]">✕</button>
                              </div>
                            ))}
                          </div>

                          {/* Potongan */}
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] font-bold text-slate-600">Potongan</span>
                              <button onClick={() => addSlipItemBulan(idx, 'potongan')} className="text-[9px] text-emerald-600 hover:text-emerald-700">+ Tambah</button>
                            </div>
                            {slip.potongan.map((p, i) => (
                              <div key={i} className="flex gap-1 mb-0.5">
                                <input value={p.label} onChange={e => updateSlipItemBulan(idx, 'potongan', i, 'label', e.target.value)}
                                  placeholder="Nama" className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                                <input type="text" value={formatRibuan(p.amount)} onChange={e => updateSlipItemBulan(idx, 'potongan', i, 'amount', String(parseRibuan(e.target.value)))}
                                  placeholder="Rp" className="w-24 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                                <button onClick={() => removeSlipItemBulan(idx, 'potongan', i)} className="text-red-500 text-[10px]">✕</button>
                              </div>
                            ))}
                          </div>

                          {/* Auto-Calc Summary */}
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5 space-y-0.5">
                            <div className="flex justify-between text-[9px] text-slate-600"><span>Gaji Pokok:</span><span>{fmt(slip.gajiPokok)}</span></div>
                            <div className="flex justify-between text-[9px] text-slate-600"><span>+ Tunjangan:</span><span>{fmt(total.totalTunjangan)}</span></div>
                            <div className="flex justify-between text-[9px] text-slate-600"><span>+ Bonus:</span><span>{fmt(total.totalBonus)}</span></div>
                            <div className="flex justify-between text-[9px] text-slate-600"><span>- Potongan:</span><span>{fmt(total.totalPotongan)}</span></div>
                            <div className="border-t border-emerald-300 my-0.5"></div>
                            <div className="flex justify-between text-[10px] font-bold text-emerald-800"><span>Gaji Bersih:</span><span>{fmt(total.gajiBersih)}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT: Template Picker */}
            <div className="flex-1 overflow-hidden flex flex-col">
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
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
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
                <p>🎨 Klik template → buka Google Doc baru (auto-isi data form di kiri) → edit langsung di Google Docs → download .docx</p>
              </div>
            </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* Editor View (Google Docs embedded) */}
        {view === 'editor' && createdDoc && (
          <div className="flex-1 overflow-hidden bg-slate-100 flex flex-col">
            {/* Info banner */}
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between shrink-0">
              <p className="text-[11px] text-emerald-700">
                📝 Editor inline (mode minimal) — untuk full editor dengan semua tab & fitur Google Docs:
              </p>
              <a
                href={createdDoc.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1 font-medium"
              >
                <ExternalLink className="w-3 h-3" /> Buka Full Editor
              </a>
            </div>
            {/* Google Docs iframe (embedded mode) */}
            <iframe
              key={iframeKey}
              src={createdDoc.embedUrl}
              className="w-full flex-1 border-0"
              title="Google Docs Editor"
              allow="fullscreen"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// =========================================================
// WirausahaAiPanel — AI Generate Laporan Keuangan (no SK Kerja)
// Form input → call /api/documents/generate-laporan-keuangan
// → upload HTML ke Google Drive sebagai Google Doc
// → return CreatedDoc untuk embed di editor
// =========================================================
function WirausahaAiPanel({ state, customerId, onDocCreated }: {
  state: BerkasState
  customerId?: string
  onDocCreated: (doc: CreatedDoc) => void
}) {
  const [jenisUsaha, setJenisUsaha] = useState(state.applicant.jobTitle || '')
  const [targetMode, setTargetMode] = useState<'range' | 'perBulan'>('range')
  const [labaMin, setLabaMin] = useState('5000000')
  const [labaMax, setLabaMax] = useState('6000000')
  const [periodeCount, setPeriodeCount] = useState<6 | 7>(6)
  const [biayaKhusus, setBiayaKhusus] = useState('')
  const [namaUsaha, setNamaUsaha] = useState(state.applicant.companyName || '')
  const [alamatUsaha, setAlamatUsaha] = useState(state.applicant.companyAddress || '')
  const [ig, setIg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const bulanList: string[] = []
  for (let i = periodeCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
    bulanList.push(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))
  }
  const [labaPerBulan, setLabaPerBulan] = useState<Record<string, string>>(
    Object.fromEntries(bulanList.map(b => [b, '5000000']))
  )

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      // Step 1: AI generate HTML
      const payload: any = {
        jenisUsaha: jenisUsaha || 'Usaha UMKM',
        targetLabaMode: targetMode,
        periodeCount,
        biayaKhusus,
        kopSurat: {
          namaUsaha: namaUsaha || 'Nama Usaha',
          alamat: alamatUsaha || 'Alamat Usaha',
          ig,
        },
      }
      if (targetMode === 'range') {
        payload.targetLabaMin = parseInt(labaMin) || 0
        payload.targetLabaMax = parseInt(labaMax) || 0
      } else {
        payload.labaPerBulan = bulanList.map(bulan => ({
          bulan, laba: parseInt(labaPerBulan[bulan] || '0') || 0,
        }))
      }

      const res = await fetch('/api/documents/generate-laporan-keuangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Gagal generate. Coba lagi.')
        return
      }

      // Step 2: Upload HTML ke Google Drive sebagai Google Doc
      const uploadRes = await fetch('/api/documents/google-docs/upload-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: data.html,
          fileName: `Laporan_Keuangan_${namaUsaha || jenisUsaha}_${new Date().toISOString().split('T')[0]}`,
          customerId,
        }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) {
        setError('AI generate OK, tapi gagal upload ke Google Drive: ' + (uploadData.error || 'unknown'))
        return
      }

      onDocCreated({
        docId: uploadData.docId,
        fileName: uploadData.fileName,
        editUrl: uploadData.editUrl,
        embedUrl: uploadData.embedUrl,
        downloadUrl: uploadData.downloadUrl,
      })
      toast.success('Laporan Keuangan berhasil di-generate & dibuka di Google Docs!')
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-violet-50 to-pink-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h2 className="text-lg font-bold text-violet-900">AI Generate Laporan Keuangan</h2>
          <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full">Wirausaha — No SK Kerja</span>
        </div>
        <p className="text-sm text-violet-700 mb-6">
          AI akan generate rincian pendapatan, HPP, dan biaya operasional otomatis berdasarkan target laba bersih.
          Hasil dibuka di Google Docs editor (bisa edit langsung).
        </p>

        <div className="bg-white rounded-lg border border-violet-200 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-600 uppercase">Jenis Usaha</label>
              <input type="text" value={jenisUsaha} onChange={e => setJenisUsaha(e.target.value)}
                placeholder="e.g., Laundry, Softlens, Camping"
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-600 uppercase">Nama Usaha (Kop Surat)</label>
              <input type="text" value={namaUsaha} onChange={e => setNamaUsaha(e.target.value)}
                placeholder="e.g., ZEELALENS"
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-600 uppercase">Alamat Usaha</label>
              <input type="text" value={alamatUsaha} onChange={e => setAlamatUsaha(e.target.value)}
                placeholder="Alamat lengkap"
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-600 uppercase">Instagram (optional)</label>
              <input type="text" value={ig} onChange={e => setIg(e.target.value)}
                placeholder="e.g., zeelalens"
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-600 uppercase">Periode</label>
              <select value={periodeCount} onChange={e => setPeriodeCount(parseInt(e.target.value) as 6 | 7)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500">
                <option value={6}>6 Bulan Terakhir</option>
                <option value={7}>7 Bulan Terakhir</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-600 uppercase">Mode Target Laba</label>
              <select value={targetMode} onChange={e => setTargetMode(e.target.value as 'range' | 'perBulan')}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500">
                <option value="range">Range (Min - Max)</option>
                <option value="perBulan">Per Bulan (Nominal Pasti)</option>
              </select>
            </div>
            {targetMode === 'range' && (
              <div>
                <label className="text-[10px] font-medium text-slate-600 uppercase">Target Laba/Bulan (Rp)</label>
                <div className="flex gap-1 items-center">
                  <input type="number" value={labaMin} onChange={e => setLabaMin(e.target.value)} placeholder="Min"
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
                  <span className="text-xs text-slate-400">-</span>
                  <input type="number" value={labaMax} onChange={e => setLabaMax(e.target.value)} placeholder="Max"
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            )}
          </div>

          {targetMode === 'perBulan' && (
            <div className="bg-violet-50 rounded p-2 border border-violet-200">
              <label className="text-[10px] font-medium text-slate-600 uppercase mb-1 block">Laba Bersih Per Bulan (Rp)</label>
              <div className="grid grid-cols-2 gap-2">
                {bulanList.map(bulan => (
                  <div key={bulan} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 w-32 truncate">{bulan}</span>
                    <input type="number" value={labaPerBulan[bulan] || ''} onChange={e => setLabaPerBulan(prev => ({ ...prev, [bulan]: e.target.value }))}
                      className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Biaya Khusus (optional)</label>
            <textarea value={biayaKhusus} onChange={e => setBiayaKhusus(e.target.value)} rows={2}
              placeholder="e.g., gaji karyawan 1.3jt/bulan, listrik 500rb, no sewa"
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500" />
          </div>

          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">⚠️ {error}</div>}

          <button onClick={handleGenerate} disabled={loading || !jenisUsaha || !namaUsaha}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-bold rounded hover:from-violet-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> AI sedang generate... (30-60 detik)</>) : (<><Sparkles className="w-4 h-4" /> Generate dengan AI → Buka di Google Docs</>)}
          </button>
        </div>
      </div>
    </div>
  )
}

// =========================================================
// WirausahaFormboxPanel — alternatif formbox untuk wirausaha
// Form manual (seperti slip gaji karyawan) + template picker
// Structur: 7 bulan × (5 pendapatan + 5 pengeluaran) + auto-calc laba bersih
// =========================================================
const LAPORAN_TEMPLATES = [
  { id: '01', name: 'Formal Standard', category: 'Umum', description: 'Font Times New Roman, header hijau/merah/biru', filePath: '/templates/laporan-keuangan/laporan-01.docx' },
  { id: '02', name: 'Modern Clean', category: 'Umum', description: 'Font Arial, accent biru', filePath: '/templates/laporan-keuangan/laporan-02.docx' },
  { id: '03', name: 'Minimal UMKM', category: 'UMKM', description: 'Font Calibri, accent hijau/oranye', filePath: '/templates/laporan-keuangan/laporan-03.docx' },
  { id: '04', name: 'Klasik Elegant', category: 'UMKM', description: 'Font Georgia, accent coklat', filePath: '/templates/laporan-keuangan/laporan-04.docx' },
  { id: '05', name: 'Simple Formal', category: 'Umum', description: 'Font Tahoma, minimal no color', filePath: '/templates/laporan-keuangan/laporan-05.docx' },
  { id: '06', name: 'Accent Hijau UMKM', category: 'UMKM', description: 'Font Calibri, accent hijau segar untuk warung/UMKM', filePath: '/templates/laporan-keuangan/laporan-06.docx' },
  { id: '07', name: 'Accent Coklat Toko', category: 'UMKM', description: 'Font Georgia, accent coklat tanah untuk toko bangunan', filePath: '/templates/laporan-keuangan/laporan-07.docx' },
  { id: '08', name: 'Modern Tech Startup', category: 'Modern', description: 'Font Segoe UI, accent ungu untuk startup/online', filePath: '/templates/laporan-keuangan/laporan-08.docx' },
  { id: '09', name: 'Klasik Hotel Premium', category: 'Premium', description: 'Font Georgia, accent dark elegant untuk hotel/jasa premium', filePath: '/templates/laporan-keuangan/laporan-09.docx' },
  { id: '10', name: 'Minimal Tanpa Warna', category: 'Umum', description: 'Font Calibri, monochrome untuk dokumen netral', filePath: '/templates/laporan-keuangan/laporan-10.docx' },
]

// Nested sub-item structure:
// Pendapatan → Sumber Pendapatan (parent) → Sub Sumber (qty × harga)
// { label: string, subItems: [{ label: string, qty: number, price: number }] }
// Total per parent = sum(subItem.qty * subItem.price)
// Total Pendapatan = sum(parent.total)

function WirausahaFormboxPanel({ state, customerId, onDocCreated }: {
  state: BerkasState
  customerId?: string
  onDocCreated: (doc: CreatedDoc) => void
}) {
  const a = state.applicant as any
  const now = new Date()
  const bulanList: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 15)
    bulanList.push(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))
  }

  type SubItem = { label: string; qty: number; price: number }
  type ParentItem = { label: string; subItems: SubItem[] }
  type LapBulanan = { bulan: string; pendapatan: ParentItem[]; pengeluaran: ParentItem[] }

  const [lapBulanan, setLapBulanan] = useState<LapBulanan[]>(() => {
    const existing = a.lapBulanan
    if (existing && Array.isArray(existing) && existing.length === 7) return existing
    return bulanList.map(bulan => ({
      bulan,
      pendapatan: [{ label: '', subItems: [{ label: '', qty: 1, price: 0 }] }] as ParentItem[],
      pengeluaran: [{ label: '', subItems: [{ label: '', qty: 1, price: 0 }] }] as ParentItem[],
    }))
  })
  const [expandedBulan, setExpandedBulan] = useState(0)
  const [creating, setCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<LaporanTemplateInfo | null>(null)

  const fmt = (n: number) => 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'

  // Calc parent total = sum(qty * price)
  const calcParentTotal = (parent: ParentItem) =>
    parent.subItems.reduce((s, sub) => s + (sub.qty || 0) * (sub.price || 0), 0)

  // Calc grand total = sum(parent totals)
  const calcGrandTotal = (items: ParentItem[]) =>
    items.reduce((s, p) => s + calcParentTotal(p), 0)

  const calcLabaBersih = (lap: LapBulanan) =>
    calcGrandTotal(lap.pendapatan) - calcGrandTotal(lap.pengeluaran)

  // Update helpers
  const updateParent = (idx: number, type: 'pendapatan' | 'pengeluaran', parentIdx: number, field: 'label', val: string) => {
    setLapBulanan(prev => {
      const updated = [...prev]
      const items = [...updated[idx][type]]
      items[parentIdx] = { ...items[parentIdx], [field]: val }
      updated[idx] = { ...updated[idx], [type]: items }
      return updated
    })
  }

  const addParent = (idx: number, type: 'pendapatan' | 'pengeluaran') => {
    setLapBulanan(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [type]: [...updated[idx][type], { label: '', subItems: [{ label: '', qty: 1, price: 0 }] }] }
      return updated
    })
  }

  const removeParent = (idx: number, type: 'pendapatan' | 'pengeluaran', parentIdx: number) => {
    setLapBulanan(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [type]: updated[idx][type].filter((_, i) => i !== parentIdx) }
      return updated
    })
  }

  const addSubItem = (idx: number, type: 'pendapatan' | 'pengeluaran', parentIdx: number) => {
    setLapBulanan(prev => {
      const updated = [...prev]
      const items = [...updated[idx][type]]
      items[parentIdx] = { ...items[parentIdx], subItems: [...items[parentIdx].subItems, { label: '', qty: 1, price: 0 }] }
      updated[idx] = { ...updated[idx], [type]: items }
      return updated
    })
  }

  const updateSubItem = (idx: number, type: 'pendapatan' | 'pengeluaran', parentIdx: number, subIdx: number, field: 'label' | 'qty' | 'price', val: any) => {
    setLapBulanan(prev => {
      const updated = [...prev]
      const items = [...updated[idx][type]]
      const subs = [...items[parentIdx].subItems]
      subs[subIdx] = { ...subs[subIdx], [field]: field === 'label' ? val : (parseInt(val) || 0) }
      items[parentIdx] = { ...items[parentIdx], subItems: subs }
      updated[idx] = { ...updated[idx], [type]: items }
      return updated
    })
  }

  const removeSubItem = (idx: number, type: 'pendapatan' | 'pengeluaran', parentIdx: number, subIdx: number) => {
    setLapBulanan(prev => {
      const updated = [...prev]
      const items = [...updated[idx][type]]
      items[parentIdx] = { ...items[parentIdx], subItems: items[parentIdx].subItems.filter((_, i) => i !== subIdx) }
      updated[idx] = { ...updated[idx], [type]: items }
      return updated
    })
  }

  const applyToAll = () => {
    setLapBulanan(prev => prev.map(lap => ({ ...prev[0], bulan: lap.bulan })))
    toast.success('Data bulan pertama diterapkan ke semua bulan!')
  }

  useEffect(() => { if (a) a.lapBulanan = lapBulanan }, [lapBulanan])

  const handleCreateDoc = async (template: LaporanTemplateInfo) => {
    setCreating(true)
    setSelectedTemplate(template)
    try {
      // KIRIM MENTAH: parent+child structure (NO flatten) — biar template-filler bisa pakai
      // placeholders {pendapatan_parent_N_P_label}, {pendapatan_child_N_P_C_qty}, dll
      // yang match dengan struktur template Opsi A (parent header + child indent + subtotal)
      const stateWithLap = { ...state, applicant: { ...state.applicant, lapBulanan } }
      const res = await fetch('/api/documents/google-docs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templatePath: template.filePath, state: stateWithLap, customerId }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || `HTTP ${res.status}`)
      onDocCreated({ docId: d.docId, fileName: d.fileName, editUrl: d.editUrl, embedUrl: d.embedUrl, downloadUrl: d.downloadUrl })
      toast.success(`Google Doc berhasil dibuat dari template "${template.name}"!`)
    } catch (err) {
      toast.error('Gagal buat Google Doc: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 overflow-hidden flex bg-slate-50">
      {/* LEFT: Form per bulan — WIDER (550px) */}
      <div className="w-[550px] border-r border-slate-200 bg-white overflow-y-auto shrink-0">
        <div className="p-3 border-b bg-violet-50 sticky top-0 z-10">
          <h3 className="text-sm font-bold text-violet-800 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Form Laporan Keuangan (7 Bulan)
          </h3>
          <p className="text-[10px] text-violet-700 mt-0.5">Pendapatan & Pengeluaran dengan sub-items (qty × harga). Auto-calc laba bersih.</p>
        </div>
        <div className="p-2 space-y-2">
          {lapBulanan.map((lap, idx) => {
            const totalPendapatan = calcGrandTotal(lap.pendapatan)
            const totalPengeluaran = calcGrandTotal(lap.pengeluaran)
            const labaBersih = totalPendapatan - totalPengeluaran
            const isExpanded = expandedBulan === idx
            return (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => setExpandedBulan(isExpanded ? -1 : idx)}
                  className={cn('w-full flex items-center justify-between p-2 text-left transition-colors', isExpanded ? 'bg-violet-100' : 'bg-slate-50 hover:bg-slate-100')}>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center', isExpanded ? 'bg-violet-600 text-white' : 'bg-slate-300 text-slate-600')}>{idx + 1}</span>
                    <span className="text-xs font-medium text-slate-800">{lap.bulan}</span>
                  </div>
                  <span className={cn('text-[10px] font-bold', labaBersih >= 0 ? 'text-emerald-700' : 'text-red-700')}>{fmt(labaBersih)}</span>
                </button>
                {isExpanded && (
                  <div className="p-2 space-y-3 bg-white">
                    {idx === 0 && (
                      <button onClick={applyToAll} className="w-full py-1.5 px-2 bg-blue-50 border border-blue-300 rounded text-[10px] font-medium text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Apply ke Semua Bulan
                      </button>
                    )}

                    {/* PENDAPATAN */}
                    <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-emerald-700">PENDAPATAN</span>
                        <button onClick={() => addParent(idx, 'pendapatan')} className="text-[9px] text-emerald-600 hover:text-emerald-700">+ Sumber Pendapatan</button>
                      </div>
                      {lap.pendapatan.map((parent, pi) => (
                        <div key={pi} className="mb-2 bg-white rounded p-1.5 border border-emerald-100">
                          <div className="flex gap-1 items-center mb-1">
                            <input value={parent.label} onChange={e => updateParent(idx, 'pendapatan', pi, 'label', e.target.value)}
                              placeholder="Sumber Pendapatan" className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-700 w-24 text-right">{fmt(calcParentTotal(parent))}</span>
                            <button onClick={() => addSubItem(idx, 'pendapatan', pi)} className="text-[9px] text-emerald-600">+ Sub</button>
                            <button onClick={() => removeParent(idx, 'pendapatan', pi)} className="text-red-500 text-[10px]">✕</button>
                          </div>
                          {parent.subItems.map((sub, si) => (
                            <div key={si} className="flex gap-1 items-center ml-4 mb-0.5">
                              <input value={sub.label} onChange={e => updateSubItem(idx, 'pendapatan', pi, si, 'label', e.target.value)}
                                placeholder="Sub sumber" className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-emerald-400" />
                              <input type="number" value={sub.qty || ''} onChange={e => updateSubItem(idx, 'pendapatan', pi, si, 'qty', e.target.value)}
                                placeholder="Qty" className="w-10 border border-slate-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-emerald-400" />
                              <span className="text-[8px] text-slate-400">×</span>
                              <input type="text" value={formatRibuan(sub.price)} onChange={e => updateSubItem(idx, "pendapatan", pi, si, "price", String(parseRibuan(e.target.value)))}
                                placeholder="Rp" className="w-24 border border-slate-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-emerald-400" />
                              <span className="text-[8px] font-medium text-emerald-600 w-20 text-right">{fmt((sub.qty || 0) * (sub.price || 0))}</span>
                              <button onClick={() => removeSubItem(idx, 'pendapatan', pi, si)} className="text-red-400 text-[8px]">✕</button>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="flex justify-between text-[10px] font-bold text-emerald-800 mt-1 pt-1 border-t border-emerald-200">
                        <span>Total Pendapatan:</span><span>{fmt(totalPendapatan)}</span>
                      </div>
                    </div>

                    {/* PENGELUARAN */}
                    <div className="bg-red-50 rounded p-2 border border-red-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-red-700">PENGELUARAN</span>
                        <button onClick={() => addParent(idx, 'pengeluaran')} className="text-[9px] text-red-600 hover:text-red-700">+ Sumber Pengeluaran</button>
                      </div>
                      {lap.pengeluaran.map((parent, pi) => (
                        <div key={pi} className="mb-2 bg-white rounded p-1.5 border border-red-100">
                          <div className="flex gap-1 items-center mb-1">
                            <input value={parent.label} onChange={e => updateParent(idx, 'pengeluaran', pi, 'label', e.target.value)}
                              placeholder="Sumber Pengeluaran" className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-red-500" />
                            <span className="text-[9px] font-bold text-red-700 w-24 text-right">{fmt(calcParentTotal(parent))}</span>
                            <button onClick={() => addSubItem(idx, 'pengeluaran', pi)} className="text-[9px] text-red-600">+ Sub</button>
                            <button onClick={() => removeParent(idx, 'pengeluaran', pi)} className="text-red-500 text-[10px]">✕</button>
                          </div>
                          {parent.subItems.map((sub, si) => (
                            <div key={si} className="flex gap-1 items-center ml-4 mb-0.5">
                              <input value={sub.label} onChange={e => updateSubItem(idx, 'pengeluaran', pi, si, 'label', e.target.value)}
                                placeholder="Sub sumber" className="flex-1 border border-slate-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-red-400" />
                              <input type="number" value={sub.qty || ''} onChange={e => updateSubItem(idx, 'pengeluaran', pi, si, 'qty', e.target.value)}
                                placeholder="Qty" className="w-10 border border-slate-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-red-400" />
                              <span className="text-[8px] text-slate-400">×</span>
                              <input type="text" value={formatRibuan(sub.price)} onChange={e => updateSubItem(idx, "pengeluaran", pi, si, "price", String(parseRibuan(e.target.value)))}
                                placeholder="Rp" className="w-24 border border-slate-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-red-400" />
                              <span className="text-[8px] font-medium text-red-600 w-20 text-right">{fmt((sub.qty || 0) * (sub.price || 0))}</span>
                              <button onClick={() => removeSubItem(idx, 'pengeluaran', pi, si)} className="text-red-400 text-[8px]">✕</button>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="flex justify-between text-[10px] font-bold text-red-800 mt-1 pt-1 border-t border-red-200">
                        <span>Total Pengeluaran:</span><span>{fmt(totalPengeluaran)}</span>
                      </div>
                    </div>

                    {/* LABA BERSIH */}
                    <div className={cn('rounded p-2 flex justify-between text-[11px] font-bold', labaBersih >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900')}>
                      <span>LABA BERSIH:</span><span>{fmt(labaBersih)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT: Template Picker — NARROWER */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-white">
          <h3 className="text-sm font-bold text-slate-800">Pilih Template</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{LAPORAN_TEMPLATES.length} template. Klik untuk buat Google Doc.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {LAPORAN_TEMPLATES.map(template => (
            <button key={template.id} onClick={() => handleCreateDoc(template)} disabled={creating}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-violet-400 hover:bg-violet-50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-violet-600 truncate">{template.name}</h4>
                  <p className="text-[9px] text-slate-500 truncate">{template.description}</p>
                </div>
                {creating && selectedTemplate?.id === template.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-violet-500 shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface LaporanTemplateInfo {
  id: string
  name: string
  category: string
  description: string
  filePath: string
}
