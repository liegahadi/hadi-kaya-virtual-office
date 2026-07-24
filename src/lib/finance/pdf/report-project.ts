// Laporan Per-Proyek PDF Generator
// Per PRD section 25.12 — lifecycle cost per project
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'

interface ProjectReportData {
  project: { name: string; code: string | null; type: string }
  summary: { totalMaterial: number; totalUpah: number; totalOps: number; totalCost: number; outstanding: number; unitCount: number }
  perUnit: Array<{ blockNumber: string; material: number; upah: number; ops: number; total: number }>
  timeline: Array<{ date: Date; amount: number; method: string; recipient: string }>
}

export async function generateProjectReportPDF(data: ProjectReportData): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([595, 842])
  let y = 842 - 50
  const margin = 50
  const contentWidth = 595 - margin * 2

  const newPageIfNeeded = (needed: number = 30) => {
    if (y < needed) { page = doc.addPage([595, 842]); y = 842 - 50 }
  }

  const drawText = (text: string, opts: any = {}) => {
    newPageIfNeeded(opts.size ? 20 : 15)
    page.drawText(text, { x: opts.x ?? margin, y, size: opts.size ?? 10, font: opts.bold ? fontBold : font, color: opts.color ?? rgb(0, 0, 0), maxWidth: opts.maxWidth ?? contentWidth })
    if (!opts.noNewline) y -= (opts.size ?? 10) + 5
  }

  // KOP
  drawText('KOP SURAT PERUSAHAAN', { size: 10, bold: true, color: rgb(0.6, 0.6, 0.6) })
  drawText('(Edit di Google Docs setelah generate)', { size: 8, color: rgb(0.7, 0.7, 0.7) })
  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 1 })
  y -= 25

  // JUDUL
  drawText('LAPORAN PER PROYEK', { size: 16, bold: true, x: margin + contentWidth / 2 - 100 })
  y -= 5
  drawText(`${data.project.name} (${data.project.code || '-'})`, { size: 12, x: margin + contentWidth / 2 - 80 })
  y -= 15

  // HEADER
  drawText(`Project: ${data.project.name}`, { size: 10 })
  drawText(`Code: ${data.project.code || '-'}`, { size: 10 })
  drawText(`Type: ${data.project.type}`, { size: 10 })
  drawText(`Total Unit: ${data.summary.unitCount}`, { size: 10 })
  y -= 10

  // RINGKASAN
  drawText('=== RINGKASAN BIAYA ===', { size: 12, bold: true })
  y -= 5
  const kpiRows = [
    ['Material (pemakaian)', formatCurrency(data.summary.totalMaterial)],
    ['Upah Tukang', formatCurrency(data.summary.totalUpah)],
    ['Biaya Operasional', formatCurrency(data.summary.totalOps)],
    ['TOTAL COST-TO-DATE', formatCurrency(data.summary.totalCost)],
    ['Outstanding Hutang', formatCurrency(data.summary.outstanding)],
  ]
  for (const [label, value] of kpiRows) {
    page.drawText(label, { x: margin, y, size: 10, font })
    page.drawText(value, { x: 595 - margin - 150, y, size: 10, font: label.includes('TOTAL') ? fontBold : font })
    y -= 15
  }
  y -= 15

  // DETAIL 1: Biaya per Unit
  drawText('=== 1. BIAYA PER UNIT (urut termahal) ===', { size: 12, bold: true })
  y -= 5
  page.drawText('Unit', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Material', { x: margin + 100, y, size: 9, font: fontBold })
  page.drawText('Upah', { x: margin + 250, y, size: 9, font: fontBold })
  page.drawText('Ops', { x: margin + 350, y, size: 9, font: fontBold })
  page.drawText('Total', { x: margin + 450, y, size: 9, font: fontBold })
  y -= 15
  for (const u of data.perUnit) {
    newPageIfNeeded()
    page.drawText(u.blockNumber, { x: margin, y, size: 9, font })
    page.drawText(formatCurrency(u.material).replace('Rp. ', ''), { x: margin + 100, y, size: 9, font })
    page.drawText(formatCurrency(u.upah).replace('Rp. ', ''), { x: margin + 250, y, size: 9, font })
    page.drawText(formatCurrency(u.ops).replace('Rp. ', ''), { x: margin + 350, y, size: 9, font })
    page.drawText(formatCurrency(u.total).replace('Rp. ', ''), { x: margin + 450, y, size: 9, font: fontBold })
    y -= 13
  }
  y -= 10

  // DETAIL 2: Timeline Pembayaran
  drawText('=== 2. TIMELINE PEMBAYARAN (20 terbaru) ===', { size: 12, bold: true })
  y -= 5
  page.drawText('Tanggal', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Penerima', { x: margin + 100, y, size: 9, font: fontBold })
  page.drawText('Metode', { x: margin + 300, y, size: 9, font: fontBold })
  page.drawText('Amount', { x: margin + 400, y, size: 9, font: fontBold })
  y -= 15
  for (const t of data.timeline) {
    newPageIfNeeded()
    page.drawText(new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }), { x: margin, y, size: 9, font })
    page.drawText(t.recipient.substring(0, 25), { x: margin + 100, y, size: 9, font })
    page.drawText(t.method, { x: margin + 300, y, size: 9, font })
    page.drawText(formatCurrency(t.amount).replace('Rp. ', ''), { x: margin + 400, y, size: 9, font })
    y -= 13
  }
  y -= 15

  // Tanda tangan
  y -= 30
  drawText('Pangkalpinang, ' + formatLongDate(new Date().toISOString()), { size: 10 })
  y -= 15
  drawText('Pemilik,', { size: 10 })
  y -= 50
  drawText('( ............................. )', { size: 10, bold: true })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
