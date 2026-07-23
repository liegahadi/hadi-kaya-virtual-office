// Bukti Kas Keluar PDF Generator — voucher per-recipient
// Format sederhana sesuai 3. Bukti Kas Keluar.pdf (owner format fisik)
// Layout: kop + no voucher + tanggal + penerima + bank + amount + terbilang + tanda tangan

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'
import { terbilang } from '@/lib/finance/terbilang'

interface BuktiKasKeluarData {
  voucherNumber: string
  voucherDate: string
  recipientName: string
  recipientType: string // 'Supplier' | 'Tukang' | 'Lainnya'
  description: string
  amount: number
  bankName?: string | null
  bankAccount?: string | null
  bankHolder?: string | null
  method: string // TRANSFER | CASH | GIRO
  notes?: string | null
}

export async function generateBuktiKasKeluarPDF(data: BuktiKasKeluarData): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()
  const margin = 50
  const contentWidth = width - margin * 2

  let y = height - 50

  // KOP
  page.drawText('KOP SURAT PERUSAHAAN', { x: margin, y, size: 10, font: fontBold, color: rgb(0.6, 0.6, 0.6) })
  y -= 25
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1 })
  y -= 25

  // JUDUL
  page.drawText('BUKTI KAS KELUAR', { x: margin + contentWidth / 2 - 80, y, size: 14, font: fontBold })
  y -= 25

  // No Voucher + Tanggal
  page.drawText(`No. Voucher: ${data.voucherNumber}`, { x: margin, y, size: 10, font })
  page.drawText(`Tanggal: ${formatLongDate(data.voucherDate)}`, { x: width - margin - 200, y, size: 10, font })
  y -= 25

  // Penerima info
  page.drawText('Dibayar kepada:', { x: margin, y, size: 10, font: fontBold })
  y -= 15
  page.drawText(data.recipientName, { x: margin, y, size: 11, font: fontBold })
  y -= 15
  page.drawText(`Tipe: ${data.recipientType}`, { x: margin, y, size: 10, font })
  y -= 15

  if (data.bankName || data.bankAccount) {
    page.drawText(`Bank: ${data.bankName || '-'}`, { x: margin, y, size: 10, font })
    y -= 13
    page.drawText(`No. Rekening: ${data.bankAccount || '-'}`, { x: margin, y, size: 10, font })
    y -= 13
    page.drawText(`Atas Nama: ${data.bankHolder || data.recipientName}`, { x: margin, y, size: 10, font })
    y -= 15
  }

  page.drawText(`Metode: ${data.method}`, { x: margin, y, size: 10, font })
  y -= 25

  // Description
  page.drawText('Untuk pembayaran:', { x: margin, y, size: 10, font: fontBold })
  y -= 15
  page.drawText(data.description, { x: margin, y, size: 10, font, maxWidth: contentWidth })
  y -= 25

  // Amount
  page.drawRectangle({ x: margin, y: y - 20, width: contentWidth, height: 25, color: rgb(0.95, 0.95, 0.95) })
  page.drawText('JUMLAH', { x: margin + 5, y: y - 13, size: 11, font: fontBold })
  page.drawText(formatCurrency(data.amount), { x: width - margin - 150, y: y - 13, size: 12, font: fontBold })
  y -= 35

  // Terbilang
  page.drawText('Terbilang:', { x: margin, y, size: 10, font: fontBold })
  y -= 15
  page.drawText(terbilang(data.amount), { x: margin, y, size: 10, font, maxWidth: contentWidth })
  y -= 30

  // Notes
  if (data.notes) {
    page.drawText('Catatan:', { x: margin, y, size: 10, font: fontBold })
    y -= 15
    page.drawText(data.notes, { x: margin, y, size: 10, font, maxWidth: contentWidth })
    y -= 25
  }

  // Tanda tangan
  y -= 30
  page.drawText('Diterima oleh,', { x: margin, y, size: 10, font })
  page.drawText('Dibayarkan oleh,', { x: width - margin - 150, y, size: 10, font })
  y -= 60
  page.drawText('( ............................. )', { x: margin, y, size: 10, font: fontBold })
  page.drawText('( ............................. )', { x: width - margin - 150, y, size: 10, font: fontBold })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
