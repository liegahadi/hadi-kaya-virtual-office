'use client'

// ============================================================
// BankTemplatePreview — Render PDF + React state overlay
// Renders PDF template via pdfjs canvas, overlays annotation text
// from DB annotations + form data (real-time, NO API call per update)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Annotation {
  id: string
  page: number
  x: number       // 0-1 relative
  y: number       // 0-1 relative
  width: number   // 0-1 relative
  height: number  // 0-1 relative
  label: string
  fieldMapping: string
  fieldType?: string
  fontSize?: number
}

interface BankTemplatePreviewProps {
  bankId: string
  templateId: string
  templatePath?: string | null  // local path for existing templates
  fileId?: string | null        // Drive fileId for Bank Builder uploaded templates
  annotations: Annotation[]
  formData: Record<string, string>
  onLoadingChange?: (loading: boolean) => void
}

export function BankTemplatePreview({
  bankId,
  templateId,
  templatePath,
  fileId,
  annotations,
  formData,
  onLoadingChange,
}: BankTemplatePreviewProps) {
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load PDF once (cached)
  useEffect(() => {
    let cancelled = false
    async function loadPdf() {
      setLoadError(null)
      setPdfLoaded(false)
      onLoadingChange?.(true)
      try {
        const proxyUrl = `/api/bank-config/${bankId}/template/pdf-proxy?templateId=${templateId}`
        const testRes = await fetch(proxyUrl)
        if (!testRes.ok) {
          const errData = await testRes.json().catch(() => ({}))
          throw new Error(errData.error || `HTTP ${testRes.status}`)
        }

        const pdfjs: any = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs`

        const loadingTask = pdfjs.getDocument({ url: proxyUrl })
        const pdf = await loadingTask.promise

        if (cancelled) return

        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
        renderPage(pdf, currentPage)
      } catch (err: any) {
        setLoadError(`Gagal memuat PDF: ${err?.message || 'unknown'}`)
      } finally {
        if (!cancelled) {
          setPdfLoaded(true)
          onLoadingChange?.(false)
        }
      }
    }
    loadPdf()
    return () => { cancelled = true }
  }, [bankId, templateId])

  // Render page on canvas
  async function renderPage(pdf: any, pageNum: number) {
    try {
      const page = await pdf.getPage(pageNum)
      const canvas = canvasRef.current
      if (!canvas) return

      const container = containerRef.current
      const maxWidth = container?.clientWidth ? container.clientWidth - 16 : 600
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min(maxWidth / viewport.width, 1.5)
      const scaledViewport = page.getViewport({ scale })

      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      canvas.style.width = `${scaledViewport.width}px`
      canvas.style.height = `${scaledViewport.height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
    } catch (err) {
      console.error('Render page error:', err)
    }
  }

  // Re-render when page changes
  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage)
  }, [currentPage, pdfDoc])

  // Re-render overlay when formData changes (NO re-fetch PDF, just redraw canvas overlay)
  // We use a separate overlay canvas on top of PDF canvas
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!pdfLoaded || !canvasRef.current || !overlayCanvasRef.current) return

    const pdfCanvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    // Match overlay canvas size to PDF canvas
    overlayCanvas.width = pdfCanvas.width
    overlayCanvas.height = pdfCanvas.height

    const ctx = overlayCanvas.getContext('2d')
    if (!ctx) return

    // Clear overlay
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    // Draw annotations for current page
    const pageAnns = annotations.filter(a => a.page === currentPage)
    const canvasWidth = pdfCanvas.width
    const canvasHeight = pdfCanvas.height

    for (const ann of pageAnns) {
      const value = formData[ann.fieldMapping] || ''
      if (!value) continue

      const x = ann.x * canvasWidth
      const y = ann.y * canvasHeight
      const w = ann.width * canvasWidth
      const h = ann.height * canvasHeight
      const fontSize = (ann.fontSize || 10) * (canvasWidth / 600) // scale font with canvas

      // Draw white background to cover template text
      ctx.fillStyle = 'white'
      ctx.fillRect(x, y, w, h)

      // Draw text
      ctx.fillStyle = 'black'
      ctx.font = `${fontSize}px Helvetica`
      ctx.textBaseline = 'top'
      
      // Word wrap if text is too long
      const maxWidth = w - 4
      const words = String(value).split(' ')
      let line = ''
      let yPos = y + 2

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, x + 2, yPos)
          line = word
          yPos += fontSize * 1.2
          if (yPos > y + h - fontSize) break // stop if overflow
        } else {
          line = testLine
        }
      }
      if (line) ctx.fillText(line, x + 2, yPos)
    }
  }, [formData, annotations, currentPage, pdfLoaded])

  if (loadError) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400 text-sm">
        <p>{loadError}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page navigation */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="h-7">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs">Page {currentPage} / {numPages || '?'}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="h-7">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {annotations.filter(a => a.page === currentPage).length} fields di page ini
        </Badge>
      </div>

      {/* PDF Canvas + Overlay */}
      <div ref={containerRef} className="flex-1 overflow-auto p-2 bg-slate-300 dark:bg-slate-900 flex items-start justify-center">
        <div className="relative inline-block bg-white shadow-lg">
          <canvas ref={canvasRef} className="block" />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
          />
          {!pdfLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
