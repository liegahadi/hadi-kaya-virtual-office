'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText, Plus, ChevronDown, ChevronRight, User, Briefcase, Heart,
  Save, Loader2, Download, Upload, RefreshCw, Wand2, X, Calendar,
  CheckCircle2, AlertCircle, Eye,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  stage: string
  whatsappNumber: string | null
  nik: string | null
  birthPlace: string | null
  birthDate: string | null
  gender: string | null
  ktpAddress: string | null
  rtRw: string | null
  kelurahan: string | null
  kecamatan: string | null
  city: string | null
  postalCode: string | null
  religion: string | null
  occupation: string | null
  companyName: string | null
  companyAddress: string | null
  workPosition: string | null
  monthlyIncome: number | null
  maritalStatus: string | null
  spouseName: string | null
  spouseNik: string | null
  spouseOccupation: string | null
  motherMaidenName: string | null
  phone: string | null
  closingDate: string | null
  berkasLengkapDate: string | null
  berkasMasukBankDate: string | null
  sp3kDate: string | null
  akadDate: string | null
  berkasLengkap: boolean
  units?: Array<{ blockNumber: string; landSize: number }>
  bankPipelines?: BankPipeline[]
}

interface BankPipeline {
  id: string
  bankName: string
  status: string
}

interface ChecklistItem {
  id: string
  documentName: string
  category: string
  status: string
  uploadedFileUrl: string | null
  isRequired: boolean
  template?: { id: string; templateUrl: string; type: string }
}

const BANKS = [
  { id: 'BTN', label: 'BTN' },
  { id: 'MANDIRI', label: 'Mandiri' },
  { id: 'BSB_SYARIAH', label: 'BSB Syariah' },
]

const PIPELINE_STATUSES = [
  'NOT_SUBMITTED', 'BERKAS_MASUK', 'PROSES_BANK', 'SURVEY_BANK',
  'REJECT', 'SP3K', 'SPPK', 'SP4K', 'AKAD', 'SERAH_TERIMA',
]

const STATUS_LABELS: Record<string, string> = {
  NOT_SUBMITTED: 'Belum Diajukan',
  BERKAS_MASUK: 'Berkas Masuk',
  PROSES_BANK: 'Proses Bank',
  SURVEY_BANK: 'Survey Bank',
  REJECT: 'REJECT',
  SP3K: 'SP3K',
  SPPK: 'SPPK',
  SP4K: 'SP4K',
  AKAD: 'Akad',
  SERAH_TERIMA: 'Serah Terima',
}

// ============================================================
// MAIN
// ============================================================
export function BerkasView({ projectId }: { projectId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/create?projectId=${projectId}`)
      const d = await res.json()
      if (d.success) setCustomers(d.data)
    } catch { toast.error('Gagal memuat') }
    finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Berkas Konsumen</h2>
          <p className="text-sm text-muted-foreground">Klik konsumen untuk expand → isi data → generate dokumen</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1" /> Konsumen Baru
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin" /></Card>
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
              onRefresh={fetchCustomers} />
          ))}
        </div>
      )}

      {showAddForm && (
        <AddCustomerModal projectId={projectId} onClose={() => setShowAddForm(false)}
          onCreated={() => { fetchCustomers(); setShowAddForm(false) }} />
      )}
    </div>
  )
}

// ============================================================
// CUSTOMER FOLDER (card with dates)
// ============================================================
function CustomerFolder({ customer, expanded, onToggle, onRefresh }: {
  customer: Customer; expanded: boolean; onToggle: () => void; onRefresh: () => void
}) {
  return (
    <Card className="border border-border overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 hover:bg-accent/30 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600">
            {customer.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-foreground">{customer.name}</span>
          {customer.units?.[0] && <span className="text-xs text-muted-foreground">Unit {customer.units[0].blockNumber}</span>}
          <div className="ml-auto flex gap-1">
            {customer.bankPipelines?.map(bp => (
              <Badge key={bp.id} variant="outline" className="text-[8px]">{bp.bankName}: {STATUS_LABELS[bp.status]}</Badge>
            ))}
          </div>
        </div>
        {/* Date tracking row */}
        <div className="flex flex-wrap gap-2 ml-7 text-[9px]">
          <DateChip label="Closing" date={customer.closingDate} />
          <DateChip label="Berkas Lengkap" date={customer.berkasLengkapDate} complete={customer.berkasLengkap} />
          <DateChip label="Berkas Masuk Bank" date={customer.berkasMasukBankDate} />
          <DateChip label="SP3K" date={customer.sp3kDate} />
          <DateChip label="Akad" date={customer.akadDate} />
        </div>
      </button>
      {expanded && <CustomerDetail customer={customer} onRefresh={onRefresh} />}
    </Card>
  )
}

function DateChip({ label, date, complete }: { label: string; date: string | null; complete?: boolean }) {
  const hasDate = date && date !== 'null'
  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded border',
      complete ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : hasDate ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'
    )}>
      {complete && <CheckCircle2 className="w-2.5 h-2.5" />}
      <span className="font-medium">{label}:</span>
      <span>{hasDate ? new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}</span>
    </div>
  )
}

// ============================================================
// CUSTOMER DETAIL (two-column)
// ============================================================
function CustomerDetail({ customer, onRefresh }: { customer: Customer; onRefresh: () => void }) {
  const [data, setData] = useState<Customer>(customer)
  const [saving, setSaving] = useState(false)
  const [activeBank, setActiveBank] = useState('BTN')
  const [generating, setGenerating] = useState(false)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [checklistLoading, setChecklistLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [autoFillingId, setAutoFillingId] = useState<string | null>(null)

  // Preload all bank pipelines
  const pipelines: Record<string, BankPipeline> = {}
  customer.bankPipelines?.forEach(bp => { pipelines[bp.bankName] = bp })

  // Fetch checklist when bank changes
  useEffect(() => {
    if (!activeBank) return
    fetchChecklist()
  }, [activeBank, customer.id])

  async function fetchChecklist() {
    setChecklistLoading(true)
    try {
      const res = await fetch(`/api/document-templates/checklist?customerId=${customer.id}&bankName=${activeBank}`)
      const d = await res.json()
      if (d.success) setChecklist(d.data)
    } catch {}
    finally { setChecklistLoading(false) }
  }

  function update(field: keyof Customer, value: string | number | null) {
    setData({ ...data, [field]: value })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const d = await res.json()
      if (d.success) { toast.success('Data tersimpan!'); onRefresh() }
      else toast.error('Gagal simpan')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  async function handleUpload(itemId: string, file: File) {
    setUploadingId(itemId)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`/api/document-templates/checklist/${itemId}/upload`, { method: 'POST', body: formData })
      const d = await res.json()
      if (d.success) { toast.success('Upload berhasil!'); fetchChecklist(); onRefresh() }
      else toast.error('Gagal upload')
    } catch { toast.error('Network error') }
    finally { setUploadingId(null) }
  }

  async function handleAutoFill(itemId: string, templateId: string) {
    setAutoFillingId(itemId)
    try {
      const res = await fetch(`/api/document-templates/${templateId}/autofill`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeBank}_${itemId}_autofill.docx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('DOCX auto-fill berhasil di-download!')
      } else { toast.error('Gagal auto-fill') }
    } catch { toast.error('Network error') }
    finally { setAutoFillingId(null) }
  }

  async function handleGenerateAll() {
    setGenerating(true)
    try {
      const res = await fetch('/api/documents/generate-all', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, bankName: activeBank }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeBank}_${customer.name.replace(/\s+/g, '_')}_pemberkasan.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('PDF berhasil di-generate!')
      } else { toast.error('Gagal generate') }
    } catch { toast.error('Network error') }
    finally { setGenerating(false) }
  }

  async function updatePipeline(bankName: string, status: string) {
    try {
      await fetch('/api/bank-pipeline', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, bankName, status }),
      })
      toast.success(`Status ${bankName}: ${STATUS_LABELS[status]}`)
      onRefresh()
    } catch { toast.error('Gagal update status') }
  }

  return (
    <div className="border-t border-border">
      {/* Bank selector + pipeline */}
      <div className="flex items-center gap-2 p-3 bg-accent/10 flex-wrap">
        {BANKS.map(b => (
          <button key={b.id} onClick={() => setActiveBank(b.id)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              activeBank === b.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-card text-muted-foreground border-border hover:bg-accent/30')}>
            {b.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select value={pipelines[activeBank]?.status || 'NOT_SUBMITTED'}
            onChange={e => updatePipeline(activeBank, e.target.value)}
            className="text-[10px] px-2 py-1 rounded border border-border bg-background">
            {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* LEFT: Data Entry */}
        <div className="p-4 space-y-4 border-r border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Data Konsumen</h3>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan
            </Button>
          </div>

          {/* Date tracking */}
          <div className="grid grid-cols-2 gap-2">
            <DateField label="Tgl Closing" value={data.closingDate || ''} onChange={v => update('closingDate', v)} />
            <DateField label="Tgl Berkas Lengkap" value={data.berkasLengkapDate || ''} onChange={v => update('berkasLengkapDate', v)} />
            <DateField label="Tgl Berkas Masuk Bank" value={data.berkasMasukBankDate || ''} onChange={v => update('berkasMasukBankDate', v)} />
            <DateField label="Tgl SP3K" value={data.sp3kDate || ''} onChange={v => update('sp3kDate', v)} />
            <DateField label="Tgl Akad" value={data.akadDate || ''} onChange={v => update('akadDate', v)} />
          </div>

          <FormSection icon={<User className="w-3 h-3" />} title="Data Nasabah">
            <FormField label="Nama Lengkap" value={data.name} onChange={v => update('name', v)} required />
            <FormField label="NIK / KTP" value={data.nik || ''} onChange={v => update('nik', v)} />
            <FormField label="Tempat Lahir" value={data.birthPlace || ''} onChange={v => update('birthPlace', v)} />
            <FormField label="Tgl Lahir" value={data.birthDate || ''} onChange={v => update('birthDate', v)} placeholder="dd-mm-yyyy" />
            <FormField label="Alamat KTP" value={data.ktpAddress || ''} onChange={v => update('ktpAddress', v)} full />
            <FormField label="RT/RW" value={data.rtRw || ''} onChange={v => update('rtRw', v)} />
            <FormField label="Kelurahan" value={data.kelurahan || ''} onChange={v => update('kelurahan', v)} />
            <FormField label="No. WhatsApp" value={data.phone || ''} onChange={v => update('phone', v)} />
          </FormSection>

          <FormSection icon={<Briefcase className="w-3 h-3" />} title="Pekerjaan">
            <FormField label="Pekerjaan" value={data.occupation || ''} onChange={v => update('occupation', v)} />
            <FormField label="Jabatan" value={data.workPosition || ''} onChange={v => update('workPosition', v)} />
            <FormField label="Perusahaan" value={data.companyName || ''} onChange={v => update('companyName', v)} />
            <FormField label="Alamat Perusahaan" value={data.companyAddress || ''} onChange={v => update('companyAddress', v)} full />
            <FormField label="Penghasilan" value={String(data.monthlyIncome || '')} onChange={v => update('monthlyIncome', parseFloat(v) || 0)} />
          </FormSection>

          <FormSection icon={<Heart className="w-3 h-3" />} title="Keluarga">
            <FormSelect label="Status" value={data.maritalStatus || ''} onChange={v => update('maritalStatus', v)} options={['SINGLE', 'MENIKAH']} />
            {data.maritalStatus === 'MENIKAH' && (
              <>
                <FormField label="Nama Pasangan" value={data.spouseName || ''} onChange={v => update('spouseName', v)} />
                <FormField label="NIK Pasangan" value={data.spouseNik || ''} onChange={v => update('spouseNik', v)} />
                <FormField label="Pekerjaan Pasangan" value={data.spouseOccupation || ''} onChange={v => update('spouseOccupation', v)} />
              </>
            )}
          </FormSection>
        </div>

        {/* RIGHT: Checklist + Upload + Preview */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Dokumen {BANKS.find(b => b.id === activeBank)?.label}</h3>
            <Button size="sm" onClick={handleGenerateAll} disabled={generating} className="bg-violet-600 hover:bg-violet-700 h-7 text-xs">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 mr-1" />} Generate PDF
            </Button>
          </div>

          {/* Checklist */}
          {checklistLoading ? (
            <Card className="p-4 text-center"><Loader2 className="w-4 h-4 mx-auto animate-spin" /></Card>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {checklist.map(item => (
                <ChecklistRow key={item.id} item={item} customerId={customer.id}
                  uploadingId={uploadingId} autoFillingId={autoFillingId}
                  onUpload={handleUpload} onAutoFill={handleAutoFill}
                  onPreview={(url) => setPreviewUrl(url)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setPreviewUrl(null)}>
          <div className="max-w-3xl w-full max-h-[90vh] overflow-auto bg-white rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-2 border-b">
              <span className="text-sm font-medium">Preview Dokumen</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(null)}><X className="w-4 h-4" /></Button>
            </div>
            {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewUrl} alt="Preview" className="w-full" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[80vh]" title="Preview" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// CHECKLIST ROW
// ============================================================
function ChecklistRow({ item, customerId, uploadingId, autoFillingId, onUpload, onAutoFill, onPreview }: {
  item: ChecklistItem; customerId: string; uploadingId: string | null; autoFillingId: string | null
  onUpload: (id: string, file: File) => void
  onAutoFill: (itemId: string, templateId: string) => void
  onPreview: (url: string) => void
}) {
  const isUploading = uploadingId === item.id
  const isAutoFilling = autoFillingId === item.id
  const isMissing = item.status === 'MISSING'
  const canAutoFill = item.template?.type === 'FORM' && item.template?.templateUrl?.endsWith('.docx')

  return (
    <Card className={cn('p-2 border', isMissing ? 'border-rose-700/30' : 'border-emerald-700/30')}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{isMissing ? '❌' : '✅'}</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium truncate block">{item.documentName}</span>
          <Badge variant="outline" className="text-[7px] h-3 px-1">{item.category}</Badge>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {/* Preview uploaded file */}
          {item.uploadedFileUrl && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onPreview(item.uploadedFileUrl!)}>
              <Eye className="w-3 h-3" />
            </Button>
          )}
          {/* Auto-fill (DOCX only) */}
          {canAutoFill && (
            <Button variant="default" size="sm" disabled={isAutoFilling}
              onClick={() => onAutoFill(item.id, item.template!.id)}
              className="h-6 text-[9px] px-1.5 bg-violet-600 hover:bg-violet-700">
              {isAutoFilling ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5 mr-0.5" />}Fill
            </Button>
          )}
          {/* Upload */}
          <input type="file" accept="image/*,.pdf" className="hidden" id={`upload-${item.id}`}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(item.id, f); e.target.value = '' }} />
          <Button variant={isMissing ? 'default' : 'outline'} size="sm" disabled={isUploading}
            onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
            className="h-6 text-[9px] px-1.5">
            {isUploading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Upload className="w-2.5 h-2.5 mr-0.5" />}
            {isMissing ? 'Upload' : 'Ganti'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ============================================================
// ADD CUSTOMER MODAL
// ============================================================
function AddCustomerModal({ projectId, onClose, onCreated }: { projectId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [wa, setWa] = useState('')
  const [unit, setUnit] = useState('')
  const [bank, setBank] = useState('BTN')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) { toast.error('Nama wajib'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/customers/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsappNumber: wa, unitBlock: unit, bankName: bank, projectId }),
      })
      const d = await res.json()
      if (d.success) { toast.success('Konsumen ditambahkan!'); onCreated() }
      else toast.error('Gagal')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <Card className="max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold">Konsumen Baru</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground">Nama *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">No. WA</label>
            <input value={wa} onChange={e => setWa(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Unit (Blok)</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Bank</label>
            <select value={bank} onChange={e => setBank(e.target.value)} className="w-full mt-1 bg-background/50 border border-border rounded px-3 py-2 text-sm">
              {BANKS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select></div>
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Tambah
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================
function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div><h4 className="text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1">{icon} {title}</h4><div className="grid grid-cols-2 gap-2">{children}</div></div>
}
function FormField({ label, value, onChange, placeholder, full, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; full?: boolean; required?: boolean }) {
  return <div className={full ? 'col-span-2' : ''}><label className="text-[9px] text-muted-foreground">{label} {required && <span className="text-rose-400">*</span>}</label><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" /></div>
}
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <div className="col-span-2"><label className="text-[9px] text-muted-foreground">{label}</label><div className="flex gap-1 mt-0.5">{options.map(o => <button key={o} onClick={() => onChange(o)} className={cn('flex-1 px-2 py-1 rounded text-[10px] border', value === o ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border')}>{o === 'SINGLE' ? 'BELUM KAWIN' : 'KAWIN'}</button>)}</div></div>
}
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className="text-[9px] text-muted-foreground">{label}</label><input type="date" value={value ? new Date(value).toISOString().split('T')[0] : ''} onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" /></div>
}
