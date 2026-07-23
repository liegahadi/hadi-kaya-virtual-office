// Bundle PDF Generator — per PRD section 25.4 A12
// Per-entity: merge PO doc + notas + transfer proofs → 1 PDF arsip
// Monthly: semua money-out bulan itu → 1 PDF lengkap
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'

// Bundle per-entity (1 PO + notas + transfer proofs → 1 PDF)
export async function bundlePoPDF(poData: {
  poNumber: string
  poDate: string
  supplier: { name: string; bankName?: string | null; bankAccount?: string | null }
  project: { name: string; code: string | null }
  items: Array<{ material: { name: string; unitMeasure: string }; qty: number; price: number; totalPrice: number }>
  plannedTotal: number
  actualTotal: number
  notes?: string | null
  payments: Array<{ amount: number; method: string; bankName?: string | null; paidAt: string; notes?: string | null }>
}): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  // === PAGE 1: PO Document ===
  let page = doc.addPage([595, 842])
  let y = 842 - 50
  const margin = 50
  const contentWidth = 595 - margin * 2

  page.drawText('=== ARSIP PURCHASE ORDER ===', { x: margin, y, size: 14, font: fontBold })
  y -= 25
  page.drawText(`No. PO: ${poData.poNumber.replace(/-/g, '/')}`, { x: margin, y, size: 11, font })
  y -= 15
  page.drawText(`Tanggal: ${formatLongDate(poData.poDate)}`, { x: margin, y, size: 10, font })
  y -= 15
  page.drawText(`Supplier: ${poData.supplier.name}`, { x: margin, y, size: 10, font })
  y -= 15
  page.drawText(`Project: ${poData.project.name} (${poData.project.code})`, { x: margin, y, size: 10, font })
  y -= 20

  // Table items
  page.drawText('Items:', { x: margin, y, size: 10, font: fontBold })
  y -= 15
  for (const it of poData.items) {
    if (y < 100) break
    page.drawText(`${it.material.name} — ${it.qty} ${it.material.unitMeasure} × ${formatCurrency(it.price)} = ${formatCurrency(it.totalPrice)}`, { x: margin + 10, y, size: 9, font, maxWidth: contentWidth - 20 })
    y -= 13
  }
  y -= 10
  page.drawText(`Planned Total: ${formatCurrency(poData.plannedTotal)}`, { x: margin, y, size: 10, font: fontBold })
  y -= 15
  page.drawText(`Actual Total: ${formatCurrency(poData.actualTotal)}`, { x: margin, y, size: 10, font: fontBold })
  if (poData.notes) {
    y -= 15
    page.drawText(`Notes: ${poData.notes}`, { x: margin, y, size: 9, font, maxWidth: contentWidth })
  }

  // === PAGE 2+: Payment proofs ===
  for (const p of poData.payments) {
    page = doc.addPage([595, 842])
    y = 842 - 50
    page.drawText('=== BUKTI PEMBAYARAN ===', { x: margin, y, size: 14, font: fontBold })
    y -= 25
    page.drawText(`PO: ${poData.poNumber.replace(/-/g, '/')}`, { x: margin, y, size: 10, font })
    y -= 15
    page.drawText(`Tanggal Bayar: ${formatLongDate(p.paidAt)}`, { x: margin, y, size: 10, font })
    y -= 15
    page.drawText(`Metode: ${p.method}`, { x: margin, y, size: 10, font })
    y -= 15
    page.drawText(`Jumlah: ${formatCurrency(p.amount)}`, { x: margin, y, size: 11, font: fontBold })
    y -= 15
    if (p.bankName) {
      page.drawText(`Bank: ${p.bankName}`, { x: margin, y, size: 10, font })
      y -= 15
    }
    if (p.notes) {
      page.drawText(`Catatan: ${p.notes}`, { x: margin, y, size: 9, font })
      y -= 15
    }
    y -= 30
    page.drawText('(Tempel bukti transfer/kas keluar di sini)', { x: margin, y, size: 10, font, color: rgb(0.6, 0.6, 0.6) })
    y -= 50
    page.drawText('Diterima oleh:    (............................)', { x: margin, y, size: 10, font })
  }

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}

// Bundle monthly — semua money-out bulan itu → 1 PDF
export async function bundleMonthlyPDF(data: {
  month: string
  payments: Array<{
    date: string
    amount: number
    method: string
    recipientName: string
    type: string // PO | WAGE | EXPENSE
    description: string
    bankName?: string | null
  }>
  totalAmount: number
}): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([595, 842])
  let y = 842 - 50
  const margin = 50

  const newPageIfNeeded = (needed: number = 30) => {
    if (y < needed) { page = doc.addPage([595, 842]); y = 842 - 50 }
  }

  // Cover page
  page.drawText('KOP SURAT PERUSAHAAN', { x: margin, y, size: 10, font: fontBold, color: rgb(0.6, 0.6, 0.6) })
  y -= 25
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 1 })
  y -= 25
  page.drawText('BUNDLE ARSIP BULANAN', { x: margin + 200, y, size: 16, font: fontBold })
  y -= 20
  page.drawText(`Periode: ${data.month}`, { x: margin + 220, y, size: 12, font })
  y -= 20
  page.drawText(`Total Pembayaran: ${formatCurrency(data.totalAmount)}`, { x: margin + 180, y, size: 12, font: fontBold })
  y -= 20
  page.drawText(`Jumlah Transaksi: ${data.payments.length}`, { x: margin + 200, y, size: 10, font })
  y -= 30

  // Detail table
  page.drawText('=== DAFTAR PEMBAYARAN ===', { x: margin, y, size: 12, font: fontBold })
  y -= 15
  page.drawText('Tgl', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Penerima', { x: margin + 60, y, size: 9, font: fontBold })
  page.drawText('Tipe', { x: margin + 200, y, size: 9, font: fontBold })
  page.drawText('Metode', { x: margin + 270, y, size: 9, font: fontBold })
  page.drawText('Amount', { x: margin + 370, y, size: 9, font: fontBold })
  y -= 15
  for (const p of data.payments) {
    newPageIfNeeded()
    page.drawText(new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), { x: margin, y, size: 8, font })
    page.drawText(p.recipientName.substring(0, 20), { x: margin + 60, y, size: 8, font })
    page.drawText(p.type, { x: margin + 200, y, size: 8, font })
    page.drawText(p.method, { x: margin + 270, y, size: 8, font })
    page.drawText(formatCurrency(p.amount).replace('Rp. ', ''), { x: margin + 370, y, size: 8, font })
    y -= 12
  }
  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5 })
  y -= 15
  page.drawText('TOTAL', { x: margin + 270, y, size: 10, font: fontBold })
  page.drawText(formatCurrency(data.totalAmount), { x: margin + 370, y, size: 10, font: fontBold })
  y -= 30
  page.drawText('Pangkalpinang, ' + formatLongDate(new Date().toISOString()), { x: margin, y, size: 10, font })
  y -= 50
  page.drawText('( ............................. )', { x: margin, y, size: 10, font: fontBold })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
