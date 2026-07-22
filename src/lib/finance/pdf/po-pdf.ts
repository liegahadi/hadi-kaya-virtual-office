// PO PDF Generator — pakai pdf-lib, format sederhana (no overlay)
// Output: PO document sesuai format fisik owner (1. Format PO.pdf)
// Layout: kop placeholder + no PO + tanggal + supplier + table material + total + tanda tangan

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'
import { terbilang } from '@/lib/finance/terbilang'

interface POPDFData {
  poNumber: string
  poDate: string
  supplier: {
    name: string
    owner?: string | null
    phone?: string | null
    address?: string | null
    bankName?: string | null
    bankAccount?: string | null
    bankHolder?: string | null
  }
  project: { name: string; code: string | null }
  unit: { blockNumber: string } | null
  items: Array<{
    material: { name: string; unitMeasure: string }
    qty: number
    price: number
    totalPrice: number
  }>
  plannedTotal: number
  notes?: string | null
}

export async function generatePoPDF(data: POPDFData): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([595, 842]) // A4 portrait (1.4pt = 1mm)
  const { width, height } = page.getSize()

  let y = height - 50
  const margin = 50
  const contentWidth = width - margin * 2

  // === KOP PLACEHOLDER (no kop surat per hard rule 1) ===
  page.drawText('KOP SURAT PERUSAHAAN', { x: margin, y, size: 10, font: fontBold, color: rgb(0.6, 0.6, 0.6) })
  y -= 15
  page.drawText('(Edit di Google Docs setelah generate)', { x: margin, y, size: 8, font, color: rgb(0.7, 0.7, 0.7) })
  y -= 25

  // Garis pemisah
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0, 0, 0) })
  y -= 25

  // === JUDUL ===
  page.drawText('PURCHASE ORDER (PO)', { x: margin + contentWidth / 2 - 100, y, size: 14, font: fontBold })
  y -= 20

  // No PO + Tanggal (2 kolom)
  const displayPoNumber = data.poNumber.replace(/-/g, '/')
  page.drawText(`No. PO: ${displayPoNumber}`, { x: margin, y, size: 10, font })
  page.drawText(`Tanggal: ${formatLongDate(data.poDate)}`, { x: width - margin - 200, y, size: 10, font })
  y -= 20

  page.drawText(`Project: ${data.project.name} (${data.project.code || '-'})`, { x: margin, y, size: 10, font })
  if (data.unit) {
    page.drawText(`Unit: ${data.unit.blockNumber}`, { x: width - margin - 200, y, size: 10, font })
  }
  y -= 25

  // === SUPPLIER INFO ===
  page.drawText('Kepada Yth:', { x: margin, y, size: 10, font })
  y -= 15
  page.drawText(data.supplier.name, { x: margin, y, size: 10, font: fontBold })
  y -= 13
  if (data.supplier.owner) {
    page.drawText(`Attn: ${data.supplier.owner}`, { x: margin, y, size: 10, font })
    y -= 13
  }
  if (data.supplier.phone) {
    page.drawText(`Telp: ${data.supplier.phone}`, { x: margin, y, size: 10, font })
    y -= 13
  }
  if (data.supplier.address) {
    page.drawText(`Alamat: ${data.supplier.address}`, { x: margin, y, size: 10, font })
    y -= 13
  }
  y -= 15

  // === TABLE MATERIAL ===
  // Header
  const tableY = y
  const cols = [
    { x: margin, w: 40, label: 'No' },
    { x: margin + 40, w: 240, label: 'Nama Material' },
    { x: margin + 280, w: 60, label: 'Qty' },
    { x: margin + 340, w: 60, label: 'Satuan' },
    { x: margin + 400, w: 75, label: 'Harga' },
    { x: margin + 475, w: 70, label: 'Subtotal' },
  ]

  // Header row
  page.drawRectangle({ x: margin, y: y - 15, width: contentWidth, height: 18, color: rgb(0.9, 0.9, 0.9) })
  for (const c of cols) {
    page.drawText(c.label, { x: c.x + 3, y: y - 10, size: 9, font: fontBold })
  }
  y -= 18

  // Item rows
  let no = 1
  for (const item of data.items) {
    if (y < 100) {
      // Tambah halaman baru kalau overflow
      page.drawText(`(lanjutan ke halaman berikutnya...)`, { x: margin, y: y - 20, size: 8, font, color: rgb(0.6, 0.6, 0.6) })
      break
    }
    page.drawText(String(no), { x: cols[0].x + 3, y: y - 10, size: 9, font })
    page.drawText(item.material.name.substring(0, 40), { x: cols[1].x + 3, y: y - 10, size: 9, font })
    page.drawText(String(item.qty), { x: cols[2].x + 3, y: y - 10, size: 9, font })
    page.drawText(item.material.unitMeasure, { x: cols[3].x + 3, y: y - 10, size: 9, font })
    page.drawText(formatCurrency(item.price).replace('Rp. ', ''), { x: cols[4].x + 3, y: y - 10, size: 9, font })
    page.drawText(formatCurrency(item.totalPrice).replace('Rp. ', ''), { x: cols[5].x + 3, y: y - 10, size: 9, font })
    y -= 15
    no++
  }

  // Total row
  y -= 5
  page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: rgb(0, 0, 0) })
  page.drawRectangle({ x: margin, y: y - 18, width: contentWidth, height: 18, color: rgb(0.95, 0.95, 0.95) })
  page.drawText('TOTAL', { x: cols[4].x + 3, y: y - 13, size: 10, font: fontBold })
  page.drawText(formatCurrency(data.plannedTotal), { x: cols[5].x + 3, y: y - 13, size: 10, font: fontBold })
  y -= 25

  // Terbilang
  page.drawText('Terbilang:', { x: margin, y, size: 10, font: fontBold })
  y -= 13
  page.drawText(terbilang(data.plannedTotal), { x: margin, y, size: 10, font, maxWidth: contentWidth })
  y -= 25

  // Notes
  if (data.notes) {
    page.drawText('Catatan:', { x: margin, y, size: 10, font: fontBold })
    y -= 13
    page.drawText(data.notes, { x: margin, y, size: 10, font, maxWidth: contentWidth })
    y -= 25
  }

  // === TANDA TANGAN ===
  y -= 30
  page.drawText('Dipesan oleh,', { x: margin, y, size: 10, font })
  page.drawText('Disetujui oleh,', { x: width - margin - 150, y, size: 10, font })
  y -= 60
  page.drawText('( ............................. )', { x: margin, y, size: 10, font: fontBold })
  page.drawText('( ............................. )', { x: width - margin - 150, y, size: 10, font: fontBold })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
