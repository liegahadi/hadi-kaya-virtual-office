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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageWidth, setPageWidth] = useState(600)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load PDF
  useEffect(() => {
    if (!template.webViewLink) return

    let cancelled = false
    async function loadPdf() {
      try {
        setLoadError(null)
        // We need to fetch the PDF content. Use Google Drive export endpoint via our proxy.
        // For simplicity, use webViewLink converted to direct download
        const fileId = template.fileId
        // Use our own proxy endpoint to avoid CORS issues with pdfjs
        // Direct Google Drive URLs cause CORS errors saat pdfjs fetch PDF
        const directUrl = `/api/bank-config/${bank.id}/template/pdf-proxy`

        const pdfjs: any = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.mjs')).default

        const loadingTask = pdfjs.getDocument({ url: directUrl })
        const pdf = await loadingTask.promise

        if (cancelled) return

        setNumPages(pdf.numPages)
        setPdfUrl(directUrl)
        renderPage(pdf, currentPage)
      } catch (err: any) {
        console.error('PDF load error:', err)
        setLoadError('Gagal memuat PDF. Pastikan permission Drive = anyone with link can view.')
      }
    }

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

    loadPdf()
    return () => { cancelled = true }
  }, [template.fileId, template.webViewLink, currentPage])

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

  // Save annotations to backend
  async function saveAnnotations() {
    setSaving(true)
    try {
      const res = await fetch('/api/bank-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bank.id,
          annotations,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${annotations.length} annotation disimpan`)
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
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* PDF Viewer */}
      <Card className="lg:col-span-2 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
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

        {/* PDF Canvas + Annotations overlay */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-slate-300 dark:bg-slate-900 relative">
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
              {/* Annotations overlay */}
              {pageAnnotations.map((ann) => {
                const isSelected = ann.id === selectedId
                return (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(ann.id)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${ann.x * 100}%`,
                      top: `${ann.y * 100}%`,
                      width: `${ann.width * 100}%`,
                      height: `${ann.height * 100}%`,
                    }}
                    className={cn(
                      'border-2 cursor-pointer transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/30'
                        : 'border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30'
                    )}
                  >
                    <span className="absolute -top-5 left-0 text-[9px] font-medium bg-emerald-600 text-white px-1 py-0.5 rounded whitespace-nowrap">
                      {ann.label}
                    </span>
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

        {/* Hint */}
        <div className="p-2 bg-blue-500/5 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Klik di PDF untuk menambah field annotation. Pilih annotation untuk edit mapping.
        </div>
      </Card>

      {/* Annotation List + Editor */}
      <Card className="overflow-hidden flex flex-col">
        <div className="p-2 border-b border-border bg-muted/30">
          <h3 className="text-xs font-semibold">Annotations</h3>
        </div>
        <ScrollArea className="flex-1">
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
        </ScrollArea>

        {/* Selected annotation editor */}
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
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={ann.x.toFixed(3)}
                        onChange={(e) => updateAnnotation(ann.id, { x: parseFloat(e.target.value) || 0 })}
                        className="h-6 text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">Y</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={ann.y.toFixed(3)}
                        onChange={(e) => updateAnnotation(ann.id, { y: parseFloat(e.target.value) || 0 })}
                        className="h-6 text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">W</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={ann.width.toFixed(3)}
                        onChange={(e) => updateAnnotation(ann.id, { width: parseFloat(e.target.value) || 0.01 })}
                        className="h-6 text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">H</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={ann.height.toFixed(3)}
                        onChange={(e) => updateAnnotation(ann.id, { height: parseFloat(e.target.value) || 0.01 })}
                        className="h-6 text-[10px]"
                      />
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </Card>
    </div>
  )
}
