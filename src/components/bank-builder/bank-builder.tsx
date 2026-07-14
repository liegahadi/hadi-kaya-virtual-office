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

      {/* Tabs — urutan: Info Bank → Dokumen Wajib → Template PDF → Annotation */}
      <div className="flex gap-2 border-b border-border pb-2">
        <TabBtn active={editMode === 'info'} onClick={() => setEditMode('info')} icon={<Edit3 className="w-3.5 h-3.5" />}>
          Info Bank
        </TabBtn>
        <TabBtn active={editMode === 'documents'} onClick={() => setEditMode('documents')} icon={<FileText className="w-3.5 h-3.5" />}>
          Dokumen Wajib
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
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
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

        {editMode === 'annotations' && (
          <BankAnnotationEditor
            bank={bank}
            template={template || {}}
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
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateStage, setNewTemplateStage] = useState('entry')
  const [showAddForm, setShowAddForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileRef = useRef<HTMLInputElement>(null)
  const [replaceTemplateId, setReplaceTemplateId] = useState<string | null>(null)

  // Load templates from BankConfig (extracted for reuse in rename)
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bank-config/${bank.id}/template`)
      const data = await res.json()
      if (data.success) {
        if (data.data.templates && data.data.templates.length > 0) {
          setTemplates(data.data.templates)
        } else if (data.data.template) {
          setTemplates([{
            id: 'legacy',
            name: data.data.template.fileName || 'Template',
            stage: 'entry',
            fileId: data.data.template.fileId,
            fileName: data.data.template.fileName,
            webViewLink: data.data.template.webViewLink,
            version: data.data.template.version,
            annotations: data.data.template.annotations || [],
          }])
        } else {
          setTemplates([])
        }
      }
    } catch (err) {
      console.error('Load templates error:', err)
    } finally {
      setLoading(false)
    }
  }, [bank.id])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('File harus PDF')
      return
    }
    if (!newTemplateName.trim()) {
      toast.error('Nama template wajib diisi (mis. FLPP, SPR, AJB)')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        try {
          const res = await fetch(`/api/bank-config/${bank.id}/template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templatePdf: dataUrl,
              originalFileName: file.name,
              version: 1,
              templateName: newTemplateName.trim(),
              stage: newTemplateStage,
              mode: 'add', // add new template
            }),
          })
          const data = await res.json()
          if (data.success) {
            toast.success(`Template "${newTemplateName}" berhasil diupload`)
            setNewTemplateName('')
            setShowAddForm(false)
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

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !replaceTemplateId) return
    if (file.type !== 'application/pdf') {
      toast.error('File harus PDF')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        try {
          const res = await fetch(`/api/bank-config/${bank.id}/template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templatePdf: dataUrl,
              originalFileName: file.name,
              version: (templates.find(t => t.id === replaceTemplateId)?.version || 1) + 1,
              templateName: templates.find(t => t.id === replaceTemplateId)?.name,
              stage: templates.find(t => t.id === replaceTemplateId)?.stage || 'entry',
              mode: 'replace',
              replaceTemplateId,
            }),
          })
          const data = await res.json()
          if (data.success) {
            toast.success(`Template berhasil di-replace (v${(templates.find(t => t.id === replaceTemplateId)?.version || 1) + 1})`)
            setReplaceTemplateId(null)
            onUpdated()
          } else {
            toast.error(data.error || 'Gagal replace template')
          }
        } catch (err) {
          toast.error('Gagal replace template')
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

  if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>

  return (
    <Card className="p-4 max-w-2xl space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Template PDF</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Upload form kosong dari bank (PDF). 1 bank bisa punya multiple template (FLPP, SPR, AJB, dll). Nama file = nama asli upload + version.
        </p>
      </div>

      {/* List of templates */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Templates ({templates.length})</h4>
          {templates.map(tpl => (
            <div key={tpl.id} className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/30">
              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{tpl.name}</span>
                  <Badge variant="outline" className="text-[9px]">v{tpl.version}</Badge>
                  <Badge variant="secondary" className="text-[9px]">{tpl.stage || 'entry'}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{tpl.fileName}</div>
              </div>
              {tpl.webViewLink && (
                <a
                  href={tpl.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  Lihat
                </a>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-1.5"
                onClick={async () => {
                  const newName = window.prompt('Rename template:', tpl.name)
                  if (newName && newName.trim() && newName !== tpl.name) {
                    // Update template name via API
                    try {
                      const docsRes = await fetch(`/api/bank-config/${bank.id}/template`)
                      const docsData = await docsRes.json()
                      if (docsData.success) {
                        let docs = docsData.data.documents || {}
                        if (docs.templates) {
                          docs.templates = docs.templates.map((t: any) =>
                            t.id === tpl.id ? { ...t, name: newName.trim() } : t
                          )
                          await fetch('/api/bank-config', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: bank.id, documents: JSON.stringify(docs) }),
                          })
                          toast.success('Template renamed')
                          // Reload
                          loadTemplates()
                        }
                      }
                    } catch (err) {
                      toast.error('Gagal rename')
                    }
                  }
                }}
                title="Rename template"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => {
                  setReplaceTemplateId(tpl.id)
                  replaceFileRef.current?.click()
                }}
                disabled={uploading}
              >
                Replace
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new template form */}
      {showAddForm ? (
        <div className="p-3 rounded-md border border-violet-500/30 bg-violet-500/5 space-y-2">
          <h4 className="text-xs font-semibold">Tambah Template Baru</h4>
          <div>
            <label className="text-[10px] text-muted-foreground">Nama Template</label>
            <Input
              placeholder="mis. FLPP, SPR, AJB, LPA"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Stage</label>
            <select
              value={newTemplateStage}
              onChange={e => setNewTemplateStage(e.target.value)}
              className="w-full h-8 text-xs border rounded bg-background px-2"
            >
              <option value="entry">Entry (Pre-Bank)</option>
              <option value="post-sp3k">AJB (Post SP3K)</option>
              <option value="post-akad">Post Akad</option>
              <option value="serah-terima">Serah Terima</option>
            </select>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !newTemplateName.trim()}
              className="h-8"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Pilih File PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="h-8">
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="h-8">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Tambah Template
        </Button>
      )}

      {/* Hidden replace file input */}
      <input
        ref={replaceFileRef}
        type="file"
        accept="application/pdf"
        onChange={handleReplaceFile}
        className="hidden"
      />

      <p className="text-[10px] text-muted-foreground">
        💡 Setiap template bisa di-annotate di tab "Annotation". Versi baru tidak overwrite versi lama (anti-overwrite rule).
      </p>
    </Card>
  )
}
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
// BANK DOCUMENTS CONFIG — Customize required documents + formbox per bank
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

// Default formbox fields (yang ada di Tab Berkas sidebar kiri)
const DEFAULT_FORMBOX_FIELDS = [
  { id: 'applicant.fullName', label: 'Nama Lengkap Debitur', default: true },
  { id: 'applicant.ktpNumber', label: 'NIK (No KTP)', default: true },
  { id: 'applicant.pob', label: 'Tempat Lahir', default: true },
  { id: 'applicant.dob', label: 'Tanggal Lahir', default: true },
  { id: 'applicant.address', label: 'Alamat KTP', default: true },
  { id: 'applicant.rtRw', label: 'RT/RW', default: true },
  { id: 'applicant.kelurahan', label: 'Kelurahan/Desa', default: true },
  { id: 'applicant.kecamatan', label: 'Kecamatan', default: true },
  { id: 'applicant.city', label: 'Kota', default: true },
  { id: 'applicant.postalCode', label: 'Kode Pos', default: true },
  { id: 'applicant.phone', label: 'No HP/Telp', default: true },
  { id: 'applicant.jobTitle', label: 'Pekerjaan/Jabatan', default: true },
  { id: 'applicant.companyName', label: 'Nama Perusahaan', default: true },
  { id: 'applicant.companyAddress', label: 'Alamat Perusahaan', default: true },
  { id: 'applicant.companyPhone', label: 'Telp Perusahaan', default: false },
  { id: 'applicant.monthlyIncome', label: 'Penghasilan/Bulan', default: true },
  { id: 'applicant.btnAccountNumber', label: 'No Rekening BTN', default: false },
  { id: 'applicant.npwpNumber', label: 'NPWP', default: true },
  { id: 'spouse.fullName', label: 'Nama Pasangan', default: false },
  { id: 'spouse.ktpNumber', label: 'NIK Pasangan', default: false },
  { id: 'spouse.dob', label: 'Tanggal Lahir Pasangan', default: false },
  { id: 'spouse.job', label: 'Pekerjaan Pasangan', default: false },
  { id: 'property.projectName', label: 'Nama Perumahan', default: true },
  { id: 'property.blockLetter', label: 'Blok Rumah', default: true },
  { id: 'property.houseNumber', label: 'No Rumah', default: true },
  { id: 'property.kavlingNumber', label: 'No Kavling', default: false },
  { id: 'property.houseAddress', label: 'Alamat Rumah', default: false },
  { id: 'property.landSize', label: 'Luas Tanah', default: true },
  { id: 'property.houseSize', label: 'Luas Bangunan', default: true },
  { id: 'property.price', label: 'Harga Rumah', default: true },
  { id: 'property.dpAmount', label: 'DP', default: true },
  { id: 'property.plafonKpr', label: 'Plafon KPR', default: true },
  { id: 'property.tenor', label: 'Tenor (tahun)', default: true },
  { id: 'dateOfDocument', label: 'Tanggal Dokumen', default: true },
  { id: 'akadDate', label: 'Tanggal Akad', default: false },
  { id: 'lpaDate', label: 'Tanggal LPA', default: false },
]

function BankDocumentsConfig({ bank, onUpdated }: { bank: any; onUpdated: () => void }) {
  const [requiredDocs, setRequiredDocs] = useState<string[]>([])
  const [formboxFields, setFormboxFields] = useState<string[]>([])
  const [customDocs, setCustomDocs] = useState<Array<{ id: string; label: string }>>([])
  const [newDocLabel, setNewDocLabel] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      if (bank.documents) {
        const docs = JSON.parse(bank.documents)
        setRequiredDocs(docs.requiredDocuments || ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
        setFormboxFields(docs.formboxFields || DEFAULT_FORMBOX_FIELDS.filter(d => d.default).map(d => d.id))
        setCustomDocs(docs.customDocs || [])
      } else {
        setRequiredDocs(ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
        setFormboxFields(DEFAULT_FORMBOX_FIELDS.filter(d => d.default).map(d => d.id))
      }
    } catch {
      setRequiredDocs(ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
      setFormboxFields(DEFAULT_FORMBOX_FIELDS.filter(d => d.default).map(d => d.id))
    }
    setLoading(false)
  }, [bank.id, bank.documents])

  function toggleDoc(docId: string) {
    setRequiredDocs(prev =>
      prev.includes(docId) ? prev.filter(d => d !== docId) : [...prev, docId]
    )
  }

  function toggleField(fieldId: string) {
    setFormboxFields(prev =>
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    )
  }

  function addCustomDoc() {
    if (!newDocLabel.trim()) return
    const id = `custom-${Date.now()}`
    setCustomDocs(prev => [...prev, { id, label: newDocLabel.trim() }])
    setRequiredDocs(prev => [...prev, id])
    setNewDocLabel('')
  }

  function addCustomField() {
    if (!newFieldLabel.trim()) return
    const id = `custom-field-${Date.now()}`
    // Add to formbox list + auto-enable
    setFormboxFields(prev => [...prev, id])
    // We need to track custom fields too — append to DEFAULT_FORMBOX_FIELDS dynamically
    DEFAULT_FORMBOX_FIELDS.push({ id, label: newFieldLabel.trim(), default: false })
    setNewFieldLabel('')
  }

  function removeCustomDoc(id: string) {
    setCustomDocs(prev => prev.filter(d => d.id !== id))
    setRequiredDocs(prev => prev.filter(d => d !== id))
  }

  async function save() {
    setSaving(true)
    try {
      let existingDocs: any = {}
      try {
        if (bank.documents) existingDocs = JSON.parse(bank.documents)
      } catch {}

      existingDocs.requiredDocuments = requiredDocs
      existingDocs.formboxFields = formboxFields
      existingDocs.customDocs = customDocs
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
        toast.success('Dokumen wajib + formbox disimpan')
        onUpdated()
      } else {
        toast.error(data.error || 'Gagal simpan')
      }
    } catch (err) {
      toast.error('Gagal simpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Memuat...</div>

  return (
    <Card className="p-4 max-w-2xl space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Dokumen Wajib (Upload) */}
      <div>
        <h3 className="text-sm font-semibold">📄 Dokumen Wajib (Upload)</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          Pilih dokumen yang wajib diupload untuk bank {bank.bankName}.
        </p>
        <div className="space-y-1.5">
          {ALL_DOC_TYPES.map(doc => (
            <label key={doc.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/30 cursor-pointer">
              <input type="checkbox" checked={requiredDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} className="w-4 h-4 rounded" />
              <span className="text-sm flex-1">{doc.label}</span>
              {doc.default && <Badge variant="secondary" className="text-[9px]">Default</Badge>}
            </label>
          ))}
          {customDocs.map(doc => (
            <label key={doc.id} className="flex items-center gap-2 p-2 rounded border border-violet-500/30 bg-violet-500/5 cursor-pointer">
              <input type="checkbox" checked={requiredDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} className="w-4 h-4 rounded" />
              <span className="text-sm flex-1">{doc.label}</span>
              <Badge variant="outline" className="text-[9px]">Custom</Badge>
              <button onClick={(e) => { e.preventDefault(); removeCustomDoc(doc.id) }} className="text-red-500 hover:text-red-700">
                <X className="w-3 h-3" />
              </button>
            </label>
          ))}
        </div>
        {/* Add custom doc */}
        <div className="flex gap-1 mt-2">
          <Input
            placeholder="Tambah dokumen custom (mis. Surat Keterangan Penghasilan Ortu)"
            value={newDocLabel}
            onChange={e => setNewDocLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomDoc()}
            className="text-xs h-8"
          />
          <Button size="sm" onClick={addCustomDoc} className="h-8">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <h3 className="text-sm font-semibold">📝 Form Box Fields (Data Input)</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          Pilih field form yang akan muncul di sidebar kiri Tab Berkas. Field ini juga bisa di-drag ke PDF untuk annotation.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {DEFAULT_FORMBOX_FIELDS.map(field => (
            <label key={field.id} className="flex items-center gap-1.5 p-1.5 rounded border border-border hover:bg-muted/30 cursor-pointer text-xs">
              <input type="checkbox" checked={formboxFields.includes(field.id)} onChange={() => toggleField(field.id)} className="w-3 h-3 rounded shrink-0" />
              <span className="truncate">{field.label}</span>
            </label>
          ))}
        </div>
        {/* Add custom field */}
        <div className="flex gap-1 mt-2">
          <Input
            placeholder="Tambah field custom (mis. No Paspor)"
            value={newFieldLabel}
            onChange={e => setNewFieldLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomField()}
            className="text-xs h-8"
          />
          <Button size="sm" onClick={addCustomField} className="h-8">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Simpan
        </Button>
        <Button variant="outline" onClick={() => {
          setRequiredDocs(ALL_DOC_TYPES.filter(d => d.default).map(d => d.id))
          setFormboxFields(DEFAULT_FORMBOX_FIELDS.filter(d => d.default).map(d => d.id))
        }}>
          Reset ke Default
        </Button>
      </div>
    </Card>
  )
}
