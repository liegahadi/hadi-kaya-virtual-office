'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Upload, Download, CheckCircle2, AlertCircle,
  X, RefreshCw, Loader2, Wand2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ChecklistItem {
  id: string
  documentName: string
  category: string
  status: string
  uploadedFileUrl: string | null
  uploadedAt: string | null
  notes: string | null
  isRequired: boolean
  template?: {
    id: string
    templateName: string
    templateUrl: string
    type: string
    category: string
    description: string | null
  }
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  MISSING: { label: 'Belum ada', icon: '❌', color: 'text-rose-400' },
  UPLOADED: { label: 'Sudah upload', icon: '✅', color: 'text-emerald-400' },
  FILLED: { label: 'Sudah diisi', icon: '📝', color: 'text-blue-400' },
  SCANNED: { label: 'Sudah scan', icon: '📄', color: 'text-violet-400' },
  VERIFIED: { label: 'Verified', icon: '✓', color: 'text-emerald-400' },
}

const BANK_LABELS: Record<string, string> = {
  MANDIRI: 'Bank Mandiri',
  BSB_SYARIAH: 'BSB Syariah',
  BTN: 'BTN',
}

export function DocumentChecklist({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [bank, setBank] = useState('BTN')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [autoFillingId, setAutoFillingId] = useState<string | null>(null)

  useEffect(() => {
    fetchChecklist()
  }, [customerId, bank])

  async function fetchChecklist() {
    setLoading(true)
    try {
      const res = await fetch(`/api/document-templates/checklist?customerId=${customerId}&bankName=${bank}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch {
      toast.error('Gagal memuat checklist')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(itemId: string, file: File) {
    setUploadingId(itemId)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/document-templates/checklist/${itemId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${data.message}`)
        await fetchChecklist()
      } else {
        toast.error(data.error || 'Gagal upload')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUploadingId(null)
    }
  }

  function triggerUpload(itemId: string) {
    const input = document.getElementById(`file-input-${itemId}`) as HTMLInputElement
    if (input) input.click()
  }

  function downloadTemplate(templateId: string, _templateName: string) {
    window.open(`/api/document-templates/${templateId}/download`, '_blank')
  }

  function downloadUploaded(fileUrl: string) {
    window.open(fileUrl, '_blank')
  }

  async function handleAutoFill(itemId: string, templateId: string) {
    setAutoFillingId(itemId)
    try {
      const res = await fetch(`/api/document-templates/${templateId}/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `autofill_${itemId}.docx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Dokumen auto-fill berhasil di-download!')
      } else {
        toast.error('Gagal auto-fill')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setAutoFillingId(null)
    }
  }

  // Split items: FORM (perlu download template) vs REFERENCE (upload scan)
  const formItems = items.filter(i => i.template?.type === 'FORM')
  const referenceItems = items.filter(i => i.template?.type === 'REFERENCE')
  const postAccItems = items.filter(i => i.template?.sortOrder >= 30)

  const completedCount = items.filter(i => i.status !== 'MISSING').length
  const percent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">Checklist Berkas: {customerName}</h3>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{items.length} lengkap ({percent}%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bank selector */}
          <select
            value={bank}
            onChange={e => setBank(e.target.value)}
            className="bg-background/50 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
          >
            <option value="BTN">BTN</option>
            <option value="MANDIRI">Mandiri</option>
            <option value="BSB_SYARIAH">BSB Syariah</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchChecklist} className="h-8">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-accent/30 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Belum ada template untuk bank {BANK_LABELS[bank]}</p>
        </Card>
      ) : (
        <>
          {/* FORM Templates — download, print, isi, scan, upload */}
          {formItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                📝 Form Templates (Download → Print → Isi → Scan → Upload)
              </h4>
              <div className="space-y-2">
                {formItems.map(item => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    customerId={customerId}
                    uploadingId={uploadingId}
                    autoFillingId={autoFillingId}
                    onUpload={handleUpload}
                    onTriggerUpload={triggerUpload}
                    onAutoFill={handleAutoFill}
                    onDownloadTemplate={downloadTemplate}
                    onDownloadUploaded={downloadUploaded}
                  />
                ))}
              </div>
            </div>
          )}

          {/* REFERENCE Items — upload scan langsung */}
          {referenceItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 mt-4">
                📎 Dokumen Pendukung (Upload Scan Langsung)
              </h4>
              <div className="space-y-2">
                {referenceItems.map(item => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    customerId={customerId}
                    uploadingId={uploadingId}
                    autoFillingId={autoFillingId}
                    onUpload={handleUpload}
                    onTriggerUpload={triggerUpload}
                    onAutoFill={handleAutoFill}
                    onDownloadTemplate={downloadTemplate}
                    onDownloadUploaded={downloadUploaded}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// CHECKLIST ROW
// ============================================================
function ChecklistRow({
  item, customerId, uploadingId, autoFillingId, onUpload, onTriggerUpload, onAutoFill, onDownloadTemplate, onDownloadUploaded,
}: {
  item: ChecklistItem
  customerId: string
  uploadingId: string | null
  autoFillingId: string | null
  onUpload: (id: string, file: File) => void
  onTriggerUpload: (id: string) => void
  onAutoFill: (itemId: string, templateId: string) => void
  onDownloadTemplate: (id: string, name: string) => void
  onDownloadUploaded: (url: string) => void
}) {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.MISSING
  const isUploading = uploadingId === item.id
  const isAutoFilling = autoFillingId === item.id
  const canAutoFill = item.template?.type === 'FORM' && item.template?.templateUrl && item.template.templateUrl.endsWith('.docx')

  return (
    <Card className={cn(
      'p-3 border border-border transition-all',
      item.status === 'MISSING' && 'border-rose-700/30',
      item.status !== 'MISSING' && 'border-emerald-700/30',
    )}>
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <span className="text-lg flex-shrink-0">{cfg.icon}</span>

        {/* Document name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{item.documentName}</span>
            <Badge variant="outline" className="text-[8px] h-3 px-1">{item.category}</Badge>
            {item.isRequired && (
              <Badge variant="outline" className="text-[8px] h-3 px-1 text-rose-400 border-rose-700/30">Wajib</Badge>
            )}
          </div>
          {item.template?.description && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.template.description}</p>
          )}
          {item.notes && (
            <p className="text-[10px] text-amber-400 mt-0.5">📝 {item.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Hidden file input */}
          <input
            id={`file-input-${item.id}`}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onUpload(item.id, file)
              e.target.value = ''
            }}
          />

          {/* Download template (if FORM type) */}
          {item.template?.type === 'FORM' && item.template?.templateUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadTemplate(item.template!.id, item.template!.templateName)}
              className="h-7 text-[10px] px-2"
              title="Download template form (kosong)"
            >
              <Download className="w-3 h-3 mr-1" />
              Form
            </Button>
          )}

          {/* Auto-fill button (DOCX only) */}
          {canAutoFill && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onAutoFill(item.id, item.template!.id)}
              disabled={isAutoFilling}
              className="h-7 text-[10px] px-2 bg-violet-600 hover:bg-violet-700"
              title="Auto-fill dengan data konsumen"
            >
              {isAutoFilling ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Wand2 className="w-3 h-3 mr-1" />
                  Fill
                </>
              )}
            </Button>
          )}

          {/* Download uploaded file (if already uploaded) */}
          {item.uploadedFileUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadUploaded(item.uploadedFileUrl!)}
              className="h-7 text-[10px] px-2"
              title="Lihat file yang diupload"
            >
              <FileText className="w-3 h-3" />
            </Button>
          )}

          {/* Upload button */}
          <Button
            variant={item.status === 'MISSING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTriggerUpload(item.id)}
            disabled={isUploading}
            className="h-7 text-[10px] px-2"
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : item.status === 'MISSING' ? (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                Ganti
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
