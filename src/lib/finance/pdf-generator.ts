// ============================================================
// PDF GENERATOR - Generate PO, Bukti Kas Keluar, dan Compile PDF per PO
// ============================================================
// Uses pdfkit (local, no token cost)
// Format mengikuti template yang owner upload:
// - 1. Format PO.pdf
// - 3. Bukti Kas Keluar.pdf
// ============================================================

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

// Fix: pdfkit font path issue in Next.js
// Register fonts explicitly to avoid ENOENT in production
const PDFKIT_FONTS_DIR = path.join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data')
if (fs.existsSync(PDFKIT_FONTS_DIR)) {
  // pdfkit auto-detects, but we ensure the data dir is accessible
  process.env.PDFKIT_DATA_DIR = PDFKIT_FONTS_DIR
}

// ============================================================
// FORMAT RUPIAH
// ============================================================
function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function formatRupiahShort(n: number): string {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`
  return `Rp ${n}`
}

function terbilang(n: number): string {
  // Simple terbilang (Indonesian number to words)
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
  const belasan = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas']
  const puluhan = ['', 'sepuluh', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']

  function convert(num: number): string {
    if (num === 0) return ''
    if (num < 10) return satuan[num]
    if (num < 20) return belasan[num - 10]
    if (num < 100) return puluhan[Math.floor(num / 10)] + (num % 10 ? ' ' + satuan[num % 10] : '')
    if (num < 200) return 'seratus' + (num - 100 > 0 ? ' ' + convert(num - 100) : '')
    if (num < 1000) return satuan[Math.floor(num / 100)] + ' ratus' + (num % 100 ? ' ' + convert(num % 100) : '')
    if (num < 2000) return 'seribu' + (num - 1000 > 0 ? ' ' + convert(num - 1000) : '')
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' ribu' + (num % 1000 ? ' ' + convert(num % 1000) : '')
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' juta' + (num % 1000000 ? ' ' + convert(num % 1000000) : '')
    return convert(Math.floor(num / 1000000000)) + ' miliar' + (num % 1000000000 ? ' ' + convert(num % 1000000000) : '')
  }

  if (n === 0) return 'nol rupiah'
  return convert(n) + ' rupiah'
}

// ============================================================
// GENERATE PO PDF
// ============================================================
export interface POData {
  poNumber: string
  projectName: string
  projectCode: string
  logoUrl?: string | null
  supplierName: string
  supplierAddress?: string | null
  supplierContact?: string | null
  supplierPhone?: string | null
  unitBlocks?: string | null
  workItem?: string | null
  date: Date
  lines: Array<{
    no: number
    description: string
    qty: number
    unit: string
    unitPrice: number
    discount?: number
    total: number
  }>
  discount: number
  tax: number
  subtotal: number
  totalAmount: number
  notes?: string | null
}

export function generatePOPdf(data: POData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      // ===== HEADER =====
      // Project name (left) + Logo (right)
      doc.fontSize(14).font('Helvetica-Bold').text(data.projectName, 50, 50, { width: 300 })
      doc.fontSize(9).font('Helvetica').text('Pangkalpinang, Bangka Belitung', 50, 70, { width: 300 })

      // Logo placeholder (if no logo URL)
      if (data.logoUrl && fs.existsSync(data.logoUrl)) {
        try {
          doc.image(data.logoUrl, 450, 45, { width: 80, height: 60 })
        } catch {
          doc.fontSize(9).font('Helvetica-Oblique').text('[LOGO]', 470, 60, { width: 80 })
        }
      } else {
        doc.fontSize(9).font('Helvetica-Oblique').text('[LOGO]', 470, 60, { width: 80 })
      }

      // ===== PO TITLE =====
      doc.fontSize(16).font('Helvetica-Bold').text('PURCHASE ORDER', 50, 110, { align: 'center', width: 500 })
      doc.fontSize(9).font('Helvetica').text(`No. PO: ${data.poNumber}`, 50, 135, { align: 'center', width: 500 })

      // ===== SUPPLIER INFO (LEFT) =====
      let y = 170
      doc.fontSize(9).font('Helvetica-Bold').text('KEPADA:', 50, y)
      doc.font('Helvetica').text(data.supplierName, 50, y + 15)
      if (data.supplierAddress) doc.text(data.supplierAddress, 50, y + 28)
      if (data.supplierContact) doc.text(`Attn: ${data.supplierContact}`, 50, y + 41)
      if (data.supplierPhone) doc.text(`Telp: ${data.supplierPhone}`, 50, y + 54)

      // ===== PO INFO (RIGHT) =====
      const dateStr = data.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      doc.font('Helvetica-Bold').text('BLOK:', 350, y)
      doc.font('Helvetica').text(data.unitBlocks || '-', 400, y)
      doc.font('Helvetica-Bold').text('TGL:', 350, y + 15)
      doc.font('Helvetica').text(dateStr, 400, y + 15)
      if (data.workItem) {
        doc.font('Helvetica-Bold').text('PEKERJAAN:', 350, y + 30)
        doc.font('Helvetica').text(data.workItem, 400, y + 30)
      }

      // ===== TABLE HEADER =====
      y = 250
      // Table border
      doc.rect(50, y, 500, 20).stroke()
      doc.fontSize(8).font('Helvetica-Bold')
      doc.text('NO', 55, y + 6, { width: 25 })
      doc.text('DESCRIPTION', 85, y + 6, { width: 180 })
      doc.text('QTY', 270, y + 6, { width: 35, align: 'right' })
      doc.text('SATUAN', 310, y + 6, { width: 50, align: 'center' })
      doc.text('HARGA/PCS', 365, y + 6, { width: 75, align: 'right' })
      doc.text('DISC.', 445, y + 6, { width: 40, align: 'right' })
      doc.text('JUMLAH', 490, y + 6, { width: 55, align: 'right' })

      // ===== TABLE ROWS =====
      y += 20
      doc.font('Helvetica').fontSize(8)
      for (const line of data.lines) {
        if (y > 700) {
          doc.addPage()
          y = 50
        }
        doc.rect(50, y, 500, 18).stroke()
        doc.text(String(line.no), 55, y + 5, { width: 25 })
        doc.text(line.description, 85, y + 5, { width: 180 })
        doc.text(String(line.qty), 270, y + 5, { width: 35, align: 'right' })
        doc.text(line.unit, 310, y + 5, { width: 50, align: 'center' })
        doc.text(formatRupiah(line.unitPrice), 365, y + 5, { width: 75, align: 'right' })
        doc.text(line.discount ? formatRupiahShort(line.discount) : '-', 445, y + 5, { width: 40, align: 'right' })
        doc.text(formatRupiah(line.total), 490, y + 5, { width: 55, align: 'right' })
        y += 18
      }

      // ===== TOTALS =====
      y += 10
      doc.font('Helvetica').fontSize(9)
      doc.text('SUBTOTAL', 350, y, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.subtotal), 490, y, { width: 55, align: 'right' })

      y += 18
      if (data.discount > 0) {
        doc.text('DISCOUNT', 350, y, { width: 140, align: 'right' })
        doc.text(formatRupiah(data.discount), 490, y, { width: 55, align: 'right' })
        y += 18
      }
      if (data.tax > 0) {
        doc.text('PAJAK', 350, y, { width: 140, align: 'right' })
        doc.text(formatRupiah(data.tax), 490, y, { width: 55, align: 'right' })
        y += 18
      }

      // Grand total (bold box)
      doc.rect(350, y, 195, 22).fillAndStroke('#f0f0f0', '#000')
      doc.font('Helvetica-Bold').fontSize(10)
      doc.fillColor('#000').text('GRAND TOTAL', 350, y + 6, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.totalAmount), 490, y + 6, { width: 55, align: 'right' })

      // ===== NOTES =====
      if (data.notes) {
        y += 35
        doc.font('Helvetica-Bold').fontSize(8).text('CATATAN:', 50, y)
        doc.font('Helvetica').text(data.notes, 50, y + 12, { width: 250 })
      }

      // ===== SIGNATURES =====
      y = Math.max(y + 40, 650)
      const pangkalpinangDate = `Pangkalpinang, ${data.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
      doc.font('Helvetica').fontSize(9).text(pangkalpinangDate, 50, y, { width: 500, align: 'center' })

      y += 20
      const signWidth = 125
      const positions = [50, 50 + signWidth + 5, 50 + (signWidth + 5) * 2, 50 + (signWidth + 5) * 3]
      const labels = ['Dibuat Oleh', 'Mengetahui', 'Disetujui', 'Diterima Oleh']
      const roles = ['Purchasing', 'Manager', 'Pimpinan', 'Supplier']

      for (let i = 0; i < 4; i++) {
        doc.fontSize(8).font('Helvetica').text(labels[i], positions[i], y, { width: signWidth, align: 'center' })
        // Line for signature
        doc.moveTo(positions[i] + 15, y + 50).lineTo(positions[i] + signWidth - 15, y + 50).stroke()
        doc.font('Helvetica-Bold').text(roles[i], positions[i], y + 55, { width: signWidth, align: 'center' })
      }

      doc.end()
      stream.on('finish', () => resolve())
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

// ============================================================
// GENERATE BUKTI KAS KELUAR PDF
// ============================================================
export interface BuktiKasKeluarData {
  poNumber: string
  projectName: string
  logoUrl?: string | null
  date: Date
  receivedBy: string
  amount: number
  paymentMethod: 'TUNAI' | 'TRANSFER' | 'CEK'
  bankAccount?: string
  description: string
  // List of PO/Nota being paid
  items: Array<{
    poNumber: string
    notes: string
    amount: number
  }>
}

export function generateBuktiKasKeluarPdf(data: BuktiKasKeluarData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      // Header
      if (data.logoUrl && fs.existsSync(data.logoUrl)) {
        try { doc.image(data.logoUrl, 50, 40, { width: 60, height: 45 }) } catch {}
      }
      doc.fontSize(14).font('Helvetica-Bold').text('BUKTI KAS KELUAR', 50, 100, { align: 'center', width: 500 })
      doc.fontSize(9).font('Helvetica').text(`No. PO: ${data.poNumber}`, 50, 120, { align: 'center', width: 500 })
      doc.text(`Tanggal: ${data.date.toLocaleDateString('id-ID')}`, 50, 135, { align: 'center', width: 500 })

      // Info
      let y = 170
      doc.font('Helvetica-Bold').text('Diterima Oleh:', 50, y)
      doc.font('Helvetica').text(data.receivedBy, 150, y)
      y += 18
      doc.font('Helvetica-Bold').text('Alamat:', 50, y)
      doc.font('Helvetica').text('Pangkalpinang', 150, y)
      y += 18
      doc.font('Helvetica-Bold').text('Jumlah:', 50, y)
      doc.font('Helvetica').text(formatRupiah(data.amount), 150, y)
      y += 18
      doc.font('Helvetica-Bold').text('Terbilang:', 50, y)
      doc.font('Helvetica').text(terbilang(data.amount), 150, y, { width: 350 })
      y += 18
      doc.font('Helvetica-Bold').text('Berupa:', 50, y)
      doc.font('Helvetica').text(
        `${data.paymentMethod === 'TUNAI' ? '✓' : '☐'} Tunai: ${data.paymentMethod === 'TUNAI' ? formatRupiah(data.amount) : ''}   ` +
        `${data.paymentMethod === 'TRANSFER' ? '✓' : '☐'} Transfer: ${data.paymentMethod === 'TRANSFER' ? formatRupiah(data.amount) : ''} ${data.bankAccount ? `(${data.bankAccount})` : ''}   ` +
        `${data.paymentMethod === 'CEK' ? '✓' : '☐'} Cek/BG: ${data.paymentMethod === 'CEK' ? formatRupiah(data.amount) : ''}`,
        150, y, { width: 350 }
      )
      y += 25

      // Items table
      doc.font('Helvetica-Bold').fontSize(8)
      doc.rect(50, y, 500, 18).stroke()
      doc.text('NO. PO/NOTA', 55, y + 5, { width: 150 })
      doc.text('KETERANGAN', 210, y + 5, { width: 250 })
      doc.text('JUMLAH (IDR)', 465, y + 5, { width: 80, align: 'right' })
      y += 18

      doc.font('Helvetica').fontSize(8)
      for (const item of data.items) {
        doc.rect(50, y, 500, 18).stroke()
        doc.text(item.poNumber, 55, y + 5, { width: 150 })
        doc.text(item.notes, 210, y + 5, { width: 250 })
        doc.text(formatRupiah(item.amount), 465, y + 5, { width: 80, align: 'right' })
        y += 18
      }

      // Total
      doc.rect(50, y, 500, 22).fillAndStroke('#f0f0f0', '#000')
      doc.font('Helvetica-Bold').fontSize(10)
      doc.text('TOTAL', 210, y + 6, { width: 250 })
      doc.text(formatRupiah(data.amount), 465, y + 6, { width: 80, align: 'right' })

      // Signatures
      y += 60
      doc.font('Helvetica').fontSize(8)
      const labels = ['Disetujui Oleh', 'Diketahui Oleh', 'Akunting', 'Diterima Oleh']
      const signWidth = 125
      for (let i = 0; i < 4; i++) {
        const x = 50 + i * (signWidth + 5)
        doc.text(labels[i], x, y, { width: signWidth, align: 'center' })
        doc.moveTo(x + 15, y + 40).lineTo(x + signWidth - 15, y + 40).stroke()
        doc.text('( ___________ )', x, y + 45, { width: signWidth, align: 'center' })
      }

      doc.end()
      stream.on('finish', () => resolve())
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

// ============================================================
// COMPILE MULTIPLE PDFs INTO ONE (per PO)
// ============================================================
export async function compilePDFsToSingle(pdfPaths: string[], outputPath: string): Promise<void> {
  // For simplicity, we'll use pdf-lib to merge (need to install)
  // For now, use pdfkit to create a cover page + reference the files
  // In production, install pdf-lib for proper merging

  const { PDFDocument: PdfLib } = await import('pdf-lib')
  const mergedPdf = await PdfLib.create()

  for (const pdfPath of pdfPaths) {
    if (!fs.existsSync(pdfPath)) continue
    const pdfBytes = fs.readFileSync(pdfPath)
    try {
      const pdf = await PdfLib.load(pdfBytes)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach((p) => mergedPdf.addPage(p))
    } catch (err) {
      console.error(`Failed to merge ${pdfPath}:`, err)
    }
  }

  const mergedBytes = await mergedPdf.save()
  fs.writeFileSync(outputPath, mergedBytes)
}

// ============================================================
// WEEKLY REPORT PDF GENERATOR
// ============================================================
export interface WeeklyReportData {
  projectName: string
  weekNumber: number
  year: number
  startDate: Date
  endDate: Date
  // Material section (warna biru)
  materials: Array<{
    supplier: string
    pos: Array<{ poNumber: string; notes: string; amount: number }>
    total: number
  }>
  totalMaterial: number
  // Upah tukang section (warna merah)
  upah: Array<{
    tukangName: string
    units: Array<{ unit: string; workItems: string; amount: number }>
    total: number
  }>
  totalUpah: number
  // Add cost section (warna kuning)
  addCost: Array<{
    category: string
    description: string
    amount: number
  }>
  totalAddCost: number
  // Daily expenses
  daily: Array<{
    date: Date
    category: string
    description: string
    amount: number
  }>
  totalDaily: number
  grandTotal: number
}

export function generateWeeklyReportPdf(data: WeeklyReportData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      // Header
      doc.fontSize(14).font('Helvetica-Bold').text('LAPORAN PENGELUARAN MINGGUAN', 50, 50, { align: 'center', width: 500 })
      doc.fontSize(12).text(data.projectName, 50, 70, { align: 'center', width: 500 })
      doc.fontSize(10).font('Helvetica').text(
        `Minggu ${data.weekNumber} - ${data.year}`,
        50, 90, { align: 'center', width: 500 }
      )
      doc.fontSize(9).text(
        `Periode: ${data.startDate.toLocaleDateString('id-ID')} - ${data.endDate.toLocaleDateString('id-ID')}`,
        50, 105, { align: 'center', width: 500 }
      )

      let y = 140

      // === MATERIAL SECTION (BLUE) ===
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0066cc').text('MATERIAL', 50, y)
      y += 20
      doc.fillColor('#000').fontSize(9).font('Helvetica')
      for (const mat of data.materials) {
        doc.font('Helvetica-Bold').text(mat.supplier, 50, y)
        y += 15
        doc.font('Helvetica').fontSize(8)
        for (const po of mat.pos) {
          doc.text(`${po.poNumber}: ${po.notes}`, 60, y, { width: 380 })
          doc.text(formatRupiah(po.amount), 440, y, { width: 110, align: 'right' })
          y += 12
        }
        doc.font('Helvetica-Bold').fontSize(9)
        doc.text(`Subtotal ${mat.supplier}:`, 300, y, { width: 140, align: 'right' })
        doc.text(formatRupiah(mat.total), 440, y, { width: 110, align: 'right' })
        y += 20
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0066cc')
      doc.text('TOTAL MATERIAL:', 300, y, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.totalMaterial), 440, y, { width: 110, align: 'right' })
      y += 30

      // === UPAH TUKANG SECTION (RED) ===
      doc.fillColor('#cc0000').fontSize(11).font('Helvetica-Bold').text('UPAH TUKANG', 50, y)
      y += 20
      doc.fillColor('#000').fontSize(9)
      for (const tukang of data.upah) {
        doc.font('Helvetica-Bold').text(tukang.tukangName, 50, y)
        y += 15
        doc.font('Helvetica').fontSize(8)
        for (const u of tukang.units) {
          doc.text(`${u.unit}: ${u.workItems}`, 60, y, { width: 380 })
          doc.text(formatRupiah(u.amount), 440, y, { width: 110, align: 'right' })
          y += 12
        }
        doc.font('Helvetica-Bold').fontSize(9)
        doc.text(`Subtotal ${tukang.tukangName}:`, 300, y, { width: 140, align: 'right' })
        doc.text(formatRupiah(tukang.total), 440, y, { width: 110, align: 'right' })
        y += 20
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#cc0000')
      doc.text('TOTAL UPAH:', 300, y, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.totalUpah), 440, y, { width: 110, align: 'right' })
      y += 30

      // === ADD COST SECTION (YELLOW) ===
      doc.fillColor('#cc9900').fontSize(11).font('Helvetica-Bold').text('ADDED COST', 50, y)
      y += 20
      doc.fillColor('#000').fontSize(9)
      for (const cost of data.addCost) {
        doc.font('Helvetica').text(`${cost.category}: ${cost.description}`, 60, y, { width: 380 })
        doc.text(formatRupiah(cost.amount), 440, y, { width: 110, align: 'right' })
        y += 14
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#cc9900')
      doc.text('TOTAL ADDED COST:', 300, y, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.totalAddCost), 440, y, { width: 110, align: 'right' })
      y += 30

      // === DAILY EXPENSES SECTION ===
      doc.fillColor('#666').fontSize(11).font('Helvetica-Bold').text('PENGELUARAN HARIAN (Listrik, Bensin, dll)', 50, y)
      y += 20
      doc.fillColor('#000').fontSize(9)
      for (const d of data.daily) {
        doc.text(`${d.date.toLocaleDateString('id-ID')} - ${d.category}: ${d.description}`, 60, y, { width: 380 })
        doc.text(formatRupiah(d.amount), 440, y, { width: 110, align: 'right' })
        y += 14
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#666')
      doc.text('TOTAL DAILY:', 300, y, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.totalDaily), 440, y, { width: 110, align: 'right' })
      y += 40

      // === GRAND TOTAL ===
      doc.rect(300, y, 250, 30).fillAndStroke('#f0f0f0', '#000')
      doc.fillColor('#000').fontSize(12).font('Helvetica-Bold')
      doc.text('GRAND TOTAL:', 300, y + 10, { width: 140, align: 'right' })
      doc.text(formatRupiah(data.grandTotal), 440, y + 10, { width: 110, align: 'right' })

      doc.end()
      stream.on('finish', () => resolve())
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}
