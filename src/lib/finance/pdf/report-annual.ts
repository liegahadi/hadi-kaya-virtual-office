// Laporan Tahunan PDF Generator
// Per PRD section 25.12 — 12 bulan breakdown + per project + per supplier
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'

interface AnnualReportData {
  year: number
  summary: {
    totalMaterial: number
    totalUpah: number
    totalOps: number
    totalKeluar: number
    outstandingAkhirTahun: number
  }
  monthlyBreakdown: Array<{ month: string; material: number; upah: number; ops: number; total: number }>
  perProject: Array<{ project: string; code: string | null; material: number; upah: number; ops: number; total: number; poCount: number }>
  perSupplier: Array<{ supplier: string; poCount: number; total: number; percentage: number }>
  topCategories: Array<{ category: string; amount: number; percentage: number }>
}

export async function generateAnnualReportPDF(data: AnnualReportData): Promise<Buffer> {
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
  drawText('LAPORAN KEUANGAN TAHUNAN', { size: 16, bold: true, x: margin + contentWidth / 2 - 130 })
  y -= 5
  drawText(`Tahun: ${data.year}`, { size: 12, x: margin + contentWidth / 2 - 40 })
  y -= 15

  // RINGKASAN
  drawText('=== RINGKASAN TAHUNAN ===', { size: 12, bold: true })
  y -= 5
  const kpiRows = [
    ['Total Pembelian Material', formatCurrency(data.summary.totalMaterial)],
    ['Total Pembayaran Upah', formatCurrency(data.summary.totalUpah)],
    ['Total Biaya Operasional', formatCurrency(data.summary.totalOps)],
    ['TOTAL KELUAR TAHUN INI', formatCurrency(data.summary.totalKeluar)],
    ['Outstanding Akhir Tahun', formatCurrency(data.summary.outstandingAkhirTahun)],
  ]
  for (const [label, value] of kpiRows) {
    page.drawText(label, { x: margin, y, size: 10, font })
    page.drawText(value, { x: 595 - margin - 150, y, size: 10, font: label.includes('TOTAL') ? fontBold : font })
    y -= 15
  }
  y -= 15

  // DETAIL 1: Monthly breakdown
  drawText('=== 1. CASHFLOW 12 BULAN ===', { size: 12, bold: true })
  y -= 5
  page.drawText('Bulan', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Material', { x: margin + 100, y, size: 9, font: fontBold })
  page.drawText('Upah', { x: margin + 220, y, size: 9, font: fontBold })
  page.drawText('Ops', { x: margin + 310, y, size: 9, font: fontBold })
  page.drawText('Total', { x: margin + 400, y, size: 9, font: fontBold })
  y -= 15
  for (const m of data.monthlyBreakdown) {
    newPageIfNeeded()
    page.drawText(m.month, { x: margin, y, size: 9, font })
    page.drawText(formatCurrency(m.material).replace('Rp. ', ''), { x: margin + 100, y, size: 9, font })
    page.drawText(formatCurrency(m.upah).replace('Rp. ', ''), { x: margin + 220, y, size: 9, font })
    page.drawText(formatCurrency(m.ops).replace('Rp. ', ''), { x: margin + 310, y, size: 9, font })
    page.drawText(formatCurrency(m.total).replace('Rp. ', ''), { x: margin + 400, y, size: 9, font: fontBold })
    y -= 13
  }
  y -= 10

  // DETAIL 2: Per project
  drawText('=== 2. BIAYA PER PROYEK ===', { size: 12, bold: true })
  y -= 5
  page.drawText('Project', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Material', { x: margin + 180, y, size: 9, font: fontBold })
  page.drawText('Upah', { x: margin + 290, y, size: 9, font: fontBold })
  page.drawText('Ops', { x: margin + 380, y, size: 9, font: fontBold })
  page.drawText('Total', { x: margin + 460, y, size: 9, font: fontBold })
  y -= 15
  // Sort by total desc
  const sortedProjects = [...data.perProject].sort((a, b) => b.total - a.total)
  for (const p of sortedProjects) {
    newPageIfNeeded()
    page.drawText(`${p.project} (${p.code || '-'})`.substring(0, 28), { x: margin, y, size: 9, font })
    page.drawText(formatCurrency(p.material).replace('Rp. ', ''), { x: margin + 180, y, size: 9, font })
    page.drawText(formatCurrency(p.upah).replace('Rp. ', ''), { x: margin + 290, y, size: 9, font })
    page.drawText(formatCurrency(p.ops).replace('Rp. ', ''), { x: margin + 380, y, size: 9, font })
    page.drawText(formatCurrency(p.total).replace('Rp. ', ''), { x: margin + 460, y, size: 9, font: fontBold })
    y -= 13
  }
  y -= 10

  // DETAIL 3: Top suppliers
  drawText('=== 3. TOP SUPPLIER (urut total transaksi) ===', { size: 12, bold: true })
  y -= 5
  page.drawText('Supplier', { x: margin, y, size: 9, font: fontBold })
  page.drawText('PO Count', { x: margin + 200, y, size: 9, font: fontBold })
  page.drawText('Total', { x: margin + 300, y, size: 9, font: fontBold })
  page.drawText('% dari Total', { x: margin + 420, y, size: 9, font: fontBold })
  y -= 15
  for (const s of data.perSupplier.slice(0, 20)) {
    newPageIfNeeded()
    page.drawText(s.supplier.substring(0, 30), { x: margin, y, size: 9, font })
    page.drawText(String(s.poCount), { x: margin + 200, y, size: 9, font })
    page.drawText(formatCurrency(s.total).replace('Rp. ', ''), { x: margin + 300, y, size: 9, font })
    page.drawText(`${s.percentage.toFixed(1)}%`, { x: margin + 420, y, size: 9, font })
    y -= 13
  }
  y -= 10

  // DETAIL 4: Top categories
  drawText('=== 4. TOP SPENDING CATEGORIES ===', { size: 12, bold: true })
  y -= 5
  page.drawText('Kategori', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Amount', { x: margin + 250, y, size: 9, font: fontBold })
  page.drawText('% dari Total', { x: margin + 400, y, size: 9, font: fontBold })
  y -= 15
  for (const c of data.topCategories.slice(0, 15)) {
    newPageIfNeeded()
    page.drawText(c.category.substring(0, 35), { x: margin, y, size: 9, font })
    page.drawText(formatCurrency(c.amount).replace('Rp. ', ''), { x: margin + 250, y, size: 9, font })
    page.drawText(`${c.percentage.toFixed(1)}%`, { x: margin + 400, y, size: 9, font })
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
