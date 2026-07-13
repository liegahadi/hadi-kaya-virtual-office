'use client'

// ============================================================
// DINA v2: BANK BUILDER
// Add new bank + upload template PDF + visual annotation editor
// Backend: /api/bank-config + /api/bank-config/[id]/template
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { Building2, Plus, Edit3, FileText, Save, Trash2, X, ArrowLeft, Upload, Loader2, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BankAnnotationEditor } from './bank-annotation-editor'

interface Bank {
  id: string
  bankCode: string
  bankName: string
  description?: string | null
  templatePath?: string | null
  documents?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BankTemplate {
  fileId?: string
  fileName?: string
  webViewLink?: string | null
  fileHash?: string
  version?: number
  annotations?: Annotation[]
}

export interface Annotation {
  id: string
  page: number
  x: number  // 0-1 relative
  y: number  // 0-1 relative
  width: number  // 0-1 relative
  height: number  // 0-1 relative
  label: string
  fieldMapping: string  // e.g. 'customer.name', 'customer.nik'
  fieldType?: 'text' | 'date' | 'number' | 'image'
}

export function BankBuilder() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [templateData, setTemplateData] = useState<BankTemplate | null>(null)

  const loadBanks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bank-config')
      const data = await res.json()
      if (data.success) setBanks(data.data)
    } catch (err) {
      console.error('Load banks error:', err)
      toast.error('Gagal memuat daftar bank')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBanks() }, [loadBanks])

  async function selectBank(bank: Bank) {
    setSelectedBank(bank)
    setTemplateData(null)
    try {
      const res = await fetch(`/api/bank-config/${bank.id}/template`)
      const data = await res.json()
      if (data.success && data.data.template) {
        setTemplateData(data.data.template)
      }
    } catch (err) {
      console.error('Load template error:', err)
    }
  }

  function handleBack() {
    setSelectedBank(null)
    setTemplateData(null)
  }

  async function handleBankUpdated() {
    await loadBanks()
    if (selectedBank) {
      const updated = banks.find(b => b.id === selectedBank.id)
      if (updated) setSelectedBank(updated)
    }
  }

  if (selectedBank) {
    return (
      <BankEditor
        bank={selectedBank}
        template={templateData}
        onBack={handleBack}
        onUpdated={handleBankUpdated}
      />
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Bank Builder</h2>
          <Badge variant="secondary" className="text-xs">{banks.length} banks</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Tambah Bank
        </Button>
      </div>

      {/* Info banner */}
      <Card className="p-3 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <FileText className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Cara kerja Bank Builder</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Tambah bank baru (atau pilih existing)</li>
              <li>Upload template PDF (form kosong dari bank)</li>
              <li>Klik di PDF untuk menandai field (annotation)</li>
              <li>Map setiap annotation ke field database</li>
              <li>Save — DINA bisa auto-generate dokumen untuk bank ini</li>
            </ol>
            <p className="mt-2 text-red-600 dark:text-red-400">⚠️ Bank tidak bisa dihapus (permanen). Hanya bisa dinonaktifkan.</p>
          </div>
        </div>
      </Card>

      {/* Bank list */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Memuat...
            </div>
          ) : banks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Belum ada bank. Klik "Tambah Bank" untuk mulai.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {banks.map((bank) => {
                let hasTemplate = false
                let annotationCount = 0
                try {
                  if (bank.documents) {
                    const docs = JSON.parse(bank.documents)
                    hasTemplate = !!docs.fileId
                    annotationCount = docs.annotations?.length || 0
                  }
                } catch {}
                return (
                  <button
                    key={bank.id}
                    onClick={() => selectBank(bank)}
                    className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {bank.bankCode.substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-medium">{bank.bankName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Kode: {bank.bankCode}
                            {bank.description && ` • ${bank.description}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasTemplate ? (
                          <>
                            <Badge variant="default" className="text-xs bg-emerald-600">Template ✓</Badge>
                            <Badge variant="outline" className="text-xs">{annotationCount} fields</Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600">No template</Badge>
                        )}
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Add Form */}
      <AddBankDialog
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onCreated={(newBank) => {
          loadBanks()
          setShowAddForm(false)
          toast.success(`Bank ${newBank.bankName} berhasil ditambahkan`)
        }}
      />
    </div>
  )
}

// ============================================================
// BANK EDITOR (selected bank)
// ============================================================
function BankEditor({
  bank,
  template,
  onBack,
  onUpdated,
}: {
  bank: Bank
  template: BankTemplate | null
  onBack: () => void
  onUpdated: () => void
}) {
  const [editMode, setEditMode] = useState<'info' | 'template' | 'annotations' | 'documents'>('info')
  const [bankName, setBankName] = useState(bank.bankName)
  const [description, setDescription] = useState(bank.description || '')
  const [savingInfo, setSavingInfo] = useState(false)

  async function saveBankInfo() {
    setSavingInfo(true)
    try {
      const res = await fetch('/api/bank-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bank.id, bankName, description }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Info bank disimpan')
        onUpdated()
      } else {
        toast.error(data.error || 'Gagal simpan')
      }
    } catch (err) {
      toast.error('Gagal simpan info bank')
    } finally {
      setSavingInfo(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{bank.bankName}</h2>
          <Badge variant="outline" className="text-xs">{bank.bankCode}</Badge>
        </div>
        <Badge variant="secondary" className="text-xs">
          {bank.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <TabBtn active={editMode === 'info'} onClick={() => setEditMode('info')} icon={<Edit3 className="w-3.5 h-3.5" />}>
          Info Bank
        </TabBtn>
        <TabBtn active={editMode === 'template'} onClick={() => setEditMode('template')} icon={<Upload className="w-3.5 h-3.5" />}>
          Template PDF
        </TabBtn>
        <TabBtn
          active={editMode === 'annotations'}
          onClick={() => setEditMode('annotations')}
          icon={<Eye className="w-3.5 h-3.5" />}
          disabled={!template?.fileId}
        >
          Annotations {template?.annotations?.length ? `(${template.annotations.length})` : ''}
        </TabBtn>
        <TabBtn active={editMode === 'documents'} onClick={() => setEditMode('documents')} icon={<FileText className="w-3.5 h-3.5" />}>
          Dokumen Wajib
        </TabBtn>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {editMode === 'info' && (
          <Card className="p-4 max-w-lg space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Kode Bank (tidak bisa diubah)</label>
              <Input value={bank.bankCode} disabled className="bg-muted/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nama Bank</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deskripsi</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Contoh: KPR Subsidi, syarat FLPP, dll"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveBankInfo} disabled={savingInfo}>
                {savingInfo ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Simpan
              </Button>
              <Button variant="outline" onClick={onBack}>Kembali</Button>
            </div>
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
                Bank tidak bisa dihapus. Hubungi developer untuk menonaktifkan.
              </p>
            </div>
          </Card>
        )}

        {editMode === 'template' && (
          <TemplateUploader bank={bank} template={template} onUpdated={onUpdated} />
        )}

        {editMode === 'annotations' && template?.fileId && (
          <BankAnnotationEditor
            bank={bank}
            template={template}
            onUpdated={onUpdated}
          />
        )}

        {editMode === 'documents' && (
          <BankDocumentsConfig bank={bank} onUpdated={onUpdated} />
        )}
      </div>
    </div>
  )
}

// ============================================================
// TEMPLATE UPLOADER
// ============================================================
function TemplateUploader({ bank, template, onUpdated }: { bank: Bank; template: BankTemplate | null; onUpdated: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [version, setVersion] = useState((template?.version || 0) + 1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('File harus PDF')
      return
    }

    setUploading(true)
    try {
      // Convert to dataUrl
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        try {
          const res = await fetch(`/api/bank-config/${bank.id}/template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templatePdf: dataUrl,
              annotations: template?.annotations || [],
              version,
            }),
          })
          const data = await res.json()
          if (data.success) {
            toast.success(`Template v${version} berhasil diupload`)
            onUpdated()
          } else {
            toast.error(data.error || 'Gagal upload template')
          }
        } catch (err) {
          toast.error('Gagal upload template')
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toast.error('Gagal baca file')
      setUploading(false)
    }
  }

  return (
    <Card className="p-4 max-w-lg space-y-3">
      <h3 className="text-sm font-semibold">Upload Template PDF</h3>
      <p className="text-xs text-muted-foreground">
        Upload form kosong dari bank (PDF). Ini akan jadi template dasar untuk auto-generate dokumen.
      </p>

      {template?.fileId ? (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <FileText className="w-4 h-4" />
            <span className="font-medium">Template v{template.version} sudah diupload</span>
          </div>
          {template.webViewLink && (
            <a
              href={template.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              Lihat di Google Drive →
            </a>
          )}
        </div>
      ) : null}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Versi Template</label>
        <Input
          type="number"
          min={1}
          value={version}
          onChange={(e) => setVersion(parseInt(e.target.value) || 1)}
          className="w-24"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Versi baru tidak overwrite versi lama (anti-overwrite rule)
        </p>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-1" />
          )}
          {uploading ? 'Uploading...' : 'Pilih File PDF'}
        </Button>
      </div>
    </Card>
  )
}

// ============================================================
// ADD BANK DIALOG
// ============================================================
function AddBankDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (bank: Bank) => void
}) {
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!bankCode.trim() || !bankName.trim()) {
      toast.error('Kode dan nama bank wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/bank-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode: bankCode.trim().toUpperCase(),
          bankName: bankName.trim(),
          description: description.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onCreated(data.data)
        setBankCode('')
        setBankName('')
        setDescription('')
      } else {
        toast.error(data.error || 'Gagal tambah bank')
      }
    } catch (err) {
      toast.error('Gagal tambah bank')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Bank Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Kode Bank (huruf besar, unik)</label>
            <Input
              placeholder="contoh: BCA, BRI, BSI"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value.toUpperCase())}
              maxLength={20}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nama Bank</label>
            <Input
              placeholder="contoh: Bank Central Asia"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Deskripsi (opsional)</label>
            <Textarea
              placeholder="contoh: KPR subsidi, syarat FLPP"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// HELPER
// ============================================================
function TabBtn({
  active, onClick, children, icon, disabled,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/50 hover:bg-muted text-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon}
      {children}
    </button>
  )
}

// ============================================================
// BANK DOCUMENTS CONFIG — Customize required documents per bank
// ============================================================
const ALL_DOC_TYPES = [
  { id: 'ktp', label: 'KTP', default: true },
  { id: 'kk', label: 'Kartu Keluarga (KK)', default: true },
  { id: 'npwp', label: 'NPWP', default: true },
  { id: 'akta-nikah', label: 'Akta Nikah / Surat Belum Menikah', default: true },
  { id: 'slip-gaji', label: 'Slip Gaji (3 bulan)', default: true },
  { id: 'sk-kerja', label: 'SK Kerja / NIB', default: true },
  { id: 'surat-belum-rumah', label: 'Surat Belum Memiliki Rumah', default: true },
  { id: 'sertifikat', label: 'Sertifikat Rumah', default: false },
  { id: 'pbb', label: 'PBB', default: false },
  { id: 'laporan-keuangan', label: 'Laporan Keuangan (6 bulan, wirausaha)', default: false },
  { id: 'mutasi-rekening', label: 'Mutasi Rekening (3 bulan)', default: false },
  { id: 'bpjs', label: 'BPJS Ketenagakerjaan', default: false },
  { id: 'domisili', label: 'Surat Keterangan Domisili', default: false },
  { id: 'lainnya', label: 'Dokumen Lainnya', default: false },
]

function BankDocumentsConfig({ bank, onUpdated }: { bank: any; onUpdated: () => void }) {
  const [requiredDocs, setRequiredDocs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load current required docs from bank.documents JSON
    try {
      if (bank.documents) {
        const docs = JSON.parse(bank.documents)
        setRequiredDocs(docs.requiredDocuments || ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
      } else {
        setRequiredDocs(ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
      }
    } catch {
      setRequiredDocs(ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
    }
    setLoading(false)
  }, [bank.id, bank.documents])

  function toggleDoc(docId: string) {
    setRequiredDocs(prev =>
      prev.includes(docId) ? prev.filter(d => d !== docId) : [...prev, docId]
    )
  }

  async function save() {
    setSaving(true)
    try {
      // Get existing documents JSON
      let existingDocs: any = {}
      try {
        if (bank.documents) existingDocs = JSON.parse(bank.documents)
      } catch {}

      existingDocs.requiredDocuments = requiredDocs
      existingDocs.updatedAt = new Date().toISOString()

      const res = await fetch('/api/bank-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bank.id,
          documents: JSON.stringify(existingDocs),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Dokumen wajib disimpan')
        onUpdated()
      } else {
        toast.error(data.error || 'Gagal simpan')
      }
    } catch (err) {
      toast.error('Gagal simpan dokumen wajib')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Memuat...</div>

  return (
    <Card className="p-4 max-w-lg space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Dokumen Wajib per Bank</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Pilih dokumen yang wajib diupload untuk bank {bank.bankName}. Dokumen yang tidak diceklis tidak akan muncul di checklist Tab Berkas.
        </p>
      </div>

      <div className="space-y-1.5">
        {ALL_DOC_TYPES.map(doc => (
          <label
            key={doc.id}
            className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/30 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={requiredDocs.includes(doc.id)}
              onChange={() => toggleDoc(doc.id)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">{doc.label}</span>
            {doc.default && (
              <Badge variant="secondary" className="text-[9px] ml-auto">Default</Badge>
            )}
          </label>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Simpan
        </Button>
        <Button variant="outline" onClick={() => setRequiredDocs(ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))}>
          Reset ke Default
        </Button>
      </div>
    </Card>
  )
}
