'use client'

// ============================================================
// DINA v2: BANK ANNOTATION EDITOR
// Visual PDF annotation — click on PDF to place field markers
// Map each marker to a DB field (customer.name, customer.nik, etc)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Plus, Trash2, Loader2, MousePointerClick, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Annotation } from './bank-builder'

// Annotation type with fontSize + testValue
interface AnnotationExt extends Annotation {
  fontSize?: number
}

// Common fields available in Customer table for mapping
const FIELD_MAPPINGS = [
  // Identity
  { value: 'customer.name', label: 'Nama Lengkap' },
  { value: 'customer.nik', label: 'NIK' },
  { value: 'customer.birthPlace', label: 'Tempat Lahir' },
  { value: 'customer.birthDate', label: 'Tanggal Lahir' },
  { value: 'customer.gender', label: 'Jenis Kelamin' },
  { value: 'customer.religion', label: 'Agama' },
  { value: 'customer.maritalStatus', label: 'Status Pernikahan' },
  // Address
  { value: 'customer.ktpAddress', label: 'Alamat KTP' },
  { value: 'customer.rtRw', label: 'RT/RW' },
  { value: 'customer.kelurahan', label: 'Kelurahan' },
  { value: 'customer.kecamatan', label: 'Kecamatan' },
  { value: 'customer.city', label: 'Kota' },
  { value: 'customer.postalCode', label: 'Kode Pos' },
  // Work
  { value: 'customer.occupation', label: 'Pekerjaan' },
  { value: 'customer.companyName', label: 'Nama Perusahaan' },
  { value: 'customer.companyAddress', label: 'Alamat Perusahaan' },
  { value: 'customer.companyPhone', label: 'Telp Perusahaan' },
  { value: 'customer.workPosition', label: 'Jabatan' },
  { value: 'customer.workDuration', label: 'Lama Bekerja' },
  { value: 'customer.monthlyIncome', label: 'Penghasilan/Bulan' },
  // Family
  { value: 'customer.spouseName', label: 'Nama Pasangan' },
  { value: 'customer.spouseNik', label: 'NIK Pasangan' },
  { value: 'customer.motherMaidenName', label: 'Nama Ibu Kandung' },
  { value: 'customer.dependents', label: 'Jumlah Tanggungan' },
  // Property
  { value: 'customer.blockLetter', label: 'Blok Rumah' },
  { value: 'customer.houseNumber', label: 'No Rumah' },
  { value: 'customer.landSize', label: 'Luas Tanah' },
  { value: 'customer.houseSize', label: 'Luas Bangunan' },
  // Bank
  { value: 'customer.bankName', label: 'Nama Bank' },
  { value: 'customer.bankAccount', label: 'No Rekening' },
  { value: 'customer.npwpNumber', label: 'NPWP' },
  { value: 'customer.btnAccountNumber', label: 'No Rekening BTN' },
  // Documents
  { value: 'customer.shmNumber', label: 'No SHM' },
  { value: 'customer.nibNumber', label: 'No NIB' },
  // Dates
  { value: 'customer.closingDate', label: 'Tanggal Closing' },
  { value: 'customer.sp3kDate', label: 'Tanggal SP3K' },
  { value: 'customer.akadDate', label: 'Tanggal Akad' },
  { value: 'customer.akadNumber', label: 'No Akad' },
  { value: 'system.todayDate', label: 'Tanggal Hari Ini (realtime, DD/MM/YYYY)' },
  { value: 'system.todayDateLong', label: 'Tanggal Hari Ini (panjang, e.g. 13 Juli 2026)' },
  { value: 'system.todayDay', label: 'Hari (e.g. Senin)' },
  { value: 'system.currentYear', label: 'Tahun Berjalan (e.g. 2026)' },
  { value: 'system.currentMonth', label: 'Bulan Berjalan (e.g. Juli)' },
  // Company (global)
  { value: 'company.companyName', label: 'Nama PT (Developer)' },
  { value: 'company.directorName', label: 'Nama Direktur' },
  { value: 'company.directorNik', label: 'NIK Direktur' },
  { value: 'company.officeAddress', label: 'Alamat Kantor' },
  { value: 'company.city', label: 'Kota Kantor' },
  // Custom
  { value: 'custom.text', label: 'Custom Text (diisi manual)' },
  { value: 'custom.date', label: 'Custom Date (diisi manual)' },
  { value: 'custom.signature', label: 'Tanda Tangan (kosong)' },
] as const

interface BankTemplate {
  fileId?: string
  fileName?: string
  webViewLink?: string | null
  fileHash?: string
  version?: number
  annotations?: Annotation[]
}

export function BankAnnotationEditor({
  bank,
  template,
  onUpdated,
}: {
  bank: any
  template: BankTemplate
  onUpdated: () => void
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(template.annotations || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<null | 'move' | 'resize' | 'resize-bl' | 'resize-tr' | 'resize-tl'>(null)

  // Multi-template state
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Test field state (sample data untuk preview)
  const [testFieldValues, setTestFieldValues] = useState<Record<string, string>>({})
  const [testCustomerId, setTestCustomerId] = useState<string>('')
  const [customers, setCustomers] = useState<any[]>([])

  const dragRef = useRef<{
    annId: string
    mode: typeof dragMode
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    containerWidth: number
    containerHeight: number
  } | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageWidth, setPageWidth] = useState(600)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load templates + customers on mount
  useEffect(() => {
    async function loadAll() {
      // Load templates
      try {
        const res = await fetch(`/api/bank-config/${bank.id}/template`)
        const data = await res.json()
        if (data.success) {
          const tpls = data.data.templates || []
          if (tpls.length > 0) {
            setTemplates(tpls)
            setSelectedTemplateId(tpls[0].id)
            setAnnotations(tpls[0].annotations || [])
          } else if (data.data.template) {
            // Legacy single template
            const legacyTpl = {
              id: 'legacy',
              name: data.data.template.fileName || 'Template',
              fileId: data.data.template.fileId,
              annotations: data.data.template.annotations || [],
            }
            setTemplates([legacyTpl])
            setSelectedTemplateId('legacy')
            setAnnotations(legacyTpl.annotations)
          }
        }
      } catch (err) {
        console.error('Load templates error:', err)
      }

      // Load customers for test field dropdown
      try {
        const res = await fetch('/api/database-explorer/berkas')
        const data = await res.json()
        if (data.success) {
          setCustomers(data.data.slice(0, 50))
        }
      } catch (err) {
        console.error('Load customers error:', err)
      }
    }
    loadAll()
  }, [bank.id])

  // Load PDF — use selected template's fileId
  useEffect(() => {
    const selectedTpl = templates.find(t => t.id === selectedTemplateId)
    if (!selectedTpl?.fileId && !template?.fileId) {
      setLoadError('Belum ada template PDF. Upload template di tab "Template PDF" dulu.')
      return
    }

    const activeFileId = selectedTpl?.fileId || template?.fileId
    let cancelled = false
    async function loadPdf() {
      try {
        setLoadError(null)
        setPdfLoaded(false)

        // Use proxy with templateId for multi-template + local path support
        const proxyUrl = `/api/bank-config/${bank.id}/template/pdf-proxy?templateId=${selectedTpl?.id || selectedTemplateId}`

        // Test proxy first — if it returns error, show real error message
        const testRes = await fetch(proxyUrl)
        if (!testRes.ok) {
          const errData = await testRes.json().catch(() => ({}))
          throw new Error(errData.error || `Proxy returned ${testRes.status}`)
        }

        const pdfjs: any = await import('pdfjs-dist')
        // Use CDN worker with MATCHING version (must match package.json version exactly)
        // Package version: 6.0.227 → worker must also be 6.0.227
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs`

        const loadingTask = pdfjs.getDocument({ url: proxyUrl })
        const pdf = await loadingTask.promise

        if (cancelled) return

        setNumPages(pdf.numPages)
        setPdfUrl(proxyUrl)
        renderPage(pdf, currentPage)
      } catch (err: any) {
        console.error('PDF load error:', err)
        setLoadError(`Gagal memuat PDF: ${err?.message || 'unknown error'}`)
      }
    }
    loadPdf()
    return () => { cancelled = true }
  }, [selectedTemplateId, templates, template?.fileId, template?.webViewLink, currentPage, bank.id])

    async function renderPage(pdf: any, pageNum: number) {
      try {
        const page = await pdf.getPage(pageNum)
        const canvas = canvasRef.current
        if (!canvas) return

        const container = containerRef.current
        const maxWidth = container?.clientWidth ? container.clientWidth - 32 : 600
        const viewport = page.getViewport({ scale: 1 })
        const scale = maxWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        canvas.style.width = `${scaledViewport.width}px`
        canvas.style.height = `${scaledViewport.height}px`
        setPageWidth(scaledViewport.width)

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        setPdfLoaded(true)
      } catch (err) {
        console.error('Render page error:', err)
      }
    }

  // Handle click on PDF to add annotation
  function handlePdfClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!pdfLoaded) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    // Default size (relative)
    const width = 0.15
    const height = 0.025

    const newAnnotation: Annotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      page: currentPage,
      x: Math.max(0, Math.min(1 - width, x - width / 2)),
      y: Math.max(0, Math.min(1 - height, y - height / 2)),
      width,
      height,
      label: `Field ${annotations.length + 1}`,
      fieldMapping: 'customer.name',
      fieldType: 'text',
    }

    setAnnotations([...annotations, newAnnotation])
    setSelectedId(newAnnotation.id)
    toast.success(`Field ditambahkan di page ${currentPage}`)
  }

  // Update annotation
  function updateAnnotation(id: string, updates: Partial<Annotation>) {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  // Delete annotation
  function deleteAnnotation(id: string) {
    setAnnotations(annotations.filter(a => a.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // === DRAG-MOVE + RESIZE handlers ===
  function startDrag(e: React.MouseEvent, annId: string, mode: typeof dragMode) {
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(annId)
    setDragMode(mode)

    const ann = annotations.find(a => a.id === annId)
    if (!ann) return

    const container = e.currentTarget.closest('.relative.inline-block')
    const rect = container?.getBoundingClientRect()
    if (!rect) return

    dragRef.current = {
      annId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: ann.x,
      origY: ann.y,
      origW: ann.width,
      origH: ann.height,
      containerWidth: rect.width,
      containerHeight: rect.height,
    }

    // Attach global listeners
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', endDrag)
  }

  function onDragMove(e: MouseEvent) {
    if (!dragRef.current) return
    const d = dragRef.current
    const ann = annotations.find(a => a.id === d.annId)
    if (!ann) return

    const deltaX = (e.clientX - d.startX) / d.containerWidth
    const deltaY = (e.clientY - d.startY) / d.containerHeight

    let newX = d.origX
    let newY = d.origY
    let newW = d.origW
    let newH = d.origH

    if (d.mode === 'move') {
      newX = Math.max(0, Math.min(1 - d.origW, d.origX + deltaX))
      newY = Math.max(0, Math.min(1 - d.origH, d.origY + deltaY))
    } else if (d.mode === 'resize') {
      // Bottom-right resize
      newW = Math.max(0.02, Math.min(1 - d.origX, d.origW + deltaX))
      newH = Math.max(0.01, Math.min(1 - d.origY, d.origH + deltaY))
    } else if (d.mode === 'resize-bl') {
      // Bottom-left resize
      const newRight = d.origX + d.origW
      newX = Math.max(0, Math.min(newRight - 0.02, d.origX + deltaX))
      newW = newRight - newX
      newH = Math.max(0.01, Math.min(1 - d.origY, d.origH + deltaY))
    } else if (d.mode === 'resize-tr') {
      // Top-right resize
      const newBottom = d.origY + d.origH
      newY = Math.max(0, Math.min(newBottom - 0.01, d.origY + deltaY))
      newH = newBottom - newY
      newW = Math.max(0.02, Math.min(1 - d.origX, d.origW + deltaX))
    } else if (d.mode === 'resize-tl') {
      // Top-left resize
      const newRight = d.origX + d.origW
      const newBottom = d.origY + d.origH
      newX = Math.max(0, Math.min(newRight - 0.02, d.origX + deltaX))
      newY = Math.max(0, Math.min(newBottom - 0.01, d.origY + deltaY))
      newW = newRight - newX
      newH = newBottom - newY
    }

    setAnnotations(prev => prev.map(a =>
      a.id === d.annId
        ? { ...a, x: newX, y: newY, width: newW, height: newH }
        : a
    ))
  }

  function endDrag() {
    setDragMode(null)
    dragRef.current = null
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', endDrag)
  }

  // Save annotations to backend
  async function saveAnnotations() {
    setSaving(true)
    try {
      // Save annotations per template (multi-template support)
      const res = await fetch('/api/bank-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bank.id,
          annotations,
          templateId: selectedTemplateId, // save to specific template
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${annotations.length} annotation disimpan untuk template ini`)
        onUpdated()
      } else {
        toast.error(data.error || 'Gagal simpan')
      }
    } catch (err) {
      toast.error('Gagal simpan annotation')
    } finally {
      setSaving(false)
    }
  }

  const pageAnnotations = annotations.filter(a => a.page === currentPage)

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
      {/* PDF Viewer */}
      <Card className="lg:col-span-2 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {/* Template selector */}
            {templates.length > 1 && (
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => {
                  const tplId = e.target.value
                  setSelectedTemplateId(tplId)
                  const tpl = templates.find(t => t.id === tplId)
                  if (tpl) {
                    setAnnotations(tpl.annotations || [])
                    setSelectedId(null)
                  }
                }}
                className="text-xs border rounded bg-background px-2 py-1 h-7"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                ))}
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs">
              Page {currentPage} / {numPages || '?'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {annotations.length} total • {pageAnnotations.length} di page ini
            </Badge>
            <Button size="sm" onClick={saveAnnotations} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Simpan
            </Button>
          </div>
        </div>

        {/* PDF Canvas + Annotations overlay — overflow hidden, scroll hanya via page nav buttons */}
        <div ref={containerRef} className="flex-1 overflow-hidden p-4 bg-slate-300 dark:bg-slate-900 relative flex items-start justify-center">
          <div className="overflow-auto max-h-full">
          {loadError ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400 text-sm">
              <p>{loadError}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Pastikan file PDF di Drive memiliki permission "anyone with link can view".
              </p>
            </div>
          ) : (
            <div className="relative inline-block mx-auto bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                onClick={handlePdfClick}
                className="block cursor-crosshair"
              />
              {/* Annotations overlay — DRAGGABLE + RESIZABLE */}
              {pageAnnotations.map((ann) => {
                const isSelected = ann.id === selectedId
                return (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(ann.id)
                    }}
                    onMouseDown={(e) => startDrag(e, ann.id, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${ann.x * 100}%`,
                      top: `${ann.y * 100}%`,
                      width: `${ann.width * 100}%`,
                      height: `${ann.height * 100}%`,
                      cursor: dragMode === 'move' && isSelected ? 'grabbing' : 'grab',
                    }}
                    className={cn(
                      'border-2 transition-colors select-none',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/30'
                        : 'border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30'
                    )}
                  >
                    <span className="absolute -top-5 left-0 text-[9px] font-medium bg-emerald-600 text-white px-1 py-0.5 rounded whitespace-nowrap pointer-events-none">
                      {ann.label}
                    </span>
                    {/* Real-time test data overlay — show sample value inside annotation box */}
                    {testFieldValues[ann.fieldMapping] && (
                      <div
                        className="absolute inset-0 flex items-center px-1 overflow-hidden pointer-events-none"
                        style={{
                          fontSize: `${(ann as any).fontSize || 10}px`,
                          color: '#1e40af',
                          fontWeight: 500,
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        <span>{testFieldValues[ann.fieldMapping]}</span>
                      </div>
                    )}
                    {/* Resize handles (only when selected) */}
                    {isSelected && (
                      <>
                        {/* Bottom-right resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize"
                          style={{ cursor: 'se-resize' }}
                        />
                        {/* Bottom-left resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize-bl')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"
                          style={{ cursor: 'sw-resize' }}
                        />
                        {/* Top-right resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize-tr')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"
                          style={{ cursor: 'ne-resize' }}
                        />
                        {/* Top-left resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize-tl')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"
                          style={{ cursor: 'nw-resize' }}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {!pdfLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          </div>
        </div>

        {/* Hint */}
        <div className="p-2 bg-blue-500/5 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Klik di PDF untuk menambah field annotation. Pilih annotation untuk edit mapping.
        </div>
      </Card>

      {/* Annotation List + Editor — proper scroll within modal */}
      <Card className="overflow-hidden flex flex-col min-h-0">
        <div className="p-2 border-b border-border bg-muted/30 shrink-0">
          <h3 className="text-xs font-semibold">Annotations</h3>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-2 space-y-2">
            {annotations.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                Belum ada annotation. Klik di PDF untuk mulai.
              </div>
            ) : (
              annotations.map((ann, idx) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    setSelectedId(ann.id)
                    if (ann.page !== currentPage) setCurrentPage(ann.page)
                  }}
                  className={cn(
                    'p-2 rounded border cursor-pointer transition-colors',
                    selectedId === ann.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{ann.label}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px]">p{ann.page}</Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id) }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {FIELD_MAPPINGS.find(f => f.value === ann.fieldMapping)?.label || ann.fieldMapping}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected annotation editor + Test Field */}
        {selectedId && (
          <div className="p-2 border-t border-border bg-muted/30 space-y-2">
            <h4 className="text-xs font-semibold">Edit Field</h4>
            {(() => {
              const ann = annotations.find(a => a.id === selectedId)
              if (!ann) return null
              return (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Label</label>
                    <Input
                      value={ann.label}
                      onChange={(e) => updateAnnotation(ann.id, { label: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Field Mapping</label>
                    <Select
                      value={ann.fieldMapping}
                      onValueChange={(v) => updateAnnotation(ann.id, { fieldMapping: v })}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_MAPPINGS.map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Field Type</label>
                    <Select
                      value={ann.fieldType || 'text'}
                      onValueChange={(v) => updateAnnotation(ann.id, { fieldType: v as any })}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text" className="text-xs">Text</SelectItem>
                        <SelectItem value="date" className="text-xs">Date</SelectItem>
                        <SelectItem value="number" className="text-xs">Number</SelectItem>
                        <SelectItem value="image" className="text-xs">Image (foto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div>
                      <label className="text-[9px] text-muted-foreground">X</label>
                      <Input type="number" step="0.01" min="0" max="1" value={ann.x.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { x: parseFloat(e.target.value) || 0 })} className="h-6 text-[10px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">Y</label>
                      <Input type="number" step="0.01" min="0" max="1" value={ann.y.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { y: parseFloat(e.target.value) || 0 })} className="h-6 text-[10px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">W</label>
                      <Input type="number" step="0.01" min="0.01" max="1" value={ann.width.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { width: parseFloat(e.target.value) || 0.01 })} className="h-6 text-[10px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">H</label>
                      <Input type="number" step="0.01" min="0.01" max="1" value={ann.height.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { height: parseFloat(e.target.value) || 0.01 })} className="h-6 text-[10px]" />
                    </div>
                  </div>
                  {/* Font Size */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">Font Size (px)</label>
                    <Input
                      type="number"
                      min="6"
                      max="72"
                      value={(ann as any).fontSize || 10}
                      onChange={(e) => updateAnnotation(ann.id, { fontSize: parseInt(e.target.value) || 10 } as any)}
                      className="h-7 text-xs w-20"
                    />
                  </div>
                  {/* TEST FIELD — sample data untuk real-time preview di PDF */}
                  <div className="pt-2 border-t border-border">
                    <label className="text-[10px] text-violet-500 font-medium">🧪 Test Data (real-time preview di PDF)</label>
                    <Input
                      placeholder="Ketik sample value..."
                      value={testFieldValues[ann.fieldMapping] || ''}
                      onChange={(e) => setTestFieldValues(prev => ({ ...prev, [ann.fieldMapping]: e.target.value }))}
                      className="h-7 text-xs mt-1"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Value muncul real-time di annotation box di PDF →
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Test Customer Selector */}
        <div className="p-2 border-t border-border bg-violet-500/5">
          <label className="text-[10px] text-violet-500 font-medium">🧪 Test dari Konsumen Existing</label>
          <select
            value={testCustomerId}
            onChange={async (e) => {
              const cid = e.target.value
              setTestCustomerId(cid)
              if (cid) {
                // Fetch customer data and fill test field values
                try {
                  const res = await fetch(`/api/customers/${cid}`)
                  const data = await res.json()
                  if (data.success) {
                    const c = data.data
                    const values: Record<string, string> = {}
                    // Map customer fields to test values
                    if (c.name) values['customer.name'] = c.name
                    if (c.nik) values['customer.nik'] = c.nik
                    if (c.birthPlace) values['customer.birthPlace'] = c.birthPlace
                    if (c.birthDate) values['customer.birthDate'] = c.birthDate
                    if (c.gender) values['customer.gender'] = c.gender
                    if (c.religion) values['customer.religion'] = c.religion
                    if (c.maritalStatus) values['customer.maritalStatus'] = c.maritalStatus
                    if (c.ktpAddress) values['customer.ktpAddress'] = c.ktpAddress
                    if (c.rtRw) values['customer.rtRw'] = c.rtRw
                    if (c.kelurahan) values['customer.kelurahan'] = c.kelurahan
                    if (c.kecamatan) values['customer.kecamatan'] = c.kecamatan
                    if (c.city) values['customer.city'] = c.city
                    if (c.postalCode) values['customer.postalCode'] = c.postalCode
                    if (c.whatsappNumber) values['customer.phone'] = c.whatsappNumber
                    if (c.occupation) values['customer.occupation'] = c.occupation
                    if (c.companyName) values['customer.companyName'] = c.companyName
                    if (c.companyAddress) values['customer.companyAddress'] = c.companyAddress
                    if (c.workPosition) values['customer.workPosition'] = c.workPosition
                    if (c.monthlyIncome) values['customer.monthlyIncome'] = String(c.monthlyIncome)
                    if (c.npwpNumber) values['customer.npwpNumber'] = c.npwpNumber
                    if (c.bankName) values['customer.bankName'] = c.bankName
                    if (c.blockLetter) values['customer.blockLetter'] = c.blockLetter
                    if (c.houseNumber) values['customer.houseNumber'] = c.houseNumber
                    // System fields
                    const today = new Date()
                    values['system.todayDate'] = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    values['system.todayDateLong'] = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    values['system.todayDay'] = today.toLocaleDateString('id-ID', { weekday: 'long' })
                    values['system.currentYear'] = String(today.getFullYear())
                    values['system.currentMonth'] = today.toLocaleDateString('id-ID', { month: 'long' })
                    setTestFieldValues(values)
                    toast.success(`Test data dari ${c.name} dimuat`)
                  }
                } catch (err) {
                  toast.error('Gagal load data konsumen')
                }
              } else {
                setTestFieldValues({})
              }
            }}
            className="w-full h-7 text-xs border rounded bg-background px-2 mt-1"
          >
            <option value="">— Pilih konsumen —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (Blok {c.blockLetter || ''}{c.houseNumber || ''})
              </option>
            ))}
          </select>
        </div>
        </div>
      </Card>
    </div>
  )
}
