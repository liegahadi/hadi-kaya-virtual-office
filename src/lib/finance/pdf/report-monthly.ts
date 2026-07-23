// Laporan Bulanan PDF Generator
// Per PRD section 25.12 — Overview + Detail "kaya buku"
// Sections: Pembelian material per supplier, Upah per unit/blok, Pemakaian material per unit/blok, Biaya lain-lain

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'

interface MonthlyReportData {
  month: string // e.g., "Juli 2026"
  project?: { name: string; code: string | null } | null
  summary: {
    totalMaterial: number
    totalUpah: number
    totalOps: number
    totalKeluar: number
    outstandingAwal: number
    outstandingAkhir: number
  }
  pembelianPerSupplier: Array<{ supplier: string; poCount: number; total: number; plannedTotal: number; variance: number }>
  upahPerUnit: Array<{ unit: string; worker: string; workItem: string; amount: number; budget: number; progress: number }>
  upahPerBlok: Array<{ blok: string; total: number; unitCount: number }>
  pemakaianPerUnit: Array<{ unit: string; material: string; qty: number; price: number; subtotal: number; source: string }>
  pemakaianPerBlok: Array<{ blok: string; total: number; unitCount: number }>
  biayaLain: Array<{ category: string; recipient: string; amount: number; description: string }>
}

export async function generateMonthlyReportPDF(data: MonthlyReportData): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([595, 842]) // A4
  let y = 842 - 50
  const margin = 50
  const contentWidth = 595 - margin * 2

  const newPageIfNeeded = (needed: number = 30) => {
    if (y < needed) {
      page = doc.addPage([595, 842])
      y = 842 - 50
    }
  }

  const drawText = (text: string, opts: any = {}) => {
    newPageIfNeeded(opts.size ? 20 : 15)
    page.drawText(text, { x: opts.x ?? margin, y, size: opts.size ?? 10, font: opts.bold ? fontBold : font, color: opts.color ?? rgb(0, 0, 0), maxWidth: opts.maxWidth ?? contentWidth })
    if (!opts.noNewline) y -= (opts.size ?? 10) + 5
  }

  // === KOP (placeholder, no kop surat per hard rule 1) ===
  drawText('KOP SURAT PERUSAHAAN', { size: 10, bold: true, color: rgb(0.6, 0.6, 0.6) })
  drawText('(Edit di Google Docs setelah generate)', { size: 8, color: rgb(0.7, 0.7, 0.7) })
  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 1 })
  y -= 25

  // === JUDUL ===
  drawText('LAPORAN KEUANGAN BULANAN', { size: 16, bold: true, x: margin + contentWidth / 2 - 130 })
  y -= 5
  drawText(`Periode: ${data.month}`, { size: 11, x: margin + contentWidth / 2 - 60 })
  if (data.project) {
    drawText(`Project: ${data.project.name} (${data.project.code || '-'})`, { size: 10, x: margin + contentWidth / 2 - 80 })
  }
  y -= 15

  // === OVERVIEW (KPI) ===
  drawText('=== RINGKASAN ===', { size: 12, bold: true })
  y -= 5

  const kpiRows = [
    ['Total Pembelian Material', formatCurrency(data.summary.totalMaterial)],
    ['Total Pembayaran Upah', formatCurrency(data.summary.totalUpah)],
    ['Total Biaya Operasional', formatCurrency(data.summary.totalOps)],
    ['TOTAL KELUAR BULAN INI', formatCurrency(data.summary.totalKeluar)],
    ['Outstanding Awal Bulan', formatCurrency(data.summary.outstandingAwal)],
    ['Outstanding Akhir Bulan', formatCurrency(data.summary.outstandingAkhir)],
  ]
  for (const [label, value] of kpiRows) {
    page.drawText(label, { x: margin, y, size: 10, font })
    page.drawText(value, { x: 595 - margin - 150, y, size: 10, font: label.includes('TOTAL') ? fontBold : font })
    y -= 15
  }
  y -= 15

  // === DETAIL 1: Pembelian Material per Supplier ===
  drawText('=== 1. PEMBELIAN MATERIAL PER SUPPLIER ===', { size: 12, bold: true })
  y -= 5
  if (data.pembelianPerSupplier.length === 0) {
    drawText('Tidak ada pembelian bulan ini.', { size: 10, color: rgb(0.6, 0.6, 0.6) })
  } else {
    // Header
    page.drawText('Supplier', { x: margin, y, size: 9, font: fontBold })
    page.drawText('PO Count', { x: margin + 200, y, size: 9, font: fontBold })
    page.drawText('Planned', { x: margin + 280, y, size: 9, font: fontBold })
    page.drawText('Actual', { x: margin + 380, y, size: 9, font: fontBold })
    page.drawText('Variance', { x: margin + 470, y, size: 9, font: fontBold })
    y -= 15
    for (const s of data.pembelianPerSupplier) {
      newPageIfNeeded()
      page.drawText(s.supplier.substring(0, 30), { x: margin, y, size: 9, font })
      page.drawText(String(s.poCount), { x: margin + 200, y, size: 9, font })
      page.drawText(formatCurrency(s.plannedTotal).replace('Rp. ', ''), { x: margin + 280, y, size: 9, font })
      page.drawText(formatCurrency(s.total).replace('Rp. ', ''), { x: margin + 380, y, size: 9, font })
      const varianceStr = formatCurrency(s.variance).replace('Rp. ', '')
      page.drawText(varianceStr, { x: margin + 470, y, size: 9, font: s.variance > 0 ? fontBold : font, color: s.variance > 0 ? rgb(0.8, 0, 0) : rgb(0, 0.5, 0) })
      y -= 13
    }
    // Total row
    y -= 3
    page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5 })
    y -= 13
    const grandTotal = data.pembelianPerSupplier.reduce((s, x) => s + x.total, 0)
    page.drawText('TOTAL', { x: margin, y, size: 10, font: fontBold })
    page.drawText(formatCurrency(grandTotal), { x: margin + 380, y, size: 10, font: fontBold })
    y -= 20
  }

  // === DETAIL 2: Pembayaran Upah per Unit ===
  drawText('=== 2. PEMBAYARAN UPAH TUKANG PER UNIT ===', { size: 12, bold: true })
  y -= 5
  if (data.upahPerUnit.length === 0) {
    drawText('Tidak ada pembayaran upah bulan ini.', { size: 10, color: rgb(0.6, 0.6, 0.6) })
  } else {
    page.drawText('Unit', { x: margin, y, size: 9, font: fontBold })
    page.drawText('Tukang', { x: margin + 60, y, size: 9, font: fontBold })
    page.drawText('Pekerjaan', { x: margin + 160, y, size: 9, font: fontBold })
    page.drawText('Amount', { x: margin + 350, y, size: 9, font: fontBold })
    page.drawText('Budget', { x: margin + 420, y, size: 9, font: fontBold })
    page.drawText('% Prog', { x: margin + 490, y, size: 9, font: fontBold })
    y -= 15
    for (const w of data.upahPerUnit) {
      newPageIfNeeded()
      page.drawText(w.unit, { x: margin, y, size: 9, font })
      page.drawText(w.worker.substring(0, 12), { x: margin + 60, y, size: 9, font })
      page.drawText((w.workItem || '').substring(0, 25), { x: margin + 160, y, size: 9, font })
      page.drawText(formatCurrency(w.amount).replace('Rp. ', ''), { x: margin + 350, y, size: 9, font })
      page.drawText(formatCurrency(w.budget).replace('Rp. ', ''), { x: margin + 420, y, size: 9, font })
      page.drawText(`${w.progress}%`, { x: margin + 490, y, size: 9, font })
      y -= 13
    }
    y -= 10
  }

  // === DETAIL 3: Upah per Blok ===
  drawText('=== 3. UPAH PER BLOK ===', { size: 12, bold: true })
  y -= 5
  for (const b of data.upahPerBlok) {
    newPageIfNeeded()
    page.drawText(`${b.blok} (${b.unitCount} unit)`, { x: margin, y, size: 10, font })
    page.drawText(formatCurrency(b.total), { x: 595 - margin - 150, y, size: 10, font: fontBold })
    y -= 14
  }
  y -= 10

  // === DETAIL 4: Pemakaian Material per Unit ===
  drawText('=== 4. PEMAKAIAN MATERIAL PER UNIT ===', { size: 12, bold: true })
  y -= 5
  if (data.pemakaianPerUnit.length === 0) {
    drawText('Tidak ada pemakaian bulan ini.', { size: 10, color: rgb(0.6, 0.6, 0.6) })
  } else {
    page.drawText('Unit', { x: margin, y, size: 9, font: fontBold })
    page.drawText('Material', { x: margin + 60, y, size: 9, font: fontBold })
    page.drawText('Qty', { x: margin + 250, y, size: 9, font: fontBold })
    page.drawText('Harga', { x: margin + 320, y, size: 9, font: fontBold })
    page.drawText('Subtotal', { x: margin + 420, y, size: 9, font: fontBold })
    page.drawText('Source', { x: margin + 500, y, size: 9, font: fontBold })
    y -= 15
    for (const u of data.pemakaianPerUnit) {
      newPageIfNeeded()
      page.drawText(u.unit, { x: margin, y, size: 9, font })
      page.drawText(u.material.substring(0, 25), { x: margin + 60, y, size: 9, font })
      page.drawText(String(u.qty), { x: margin + 250, y, size: 9, font })
      page.drawText(formatCurrency(u.price).replace('Rp. ', ''), { x: margin + 320, y, size: 9, font })
      page.drawText(formatCurrency(u.subtotal).replace('Rp. ', ''), { x: margin + 420, y, size: 9, font })
      page.drawText(u.source.substring(0, 15), { x: margin + 500, y, size: 8, font })
      y -= 13
    }
    y -= 10
  }

  // === DETAIL 5: Biaya Lain-lain ===
  drawText('=== 5. BIAYA LAIN-LAIN ===', { size: 12, bold: true })
  y -= 5
  if (data.biayaLain.length === 0) {
    drawText('Tidak ada biaya lain bulan ini.', { size: 10, color: rgb(0.6, 0.6, 0.6) })
  } else {
    page.drawText('Kategori', { x: margin, y, size: 9, font: fontBold })
    page.drawText('Penerima', { x: margin + 120, y, size: 9, font: fontBold })
    page.drawText('Description', { x: margin + 250, y, size: 9, font: fontBold })
    page.drawText('Amount', { x: margin + 470, y, size: 9, font: fontBold })
    y -= 15
    for (const e of data.biayaLain) {
      newPageIfNeeded()
      page.drawText(e.category.substring(0, 15), { x: margin, y, size: 9, font })
      page.drawText(e.recipient.substring(0, 15), { x: margin + 120, y, size: 9, font })
      page.drawText(e.description.substring(0, 25), { x: margin + 250, y, size: 9, font })
      page.drawText(formatCurrency(e.amount).replace('Rp. ', ''), { x: margin + 470, y, size: 9, font })
      y -= 13
    }
  }
  y -= 15

  // === TANDA TANGAN ===
  y -= 30
  drawText('Pangkalpinang, ' + formatLongDate(new Date().toISOString()), { size: 10 })
  y -= 15
  drawText('Pemilik,', { size: 10 })
  y -= 50
  drawText('( ............................. )', { size: 10, bold: true })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
