'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, ChevronDown, ChevronRight, User, Briefcase, Heart,
  Save, Loader2, Download, X, Building2, FileText, FileDown,
  RefreshCw, Eye, Printer, Upload, Send, MessageSquare,
  LayoutGrid, Files, Calendar, Banknote, CheckCircle2, Circle, MapPin,
  ExternalLink,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import {
  BerkasState, JobType, MaritalStatus, SpouseJobType,
  ApplicantData, SpouseData, PropertyData,
} from '@/lib/berkas/types'
import { COMPANY_INFO, DEFAULT_PROPERTY, INITIAL_STATE } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'
import { DocumentLayout } from '@/components/berkas-docs/DocumentLayout'
import { SPR_BTN } from '@/components/berkas-docs/docs/btn/SPR'
import { SuratPernyataanTidakMemilikiRumah } from '@/components/berkas-docs/docs/common/SuratPernyataanTidakMemilikiRumah'
import { SuratPernyataanPenghasilan } from '@/components/berkas-docs/docs/common/SuratPernyataanPenghasilan'
import { SuratPernyataanBPHTB } from '@/components/berkas-docs/docs/bphtb/SuratPernyataanBPHTB'
import { SuratKuasaBPHTB } from '@/components/berkas-docs/docs/bphtb/SuratKuasaBPHTB'
import { BastNotaris } from '@/components/berkas-docs/docs/notaris/BastNotaris'
import { TandaTerimaNotaris } from '@/components/berkas-docs/docs/notaris/TandaTerimaNotaris'
import { PernyataanPengecekanSHGB } from '@/components/berkas-docs/docs/notaris/PernyataanPengecekanSHGB'
import { SuratKuasaNotaris } from '@/components/berkas-docs/docs/notaris/SuratKuasaNotaris'
import { LokasiTempatKerja } from '@/components/berkas-docs/docs/common/LokasiTempatKerja'
import { SlipGajiForm } from '@/components/berkas-docs/docs/common/SlipGajiForm'
import { TemplatePopover } from '@/components/berkas-docs/docs/common/TemplatePopover'
import { CombinedDocEditorModal } from '@/components/berkas-docs/CombinedDocEditorModal'
import { LokasiKerjaModal } from '@/components/berkas-docs/LokasiKerjaModal'

// ============================================================
// REQUIRED UPLOADS - Dokumen identitas wajib
// ============================================================
const BASE_REQUIRED_UPLOADS = [
  { id: 'ktp', label: 'KTP', desc: 'Kartu Tanda Penduduk' },
  { id: 'kk', label: 'KK', desc: 'Kartu Keluarga' },
  { id: 'npwp', label: 'NPWP', desc: 'Nomor Pokok Wajib Pajak' },
  { id: 'status-nikah', label: 'Akta Nikah/Cerai/Surat Belum Menikah', desc: 'Pilih salah satu sesuai status' },
  { id: 'slip-gaji', label: 'Slip Gaji / Laporan Keuangan', desc: '3 bulan terakhir (karyawan) atau 6 bulan (wirausaha)' },
  { id: 'sk-kerja', label: 'SK Kerja / NIB', desc: 'Surat Keterangan Kerja atau NIB (wirausaha)' },
  { id: 'surat-rumah', label: 'Surat Belum Memiliki Rumah', desc: 'Dari Kelurahan/Desa' },
  { id: 'sertifikat', label: 'Sertifikat Rumah', desc: 'Sertifikat tanah/rumah' },
  { id: 'pbb', label: 'PBB', desc: 'Pajak Bumi dan Bangunan (scan/foto)' },
]

const SPOUSE_UPLOADS = {
  NGANGGUR: [{ id: 'spouse-tidak-bekerja', label: 'Surat Pernyataan Tidak Bekerja (Pasangan)', desc: 'Karena pasangan nganggur' }],
  KARYAWAN: [
    { id: 'spouse-slip-gaji', label: 'Slip Gaji Pasangan', desc: '3 bulan terakhir' },
    { id: 'spouse-sk-kerja', label: 'SK Kerja Pasangan', desc: 'Surat keterangan kerja' },
  ],
  WIRAUSAHA: [
    { id: 'spouse-nib', label: 'NIB Pasangan', desc: 'Nomor Induk Berusaha' },
    { id: 'spouse-laporan-keuangan', label: 'Laporan Keuangan Pasangan', desc: '6 bulan terakhir' },
  ],
}

function getRequiredUploads(maritalStatus: MaritalStatus, spouseJobType?: SpouseJobType) {
  const base = [...BASE_REQUIRED_UPLOADS]
  if (maritalStatus === MaritalStatus.MARRIED && spouseJobType) {
    return [...base, ...(SPOUSE_UPLOADS[spouseJobType] || [])]
  }
  return base
}

const SIGNED_DOCS = [
  { id: 'flpp-signed', label: 'Form FLPP', desc: 'Formulir FLPP yang sudah ditandatangani' },
  { id: 'spr-signed', label: 'SPR (Surat Pemesanan Rumah)', desc: 'Sudah ditandatangani pemohon & developer' },
  { id: 'aplikasi-signed', label: 'Form Aplikasi', desc: 'Form aplikasi KPR yang sudah ditandatangani' },
  { id: 'pernyataan-penghasilan-signed', label: 'Surat Pernyataan Penghasilan', desc: 'Sudah ditandatangani pemohon' },
  { id: 'rekening-koran-signed', label: 'Rekening Koran / Buku Tabungan', desc: '3-6 bulan terakhir (scan/foto)' },
  { id: 'sp3k-btn', label: 'SP3K (BTN)', desc: 'Surat Persetujuan Pinjaman BTN', showWhen: 'BTN' },
  { id: 'sppk-mandiri', label: 'SPPK (Mandiri)', desc: 'Surat Persetujuan Pinjaman Mandiri', showWhen: 'MANDIRI' },
  { id: 'sp4-bsb', label: 'SP4 (BSB Syariah)', desc: 'Surat Persetujuan Pembiayaan BSB', showWhen: 'BSB_SYARIAH' },
]

function formatShortDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

function getBerkasStatus(customer: any): { label: string; color: string } {
  if (customer.berkasLengkap) return { label: 'LENGKAP', color: 'emerald' }
  const stage = (customer.stage || '').toUpperCase()
  if (stage === 'PEMBERKASAN') return { label: 'PEMBERKASAN', color: 'amber' }
  if (stage === 'SP3K') return { label: 'SP3K', color: 'blue' }
  if (stage === 'AKAD') return { label: 'AKAD', color: 'violet' }
  if (stage === 'SERAH_TERIMA') return { label: 'SERAH TERIMA', color: 'emerald' }
  return { label: 'BELUM LENGKAP', color: 'slate' }
}

// ============================================================
// MAIN BERKAS VIEW - [Main Content] + [DINA Sidebar persistent]
// ============================================================
export function BerkasViewV2({ projectId }: { projectId: string }) {
  const [customers, setCustomers] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/create?projectId=${projectId}`)
      const d = await res.json()
      if (d.success) setCustomers(d.data)
    } catch {}
    finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const selectedCustomer = customers.find(c => c.id === expandedId) || null

  return (
    <div className="flex gap-3 h-full">
      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Berkas Konsumen</h2>
            <p className="text-sm text-muted-foreground">Isi data sekali → dokumen auto-generate → download PDF</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Konsumen Baru
          </Button>
        </div>

        {loading ? (
          <Card className="p-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></Card>
        ) : customers.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada konsumen.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {customers.map(c => (
              <CustomerFolder key={c.id} customer={c} expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                onRefresh={fetchCustomers} projectId={projectId} />
            ))}
          </div>
        )}

        {showAddForm && (
          <AddCustomerModal projectId={projectId} onClose={() => setShowAddForm(false)}
            onCreated={() => { fetchCustomers(); setShowAddForm(false) }} />
        )}
      </div>

      {/* DINA SIDEBAR - PERSISTENT */}
      <DinaSidebar customer={selectedCustomer} onDbUpdate={fetchCustomers} />
    </div>
  )
}

// ============================================================
// CUSTOMER FOLDER
// ============================================================
function CustomerFolder({ customer, expanded, onToggle, onRefresh, projectId }: {
  customer: any; expanded: boolean; onToggle: () => void; onRefresh: () => void; projectId: string
}) {
  // Issue 2: Display blok/unit from multiple sources:
  // 1. customer.units[0].blockNumber (if linked via Unit table)
  // 2. customer.blockLetter + customer.houseNumber (if set via DINA chat or form)
  // 3. fallback '—'
  const unitBlock = customer.units?.[0]?.blockNumber
  const customerBlock = (customer.blockLetter || '') + (customer.houseNumber || '')
  const blok = unitBlock || customerBlock || '—'
  const bankName = customer.bankName || customer.bankPipelines?.[0]?.bankName || ''
  const berkasStatus = getBerkasStatus(customer)

  return (
    <div>
      <Card className="border border-border overflow-hidden">
        <button onClick={onToggle} className="w-full p-3 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-4">
            {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex items-center gap-x-8 gap-y-1 flex-wrap flex-1 min-w-0">
              <div className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Blok</span><span className="text-sm font-bold text-foreground">{blok}</span></div>
              <div className="flex flex-col min-w-0"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Nama Konsumen</span><span className="text-sm font-semibold text-foreground truncate">{customer.name}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Bank</span><span className={cn('text-sm font-semibold', bankName ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/60 italic')}>{bankName || 'belum diputuskan'}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tgl Closing</span><span className="text-xs text-foreground">{formatShortDate(customer.closingDate)}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tgl SP3K</span><span className="text-xs text-foreground">{formatShortDate(customer.sp3kDate)}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tgl Akad</span><span className="text-xs text-foreground">{formatShortDate(customer.akadDate)}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-muted-foreground uppercase tracking-wider">Status</span>
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                  berkasStatus.color === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                  berkasStatus.color === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                  berkasStatus.color === 'blue' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                  berkasStatus.color === 'violet' && 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
                  berkasStatus.color === 'slate' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                )}>{berkasStatus.label}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] shrink-0 hidden md:inline-flex">{customer.stage}</Badge>
          </div>
        </button>
      </Card>
      {expanded && <div className="mt-2"><BerkasEditor customer={customer} onRefresh={onRefresh} projectId={projectId} /></div>}
    </div>
  )
}

// ============================================================
// DINA SIDEBAR — Powered by Gemini 2.0 Flash with full knowledge base + customer context
// Chat persists across page reloads (loaded from DB)
// DINA can READ and WRITE to database (update bank, stage, etc)
function DinaSidebar({ customer, onDbUpdate }: { customer: any; onDbUpdate?: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; ts: number }>>([
    { role: 'agent', content: 'Halo! Saya DINA, Document AI Assistant untuk PT. Marlindo Bangun Persada. Saya bisa bantu soal berkas KPR, proses bank, dokumen yang dibutuhkan, status konsumen, dan update data langsung dari database. Apa yang bisa saya bantu? 😊', ts: Date.now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages, loading])

  // Load chat history from DB on mount (persists across reloads)
  useEffect(() => {
    const url = customer?.id ? `/api/dina/history?customerId=${customer.id}` : '/api/dina/history'
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.messages && d.messages.length > 0) {
          setMessages(d.messages)
        }
        setHistoryLoaded(true)
      })
      .catch(() => setHistoryLoaded(true))
  }, [customer?.id])

  async function send() {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: Date.now() }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/dina/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, customerId: customer?.id }),
      })
      const d = await res.json()
      if (d.success) {
        setMessages(prev => [...prev, { role: 'agent', content: d.response, ts: Date.now() }])
        // If DINA updated the database, refresh the dashboard
        if (d.dbUpdated && onDbUpdate) {
          onDbUpdate()
          toast.success('🔄 Data diperbarui oleh DINA — dashboard direfresh')
        }
      } else {
        setMessages(prev => [...prev, { role: 'agent', content: 'Maaf, saya lagi ada gangguan teknis. Coba lagi ya. 😅', ts: Date.now() }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Koneksi bermasalah. Coba lagi ya. 😅', ts: Date.now() }])
    }
    finally { setLoading(false) }
  }

  return (
    <div className="w-80 shrink-0 flex flex-col rounded-lg overflow-hidden border border-slate-700/60 shadow-xl"
      style={{ background: 'linear-gradient(180deg, #1e1b2e 0%, #14121f 100%)', maxHeight: 'calc(100vh - 100px)' }}>
      <div className="px-3 py-2.5 border-b border-violet-900/40 flex items-center gap-2 bg-violet-950/60">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">DI</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-violet-100">DINA</div>
          <div className="text-[9px] text-violet-300/70 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400" /> Gemini 2.0 Flash
          </div>
        </div>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />online</span>
      </div>
      {customer && (
        <div className="px-3 py-1.5 bg-violet-900/30 border-b border-violet-900/40">
          <div className="text-[9px] text-violet-300/70 uppercase tracking-wider">Konteks Aktif</div>
          <div className="text-[11px] font-semibold text-violet-100 truncate">{customer.name} · Blok {customer.units?.[0]?.blockNumber || (customer.blockLetter || '') + (customer.houseNumber || '') || '—'}</div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ background: '#0f0d1a' }}>
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[88%] rounded-lg px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap', msg.role === 'user' ? 'bg-violet-700 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm')}>{msg.content}</div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-slate-800 border border-slate-700 rounded-lg rounded-bl-sm px-3 py-2"><Loader2 className="w-3 h-3 animate-spin text-violet-400" /></div></div>}
      </div>
      <div className="p-2 border-t border-slate-800 bg-slate-900">
        <div className="flex gap-1">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Tanya DINA soal berkas, KPR, bank..." disabled={loading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-600" />
          <button onClick={send} disabled={loading || !input.trim()} className="p-1.5 rounded bg-violet-600 text-white disabled:opacity-40 hover:bg-violet-500"><Send className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// BERKAS EDITOR - Form + Preview (2 columns inside box)
// ============================================================
function BerkasEditor({ customer, onRefresh, projectId }: { customer: any; onRefresh: () => void; projectId: string }) {
  // Build initial state FROM customer DB data (prevents reset after save)
  const buildInitialState = (): BerkasState => {
    const unit = customer.units?.[0]
    // Parse blockLetter + houseNumber from existing blockNumber if present
    // Format: "E6" → blockLetter="E", houseNumber="6"
    let blockLetter = '', houseNumber = ''
    if (unit?.blockNumber) {
      const match = String(unit.blockNumber).match(/^([A-Za-z]+)(\d+.*)$/)
      if (match) { blockLetter = match[1]; houseNumber = match[2] }
      else { blockLetter = String(unit.blockNumber) }
    }
    return {
      ...INITIAL_STATE,
      applicant: {
        ...INITIAL_STATE.applicant,
        fullName: customer.name || '',
        phone: customer.whatsappNumber || customer.phone || '',
        ktpNumber: customer.nik || '',
        pob: customer.birthPlace || '',
        dob: customer.birthDate || '',
        address: customer.ktpAddress || '',
        jobTitle: customer.workPosition || '',
        companyName: customer.companyName || '',
        companyAddress: customer.companyAddress || '',
        monthlyIncome: customer.monthlyIncome || 0,
        btnAccountNumber: customer.btnAccountNumber || '',
        npwpNumber: customer.npwpNumber || '',
        jobType: (customer.occupation === 'Wirausaha' ? JobType.ENTREPRENEUR : JobType.EMPLOYEE),
        // Workplace info (Lokasi Kerja) - restore from DB
        atasanName: customer.atasanName || '',
        atasanNip: customer.atasanNip || '',
        workplaceFrontPhoto: customer.workplaceFrontPhoto || '',
        workplaceInsidePhoto: customer.workplaceInsidePhoto || '',
        workplaceMapsLink: customer.workplaceMapsLink || '',
        workplaceMapsShortLink: customer.workplaceMapsShortLink || '',
        workplaceJamOperasional: customer.workplaceJamOperasional || '',
        workplaceWaktuHubungi: customer.workplaceWaktuHubungi || '',
        // Slip gaji components - restore from DB
        gajiPokok: customer.gajiPokok || 0,
        ...(customer.slipGajiData ? (() => {
          try {
            const parsed = JSON.parse(customer.slipGajiData)
            return {
              tunjanganTetap: parsed.tunjanganTetap || [],
              tunjanganVariabel: parsed.tunjanganVariabel || [],
              potongan: parsed.potongan || [],
              tanggalTerimaGaji: parsed.tanggalTerimaGaji || '',
              periodeSlip: parsed.periodeSlip || '',
            }
          } catch { return {} }
        })() : {}),
      },
      maritalStatus: customer.maritalStatus === 'MENIKAH' ? MaritalStatus.MARRIED : MaritalStatus.SINGLE,
      spouse: customer.spouseName ? {
        fullName: customer.spouseName || '',
        ktpNumber: customer.spouseNik || '',
        pob: customer.spouseBirthPlace || '',
        dob: customer.spouseBirthDate || '',
        job: customer.spouseOccupation || '',
        address: customer.spouseAddress || '',
        isWorking: false,
        jobType: 'NGANGGUR' as SpouseJobType,
      } : undefined,
      property: {
        ...DEFAULT_PROPERTY,
        kavlingNumber: unit?.blockNumber || '',
        blockLetter: customer.blockLetter || blockLetter,
        houseNumber: customer.houseNumber || houseNumber,
        landSize: customer.landSize || unit?.landSize || 84,
        houseSize: customer.houseSize || 36,
        shmNumber: customer.shmNumber || '',
        nibNumber: customer.nibNumber || '',
        projectName: 'ANJAYO 16',
      },
      dateOfDocument: customer.dateOfDocument || new Date().toISOString().split('T')[0],
      akadDate: customer.akadDate ? new Date(customer.akadDate).toISOString().split('T')[0] : '',
      akadNumber: customer.akadNumber || '',
      lpaDate: customer.lpaDate ? new Date(customer.lpaDate).toISOString().split('T')[0] : '',
      lpaNumber: customer.lpaNumber || '',
      sp3kDate: customer.sp3kDate ? new Date(customer.sp3kDate).toISOString().split('T')[0] : '',
    }
  }
  const [state, setState] = useState<BerkasState>(buildInitialState)
  const [bank, setBank] = useState<string>(customer.bankName || customer.bankPipelines?.[0]?.bankName || 'BTN')
  const [saving, setSaving] = useState(false)
  const [flppGenerating, setFlppGenerating] = useState(false)
  // Load uploaded files from DB (persisted as JSON string in customer.uploadedDocs)
  const loadUploadedFiles = (): Record<string, string> => {
    try {
      if (customer.uploadedDocs) {
        return JSON.parse(customer.uploadedDocs)
      }
    } catch {}
    return {}
  }
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(loadUploadedFiles)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'generate' | 'uploads'>('generate')
  const [docStage, setDocStage] = useState<'entry' | 'ajb' | 'bphtb'>('entry')
  const [formMode, setFormMode] = useState<'bank' | 'bphtb' | 'notaris'>('bank')
  const [generateDocId, setGenerateDocId] = useState<string>('flpp')
  const [flppBlobUrl, setFlppBlobUrl] = useState<string | null>(null)
  const [flppLoading, setFlppLoading] = useState(false)
  const [notarisList, setNotarisList] = useState<any[]>([])
  const [selectedNotaris, setSelectedNotaris] = useState<string>('')
  // Template state for SK Kerja & Slip Gaji (.docx templates per workplace)
  // Stored in uploadedFiles under 'sk-kerja-template' & 'slip-gaji-template'
  // Preview HTML for filled template (loaded from /api/documents/preview-docx-template)
  const [templatePreviewHtml, setTemplatePreviewHtml] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  // Modal states for combined doc download & Lokasi Kerja
  const [combinedDocModalOpen, setCombinedDocModalOpen] = useState(false)
  const [lokasiModalOpen, setLokasiModalOpen] = useState(false)
  // Generated Lokasi Kerja Google Doc
  const [lokasiDoc, setLokasiDoc] = useState<{ docId: string; editUrl: string; embedUrl: string; downloadUrl: string } | null>(null)
  const [generatingLokasi, setGeneratingLokasi] = useState(false)
  // Global company settings (director info + per-bank accounts, shared across all customers)
  // Dynamic banks from BankConfig DB (added below hardcoded BTN/Mandiri/BSB)
  const [dbBanks, setDbBanks] = useState<Array<{ id: string; bankCode: string; bankName: string }>>([])

  // Fetch DB banks on mount
  useEffect(() => {
    fetch('/api/bank-config')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setDbBanks(d.data) })
      .catch(() => {})
  }, [])

  const [companySettings, setCompanySettings] = useState<{
    companyName?: string; directorName?: string; directorNik?: string; directorPhone?: string; directorAddress?: string; officeAddress?: string; city?: string
    btnAccount?: string; mandiriAccount?: string; bsbAccount?: string
    btnBranch?: string; mandiriBranch?: string; bsbBranch?: string
  }>({})
  const previewRef = useRef<HTMLDivElement>(null)

  // Fetch notaris list
  useEffect(() => {
    fetch('/api/notaris').then(r => r.json()).then(d => {
      if (d.success) setNotarisList(d.data)
    }).catch(() => {})
  }, [])

  // Fetch global company settings (director info + bank accounts)
  useEffect(() => {
    fetch('/api/company-settings').then(r => r.json()).then(d => {
      if (d.success && d.data) setCompanySettings(d.data)
    }).catch(() => {})
  }, [])

  // Update company setting (debounced save ke DB)
  const companySettingsSaveTimer = useRef<NodeJS.Timeout | null>(null)
  function updateCompanySetting(field: string, val: string) {
    setCompanySettings(prev => ({ ...prev, [field]: val }))
    // Debounced save
    if (companySettingsSaveTimer.current) clearTimeout(companySettingsSaveTimer.current)
    companySettingsSaveTimer.current = setTimeout(async () => {
      try {
        const updated = { ...companySettings, [field]: val }
        await fetch('/api/company-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        })
        toast.success('Data perusahaan tersimpan (global)')
      } catch {
        toast.error('Gagal simpan data perusahaan')
      }
    }, 1500)
  }

  function updateApplicant(field: keyof ApplicantData, val: any) { setState(s => ({ ...s, applicant: { ...s.applicant, [field]: val } })) }
  function updateProperty(field: keyof PropertyData, val: any) { setState(s => ({ ...s, property: { ...s.property, [field]: val } })) }
  function updateSpouse(field: keyof SpouseData, val: any) {
    setState(s => ({ ...s, spouse: { ...(s.spouse || { fullName: '', ktpNumber: '', pob: '', dob: '', job: '', address: '', isWorking: false, jobType: 'NGANGGUR' as SpouseJobType }), [field]: val } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.applicant.fullName, phone: state.applicant.phone, whatsappNumber: state.applicant.phone,
          nik: state.applicant.ktpNumber, birthPlace: state.applicant.pob, birthDate: state.applicant.dob,
          occupation: state.applicant.jobType, ktpAddress: state.applicant.address,
          companyName: state.applicant.companyName, companyAddress: state.applicant.companyAddress,
          workPosition: state.applicant.jobTitle, monthlyIncome: state.applicant.monthlyIncome,
          maritalStatus: state.maritalStatus === 'Sudah Menikah' ? 'MENIKAH' : 'SINGLE',
          spouseName: state.spouse?.fullName, spouseNik: state.spouse?.ktpNumber,
          spouseBirthPlace: state.spouse?.pob, spouseBirthDate: state.spouse?.dob, spouseOccupation: state.spouse?.job,
          spouseAddress: state.spouse?.address,
          dateOfDocument: state.dateOfDocument,
          akadDate: state.akadDate, akadNumber: state.akadNumber,
          lpaDate: state.lpaDate, lpaNumber: state.lpaNumber,
          sp3kDate: state.sp3kDate,
          npwpNumber: state.applicant.npwpNumber,
          btnAccountNumber: state.applicant.btnAccountNumber,
          blockLetter: state.property.blockLetter,
          houseNumber: state.property.houseNumber,
          landSize: state.property.landSize,
          houseSize: state.property.houseSize,
          shmNumber: state.property.shmNumber,
          nibNumber: state.property.nibNumber,
          // Workplace info (Lokasi Kerja)
          atasanName: (state.applicant as any).atasanName,
          atasanNip: (state.applicant as any).atasanNip,
          workplaceFrontPhoto: (state.applicant as any).workplaceFrontPhoto,
          workplaceInsidePhoto: (state.applicant as any).workplaceInsidePhoto,
          workplaceMapsLink: (state.applicant as any).workplaceMapsLink,
          workplaceMapsShortLink: (state.applicant as any).workplaceMapsShortLink,
          workplaceJamOperasional: (state.applicant as any).workplaceJamOperasional,
          workplaceWaktuHubungi: (state.applicant as any).workplaceWaktuHubungi,
          // Slip gaji components
          gajiPokok: (state.applicant as any).gajiPokok,
          slipGajiData: JSON.stringify({
            tunjanganTetap: (state.applicant as any).tunjanganTetap || [],
            tunjanganVariabel: (state.applicant as any).tunjanganVariabel || [],
            potongan: (state.applicant as any).potongan || [],
            tanggalTerimaGaji: (state.applicant as any).tanggalTerimaGaji,
            periodeSlip: (state.applicant as any).periodeSlip,
          }),
          uploadedDocs: JSON.stringify(uploadedFiles),
        }),
      })
      const d = await res.json()
      if (d.success) { toast.success('Data tersimpan!'); onRefresh() }
      else { toast.error('Gagal simpan: ' + (d.error || 'Unknown')); console.error('Save error:', d) }
    } catch (err) { toast.error('Network error: ' + (err instanceof Error ? err.message : 'unknown')); console.error('Save network error:', err) }
    finally { setSaving(false) }
  }

  // Download PDF - MERGE mode: combine all uploads + generated docs into ONE PDF
  async function handleDownloadFlpp() {
    setFlppGenerating(true)
    try {
      // Collect files to merge based on current mode/bank/stage
      const filesToMerge: Array<{ docId: string; dataUrl: string; label: string }> = []

      if (formMode === 'bank') {
        if (docStage === 'entry') {
          const requiredDocIds = ['ktp', 'kk', 'npwp', 'status-nikah', 'slip-gaji', 'sk-kerja', 'surat-rumah', 'sertifikat', 'pbb']
          requiredDocIds.forEach(id => { if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id }) })
          if (state.maritalStatus === MaritalStatus.MARRIED) {
            ['spouse-tidak-bekerja', 'spouse-slip-gaji', 'spouse-sk-kerja', 'spouse-nib', 'spouse-laporan-keuangan'].forEach(id => {
              if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id })
            })
          }
          const signedDocIds = ['flpp-signed', 'spr-signed', 'aplikasi-signed', 'pernyataan-penghasilan-signed', 'rekening-koran-signed', 'sp3k-btn', 'sppk-mandiri', 'sp4-bsb']
          signedDocIds.forEach(id => { if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id }) })
        } else if (docStage === 'ajb' && bank === 'BTN') {
          for (let i = 0; i < 15; i++) {
            const id = `post-sp3k-${i}`
            if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id })
          }
        }
      } else if (formMode === 'bphtb') {
        ['bphtb-bukti-bayar-pbb', 'bphtb-kwitansi', 'bphtb-sppk'].forEach(id => { if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id }) })
        ['ktp', 'kk', 'npwp', 'status-nikah', 'sertifikat', 'pbb'].forEach(id => { if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id }) })
        if (state.maritalStatus === MaritalStatus.MARRIED && uploadedFiles['spouse-ktp']) filesToMerge.push({ docId: 'spouse-ktp', dataUrl: uploadedFiles['spouse-ktp'], label: 'spouse-ktp' })
      } else if (formMode === 'notaris') {
        ['pph-bukti', 'akta-pendirian', 'akta-perubahan', 'kwitansi-rumah-notaris', 'ktp-direktur', 'npwp-pt'].forEach(id => { if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id }) })
        ['ktp', 'kk', 'npwp', 'status-nikah', 'sertifikat', 'pbb'].forEach(id => { if (uploadedFiles[id]) filesToMerge.push({ docId: id, dataUrl: uploadedFiles[id], label: id }) })
        if (state.maritalStatus === MaritalStatus.MARRIED && uploadedFiles['spouse-ktp']) filesToMerge.push({ docId: 'spouse-ktp', dataUrl: uploadedFiles['spouse-ktp'], label: 'spouse-ktp' })
        const sp3kId = bank === 'BTN' ? 'sp3k-btn' : bank === 'MANDIRI' ? 'sppk-mandiri' : 'sp4-bsb'
        if (uploadedFiles[sp3kId]) filesToMerge.push({ docId: sp3kId, dataUrl: uploadedFiles[sp3kId], label: sp3kId })
      }

      if (filesToMerge.length === 0) {
        toast.info('Tidak ada berkas untuk di-download. Upload dokumen dulu.')
        setFlppGenerating(false)
        return
      }

      // Build merge label: [Jenis Dokumen] - based on mode/bank/stage
      let mergeLabel = 'Data Entry'
      if (formMode === 'bank') {
        if (docStage === 'entry') mergeLabel = `Data Entry ${bank === 'BTN' ? 'BTN' : bank === 'MANDIRI' ? 'Mandiri' : 'BSB'}`
        else if (docStage === 'ajb') mergeLabel = `Post SP3K ${bank === 'BTN' ? 'BTN' : bank === 'MANDIRI' ? 'Mandiri' : 'BSB'}`
      } else if (formMode === 'bphtb') {
        mergeLabel = 'BPHTB'
      } else if (formMode === 'notaris') {
        mergeLabel = 'Notaris'
      }

      // Call merge-to-drive API (merges all files + saves to Drive + returns download URL)
      const res = await fetch('/api/documents/google-docs/merge-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesToMerge,
          mergeLabel,
          state,
          customerId: customer.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const d = await res.json()

      if (d.success) {
        // Download the merged PDF
        const dlRes = await fetch(d.downloadUrl)
        if (dlRes.ok) {
          const blob = await dlRes.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const customerName = state.applicant.fullName || 'Konsumen'
          const blockUnit = state.property.blockLetter || state.property.houseNumber ? ` - ${state.property.blockLetter}${state.property.houseNumber}` : ''
          a.download = `${mergeLabel} - ${customerName}${blockUnit}.pdf`
          document.body.appendChild(a); a.click(); document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
        toast.success(`Berhasil! ${d.pageCount} halaman digabung → tersimpan di Google Drive + didownload!`)
      } else {
        throw new Error(d.error || 'Merge failed')
      }
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Gagal download: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setFlppGenerating(false)
    }
  }

  // Download single doc PDF — handles ALL doc types:
  // - React components (SPR BTN, Surat Pernyataan, BPHTB, Notaris) → html2canvas → jsPDF
  // - PDF overlay (FLPP BTN, AJB, Mandiri Pernyataan, BSB, SPR Mandiri) → fetch from API
  // - dok-kerja → buka CombinedDocEditorModal (Google Docs)
  // - lokasi-kerja → generate via create-lokasi API
  async function handleDownloadSingleReact() {
    // === PDF Overlay docs (fetch from API) ===
    const pdfOverlayDocs: Record<string, { endpoint: string; name: string; method?: string }> = {
      'flpp': { endpoint: '/api/documents/generate-flpp', name: 'Form_FLPP_BTN' },
      'ajb-bank': { endpoint: '/api/documents/generate-ajb', name: 'AJB_Bank' },
      'surat-lpa-akad': { endpoint: '/api/documents/generate-ajb', name: 'Surat_LPA_Akad' },
      'mandiri-pernyataan-pemohon': { endpoint: '/api/documents/generate-mandiri', name: 'Surat_Pernyataan_Pemohon_Mandiri' },
      'bsb-flpp': { endpoint: '/api/documents/generate-bsb', name: 'FLPP_BSB' },
      'bsb-spr': { endpoint: '/api/documents/generate-bsb', name: 'SPR_BSB' },
      'bsb-permohonan': { endpoint: '/api/documents/generate-bsb', name: 'Permohonan_BSB' },
      'bsb-kuasa-bendaharawan': { endpoint: '/api/documents/generate-bsb', name: 'Kuasa_Bendaharawan_BSB' },
      'bsb-pernyataan': { endpoint: '/api/documents/generate-bsb', name: 'Pernyataan_BSB' },
      'bsb-sbum': { endpoint: '/api/documents/generate-bsb', name: 'SBUM_BSB' },
    }

    // SPR Mandiri special case
    if (generateDocId === 'spr' && bank === 'MANDIRI') {
      pdfOverlayDocs['spr'] = { endpoint: '/api/documents/generate-spr-mandiri', name: 'SPR_Mandiri' }
    }

    if (pdfOverlayDocs[generateDocId]) {
      const { endpoint, name } = pdfOverlayDocs[generateDocId]
      setFlppGenerating(true)
      try {
        const isAjb = ['ajb-bank', 'surat-lpa-akad'].includes(generateDocId)
        const isBsb = generateDocId.startsWith('bsb-')
        const isMandiri = generateDocId.startsWith('mandiri-')
        const realDocId = generateDocId === 'surat-lpa-akad' ? 'surat-lpa' : generateDocId
        const body = (isAjb || isMandiri || isBsb) ? { state, docId: realDocId } : { state }
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${name}_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        toast.success(`${name} PDF berhasil di-download!`)
        return true
      } catch (err) {
        toast.error(`Gagal download ${name}: ` + (err instanceof Error ? err.message : 'unknown'))
        return false
      } finally { setFlppGenerating(false) }
    }

    // === dok-kerja → buka Google Docs modal (tidak download langsung) ===
    if (generateDocId === 'dok-kerja') {
      setCombinedDocModalOpen(true)
      return true
    }

    // === lokasi-kerja → generate Lokasi Kerja doc via API ===
    if (generateDocId === 'lokasi-kerja') {
      setFlppGenerating(true)
      try {
        const res = await fetch('/api/documents/google-docs/create-lokasi', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, customerId: customer.id }),
        })
        const d = await res.json()
        if (d.success) {
          // Download the generated doc
          const dlRes = await fetch(d.downloadUrl)
          if (dlRes.ok) {
            const blob = await dlRes.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${d.fileName}.docx`
            document.body.appendChild(a); a.click(); document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          }
          toast.success('Lokasi Kerja doc berhasil dibuat & didownload!')
          setLokasiDoc({ docId: d.docId, editUrl: d.editUrl, embedUrl: d.embedUrl, downloadUrl: d.downloadUrl })
          return true
        } else throw new Error(d.error || d.message || 'Failed')
      } catch (err) {
        toast.error('Gagal: ' + (err instanceof Error ? err.message : 'unknown'))
        return false
      } finally { setFlppGenerating(false) }
    }

    // === React component docs (html2canvas → jsPDF) ===
    const reactDocs: Record<string, { component: any; name: string; extraProps?: any }> = {
      'spr': { component: SPR_BTN, name: 'SPR' },
      'pernyataan-rumah': { component: SuratPernyataanTidakMemilikiRumah, name: 'Surat_Pernyataan_Tidak_Memiliki_Rumah' },
      'pernyataan-penghasilan': { component: SuratPernyataanPenghasilan, name: 'Surat_Pernyataan_Penghasilan' },
      'bphtb-pernyataan': { component: SuratPernyataanBPHTB, name: 'Surat_Pernyataan_BPHTB' },
      'bphtb-kuasa': { component: SuratKuasaBPHTB, name: 'Surat_Kuasa_BPHTB' },
      'notaris-bast': { component: BastNotaris, name: 'BAST_Notaris', extraProps: { notarisName: notarisList.find(n => n.id === selectedNotaris)?.name } },
      'notaris-tanda-terima': { component: TandaTerimaNotaris, name: 'Tanda_Terima_Notaris', extraProps: { notarisName: notarisList.find(n => n.id === selectedNotaris)?.name } },
      'notaris-pernyataan': { component: PernyataanPengecekanSHGB, name: 'Pernyataan_Pengecekan_SHGB' },
      'notaris-kuasa': { component: SuratKuasaNotaris, name: 'Surat_Kuasa_Notaris', extraProps: { notarisName: notarisList.find(n => n.id === selectedNotaris)?.name, notarisAddress: notarisList.find(n => n.id === selectedNotaris)?.address } },
    }

    if (!reactDocs[generateDocId]) {
      toast.info('Dokumen ini tidak memiliki tombol download individual. Gunakan Download All untuk merge semua berkas.')
      return false
    }

    const { component: DocComponent, name, extraProps } = reactDocs[generateDocId]
    setFlppGenerating(true)
    let printArea: HTMLDivElement | null = null
    let root: any = null
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
      printArea = document.createElement('div')
      Object.assign(printArea.style, { position: 'absolute', left: '-9999px', top: '0', width: '210mm', background: '#ffffff' })
      const { createRoot } = await import('react-dom/client')
      root = createRoot(printArea)
      document.body.appendChild(printArea)
      await new Promise(resolve => { root.render(React.createElement(DocComponent, { data: state, ...extraProps })); setTimeout(resolve, 800) })
      const canvas = await html2canvas(printArea, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: printArea.scrollWidth, windowHeight: printArea.scrollHeight })
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const imgWidth = 210, imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight, position = 0
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
      while (heightLeft > 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight); heightLeft -= 297 }
      pdf.save(`${name}_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success(`${name} PDF berhasil di-download!`)
      return true
    } catch (err) { toast.error(`Gagal generate ${name}: ` + (err instanceof Error ? err.message : 'unknown')); return false }
    finally { try { if (root) root.unmount(); if (printArea?.parentNode) printArea.parentNode.removeChild(printArea) } catch {} setFlppGenerating(false) }
  }

  // PDF preview via API overlay — handles FLPP + AJB documents
  const flppLoadingRef = useRef(false)
  async function loadFlppPreview() {
    if (flppLoadingRef.current) return
    flppLoadingRef.current = true
    setFlppLoading(true)
    try {
      // SPR Mandiri uses its own overlay endpoint
      const isSprMandiri = generateDocId === 'spr' && bank === 'MANDIRI'
      const isAjb = ['ajb-bank', 'surat-lpa-akad'].includes(generateDocId)
      const isMandiri = generateDocId.startsWith('mandiri-')
      const isBsb = generateDocId.startsWith('bsb-')
      const endpoint = isSprMandiri ? '/api/documents/preview-spr-mandiri'
        : isBsb ? '/api/documents/preview-bsb'
        : isMandiri ? '/api/documents/preview-mandiri'
        : isAjb ? '/api/documents/preview-ajb'
        : '/api/documents/preview-flpp'
      const realDocId = generateDocId === 'surat-lpa-akad' ? 'surat-lpa' : generateDocId
      const body = (isAjb || isMandiri || isBsb) ? { state, docId: realDocId } : { state }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
      const blob = await res.blob()
      const newUrl = URL.createObjectURL(blob)
      const oldUrl = flppBlobUrl
      setFlppBlobUrl(newUrl)
      if (oldUrl) setTimeout(() => URL.revokeObjectURL(oldUrl), 500)
    } catch (err) { toast.error('Gagal load preview: ' + (err instanceof Error ? err.message : 'unknown')) }
    finally { flppLoadingRef.current = false; setFlppLoading(false) }
  }

  // =========================================================
  // TEMPLATE-BASED PREVIEW & DOWNLOAD (SK Kerja & Slip Gaji)
  // Uses user-uploaded .docx template + docxtemplater
  // =========================================================
  function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, b64] = dataUrl.split(',')
    const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return new Blob([arr], { type: mime })
  }

  async function loadTemplatePreview(docType: 'sk-kerja' | 'slip-gaji') {
    const templateKey = `${docType}-template`
    const templateDataUrl = uploadedFiles[templateKey]
    if (!templateDataUrl) {
      setTemplatePreviewHtml(null)
      return
    }
    setTemplateLoading(true)
    try {
      const blob = dataUrlToBlob(templateDataUrl)
      const fd = new FormData()
      fd.append('template', blob, `template-${docType}.docx`)
      fd.append('docType', docType)
      fd.append('state', JSON.stringify(state))
      const res = await fetch('/api/documents/preview-docx-template', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }
      const html = await res.text()
      setTemplatePreviewHtml(html)
    } catch (err) {
      toast.error('Gagal load preview template: ' + (err instanceof Error ? err.message : 'unknown'))
      setTemplatePreviewHtml(null)
    } finally {
      setTemplateLoading(false)
    }
  }

  async function handleDownloadTemplateDoc(docType: 'sk-kerja' | 'slip-gaji') {
    const templateKey = `${docType}-template`
    const templateDataUrl = uploadedFiles[templateKey]
    if (!templateDataUrl) {
      toast.error('Belum ada template. Upload template .docx dulu di sidebar.')
      return
    }
    setFlppGenerating(true)
    try {
      const blob = dataUrlToBlob(templateDataUrl)
      const fd = new FormData()
      fd.append('template', blob, `template-${docType}.docx`)
      fd.append('docType', docType)
      fd.append('state', JSON.stringify(state))
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
      a.download = await res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1]
        || (docType === 'sk-kerja' ? `SK_Kerja_${state.applicant.fullName || 'Konsumen'}.docx` : `Slip_Gaji_${state.applicant.fullName || 'Konsumen'}.docx`)
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(`${docType === 'sk-kerja' ? 'SK Kerja' : 'Slip Gaji'} berhasil di-download (.docx)!`)
    } catch (err) {
      toast.error('Gagal download: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setFlppGenerating(false)
    }
  }

  // Load template preview when user clicks Slip Gaji / SK Kerja tab
  useEffect(() => {
    if (generateDocId === 'slip-gaji' || generateDocId === 'sk-kerja') {
      loadTemplatePreview(generateDocId as 'sk-kerja' | 'slip-gaji')
    } else {
      setTemplatePreviewHtml(null)
    }
  }, [generateDocId, uploadedFiles['sk-kerja-template'], uploadedFiles['slip-gaji-template']])

  // Refresh template preview when form data changes (debounced 2s)
  useEffect(() => {
    if (generateDocId !== 'slip-gaji' && generateDocId !== 'sk-kerja') return
    const docType = generateDocId as 'sk-kerja' | 'slip-gaji'
    if (!uploadedFiles[`${docType}-template`]) return
    const timer = setTimeout(() => { loadTemplatePreview(docType) }, 2000)
    return () => clearTimeout(timer)
  }, [state.applicant.fullName, state.applicant.ktpNumber, state.applicant.companyName, state.applicant.jobTitle, state.applicant.monthlyIncome, (state.applicant as any).gajiPokok, (state.applicant as any).tunjanganTetap, (state.applicant as any).tunjanganVariabel, (state.applicant as any).potongan, state.dateOfDocument])

  async function handleTemplateUpload(templateKey: string, dataUrl: string | null) {
    setUploadedFiles(prev => {
      const updated = { ...prev }
      if (dataUrl === null) {
        delete updated[templateKey]
      } else {
        updated[templateKey] = dataUrl
      }
      return updated
    })
  }

  // Generate Lokasi Kerja Google Doc (with photos + maps link embedded)
  async function handleGenerateLokasiDoc() {
    setGeneratingLokasi(true)
    try {
      const res = await fetch('/api/documents/google-docs/create-lokasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, customerId: customer.id }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || d.message || `HTTP ${res.status}`)

      setLokasiDoc({
        docId: d.docId,
        editUrl: d.editUrl,
        embedUrl: d.embedUrl,
        downloadUrl: d.downloadUrl,
      })
      toast.success('Dokumen Lokasi Kerja berhasil dibuat di Google Docs!')
    } catch (err) {
      toast.error('Gagal buat dokumen: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setGeneratingLokasi(false)
    }
  }

  useEffect(() => {
    // SPR Mandiri uses PDF overlay, so include 'spr' in the list for Mandiri
    const skipPdfIds = bank === 'MANDIRI'
      ? ['pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa', 'slip-gaji', 'sk-kerja', 'dok-kerja', 'lokasi-kerja']
      : ['spr', 'pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa', 'slip-gaji', 'sk-kerja', 'dok-kerja', 'lokasi-kerja']
    if (!skipPdfIds.includes(generateDocId) && !flppLoading) loadFlppPreview()
  }, [previewMode, generateDocId])

  // Refresh preview when key form data changes (debounced 2.5s)
  useEffect(() => {
    // Skip auto-refresh for React component docs (SPR + BPHTB + common) - they update live in DOM
    // SPR Mandiri uses PDF overlay (not React), so don't skip it
    const reactDocIds = bank === 'MANDIRI'
      ? ['pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa', 'slip-gaji', 'sk-kerja', 'dok-kerja', 'lokasi-kerja']
      : ['spr', 'pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa', 'slip-gaji', 'sk-kerja', 'dok-kerja', 'lokasi-kerja']
    if (reactDocIds.includes(generateDocId)) return
    const timer = setTimeout(() => { loadFlppPreview() }, 2500)
    return () => clearTimeout(timer)
  }, [state.applicant.fullName, state.applicant.ktpNumber, state.applicant.address, state.applicant.pob, state.applicant.dob, state.applicant.jobTitle, state.spouse?.fullName, state.spouse?.ktpNumber, state.spouse?.pob, state.spouse?.dob, state.spouse?.job, state.spouse?.address, state.property.projectName, state.property.kavlingNumber, state.property.houseAddress, state.dateOfDocument, state.akadDate, state.lpaDate])

  async function handleUpload(docId: string, file: File) {
    setUploadingId(docId)
    try {
      if (file.size > 10 * 1024 * 1024) { toast.error('File terlalu besar (max 10MB)'); return }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
      setUploadedFiles(prev => ({ ...prev, [docId]: dataUrl }))
      const label = [...requiredUploads, ...SIGNED_DOCS].find(u => u.id === docId)?.label || docId
      toast.success(`${label} berhasil diupload!`)

      // === AUTO UPLOAD TO GOOGLE DRIVE ===
      // Save file to customer's Drive folder with naming: [Dokumen] - [Nama] - Blok
      fetch('/api/documents/google-docs/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, docLabel: label, state, customerId: customer.id, overwrite: true }),
      }).then(r => r.json()).then(d => {
        if (d.success) toast.success(`📁 ${label} tersimpan di Google Drive`)
        else console.error('Drive upload failed:', d.error)
      }).catch(() => {}) // Silent fail - don't block upload flow

      // === AUTO OCR: KTP Debitur ===
      if (docId === 'ktp') {
        toast.info('🔍 Membaca data KTP...')
        try {
          const res = await fetch('/api/ocr/ktp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
          })
          const d = await res.json()
          if (d.success && d.data) {
            const ocr = d.data
            if (ocr.nama) updateApplicant('fullName', ocr.nama.toUpperCase())
            if (ocr.nik) updateApplicant('ktpNumber', ocr.nik)
            if (ocr.tempatLahir) updateApplicant('pob', ocr.tempatLahir.toUpperCase())
            if (ocr.tanggalLahir) {
              const parts = ocr.tanggalLahir.split('-')
              if (parts.length === 3) updateApplicant('dob', `${parts[2]}-${parts[1]}-${parts[0]}`)
            }
            if (ocr.alamat) updateApplicant('address', ocr.alamat.toUpperCase())
            if (ocr.pekerjaan) updateApplicant('jobTitle', ocr.pekerjaan.toUpperCase())
            if (ocr.statusPerkawinan) {
              const st = ocr.statusPerkawinan.toUpperCase()
              if (st.includes('KAWIN') && !st.includes('BELUM')) {
                setState(s => ({ ...s, maritalStatus: MaritalStatus.MARRIED }))
              } else {
                setState(s => ({ ...s, maritalStatus: MaritalStatus.SINGLE }))
              }
            }
            toast.success('✅ Data KTP otomatis terisi!')
          } else {
            toast.error('Gagal scan KTP: ' + (d.error || 'Unknown'))
          }
        } catch (err) { console.error('KTP OCR error:', err); toast.error('Gagal scan KTP, isi manual ya') }
      }

      // === AUTO OCR: KTP Pasangan ===
      if (docId === 'spouse-ktp') {
        toast.info('🔍 Membaca data KTP Pasangan...')
        try {
          const res = await fetch('/api/ocr/ktp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
          })
          const d = await res.json()
          if (d.success && d.data) {
            const ocr = d.data
            if (ocr.nama) updateSpouse('fullName', ocr.nama.toUpperCase())
            if (ocr.nik) updateSpouse('ktpNumber', ocr.nik)
            if (ocr.tempatLahir) updateSpouse('pob', ocr.tempatLahir.toUpperCase())
            if (ocr.tanggalLahir) {
              const parts = ocr.tanggalLahir.split('-')
              if (parts.length === 3) updateSpouse('dob', `${parts[2]}-${parts[1]}-${parts[0]}`)
            }
            if (ocr.alamat) updateSpouse('address', ocr.alamat.toUpperCase())
            if (ocr.pekerjaan) updateSpouse('job', ocr.pekerjaan.toUpperCase())
            toast.success('✅ Data KTP Pasangan otomatis terisi!')
          } else {
            toast.error('Gagal scan KTP pasangan: ' + (d.error || 'Unknown'))
          }
        } catch (err) { console.error('Spouse KTP OCR error:', err); toast.error('Gagal scan KTP pasangan') }
      }

      // === AUTO OCR: Sertifikat ===
      if (docId === 'sertifikat') {
        toast.info('🔍 Membaca nomor sertifikat...')
        try {
          const res = await fetch('/api/ocr/sertifikat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
          })
          const d = await res.json()
          if (d.success && d.data) {
            if (d.data.nomorSertifikat) updateProperty('shmNumber', d.data.nomorSertifikat)
            if (d.data.nib) updateProperty('nibNumber', d.data.nib)
            if (d.data.luasTanah) {
              const luas = parseInt(d.data.luasTanah.replace(/\D/g, ''))
              if (luas) updateProperty('landSize', luas)
            }
            toast.success('✅ Nomor sertifikat otomatis terisi!')
          } else {
            toast.error('Gagal scan sertifikat: ' + (d.error || 'Unknown'))
          }
        } catch (err) { console.error('Sertifikat OCR error:', err); toast.error('Gagal scan sertifikat') }
      }

      // === AUTO-SET TANGGAL SP3K saat upload SP3K/SPPK/SP4K ===
      if (docId === 'sp3k-btn' || docId === 'sppk-mandiri' || docId === 'sp4-bsb') {
        const today = new Date().toISOString().split('T')[0]
        setState(s => ({ ...s, sp3kDate: today }))
        toast.info(`📅 Tanggal SP3K otomatis di-set: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`)
      }

    } catch (err) { toast.error('Gagal upload: ' + (err instanceof Error ? err.message : 'unknown')) }
    finally { setUploadingId(null) }
  }

  const requiredUploads = getRequiredUploads(state.maritalStatus, state.spouse?.jobType)
  const uploadedCount = Object.keys(uploadedFiles).filter(k => requiredUploads.some(u => u.id === k)).length
  const signedCount = Object.keys(uploadedFiles).filter(k => SIGNED_DOCS.some(u => u.id === k && (!u.showWhen || u.showWhen === bank))).length
  const totalUploadCount = uploadedCount + signedCount
  const totalDocs = requiredUploads.length + SIGNED_DOCS.filter(d => !d.showWhen || d.showWhen === bank).length

  // Check if workplace data is filled (for Lokasi Kerja button status indicator)
  const a_workplaceHasData = !!(state.applicant as any).workplaceMapsLink || !!(state.applicant as any).workplaceFrontPhoto || !!(state.applicant as any).companyAddress

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-2 p-3 bg-accent/10 flex-wrap">
        {/* Mode selector: Bank | BPHTB | Notaris */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button onClick={() => { setFormMode('bank'); setDocStage('entry'); setGenerateDocId('flpp') }}
            className={cn('px-3 py-1.5 rounded text-[11px] font-medium', formMode === 'bank' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-muted-foreground')}>
            Bank
          </button>
          <button onClick={() => { setFormMode('bphtb'); setDocStage('bphtb'); setGenerateDocId('bphtb-pernyataan') }}
            className={cn('px-3 py-1.5 rounded text-[11px] font-medium', formMode === 'bphtb' ? 'bg-white dark:bg-slate-900 shadow text-amber-600' : 'text-muted-foreground')}>
            BPHTB
          </button>
          <button onClick={() => { setFormMode('notaris'); setDocStage('bphtb'); setGenerateDocId('bphtb-pernyataan') }}
            className={cn('px-3 py-1.5 rounded text-[11px] font-medium', formMode === 'notaris' ? 'bg-white dark:bg-slate-900 shadow text-blue-600' : 'text-muted-foreground')}>
            Notaris
          </button>
        </div>
        {/* Bank selector - only show in bank mode */}
        {formMode === 'bank' && (
          <select value={bank} onChange={e => setBank(e.target.value)} className="text-xs px-2 py-1.5 rounded border border-border bg-background">
            {/* Existing hardcoded banks — DO NOT TOUCH */}
            <option value="BTN">BTN</option><option value="MANDIRI">Mandiri</option><option value="BSB_SYARIAH">BSB Syariah</option>
            {/* Dynamic banks from BankConfig DB — added below, never replace existing */}
            {dbBanks.filter(b => !['BTN', 'MANDIRI', 'BSB_SYARIAH'].includes(b.bankCode)).map(b => (
              <option key={b.id} value={b.bankCode}>{b.bankName}</option>
            ))}
          </select>
        )}
        {/* Editor buttons for Combined Doc (SK+Slip) & Lokasi Kerja - only in bank mode Entry */}
        {formMode === 'bank' && docStage === 'entry' && (
          <>
            <button
              onClick={() => setCombinedDocModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors h-8 bg-amber-50 dark:bg-amber-950/20 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              title="Edit SK Kerja + Slip Gaji di Google Docs (Service Account)"
            >
              <FileText className="w-3 h-3" />
              <span>SK + Slip Gaji</span>
            </button>
            <button
              onClick={() => setLokasiModalOpen(true)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors h-8',
                (a_workplaceHasData)
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              )}
              title="Buka form Lokasi Tempat Kerja (Google Maps + foto + denah)"
            >
              <MapPin className="w-3 h-3" />
              <span>Lokasi Kerja</span>
              {a_workplaceHasData && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan</Button>
          <Button size="sm" onClick={handleDownloadSingleReact} disabled={flppGenerating} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" title="Download dokumen yang sedang di-preview saja">{flppGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}Single</Button>
          <Button size="sm" onClick={handleDownloadFlpp} disabled={flppGenerating} className="bg-orange-600 hover:bg-orange-700 h-8 text-xs" title="Download semua berkas dalam 1 PDF">{flppGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}{flppGenerating ? 'Generating...' : 'Download All'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 p-4 space-y-4 border-r border-border max-h-[70vh] overflow-y-auto">
          {/* Data Perusahaan - SELALU TAMPIL (default untuk Anjayo 16), editable, disimpan global */}
          <FormSection icon={<Building2 className="w-3 h-3" />} title="Data Perusahaan (Global)">
            <FormField label="Nama PT" value={companySettings.companyName || ''} onChange={v => updateCompanySetting('companyName', v)} />
            <FormField label="Direktur" value={companySettings.directorName || ''} onChange={v => updateCompanySetting('directorName', v)} />
            <FormField label="NIK Direktur" value={companySettings.directorNik || ''} onChange={v => updateCompanySetting('directorNik', v)} />
            <FormField label="No. HP Owner (Global)" value={(companySettings as any).directorPhone || ''} onChange={v => updateCompanySetting('directorPhone', v)} />
            <FormField label="Alamat KTP Direktur" value={(companySettings as any).directorAddress || ''} onChange={v => updateCompanySetting('directorAddress', v)} full />
            <FormField label="Alamat Kantor (Global)" value={(companySettings as any).officeAddress || ''} onChange={v => updateCompanySetting('officeAddress', v)} full />
            <FormField label="Kota" value={companySettings.city || ''} onChange={v => updateCompanySetting('city', v)} />
            {/* Rekening per bank - hanya tampil yang sesuai bank yang dipilih */}
            {bank === 'BTN' && <FormField label="Rekening BTN" value={companySettings.btnAccount || ''} onChange={v => updateCompanySetting('btnAccount', v)} />}
            {bank === 'MANDIRI' && <FormField label="Rekening Mandiri" value={companySettings.mandiriAccount || ''} onChange={v => updateCompanySetting('mandiriAccount', v)} />}
            {bank === 'BSB_SYARIAH' && <FormField label="Rekening BSB Syariah" value={companySettings.bsbAccount || ''} onChange={v => updateCompanySetting('bsbAccount', v)} />}
          </FormSection>
          <FormSection icon={<User className="w-3 h-3" />} title="Data Nasabah">
            <FormField label="Nama Lengkap (KTP)" value={state.applicant.fullName} onChange={v => updateApplicant('fullName', v)} required />
            <FormField label="NIK / No. KTP" value={state.applicant.ktpNumber} onChange={v => updateApplicant('ktpNumber', v)} />
            {formMode === 'bank' && <FormField label="NPWP" value={state.applicant.npwpNumber} onChange={v => updateApplicant('npwpNumber', v)} />}
            {formMode === 'bank' && <FormField label="Rekening BTN" value={state.applicant.btnAccountNumber} onChange={v => updateApplicant('btnAccountNumber', v)} />}
            <FormField label="Tempat Lahir" value={state.applicant.pob} onChange={v => updateApplicant('pob', v)} />
            <FormField label="Tanggal Lahir" type="date" value={state.applicant.dob} onChange={v => updateApplicant('dob', v)} />
            <FormField label="Alamat KTP" value={state.applicant.address} onChange={v => updateApplicant('address', v)} full />
            <FormField label="No. WhatsApp" value={state.applicant.phone} onChange={v => updateApplicant('phone', v)} />
            {bank === 'BSB_SYARIAH' && <FormField label="Alamat Domisili" value={state.applicant.domicileAddress || ''} onChange={v => updateApplicant('domicileAddress', v)} full />}
            {bank === 'BSB_SYARIAH' && <FormField label="Email" value={state.applicant.email || ''} onChange={v => updateApplicant('email', v)} />}
            {bank === 'BSB_SYARIAH' && <FormField label="NIP / No. Pokok Pegawai" value={state.applicant.nip || ''} onChange={v => updateApplicant('nip', v)} />}
          </FormSection>
          <FormSection icon={<Briefcase className="w-3 h-3" />} title="Pekerjaan">
            <div className="col-span-2 flex gap-1 mb-1">
              <button onClick={() => updateApplicant('jobType', JobType.EMPLOYEE)} className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.applicant.jobType === JobType.EMPLOYEE ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border')}>KARYAWAN</button>
              <button onClick={() => updateApplicant('jobType', JobType.ENTREPRENEUR)} className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.applicant.jobType === JobType.ENTREPRENEUR ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border')}>WIRAUSAHA</button>
            </div>
            <FormField label="Jabatan / Jenis Usaha" value={state.applicant.jobTitle} onChange={v => updateApplicant('jobTitle', v)} />
            <FormField label="Nama Perusahaan" value={state.applicant.companyName} onChange={v => updateApplicant('companyName', v)} />
            <FormField label="Alamat Perusahaan" value={state.applicant.companyAddress} onChange={v => updateApplicant('companyAddress', v)} full />
            <FormField label="Gaji Bersih / Bulan" type="number" value={state.applicant.monthlyIncome} onChange={v => updateApplicant('monthlyIncome', parseInt(v) || 0)} />
          </FormSection>
          {/* BSB-specific: Bendaharawan fields */}
          {bank === 'BSB_SYARIAH' && (
          <FormSection icon={<User className="w-3 h-3" />} title="Data Bendaharawan & Atasan (BSB)">
            <FormField label="Nama Bendaharawan" value={state.applicant.bendaharawanName || ''} onChange={v => updateApplicant('bendaharawanName', v)} full />
            <FormField label="NIP Bendaharawan" value={state.applicant.bendaharawanNip || ''} onChange={v => updateApplicant('bendaharawanNip', v)} />
            <FormField label="Nama Atasan" value={state.applicant.atasanName || ''} onChange={v => updateApplicant('atasanName', v)} full />
            <FormField label="NIP Atasan" value={state.applicant.atasanNip || ''} onChange={v => updateApplicant('atasanNip', v)} />
          </FormSection>
          )}
          <FormSection icon={<Heart className="w-3 h-3" />} title="Status Keluarga">
            <div className="col-span-2 flex gap-1 mb-1">
              <button onClick={() => setState(s => ({ ...s, maritalStatus: MaritalStatus.SINGLE }))} className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.maritalStatus === MaritalStatus.SINGLE ? 'bg-pink-500 text-white border-pink-500' : 'bg-card border-border')}>BELUM KAWIN</button>
              <button onClick={() => setState(s => ({ ...s, maritalStatus: MaritalStatus.MARRIED }))} className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.maritalStatus === MaritalStatus.MARRIED ? 'bg-pink-500 text-white border-pink-500' : 'bg-card border-border')}>KAWIN</button>
            </div>
            {state.maritalStatus === MaritalStatus.MARRIED && (
              <>
                <FormField label="Nama Pasangan" value={state.spouse?.fullName || ''} onChange={v => updateSpouse('fullName', v)} />
                <FormField label="NIK Pasangan" value={state.spouse?.ktpNumber || ''} onChange={v => updateSpouse('ktpNumber', v)} />
                <FormField label="Tempat Lahir" value={state.spouse?.pob || ''} onChange={v => updateSpouse('pob', v)} />
                <FormField label="Tanggal Lahir" type="date" value={state.spouse?.dob || ''} onChange={v => updateSpouse('dob', v)} />
                <FormField label="Pekerjaan" value={state.spouse?.job || ''} onChange={v => updateSpouse('job', v)} />
                <FormField label="Alamat Pasangan" value={state.spouse?.address || ''} onChange={v => updateSpouse('address', v)} full />
                <div className="col-span-2">
                  <label className="text-[9px] text-muted-foreground">Status Pekerjaan Pasangan</label>
                  <div className="flex gap-1 mt-0.5">
                    {(['NGANGGUR', 'KARYAWAN', 'WIRAUSAHA'] as SpouseJobType[]).map(jt => (
                      <button key={jt} onClick={() => updateSpouse('jobType', jt)} className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', (state.spouse?.jobType || 'NGANGGUR') === jt ? 'bg-pink-600 text-white border-pink-600' : 'bg-card border-border')}>{jt}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </FormSection>
          <FormSection icon={<Building2 className="w-3 h-3" />} title="Unit Properti">
            <FormField label="Nama Perumahan" value={state.property.projectName} onChange={v => updateProperty('projectName', v)} />
            <FormField label="Alamat" value={state.property.houseAddress} onChange={v => updateProperty('houseAddress', v)} full />
            <FormField label="Blok (Huruf)" value={state.property.blockLetter} onChange={v => {
              updateProperty('blockLetter', v)
              setState(s => ({ ...s, property: { ...s.property, blockLetter: v, kavlingNumber: `${v}${s.property.houseNumber || ''}` } }))
            }} />
            <FormField label="No. Rumah (Angka)" value={state.property.houseNumber} onChange={v => {
              updateProperty('houseNumber', v)
              setState(s => ({ ...s, property: { ...s.property, houseNumber: v, kavlingNumber: `${s.property.blockLetter || ''}${v}` } }))
            }} />
            <FormField label="Luas Tanah (m²)" type="number" value={state.property.landSize} onChange={v => updateProperty('landSize', parseInt(v) || 0)} />
            <FormField label="Luas Bangunan (m²)" type="number" value={state.property.houseSize} onChange={v => updateProperty('houseSize', parseInt(v) || 0)} />
            <FormField label="No. Sertifikat (SHM)" value={state.property.shmNumber} onChange={v => updateProperty('shmNumber', v)} />
            <FormField label="No. NIB" value={state.property.nibNumber} onChange={v => updateProperty('nibNumber', v)} />
            <FormField label="Harga Jual" type="number" value={state.property.price} onChange={v => updateProperty('price', parseInt(v) || 0)} />
            {formMode === 'bank' && <FormField label="DP" type="number" value={state.property.downPayment} onChange={v => updateProperty('downPayment', parseInt(v) || 0)} />}
            {formMode === 'bank' && <FormField label="Plafon KPR" type="number" value={state.property.kprPlafon} onChange={v => updateProperty('kprPlafon', parseInt(v) || 0)} />}
            {formMode === 'bank' && <FormField label="Tenor (tahun)" type="number" value={state.property.kprTerm} onChange={v => updateProperty('kprTerm', parseInt(v) || 0)} />}
            <FormField label="Tanggal Dokumen" type="date" value={state.dateOfDocument} onChange={v => setState(s => ({ ...s, dateOfDocument: v }))} full />
            {formMode === 'bank' && <FormField label="Tanggal Akad" type="date" value={state.akadDate || ''} onChange={v => setState(s => ({ ...s, akadDate: v }))} />}
            {formMode === 'bank' && <FormField label="No. Akad" value={state.akadNumber || ''} onChange={v => setState(s => ({ ...s, akadNumber: v }))} />}
            {formMode === 'bank' && <FormField label="Tanggal LPA" type="date" value={state.lpaDate || ''} onChange={v => setState(s => ({ ...s, lpaDate: v }))} />}
            {formMode === 'bank' && <FormField label="No. LPA" value={state.lpaNumber || ''} onChange={v => setState(s => ({ ...s, lpaNumber: v }))} />}
            {formMode === 'bank' && <FormField label="Tanggal SP3K" type="date" value={state.sp3kDate || ''} onChange={v => setState(s => ({ ...s, sp3kDate: v }))} />}
          </FormSection>
          {/* Post-SP3K BTN file requirements - only when AJB stage for BTN */}
          {formMode === 'bank' && docStage === 'ajb' && bank === 'BTN' && (
            <div>
              <h4 className="text-[10px] font-bold text-violet-400 uppercase mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Kebutuhan Post-SP3K BTN
              </h4>
              <div className="space-y-1">
                {[
                  'Surat Pernyataan Debitur PBG',
                  'Standing Instruction',
                  'Surat Pernyataan SPSU',
                  'Surat Pernyataan PSU',
                  'Surat Pernyataan Debitur',
                  'Validasi PPH',
                  'Validasi BPHTB',
                  'Buku Tabungan',
                  'SLF (Sertifikat Laik Fungsi)',
                  'Standing Instruction LPA',
                  'Hasil Checking Sertipikat (dari Notaris)',
                  'Sertifikasi SLF',
                  'Surat Pernyataan & Kuasa Pemblokiran',
                  'Bale BTN',
                  'Surat Kuasa Notaris',
                ].map((label, i) => {
                  const docId = `post-sp3k-${i}`
                  const isUploaded = !!uploadedFiles[docId]
                  return (
                    <div key={docId} className={cn('flex items-center gap-2 p-1.5 rounded border text-[10px]', isUploaded ? 'border-emerald-700/30 bg-emerald-950/10' : 'border-violet-500/30 bg-violet-950/10')}>
                      <span>{isUploaded ? '✅' : '⬜'}</span>
                      <span className="flex-1">{i + 1}. {label}</span>
                      {isUploaded && <button onClick={() => setPreviewUrl(uploadedFiles[docId])} className="text-muted-foreground hover:text-foreground"><Eye className="w-3 h-3" /></button>}
                      <input type="file" accept="image/*,.pdf" className="hidden" id={`upload-${docId}`} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(docId, f); e.target.value = '' }} />
                      <button onClick={() => document.getElementById(`upload-${docId}`)?.click()} disabled={uploadingId === docId} className={cn('text-[9px] px-1.5 py-0.5 rounded border', isUploaded ? 'border-border text-muted-foreground' : 'border-violet-500/30 text-violet-400')}>
                        {uploadingId === docId ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isUploaded ? 'Ganti' : 'Upload'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Slip Gaji & SK Kerja Form + Lokasi Tempat Kerja - show in bank mode Entry */}
          {/* NOTE: Template upload for SK Kerja & Slip Gaji is in the top action bar (TemplatePopover) */}
          {formMode === 'bank' && docStage === 'entry' && (
            <SlipGajiForm state={state} onUpdate={(field, val) => updateApplicant(field as keyof ApplicantData, val)} />
          )}
          {formMode === 'bank' && docStage === 'entry' && (
            <LokasiTempatKerja state={state}
              onUpdate={(field, val) => updateApplicant(field as keyof ApplicantData, val)}
              onPhotoUpload={async (field, file) => {
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = () => reject(new Error('fail')); reader.readAsDataURL(file)
                })
                updateApplicant(field as keyof ApplicantData, dataUrl)
              }} />
          )}
          {/* Upload sections - ONLY in bank mode */}
          {formMode === 'bank' && (
          <>
          <div>
            <h4 className="text-[10px] font-bold text-amber-400 uppercase mb-2 flex items-center gap-1"><Upload className="w-3 h-3" /> Dokumen Wajib ({uploadedCount}/{requiredUploads.length})</h4>
            <div className="space-y-1.5">
              {requiredUploads.map(doc => {
                const isUploaded = !!uploadedFiles[doc.id]
                return (
                  <div key={doc.id} className={cn('flex items-center gap-2 p-1.5 rounded border', isUploaded ? 'border-emerald-700/30 bg-emerald-950/10' : 'border-slate-200 dark:border-slate-700')}>
                    <span className="text-xs">{isUploaded ? '✅' : '❌'}</span>
                    <div className="flex-1 min-w-0"><p className="text-[10px] font-medium truncate">{doc.label}</p><p className="text-[8px] text-muted-foreground truncate">{doc.desc}</p></div>
                    {isUploaded && <button onClick={() => setPreviewUrl(uploadedFiles[doc.id])} className="text-muted-foreground hover:text-foreground"><Eye className="w-3 h-3" /></button>}
                    <input type="file" accept="image/*,.pdf" className="hidden" id={`upload-${doc.id}`} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.id, f); e.target.value = '' }} />
                    <button onClick={() => document.getElementById(`upload-${doc.id}`)?.click()} disabled={uploadingId === doc.id} className={cn('text-[9px] px-1.5 py-0.5 rounded border', isUploaded ? 'border-border text-muted-foreground' : 'border-amber-500/30 text-amber-400 bg-amber-950/20')}>{uploadingId === doc.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isUploaded ? 'Ganti' : 'Upload'}</button>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-violet-400 uppercase mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Dokumen Cetak & TTD ({signedCount}/{SIGNED_DOCS.filter(d => !d.showWhen || d.showWhen === bank).length})</h4>
            <div className="space-y-1.5">
              {SIGNED_DOCS.filter(doc => !doc.showWhen || doc.showWhen === bank).map(doc => {
                const isUploaded = !!uploadedFiles[doc.id]
                return (
                  <div key={doc.id} className={cn('flex items-center gap-2 p-1.5 rounded border', isUploaded ? 'border-violet-700/30 bg-violet-950/10' : 'border-slate-200 dark:border-slate-700')}>
                    <span className="text-xs">{isUploaded ? '✅' : '❌'}</span>
                    <div className="flex-1 min-w-0"><p className="text-[10px] font-medium truncate">{doc.label}</p><p className="text-[8px] text-muted-foreground truncate">{doc.desc}</p></div>
                    {isUploaded && <button onClick={() => setPreviewUrl(uploadedFiles[doc.id])} className="text-muted-foreground hover:text-foreground"><Eye className="w-3 h-3" /></button>}
                    <input type="file" accept="image/*,.pdf" className="hidden" id={`upload-${doc.id}`} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.id, f); e.target.value = '' }} />
                    <button onClick={() => document.getElementById(`upload-${doc.id}`)?.click()} disabled={uploadingId === doc.id} className={cn('text-[9px] px-1.5 py-0.5 rounded border', isUploaded ? 'border-border text-muted-foreground' : 'border-violet-500/30 text-violet-400 bg-violet-950/20')}>{uploadingId === doc.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isUploaded ? 'Ganti' : 'Upload'}</button>
                  </div>
                )
              })}
            </div>
          </div>
          </>
          )}

          {/* Notaris-specific: Sertifikat address fields */}
          {formMode === 'notaris' && (
          <FormSection icon={<Building2 className="w-3 h-3" />} title="Alamat Sertifikat (Notaris)">
            <FormField label="No. Sertifikat (SHM)" value={state.property.shmNumber} onChange={v => updateProperty('shmNumber', v)} />
            <FormField label="Tgl Terbit Sertifikat" type="date" value={state.property.certificateDate} onChange={v => updateProperty('certificateDate', v)} />
            <FormField label="Jalan" value={state.property.certStreet} onChange={v => updateProperty('certStreet', v)} full />
            <FormField label="Kelurahan" value={state.property.certKelurahan} onChange={v => updateProperty('certKelurahan', v)} />
            <FormField label="Kecamatan" value={state.property.certKecamatan} onChange={v => updateProperty('certKecamatan', v)} />
            <FormField label="Kota" value={state.property.certCity} onChange={v => updateProperty('certCity', v)} />
            <FormField label="No. NIB" value={state.property.nibNumber} onChange={v => updateProperty('nibNumber', v)} />
          </FormSection>
          )}

          {/* Notaris form fields - show when Notaris mode */}
          {formMode === 'notaris' && (
            <FormSection icon={<User className="w-3 h-3" />} title="Data Notaris">
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground">Pilih Notaris</label>
                <div className="flex gap-1 mt-0.5">
                  <select value={selectedNotaris} onChange={e => setSelectedNotaris(e.target.value)}
                    className="flex-1 bg-background/50 border border-border rounded px-2 py-1 text-xs">
                    <option value="">— Pilih Notaris —</option>
                    {notarisList.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                  <button onClick={() => {
                    const n = prompt('Nama + Gelar Notaris:'); if (!n) return;
                    const a = prompt('Alamat Kantor Notaris (opsional):') || '';
                    fetch('/api/notaris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n, address: a, city: 'Pangkalpinang' }) })
                      .then(r => r.json()).then(d => { if (d.success) { setNotarisList(prev => [...prev, d.data]); setSelectedNotaris(d.data.id); toast.success('Notaris ditambahkan!') } })
                  }} className="px-2 py-1 text-[9px] rounded border border-blue-500/30 text-blue-400 bg-blue-950/20">+ Tambah</button>
                </div>
                {selectedNotaris && (() => { const n = notarisList.find(x => x.id === selectedNotaris); return n ? (
                  <div className="mt-2 p-2 rounded border border-blue-500/20 bg-blue-950/10 text-[10px] space-y-1">
                    <p><strong>Nama:</strong> {n.name}</p>
                    {n.address && <p><strong>Alamat:</strong> {n.address}</p>}
                    {n.city && <p><strong>Kota:</strong> {n.city}</p>}
                    <button onClick={() => {
                      const a = prompt('Alamat Kantor Notaris:', n.address || '');
                      if (a !== null) fetch('/api/notaris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n.name, address: a, city: n.city }) })
                        .then(r => r.json()).then(d => { if (d.success) { setNotarisList(prev => prev.map(x => x.id === n.id ? { ...x, address: a } : x)); toast.success('Alamat diperbarui!') } })
                    }} className="text-[9px] text-blue-400 hover:underline">✏️ Edit Alamat</button>
                    <button onClick={() => {
                      if (confirm(`Hapus notaris "${n.name}"?`)) {
                        fetch('/api/notaris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: n.id }) })
                          .then(r => r.json()).then(d => { if (d.success) { setNotarisList(prev => prev.filter(x => x.id !== n.id)); setSelectedNotaris(''); toast.success('Notaris dihapus!') } })
                      }
                    }} className="text-[9px] text-red-400 hover:underline">🗑️ Hapus</button>
                  </div>
                ) : null; })()}
              </div>
            </FormSection>
          )}

          {/* Notaris file requirements - show when Notaris mode */}
          {formMode === 'notaris' && (
            <div>
              <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Kebutuhan Berkas Notaris
              </h4>
              <div className="space-y-1">
                {[
                  { id: 'pbg-imb', label: '1. PBG / IMB', source: 'bank', from: 'sertifikat' },
                  { id: 'pbb-notaris', label: '2. PBB + Bukti Bayar', source: 'bphtb', from: 'pbb' },
                  { id: 'pph-bukti', label: '3. PPH + Bukti Bayar', source: 'new' },
                  { id: 'akta-pendirian', label: '4. Akta Pendirian PT + AHU', source: 'new' },
                  { id: 'akta-perubahan', label: '5. Akta Perubahan PT + AHU', source: 'new' },
                  { id: 'kwitansi-rumah-notaris', label: '6. Kwitansi Harga Rumah', source: 'new' },
                  { id: 'ktp-notaris', label: '7. KTP Debitur', source: 'bank', from: 'ktp' },
                  { id: 'spouse-ktp-notaris', label: '8. KTP Pasangan', source: 'bank', from: 'spouse-ktp', showWhen: state.maritalStatus === 'Sudah Menikah' },
                  { id: 'kk-notaris', label: '9. Kartu Keluarga', source: 'bank', from: 'kk' },
                  { id: 'npwp-notaris', label: '10. NPWP', source: 'bank', from: 'npwp' },
                  { id: 'sp3k-notaris', label: '11. SP3K / SPPK / SP4', source: 'bank', from: bank === 'BTN' ? 'sp3k-btn' : bank === 'MANDIRI' ? 'sppk-mandiri' : 'sp4-bsb' },
                  { id: 'status-nikah-notaris', label: '12. Akte Nikah / Cerai / Blm Menikah', source: 'bank', from: 'status-nikah' },
                  { id: 'ktp-direktur', label: '13. KTP Direktur', source: 'new' },
                  { id: 'bast-sertipikat', label: '14. BAST Penyerahan Sertipikat', source: 'generated' },
                  { id: 'npwp-pt', label: '15. NPWP PT', source: 'new' },
                  { id: 'surat-kuasa-notaris', label: '16. Surat Kuasa Notaris', source: 'generated' },
                ].filter(d => !d.showWhen || d.showWhen).map(doc => {
                  const isReady = doc.source === 'generated' || doc.source === 'bank' ? (doc.source === 'generated' || !!uploadedFiles[doc.from || '']) : !!uploadedFiles[doc.id]
                  return (
                    <div key={doc.id} className={cn('flex items-center gap-2 p-1.5 rounded border text-[10px]', isReady ? 'border-emerald-700/30 bg-emerald-950/10' : 'border-blue-500/30 bg-blue-950/10')}>
                      <span>{isReady ? '✅' : '⬜'}</span>
                      <span className="flex-1">{doc.label}</span>
                      <span className="text-[8px] text-muted-foreground">
                        {doc.source === 'generated' ? '⚡ Auto-generate' : doc.source === 'bank' ? '📦 Dari berkas bank' : doc.source === 'bphtb' ? '📦 Dari BPHTB' : '📤 Upload baru'}
                      </span>
                      {doc.source === 'new' && (
                        <>
                          {uploadedFiles[doc.id] && <button onClick={() => setPreviewUrl(uploadedFiles[doc.id])} className="text-muted-foreground hover:text-foreground"><Eye className="w-3 h-3" /></button>}
                          <input type="file" accept="image/*,.pdf" className="hidden" id={`upload-${doc.id}`} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.id, f); e.target.value = '' }} />
                          <button onClick={() => document.getElementById(`upload-${doc.id}`)?.click()} disabled={uploadingId === doc.id} className="text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400">
                            {uploadingId === doc.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : uploadedFiles[doc.id] ? 'Ganti' : 'Upload'}
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {formMode !== 'bank' && (
            <div>
              <h4 className="text-[10px] font-bold text-amber-400 uppercase mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Kebutuhan Berkas BPHTB
              </h4>
              <div className="space-y-1">
                {[
                  { id: 'sertifikat', label: '1. Sertipikat', source: 'bank', from: 'sertifikat' },
                  { id: 'pbb', label: '2. PBB', source: 'bank', from: 'pbb' },
                  { id: 'bphtb-bukti-bayar-pbb', label: '3. Bukti Bayar PBB', source: 'new' },
                  { id: 'bphtb-pernyataan', label: '4. Pernyataan Penghasilan', source: 'generated' },
                  { id: 'bphtb-kwitansi', label: '5. Kwitansi Harga Rumah', source: 'new' },
                  { id: 'ktp', label: '6. KTP Debitur', source: 'bank', from: 'ktp' },
                  { id: 'spouse-ktp', label: '7. KTP Pasangan', source: 'bank', from: 'spouse-ktp', showWhen: state.maritalStatus === 'Sudah Menikah' },
                  { id: 'kk', label: '8. Kartu Keluarga', source: 'bank', from: 'kk' },
                  { id: 'npwp', label: '9. NPWP', source: 'bank', from: 'npwp' },
                  { id: 'bphtb-sppk', label: '10. SPPK / SP3K / SP4K', source: 'new' },
                  { id: 'status-nikah', label: '11. Akte Nikah / Cerai / Blm Menikah', source: 'bank', from: 'status-nikah' },
                  { id: 'bphtb-kuasa', label: '12. Surat Kuasa', source: 'generated' },
                ].filter(d => !d.showWhen || d.showWhen).map(doc => {
                  const isReady = doc.source === 'generated' || doc.source === 'bank'
                    ? (doc.source === 'generated' || !!uploadedFiles[doc.from || ''])
                    : !!uploadedFiles[doc.id]
                  return (
                    <div key={doc.id} className={cn('flex items-center gap-2 p-1.5 rounded border text-[10px]', isReady ? 'border-emerald-700/30 bg-emerald-950/10' : 'border-amber-500/30 bg-amber-950/10')}>
                      <span>{isReady ? '✅' : '⬜'}</span>
                      <span className="flex-1">{doc.label}</span>
                      <span className="text-[8px] text-muted-foreground">
                        {doc.source === 'generated' ? '⚡ Auto-generate' : doc.source === 'bank' ? '📦 Dari berkas bank' : '📤 Upload baru'}
                      </span>
                      {doc.source === 'new' && (
                        <>
                          {uploadedFiles[doc.id] && <button onClick={() => setPreviewUrl(uploadedFiles[doc.id])} className="text-muted-foreground hover:text-foreground"><Eye className="w-3 h-3" /></button>}
                          <input type="file" accept="image/*,.pdf" className="hidden" id={`upload-${doc.id}`} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.id, f); e.target.value = '' }} />
                          <button onClick={() => document.getElementById(`upload-${doc.id}`)?.click()} disabled={uploadingId === doc.id} className="text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400">
                            {uploadingId === doc.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : uploadedFiles[doc.id] ? 'Ganti' : 'Upload'}
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-3 bg-slate-200 dark:bg-slate-800 p-4 max-h-[70vh] overflow-auto">
          <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 mb-3 shadow-sm">
            <button onClick={() => setPreviewMode('generate')} className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium', previewMode === 'generate' ? 'bg-emerald-600 text-white shadow' : 'text-muted-foreground hover:text-foreground')}><FileText className="w-3.5 h-3.5" /> Preview Dokumen</button>
            <button onClick={() => setPreviewMode('uploads')} className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium', previewMode === 'uploads' ? 'bg-amber-600 text-white shadow' : 'text-muted-foreground hover:text-foreground')}><LayoutGrid className="w-3.5 h-3.5" /> Review Berkas ({totalUploadCount}/{totalDocs})</button>
          </div>

          {previewMode === 'generate' && (
            <>
              {/* Stage toggle: Entry vs AJB - ONLY in bank mode */}
              {formMode === 'bank' && (
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mb-3">
                <button onClick={() => { setDocStage('entry'); setGenerateDocId('flpp') }}
                  className={cn('flex-1 px-3 py-1.5 rounded text-[11px] font-medium', docStage === 'entry' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-muted-foreground')}>
                  Entry (Pre-Bank)
                </button>
                {bank === 'BTN' && <button onClick={() => { setDocStage('ajb'); setGenerateDocId('ajb-bank') }}
                  className={cn('flex-1 px-3 py-1.5 rounded text-[11px] font-medium', docStage === 'ajb' ? 'bg-white dark:bg-slate-900 shadow text-violet-600' : 'text-muted-foreground')}>
                  AJB (Post-SP3K)
                </button>}
              </div>
              )}
              <div className="flex gap-1 mb-3 flex-wrap">
                {formMode === 'bank' && docStage === 'entry' ? (
                  <>
                    {bank !== 'BSB_SYARIAH' && <button onClick={() => setGenerateDocId('spr')} className={cn('px-3 py-1.5 rounded text-[10px] font-medium border flex items-center gap-1.5', generateDocId === 'spr' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> SPR</button>}
                    {bank === 'BTN' && <button onClick={() => setGenerateDocId('flpp')} className={cn('px-3 py-1.5 rounded text-[10px] font-medium border flex items-center gap-1.5', generateDocId === 'flpp' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Form FLPP BTN</button>}
                    {bank === 'MANDIRI' && <button onClick={() => setGenerateDocId('mandiri-pernyataan-pemohon')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'mandiri-pernyataan-pemohon' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Pernyataan Pemohon</button>}
                    {bank === 'BSB_SYARIAH' && <>
                      <button onClick={() => setGenerateDocId('bsb-flpp')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bsb-flpp' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> FLPP</button>
                      <button onClick={() => setGenerateDocId('bsb-spr')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bsb-spr' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> SPR</button>
                      <button onClick={() => setGenerateDocId('bsb-permohonan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bsb-permohonan' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Permohonan</button>
                      <button onClick={() => setGenerateDocId('bsb-kuasa-bendaharawan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bsb-kuasa-bendaharawan' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Kuasa Bendaharawan</button>
                      <button onClick={() => setGenerateDocId('bsb-pernyataan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bsb-pernyataan' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Pernyataan</button>
                      <button onClick={() => setGenerateDocId('bsb-sbum')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bsb-sbum' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> SBUM</button>
                    </>}
                    {bank !== 'BSB_SYARIAH' && <button onClick={() => setGenerateDocId('pernyataan-rumah')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'pernyataan-rumah' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Tidak Punya Rumah</button>}
                    {bank !== 'BSB_SYARIAH' && <button onClick={() => setGenerateDocId('pernyataan-penghasilan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'pernyataan-penghasilan' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Penghasilan</button>}
                    {/* NEW: Dokumen Kerja preview tab (shows saved SK+Slip HTML + Denah from Lokasi Kerja) */}
                    <button onClick={() => setGenerateDocId('dok-kerja')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'dok-kerja' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Dok Kerja</button>
                    <button onClick={() => setGenerateDocId('lokasi-kerja')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'lokasi-kerja' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><MapPin className="w-3 h-3" /> Lokasi Kerja {((state.applicant as any).workplaceFrontPhoto || (state.applicant as any).workplaceMapsLink) ? '✓' : ''}</button>
                    {/* NOTE: Slip Gaji & SK Kerja diakses via tombol di action bar (CombinedDocumentEditorModal), bukan di sini */}
                  </>
                ) : formMode === 'bank' && docStage === 'ajb' ? (
                  <>
                    <button onClick={() => setGenerateDocId('ajb-bank')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'ajb-bank' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> AJB Bank</button>
                    <button onClick={() => setGenerateDocId('surat-lpa-akad')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'surat-lpa-akad' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat LPA & Akad</button>
                  </>
                ) : formMode === 'notaris' ? (
                  <>
                    <button onClick={() => setGenerateDocId('notaris-bast')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'notaris-bast' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> BAST</button>
                    <button onClick={() => setGenerateDocId('notaris-tanda-terima')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'notaris-tanda-terima' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Tanda Terima</button>
                    <button onClick={() => setGenerateDocId('notaris-pernyataan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'notaris-pernyataan' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Pernyataan Pengecekan</button>
                    <button onClick={() => setGenerateDocId('notaris-kuasa')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'notaris-kuasa' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Kuasa</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setGenerateDocId('bphtb-pernyataan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bphtb-pernyataan' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Pernyataan</button>
                    <button onClick={() => setGenerateDocId('bphtb-kuasa')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bphtb-kuasa' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Kuasa</button>
                  </>
                )}
                {/* Show Refresh button for PDF overlay docs (including SPR Mandiri) */}
                {(() => {
                  const isSprMandiri = generateDocId === 'spr' && bank === 'MANDIRI'
                  const reactSkipList = ['spr', 'pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa']
                  const showRefresh = isSprMandiri || !reactSkipList.includes(generateDocId)
                  return showRefresh && <button onClick={loadFlppPreview} disabled={flppLoading} className="ml-auto px-2 py-1.5 rounded text-[9px] font-medium border bg-white dark:bg-slate-700 text-muted-foreground border-border hover:text-foreground disabled:opacity-50 flex items-center gap-1"><RefreshCw className={cn('w-3 h-3', flppLoading && 'animate-spin')} /> Refresh</button>
                })()}
              </div>

              {/* SPR Preview - BTN uses React component, Mandiri uses PDF overlay */}
              {generateDocId === 'spr' && bank !== 'MANDIRI' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}>
                    <SPR_BTN data={state} />
                  </div>
                </div>
              )}

              {/* Surat Pernyataan Tidak Memiliki Rumah Preview */}
              {generateDocId === 'pernyataan-rumah' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><SuratPernyataanTidakMemilikiRumah data={state} /></div>
                </div>
              )}

              {/* Surat Pernyataan Penghasilan Preview */}
              {generateDocId === 'pernyataan-penghasilan' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><SuratPernyataanPenghasilan data={state} /></div>
                </div>
              )}

              {/* BPHTB Surat Pernyataan Preview (React component) */}
              {generateDocId === 'bphtb-pernyataan' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><SuratPernyataanBPHTB data={state} /></div>
                </div>
              )}

              {/* BPHTB Surat Kuasa Preview (React component) */}
              {generateDocId === 'bphtb-kuasa' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><SuratKuasaBPHTB data={state} /></div>
                </div>
              )}

              {/* Notaris Previews (React components) */}
              {generateDocId === 'notaris-bast' && (() => { const n = notarisList.find(x => x.id === selectedNotaris); return (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><BastNotaris data={state} notarisName={n?.name} /></div>
                </div>
              )})()}
              {generateDocId === 'notaris-tanda-terima' && (() => { const n = notarisList.find(x => x.id === selectedNotaris); return (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><TandaTerimaNotaris data={state} notarisName={n?.name} /></div>
                </div>
              )})()}
              {generateDocId === 'notaris-pernyataan' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><PernyataanPengecekanSHGB data={state} /></div>
                </div>
              )}
              {generateDocId === 'notaris-kuasa' && (() => { const n = notarisList.find(x => x.id === selectedNotaris); return (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}><SuratKuasaNotaris data={state} notarisName={n?.name} notarisAddress={n?.address} /></div>
                </div>
              )})()}

              {/* Dok Kerja Preview - SK + Slip Gaji only (Lokasi Kerja terpisah di tab sendiri) */}
              {generateDocId === 'dok-kerja' && (
                <div className="space-y-4 text-slate-900" style={{ colorScheme: 'light' }}>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold flex items-center gap-1.5"><FileText className="w-4 h-4 text-cyan-600" /> SK Kerja + Slip Gaji</h3>
                      <button
                        onClick={() => setCombinedDocModalOpen(true)}
                        className="text-xs px-3 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-700 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> Buat & Edit di Google Docs
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded p-3 border border-slate-200 text-xs text-slate-600">
                      <p className="font-bold text-slate-700 mb-1">Cara pakai:</p>
                      <ol className="list-decimal list-inside space-y-0.5">
                        <li>Klik tombol di atas → pilih template (20 pilihan)</li>
                        <li>System buat Google Doc baru otomatis terisi data form (SK + 7 Slip Gaji)</li>
                        <li>Edit langsung di <strong>Google Docs editor</strong> yang di-embed di dalam modal (paste logo, ubah font/layout, dll)</li>
                        <li>Klik <strong>Download .docx</strong> untuk export sebagai Word file</li>
                      </ol>
                      <p className="text-[10px] text-slate-500 mt-2">Dokumen tersimpan otomatis di Google Drive (folder: Hadi Kaya Docs {'>'} [Perumahan] {'>'} Berkas Konsumen {'>'} [Nama Konsumen - Blok]).</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lokasi Kerja Preview - Google Maps + Foto + Short Link + Generate Doc */}
              {generateDocId === 'lokasi-kerja' && (
                <div className="space-y-4 text-slate-900" style={{ colorScheme: 'light' }}>
                  {/* Generate Document section */}
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-600" /> Dokumen Lokasi Kerja</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLokasiModalOpen(true)}
                          className="text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-600 hover:bg-blue-50"
                        >
                          Edit Data
                        </button>
                        <button
                          onClick={handleGenerateLokasiDoc}
                          disabled={generatingLokasi}
                          className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {generatingLokasi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                          {generatingLokasi ? 'Generating...' : lokasiDoc ? 'Regenerate' : 'Generate Dokumen'}
                        </button>
                      </div>
                    </div>

                    {/* If doc generated, show embedded Google Docs + download */}
                    {lokasiDoc ? (
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 flex items-center justify-between">
                          <p className="text-[11px] text-blue-700">✓ Dokumen dibuat di Google Docs. Edit langsung di bawah atau buka full editor.</p>
                          <div className="flex gap-1.5">
                            <a href={lokasiDoc.editUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1">
                              <ExternalLink className="w-2.5 h-2.5" /> Full Editor
                            </a>
                            <a href={lokasiDoc.downloadUrl} className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                              <Download className="w-2.5 h-2.5" /> .docx
                            </a>
                          </div>
                        </div>
                        <iframe
                          src={lokasiDoc.embedUrl}
                          className="w-full border border-slate-200 rounded"
                          style={{ height: '500px' }}
                          title="Lokasi Kerja Doc"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded p-3 border border-slate-200 text-xs text-slate-600">
                        <p className="font-bold text-slate-700 mb-1">Klik "Generate Dokumen" untuk membuat Google Doc berisi:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Link Google Maps + short link</li>
                          <li>Foto Tampak Depan (embedded)</li>
                          <li>Foto Tampak Dalam (embedded)</li>
                          <li>Opening Hours, Shift Debitur, No HP Pemilik</li>
                        </ul>
                        <p className="text-[10px] text-slate-500 mt-2">Pastikan data lokasi sudah diisi via tombol "Edit Data" sebelum generate.</p>
                      </div>
                    )}
                  </div>

                  {/* Data preview (Google Maps + Foto + Info) */}
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-600" /> Preview Data Lokasi</h3>
                    {/* Google Maps embed */}
                    {(state.applicant as any).workplaceMapsLink && (
                      <div className="mb-3">
                        <iframe
                          src={`https://maps.google.com/maps?q=${encodeURIComponent((state.applicant as any).workplaceMapsLink)}&z=16&output=embed`}
                          className="w-full h-64 rounded border border-slate-200"
                          title="Lokasi Tempat Kerja"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    )}
                    {/* Short link */}
                    {(state.applicant as any).workplaceMapsShortLink && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-[10px] text-blue-600 font-bold uppercase mb-0.5">Short Link untuk Bank</p>
                        <p className="text-[11px] font-mono text-blue-800 break-all">{(state.applicant as any).workplaceMapsShortLink}</p>
                      </div>
                    )}
                    {/* Photos */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Tampak Depan', val: (state.applicant as any).workplaceFrontPhoto },
                        { label: 'Tampak Dalam', val: (state.applicant as any).workplaceInsidePhoto },
                      ].map((photo, i) => (
                        <div key={i} className="border border-slate-200 rounded p-2 text-center">
                          <p className="text-[10px] text-slate-600 mb-1">{photo.label}</p>
                          {photo.val ? (
                            <img src={photo.val} alt={photo.label} className="w-full h-32 object-cover rounded" />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center bg-slate-50 rounded text-[10px] text-slate-400">Belum ada</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Info */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-slate-500">Alamat:</span> {(state.applicant as any).companyAddress || '-'}</div>
                      <div><span className="text-slate-500">Jam Operasional:</span> {(state.applicant as any).workplaceJamOperasional || '-'}</div>
                      <div><span className="text-slate-500">Atasan:</span> {(state.applicant as any).atasanName || '-'}</div>
                      <div><span className="text-slate-500">No. HP Atasan:</span> {(state.applicant as any).atasanNip || '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTE: Slip Gaji & SK Kerja preview dihapus dari sini. Diakses via tombol di action bar (CombinedDocumentEditorModal). */}

              {/* PDF Preview (iframe) - for FLPP + AJB + SPR Mandiri docs */}
              {(() => {
                const isSprMandiri = generateDocId === 'spr' && bank === 'MANDIRI'
                const skipList = bank === 'MANDIRI'
                  ? ['pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa', 'slip-gaji', 'sk-kerja', 'dok-kerja', 'lokasi-kerja']
                  : ['spr', 'pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa', 'notaris-bast', 'notaris-tanda-terima', 'notaris-pernyataan', 'notaris-kuasa', 'slip-gaji', 'sk-kerja', 'dok-kerja', 'lokasi-kerja']
                return (isSprMandiri || !skipList.includes(generateDocId)) && (
                  <div className="bg-white rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700" style={{ height: '70vh' }}>
                    {flppLoading && !flppBlobUrl && <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /><span className="ml-2 text-sm text-muted-foreground">Loading PDF...</span></div>}
                    {flppBlobUrl && <iframe src={flppBlobUrl + '#toolbar=0'} className="w-full h-full border-0" title="PDF Preview" />}
                    {!flppLoading && !flppBlobUrl && <div className="flex items-center justify-center h-full flex-col gap-2"><FileText className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Klik Refresh untuk load preview</p></div>}
                  </div>
                )
              })()}
            </>
          )}

          {previewMode === 'uploads' && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                <div><h4 className="text-sm font-bold text-foreground">Berkas Terupload</h4><p className="text-[10px] text-muted-foreground">Klik thumbnail untuk preview</p></div>
                <div className="text-right"><div className="text-2xl font-bold text-amber-600">{totalUploadCount}<span className="text-sm text-muted-foreground">/{totalDocs}</span></div></div>
              </div>
              {totalUploadCount === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-lg p-8 text-center"><Files className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Belum ada berkas terupload.</p></div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {[...requiredUploads, ...SIGNED_DOCS].filter(doc => uploadedFiles[doc.id]).map(doc => {
                    const fileUrl = uploadedFiles[doc.id]
                    const isImg = fileUrl.startsWith('data:image') || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    return (
                      <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-lg border-2 border-emerald-500/40 overflow-hidden cursor-pointer hover:border-emerald-500" onClick={() => setPreviewUrl(fileUrl)}>
                        <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                          {isImg ? <img src={fileUrl} alt={doc.label} className="w-full h-full object-cover" /> : <FileText className="w-8 h-8 text-rose-600" />}
                          <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                        </div>
                        <div className="p-2"><p className="text-[10px] font-bold truncate">{doc.label}</p><p className="text-[8px] text-muted-foreground">✓ Terupload</p></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setPreviewUrl(null)}>
          <div className="max-w-3xl w-full max-h-[90vh] overflow-auto bg-white text-slate-900 rounded-lg" style={{ colorScheme: 'light' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-2 border-b"><span className="text-sm font-medium text-slate-900">Preview Dokumen</span><button onClick={() => setPreviewUrl(null)} className="text-slate-700 hover:text-slate-900"><X className="w-4 h-4" /></button></div>
            {previewUrl.startsWith('data:image') ? <img src={previewUrl} alt="Preview" className="w-full" /> : previewUrl.startsWith('data:application/pdf') ? <iframe src={previewUrl} className="w-full h-[80vh]" title="Preview" /> : previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <img src={previewUrl} alt="Preview" className="w-full" /> : <iframe src={previewUrl} className="w-full h-[80vh]" title="Preview" />}
          </div>
        </div>
      )}

      {/* Combined Doc Editor Modal (Google Docs API - edit langsung di Google Docs) */}
      <CombinedDocEditorModal
        open={combinedDocModalOpen}
        onClose={() => setCombinedDocModalOpen(false)}
        state={state}
        customerId={customer.id}
      />

      {/* Lokasi Kerja Modal - Google Maps form + embed + denah */}
      <LokasiKerjaModal
        open={lokasiModalOpen}
        onClose={() => setLokasiModalOpen(false)}
        state={state}
        onUpdate={(field, val) => updateApplicant(field as keyof ApplicantData, val)}
      />
    </div>
  )
}

// ============================================================
// ADD CUSTOMER MODAL
// ============================================================
function AddCustomerModal({ projectId, onClose, onCreated }: { projectId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [wa, setWa] = useState('')
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)
  async function handleCreate() {
    if (!name.trim()) { toast.error('Nama wajib'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/customers/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, whatsappNumber: wa, unitBlock: unit, bankName: 'BTN', projectId, closingDate: new Date().toISOString() }) })
      const d = await res.json()
      if (d.success) { toast.success('Konsumen ditambahkan!'); onCreated() } else toast.error('Gagal')
    } catch { toast.error('Network error') } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <Card className="max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="text-lg font-bold">Konsumen Baru</h3><Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button></div>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground">Nama *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">No. WA</label><input value={wa} onChange={e => setWa(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Unit (Blok)</label><input value={unit} onChange={e => setUnit(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm" /></div>
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Tambah</Button>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================
import React from 'react'

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div><h4 className="text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1">{icon} {title}</h4><div className="grid grid-cols-2 gap-2">{children}</div></div>
}
function FormField({ label, value, onChange, placeholder, full, required, type = 'text', disabled }: {
  label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; full?: boolean; required?: boolean; type?: string; disabled?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="text-[9px] text-muted-foreground">{label} {required && <span className="text-rose-400">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        lang={type === 'date' ? 'id' : undefined}
        className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs disabled:opacity-50" />
    </div>
  )
}
