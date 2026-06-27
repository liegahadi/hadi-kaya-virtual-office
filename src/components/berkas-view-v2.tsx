'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, ChevronDown, ChevronRight, User, Briefcase, Heart,
  Save, Loader2, Download, X, Building2, FileText, FileDown,
  RefreshCw, Eye, Printer, Upload, Send, MessageSquare,
  LayoutGrid, Files, Calendar, Banknote, CheckCircle2, Circle,
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
import { SPR_MANDIRI } from '@/components/berkas-docs/docs/mandiri/SPR_MANDIRI'
import { SuratPernyataanTidakMemilikiRumah } from '@/components/berkas-docs/docs/common/SuratPernyataanTidakMemilikiRumah'
import { SuratPernyataanPenghasilan } from '@/components/berkas-docs/docs/common/SuratPernyataanPenghasilan'
import { SuratPernyataanBPHTB } from '@/components/berkas-docs/docs/bphtb/SuratPernyataanBPHTB'
import { SuratKuasaBPHTB } from '@/components/berkas-docs/docs/bphtb/SuratKuasaBPHTB'

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
      <DinaSidebar customer={selectedCustomer} />
    </div>
  )
}

// ============================================================
// CUSTOMER FOLDER
// ============================================================
function CustomerFolder({ customer, expanded, onToggle, onRefresh, projectId }: {
  customer: any; expanded: boolean; onToggle: () => void; onRefresh: () => void; projectId: string
}) {
  const blok = customer.units?.[0]?.blockNumber || '—'
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
// DINA SIDEBAR
// ============================================================
function DinaSidebar({ customer }: { customer: any }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; ts: number }>>([
    { role: 'agent', content: 'Halo! Saya DINA, Document AI Assistant. Bisa bantu koordinasi berkas konsumen kapan aja. 😊', ts: Date.now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: Date.now() }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/agents/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, channel: 'DASHBOARD', customerId: customer?.id }) })
      if (!res.ok) {
        const agentsRes = await fetch('/api/agents')
        const agentsData = await agentsRes.json()
        const dina = agentsData.data?.find((a: any) => a.name === 'Dina')
        if (dina) {
          const res2 = await fetch(`/api/agents/${dina.id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, channel: 'DASHBOARD' }) })
          const d2 = await res2.json()
          setMessages(prev => [...prev, { role: 'agent', content: d2.data?.response || 'Maaf, saya belum bisa merespons.', ts: Date.now() }])
        } else { setMessages(prev => [...prev, { role: 'agent', content: 'Saya DINA, tapi lagi ada gangguan.', ts: Date.now() }]) }
      } else {
        const d = await res.json()
        setMessages(prev => [...prev, { role: 'agent', content: d.data?.response || 'Maaf, belum bisa merespons.', ts: Date.now() }])
      }
    } catch { setMessages(prev => [...prev, { role: 'agent', content: 'Network error.', ts: Date.now() }]) }
    finally { setLoading(false) }
  }

  return (
    <div className="w-80 shrink-0 flex flex-col rounded-lg overflow-hidden border border-slate-700/60 shadow-xl"
      style={{ background: 'linear-gradient(180deg, #1e1b2e 0%, #14121f 100%)', maxHeight: 'calc(100vh - 100px)' }}>
      <div className="px-3 py-2.5 border-b border-violet-900/40 flex items-center gap-2 bg-violet-950/60">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">DI</div>
        <div className="flex-1 min-w-0"><div className="text-sm font-bold text-violet-100">DINA</div><div className="text-[9px] text-violet-300/70">Document AI Assistant</div></div>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />online</span>
      </div>
      {customer && (
        <div className="px-3 py-1.5 bg-violet-900/30 border-b border-violet-900/40">
          <div className="text-[9px] text-violet-300/70 uppercase tracking-wider">Konteks Aktif</div>
          <div className="text-[11px] font-semibold text-violet-100 truncate">{customer.name} · Blok {customer.units?.[0]?.blockNumber || '—'}</div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ background: '#0f0d1a' }}>
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[88%] rounded-lg px-3 py-2 text-[11px] leading-relaxed', msg.role === 'user' ? 'bg-violet-700 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm')}>{msg.content}</div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-slate-800 border border-slate-700 rounded-lg rounded-bl-sm px-3 py-2"><Loader2 className="w-3 h-3 animate-spin text-violet-400" /></div></div>}
      </div>
      <div className="p-2 border-t border-slate-800 bg-slate-900">
        <div className="flex gap-1">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Tulis pesan untuk DINA..." disabled={loading}
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
  const previewRef = useRef<HTMLDivElement>(null)

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
          npwpNumber: state.applicant.npwpNumber,
          btnAccountNumber: state.applicant.btnAccountNumber,
          blockLetter: state.property.blockLetter,
          houseNumber: state.property.houseNumber,
          landSize: state.property.landSize,
          houseSize: state.property.houseSize,
          shmNumber: state.property.shmNumber,
          nibNumber: state.property.nibNumber,
          uploadedDocs: JSON.stringify(uploadedFiles),
        }),
      })
      const d = await res.json()
      if (d.success) { toast.success('Data tersimpan!'); onRefresh() }
      else { toast.error('Gagal simpan: ' + (d.error || 'Unknown')); console.error('Save error:', d) }
    } catch (err) { toast.error('Network error: ' + (err instanceof Error ? err.message : 'unknown')); console.error('Save network error:', err) }
    finally { setSaving(false) }
  }

  // Download PDF - handles all document types
  async function handleDownloadFlpp() {
    // React component docs: SPR + BPHTB Surat Pernyataan + BPHTB Surat Kuasa
    const reactDocs: Record<string, { component: any; name: string }> = {
      'spr': { component: bank === 'MANDIRI' ? SPR_MANDIRI : SPR_BTN, name: 'SPR' },
      'pernyataan-rumah': { component: SuratPernyataanTidakMemilikiRumah, name: 'Surat_Pernyataan_Tidak_Memiliki_Rumah' },
      'pernyataan-penghasilan': { component: SuratPernyataanPenghasilan, name: 'Surat_Pernyataan_Penghasilan' },
      'bphtb-pernyataan': { component: SuratPernyataanBPHTB, name: 'Surat_Pernyataan_BPHTB' },
      'bphtb-kuasa': { component: SuratKuasaBPHTB, name: 'Surat_Kuasa_BPHTB' },
    }

    if (reactDocs[generateDocId]) {
      const { component: DocComponent, name } = reactDocs[generateDocId]
      setFlppGenerating(true)
      let printArea: HTMLDivElement | null = null
      let root: any = null
      try {
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
        printArea = document.createElement('div')
        Object.assign(printArea.style, { position: 'fixed', left: '0', top: '0', width: '210mm', zIndex: '-9999', visibility: 'hidden', pointerEvents: 'none', opacity: '0', background: '#ffffff' })
        const { createRoot } = await import('react-dom/client')
        root = createRoot(printArea)
        document.body.appendChild(printArea)
        await new Promise(resolve => { root.render(React.createElement(DocComponent, { data: state })); setTimeout(resolve, 800) })
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
      } catch (err) { toast.error(`Gagal generate ${name}: ` + (err instanceof Error ? err.message : 'unknown')) }
      finally { try { if (root) root.unmount(); if (printArea?.parentNode) printArea.parentNode.removeChild(printArea) } catch {} setFlppGenerating(false) }
    } else if (generateDocId === 'flpp') {
      setFlppGenerating(true)
      try {
        const res = await fetch('/api/documents/generate-flpp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `FLPP_BTN_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
        toast.success('FLPP PDF berhasil di-download!')
      } catch (err) { toast.error('Gagal generate FLPP: ' + (err instanceof Error ? err.message : 'unknown')) }
      finally { setFlppGenerating(false) }
    } else {
      // AJB, Mandiri, or BSB documents (PDF overlay)
      setFlppGenerating(true)
      try {
        const isMandiri = generateDocId.startsWith('mandiri-')
        const isBsb = generateDocId.startsWith('bsb-')
        const endpoint = isBsb ? '/api/documents/generate-bsb' : isMandiri ? '/api/documents/generate-mandiri' : '/api/documents/generate-ajb'
        const realDocId = generateDocId === 'surat-lpa-akad' ? 'surat-lpa' : generateDocId
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, docId: realDocId }) })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${realDocId.toUpperCase()}_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
        toast.success('PDF berhasil di-download!')
      } catch (err) { toast.error('Gagal generate PDF: ' + (err instanceof Error ? err.message : 'unknown')) }
      finally { setFlppGenerating(false) }
    }
  }

  // PDF preview via API overlay — handles FLPP + AJB documents
  const flppLoadingRef = useRef(false)
  async function loadFlppPreview() {
    if (flppLoadingRef.current) return
    flppLoadingRef.current = true
    setFlppLoading(true)
    try {
      const isAjb = ['ajb-bank', 'surat-lpa-akad'].includes(generateDocId)
      const isMandiri = generateDocId.startsWith('mandiri-')
      const isBsb = generateDocId.startsWith('bsb-')
      const endpoint = isBsb ? '/api/documents/preview-bsb' : isMandiri ? '/api/documents/preview-mandiri' : isAjb ? '/api/documents/preview-ajb' : '/api/documents/preview-flpp'
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

  useEffect(() => {
    if (previewMode === 'generate' && generateDocId !== 'spr' && generateDocId !== 'pernyataan-rumah' && generateDocId !== 'pernyataan-penghasilan' && generateDocId !== 'bphtb-pernyataan' && generateDocId !== 'bphtb-kuasa' && !flppLoading) loadFlppPreview()
  }, [previewMode, generateDocId])

  // Refresh preview when key form data changes (debounced 2.5s)
  useEffect(() => {
    // Skip auto-refresh for React component docs (SPR + BPHTB + common) - they update live in DOM
    if (['spr', 'pernyataan-rumah', 'pernyataan-penghasilan', 'bphtb-pernyataan', 'bphtb-kuasa'].includes(generateDocId)) return
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

    } catch (err) { toast.error('Gagal upload: ' + (err instanceof Error ? err.message : 'unknown')) }
    finally { setUploadingId(null) }
  }

  const requiredUploads = getRequiredUploads(state.maritalStatus, state.spouse?.jobType)
  const uploadedCount = Object.keys(uploadedFiles).filter(k => requiredUploads.some(u => u.id === k)).length
  const signedCount = Object.keys(uploadedFiles).filter(k => SIGNED_DOCS.some(u => u.id === k)).length
  const totalUploadCount = uploadedCount + signedCount
  const totalDocs = requiredUploads.length + SIGNED_DOCS.length

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
            <option value="BTN">BTN</option><option value="MANDIRI">Mandiri</option><option value="BSB_SYARIAH">BSB Syariah</option>
          </select>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan</Button>
          <Button size="sm" onClick={handleDownloadFlpp} disabled={flppGenerating} className="bg-orange-600 hover:bg-orange-700 h-8 text-xs">{flppGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}{flppGenerating ? 'Generating...' : 'Download PDF'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 p-4 space-y-4 border-r border-border max-h-[70vh] overflow-y-auto">
          {/* Data Perusahaan - ONLY in bank mode */}
          {formMode === 'bank' && (
          <FormSection icon={<Building2 className="w-3 h-3" />} title="Data Perusahaan">
            <FormField label="Nama PT" value={COMPANY_INFO.name} onChange={() => {}} disabled />
            <FormField label="Direktur" value={COMPANY_INFO.director} onChange={() => {}} disabled />
            <FormField label="Kota" value={COMPANY_INFO.city} onChange={() => {}} disabled />
            <FormField label="Rekening BTN" value={COMPANY_INFO.btnAccount} onChange={() => {}} disabled />
          </FormSection>
          )}
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
          </FormSection>
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
            <h4 className="text-[10px] font-bold text-violet-400 uppercase mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Dokumen Cetak & TTD ({signedCount}/{SIGNED_DOCS.length})</h4>
            <div className="space-y-1.5">
              {SIGNED_DOCS.map(doc => {
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

          {/* BPHTB/Notaris file requirements - show when not in bank mode */}
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
                  </>
                ) : formMode === 'bank' && docStage === 'ajb' ? (
                  <>
                    <button onClick={() => setGenerateDocId('ajb-bank')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'ajb-bank' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> AJB Bank</button>
                    <button onClick={() => setGenerateDocId('surat-lpa-akad')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'surat-lpa-akad' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat LPA & Akad</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setGenerateDocId('bphtb-pernyataan')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bphtb-pernyataan' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Pernyataan</button>
                    <button onClick={() => setGenerateDocId('bphtb-kuasa')} className={cn('px-2 py-1.5 rounded text-[9px] font-medium border flex items-center gap-1', generateDocId === 'bphtb-kuasa' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}><FileText className="w-3 h-3" /> Surat Kuasa</button>
                  </>
                )}
                {generateDocId !== 'spr' && generateDocId !== 'pernyataan-rumah' && generateDocId !== 'pernyataan-penghasilan' && generateDocId !== 'bphtb-pernyataan' && generateDocId !== 'bphtb-kuasa' && <button onClick={loadFlppPreview} disabled={flppLoading} className="ml-auto px-2 py-1.5 rounded text-[9px] font-medium border bg-white dark:bg-slate-700 text-muted-foreground border-border hover:text-foreground disabled:opacity-50 flex items-center gap-1"><RefreshCw className={cn('w-3 h-3', flppLoading && 'animate-spin')} /> Refresh</button>}
              </div>

              {/* SPR Preview (React component) - BTN or Mandiri */}
              {generateDocId === 'spr' && (
                <div ref={previewRef} className="flex justify-center">
                  <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '210mm', flexShrink: 0 }}>
                    {bank === 'MANDIRI' ? <SPR_MANDIRI data={state} /> : <SPR_BTN data={state} />}
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

              {/* PDF Preview (iframe) - for FLPP + AJB docs only */}
              {generateDocId !== 'spr' && generateDocId !== 'pernyataan-rumah' && generateDocId !== 'pernyataan-penghasilan' && generateDocId !== 'bphtb-pernyataan' && generateDocId !== 'bphtb-kuasa' && (
                <div className="bg-white rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700" style={{ height: '70vh' }}>
                  {flppLoading && !flppBlobUrl && <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /><span className="ml-2 text-sm text-muted-foreground">Loading PDF...</span></div>}
                  {flppBlobUrl && <iframe src={flppBlobUrl + '#toolbar=0'} className="w-full h-full border-0" title="PDF Preview" />}
                  {!flppLoading && !flppBlobUrl && <div className="flex items-center justify-center h-full flex-col gap-2"><FileText className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Klik Refresh untuk load preview</p></div>}
                </div>
              )}
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
          <div className="max-w-3xl w-full max-h-[90vh] overflow-auto bg-white rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-2 border-b"><span className="text-sm font-medium">Preview Dokumen</span><button onClick={() => setPreviewUrl(null)}><X className="w-4 h-4" /></button></div>
            {previewUrl.startsWith('data:image') ? <img src={previewUrl} alt="Preview" className="w-full" /> : previewUrl.startsWith('data:application/pdf') ? <iframe src={previewUrl} className="w-full h-[80vh]" title="Preview" /> : previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <img src={previewUrl} alt="Preview" className="w-full" /> : <iframe src={previewUrl} className="w-full h-[80vh]" title="Preview" />}
          </div>
        </div>
      )}
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
      const res = await fetch('/api/customers/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, whatsappNumber: wa, unitBlock: unit, bankName: 'BTN', projectId }) })
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
