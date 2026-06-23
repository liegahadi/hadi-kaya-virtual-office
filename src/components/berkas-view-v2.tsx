'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, ChevronDown, ChevronRight, User, Briefcase, Heart,
  Save, Loader2, Download, X, Building2, FileText, FileDown,
  RefreshCw, Eye, Printer,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import {
  BerkasState, JobType, MaritalStatus,
  ApplicantData, SpouseData, PropertyData,
} from '@/lib/berkas/types'
import { COMPANY_INFO, DEFAULT_PROPERTY, INITIAL_STATE } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'
import { DocumentLayout } from '@/components/berkas-docs/DocumentLayout'
import { BTN_DOCUMENTS, getBtnDocuments, type DocDef } from '@/components/berkas-docs/docs/btn'

// ============================================================
// MAIN BERKAS VIEW v2
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Berkas Konsumen</h2>
          <p className="text-sm text-muted-foreground">Isi data sekali → semua dokumen auto-generate → download PDF</p>
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
  )
}

// ============================================================
// CUSTOMER FOLDER
// ============================================================
function CustomerFolder({ customer, expanded, onToggle, onRefresh, projectId }: {
  customer: any; expanded: boolean; onToggle: () => void; onRefresh: () => void; projectId: string
}) {
  return (
    <Card className="border border-border overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 hover:bg-accent/30 transition-colors">
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600">
            {customer.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-foreground">{customer.name}</span>
          {customer.units?.[0] && <span className="text-xs text-muted-foreground">Unit {customer.units[0].blockNumber}</span>}
          <Badge variant="outline" className="text-[8px] ml-auto">{customer.stage}</Badge>
        </div>
      </button>
      {expanded && <BerkasEditor customer={customer} onRefresh={onRefresh} projectId={projectId} />}
    </Card>
  )
}

// ============================================================
// BERKAS EDITOR (Two-column: form + preview)
// ============================================================
function BerkasEditor({ customer, onRefresh, projectId }: { customer: any; onRefresh: () => void; projectId: string }) {
  const [state, setState] = useState<BerkasState>({
    ...INITIAL_STATE,
    applicant: {
      ...INITIAL_STATE.applicant,
      fullName: customer.name || '',
      phone: customer.whatsappNumber || customer.phone || '',
    },
    property: {
      ...DEFAULT_PROPERTY,
      kavlingNumber: customer.units?.[0]?.blockNumber || '',
      landSize: customer.units?.[0]?.landSize || 84,
    },
    dateOfDocument: new Date().toISOString().split('T')[0],
  })
  const [bank, setBank] = useState<string>('BTN')
  const [docCategory, setDocCategory] = useState<'pre-bank' | 'post-acc'>('pre-bank')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [currentDocIndex, setCurrentDocIndex] = useState(0)
  const previewRef = useRef<HTMLDivElement>(null)

  // Get documents for current bank + category
  const documents: DocDef[] = getBtnDocuments(docCategory, state.maritalStatus)
  const CurrentDoc = documents[currentDocIndex]?.component

  // Update applicant field
  function updateApplicant(field: keyof ApplicantData, val: any) {
    setState(s => ({ ...s, applicant: { ...s.applicant, [field]: val } }))
  }

  // Update property field
  function updateProperty(field: keyof PropertyData, val: any) {
    setState(s => ({ ...s, property: { ...s.property, [field]: val } }))
  }

  // Update spouse field
  function updateSpouse(field: keyof SpouseData, val: any) {
    setState(s => ({
      ...s,
      spouse: { ...(s.spouse || { fullName: '', ktpNumber: '', pob: '', dob: '', job: '', address: '', isWorking: false }), [field]: val }
    }))
  }

  // Save to cloud
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.applicant.fullName,
          phone: state.applicant.phone,
          whatsappNumber: state.applicant.phone,
          nik: state.applicant.ktpNumber,
          birthPlace: state.applicant.pob,
          birthDate: state.applicant.dob,
          occupation: state.applicant.jobType,
          ktpAddress: state.applicant.address,
          companyName: state.applicant.companyName,
          companyAddress: state.applicant.companyAddress,
          workPosition: state.applicant.jobTitle,
          monthlyIncome: state.applicant.monthlyIncome,
          maritalStatus: state.maritalStatus === 'Sudah Menikah' ? 'MENIKAH' : 'SINGLE',
          spouseName: state.spouse?.fullName,
          spouseNik: state.spouse?.ktpNumber,
          spouseBirthPlace: state.spouse?.pob,
          spouseBirthDate: state.spouse?.dob,
          spouseOccupation: state.spouse?.job,
          dateOfDocument: state.dateOfDocument,
        }),
      })
      const d = await res.json()
      if (d.success) { toast.success('Data tersimpan ke cloud!'); onRefresh() }
      else toast.error('Gagal simpan')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  // Download all as PDF
  async function handleDownloadPDF() {
    setGenerating(true)
    try {
      const html2pdf = (window as any).html2pdf
      if (!html2pdf) {
        // Load dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const html2pdfLib = (window as any).html2pdf
      if (!html2pdfLib) { toast.error('Gagal load PDF library'); return }

      // Show ALL documents in a hidden div
      const printArea = document.createElement('div')
      printArea.style.position = 'absolute'
      printArea.style.left = '-9999px'
      printArea.style.top = '0'

      // Render all documents
      const { createRoot } = await import('react-dom/client')
      const allDocs = documents.map((doc, i) => {
        const Comp = doc.component
        return React.createElement(Comp, { key: i, data: state })
      })

      const root = createRoot(printArea)
      document.body.appendChild(printArea)

      await new Promise(resolve => {
        root.render(React.createElement('div', null, allDocs))
        setTimeout(resolve, 500)
      })

      const filename = `${bank}_${state.applicant.fullName || 'Konsumen'}_${docCategory}.pdf`
      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, scrollX: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css', 'legacy'] },
      }

      await html2pdfLib().from(printArea).set(opt).save()
      root.unmount()
      document.body.removeChild(printArea)
      toast.success('PDF berhasil di-download!')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Gagal generate PDF')
    } finally { setGenerating(false) }
  }

  return (
    <div className="border-t border-border">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-accent/10 flex-wrap">
        {/* Bank selector */}
        <select value={bank} onChange={e => setBank(e.target.value)}
          className="text-xs px-2 py-1.5 rounded border border-border bg-background">
          <option value="BTN">BTN</option>
          <option value="MANDIRI">Mandiri (coming soon)</option>
          <option value="BSB_SYARIAH">BSB Syariah (coming soon)</option>
        </select>

        {/* Category */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button onClick={() => setDocCategory('pre-bank')}
            className={cn('px-3 py-1 rounded text-[10px] font-medium', docCategory === 'pre-bank' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-muted-foreground')}>
            Data Entry (Pre-Bank)
          </button>
          <button onClick={() => setDocCategory('post-acc')}
            className={cn('px-3 py-1 rounded text-[10px] font-medium', docCategory === 'post-acc' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-muted-foreground')}>
            AJB Bank (Post-ACC)
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan
          </Button>
          <Button size="sm" onClick={handleDownloadPDF} disabled={generating} className="bg-orange-600 hover:bg-orange-700 h-8 text-xs">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}
            {generating ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* LEFT: Data Entry Form (2/5 width) */}
        <div className="lg:col-span-2 p-4 space-y-4 border-r border-border max-h-[70vh] overflow-y-auto">
          {/* Company settings */}
          <FormSection icon={<Building2 className="w-3 h-3" />} title="Data Perusahaan">
            <FormField label="Nama PT" value={COMPANY_INFO.name} onChange={() => {}} disabled />
            <FormField label="Direktur" value={COMPANY_INFO.director} onChange={() => {}} disabled />
            <FormField label="Kota" value={COMPANY_INFO.city} onChange={() => {}} disabled />
            <FormField label="Rekening BTN" value={COMPANY_INFO.btnAccount} onChange={() => {}} disabled />
          </FormSection>

          {/* Data Nasabah */}
          <FormSection icon={<User className="w-3 h-3" />} title="Data Nasabah">
            <FormField label="Nama Lengkap (KTP)" value={state.applicant.fullName} onChange={v => updateApplicant('fullName', v)} required />
            <FormField label="NIK / No. KTP" value={state.applicant.ktpNumber} onChange={v => updateApplicant('ktpNumber', v)} />
            <FormField label="NPWP" value={state.applicant.npwpNumber} onChange={v => updateApplicant('npwpNumber', v)} />
            <FormField label="Rekening BTN" value={state.applicant.btnAccountNumber} onChange={v => updateApplicant('btnAccountNumber', v)} />
            <FormField label="Tempat Lahir" value={state.applicant.pob} onChange={v => updateApplicant('pob', v)} />
            <FormField label="Tanggal Lahir" type="date" value={state.applicant.dob} onChange={v => updateApplicant('dob', v)} />
            <FormField label="Alamat KTP" value={state.applicant.address} onChange={v => updateApplicant('address', v)} full />
            <FormField label="No. WhatsApp" value={state.applicant.phone} onChange={v => updateApplicant('phone', v)} />
          </FormSection>

          {/* Pekerjaan */}
          <FormSection icon={<Briefcase className="w-3 h-3" />} title="Pekerjaan">
            <div className="col-span-2 flex gap-1 mb-1">
              <button onClick={() => updateApplicant('jobType', JobType.EMPLOYEE)}
                className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.applicant.jobType === JobType.EMPLOYEE ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border')}>
                KARYAWAN
              </button>
              <button onClick={() => updateApplicant('jobType', JobType.ENTREPRENEUR)}
                className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.applicant.jobType === JobType.ENTREPRENEUR ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border')}>
                WIRAUSAHA
              </button>
            </div>
            <FormField label="Jabatan / Jenis Usaha" value={state.applicant.jobTitle} onChange={v => updateApplicant('jobTitle', v)} />
            <FormField label="Nama Perusahaan" value={state.applicant.companyName} onChange={v => updateApplicant('companyName', v)} />
            <FormField label="Alamat Perusahaan" value={state.applicant.companyAddress} onChange={v => updateApplicant('companyAddress', v)} full />
            <FormField label="Gaji Bersih / Bulan" type="number" value={state.applicant.monthlyIncome} onChange={v => updateApplicant('monthlyIncome', parseInt(v) || 0)} />
          </FormSection>

          {/* Status Keluarga */}
          <FormSection icon={<Heart className="w-3 h-3" />} title="Status Keluarga">
            <div className="col-span-2 flex gap-1 mb-1">
              <button onClick={() => setState(s => ({ ...s, maritalStatus: MaritalStatus.SINGLE }))}
                className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.maritalStatus === MaritalStatus.SINGLE ? 'bg-pink-500 text-white border-pink-500' : 'bg-card border-border')}>
                BELUM KAWIN
              </button>
              <button onClick={() => setState(s => ({ ...s, maritalStatus: MaritalStatus.MARRIED }))}
                className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-bold border', state.maritalStatus === MaritalStatus.MARRIED ? 'bg-pink-500 text-white border-pink-500' : 'bg-card border-border')}>
                KAWIN
              </button>
            </div>
            {state.maritalStatus === MaritalStatus.MARRIED && (
              <>
                <FormField label="Nama Pasangan" value={state.spouse?.fullName || ''} onChange={v => updateSpouse('fullName', v)} />
                <FormField label="NIK Pasangan" value={state.spouse?.ktpNumber || ''} onChange={v => updateSpouse('ktpNumber', v)} />
                <FormField label="Tempat Lahir" value={state.spouse?.pob || ''} onChange={v => updateSpouse('pob', v)} />
                <FormField label="Tanggal Lahir" type="date" value={state.spouse?.dob || ''} onChange={v => updateSpouse('dob', v)} />
                <FormField label="Pekerjaan" value={state.spouse?.job || ''} onChange={v => updateSpouse('job', v)} />
              </>
            )}
          </FormSection>

          {/* Unit Properti */}
          <FormSection icon={<Building2 className="w-3 h-3" />} title="Unit Properti">
            <FormField label="Nama Perumahan" value={state.property.projectName} onChange={v => updateProperty('projectName', v)} />
            <FormField label="Alamat" value={state.property.houseAddress} onChange={v => updateProperty('houseAddress', v)} full />
            <FormField label="Kavling / Blok" value={state.property.kavlingNumber} onChange={v => updateProperty('kavlingNumber', v)} />
            <FormField label="Luas Tanah (m²)" type="number" value={state.property.landSize} onChange={v => updateProperty('landSize', parseInt(v) || 0)} />
            <FormField label="No. Sertifikat (NIB)" value={state.property.nibNumber} onChange={v => updateProperty('nibNumber', v)} />
            <FormField label="Tgl Sertifikat" type="date" value={state.property.certificateDate} onChange={v => updateProperty('certificateDate', v)} />
            <FormField label="No. PBG" value={state.property.pbgNumber} onChange={v => updateProperty('pbgNumber', v)} />
            <FormField label="Harga Jual" type="number" value={state.property.price} onChange={v => updateProperty('price', parseInt(v) || 0)} />
            <FormField label="DP" type="number" value={state.property.downPayment} onChange={v => updateProperty('downPayment', parseInt(v) || 0)} />
            <FormField label="SBUM" type="number" value={state.property.sbumAmount} onChange={v => updateProperty('sbumAmount', parseInt(v) || 0)} />
            <FormField label="Plafon KPR" type="number" value={state.property.kprPlafon} onChange={v => updateProperty('kprPlafon', parseInt(v) || 0)} />
            <FormField label="Tenor (tahun)" type="number" value={state.property.kprTerm} onChange={v => updateProperty('kprTerm', parseInt(v) || 0)} />
            <FormField label="No. SPR" value={state.property.sprNumber} onChange={v => updateProperty('sprNumber', v)} />
            <FormField label="Tanggal Dokumen" type="date" value={state.dateOfDocument} onChange={v => setState(s => ({ ...s, dateOfDocument: v }))} />
          </FormSection>
        </div>

        {/* RIGHT: Document Preview (3/5 width) */}
        <div className="lg:col-span-3 bg-slate-200 dark:bg-slate-800 p-4 max-h-[70vh] overflow-y-auto">
          {/* Document tabs */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {documents.map((doc, i) => (
              <button key={doc.id} onClick={() => setCurrentDocIndex(i)}
                className={cn('px-2 py-1 rounded text-[9px] font-medium border', currentDocIndex === i ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-700 text-muted-foreground border-border')}>
                {doc.name.length > 25 ? doc.name.substring(0, 25) + '...' : doc.name}
              </button>
            ))}
          </div>

          {/* Live Preview */}
          <div ref={previewRef} className="flex flex-col items-center">
            {CurrentDoc && <CurrentDoc data={state} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ADD CUSTOMER MODAL (same as before)
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
      const res = await fetch('/api/customers/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsappNumber: wa, unitBlock: unit, bankName: 'BTN', projectId }),
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
        className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs disabled:opacity-50" />
    </div>
  )
}
