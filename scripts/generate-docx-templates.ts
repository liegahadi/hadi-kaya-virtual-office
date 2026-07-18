// Generate 30 .docx templates for SK Kerja + Slip Gaji
// Features:
// - Tab stops untuk alignment (Rata Kiri-Kanan / Tabulasi Sejajar)
// - Proper page breaks (1 SK + 7 Slip, each on own page)
// - No kop surat (user edit di Google Docs)
// - Borderless table untuk identitas
// - Real table untuk slip gaji pendapatan/potongan
// - Signature: stacked di kanan bawah (SK), side-by-side (Slip Gaji)

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, TabStopType, TabStopPosition } from 'docx'
import fs from 'fs'
import path from 'path'

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates', 'combined')

// 30 template styles
const STYLES = [
  { id: '01', name: 'Standard Formal', category: 'Umum', accent: '000000', font: 'Times New Roman' },
  { id: '02', name: 'Modern Minimalis', category: 'Umum', accent: '2563eb', font: 'Arial' },
  { id: '03', name: 'Sederhana', category: 'Warung/UMKM', accent: '000000', font: 'Calibri' },
  { id: '04', name: 'Kop Boxed', category: 'Warung/UMKM', accent: '000000', font: 'Tahoma' },
  { id: '05', name: 'Accent Hijau', category: 'Kafe/Restoran', accent: '16a34a', font: 'Georgia' },
  { id: '06', name: 'Accent Oranye', category: 'Jasa Service', accent: 'ea580c', font: 'Verdana' },
  { id: '07', name: 'Formal Double Border', category: 'Perusahaan', accent: '000000', font: 'Cambria' },
  { id: '08', name: 'Accent Ungu', category: 'Jasa Beauty', accent: '7c3aed', font: 'Arial' },
  { id: '09', name: 'Simple Underline', category: 'Personal', accent: '000000', font: 'Times New Roman' },
  { id: '10', name: 'Accent Coklat', category: 'Toko Bangunan', accent: '92400e', font: 'Georgia' },
  { id: '11', name: 'Gradient Oranye-Kuning', category: 'Warung Makan', accent: 'ea580c', font: 'Calibri' },
  { id: '12', name: 'Klasik Italic', category: 'Hotel', accent: '92400e', font: 'Georgia' },
  { id: '13', name: 'Accent Merah', category: 'Restoran', accent: 'dc2626', font: 'Arial' },
  { id: '14', name: 'Minimal No Color', category: 'Jasa Service', accent: '000000', font: 'Tahoma' },
  { id: '15', name: 'Accent Navy', category: 'Perbankan', accent: '1e3a8a', font: 'Calibri' },
  { id: '16', name: 'Accent Cyan', category: 'Jasa Service', accent: '0891b2', font: 'Arial' },
  { id: '17', name: 'Accent Pink', category: 'Jasa Beauty', accent: 'db2777', font: 'Georgia' },
  { id: '18', name: 'Accent Dark Gold', category: 'Konstruksi', accent: 'fbbf24', font: 'Cambria' },
  { id: '19', name: 'Accent Forest Green', category: 'Pertanian', accent: '166534', font: 'Times New Roman' },
  { id: '20', name: 'Accent Burgundy', category: 'Fashion', accent: '881337', font: 'Georgia' },
  { id: '21', name: 'Warung Sembako', category: 'Warung/UMKM', accent: '000000', font: 'Times New Roman' },
  { id: '22', name: 'Toko Kelontong', category: 'Warung/UMKM', accent: '92400e', font: 'Calibri' },
  { id: '23', name: 'Kafe Coffee Shop', category: 'Kafe/Restoran', accent: '16a34a', font: 'Georgia' },
  { id: '24', name: 'Barbershop Salon', category: 'Jasa', accent: '1e293b', font: 'Arial' },
  { id: '25', name: 'Laundry', category: 'Jasa', accent: '0ea5e9', font: 'Calibri' },
  { id: '26', name: 'Online Shop', category: 'Online', accent: '8b5cf6', font: 'Arial' },
  { id: '27', name: 'Pabrik Manufaktur', category: 'Perusahaan', accent: '374151', font: 'Tahoma' },
  { id: '28', name: 'Minimarket Franchise', category: 'Retail', accent: 'dc2626', font: 'Arial' },
  { id: '29', name: 'Startup Tech', category: 'Tech', accent: '8b5cf6', font: 'Segoe UI' },
  { id: '30', name: 'CV Profesional', category: 'Perusahaan', accent: '1e3a8a', font: 'Cambria' },
]

// Border style untuk borderless table
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const BORDER_NONE = {
  top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
  insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
}

// Border style untuk slip gaji table (with borders)
const BORDER_THIN = { style: BorderStyle.SINGLE, size: 1, color: '999999' }
const BORDER_THICK = { style: BorderStyle.SINGLE, size: 2, color: '000000' }
const BORDER_TABLE = {
  top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN,
  insideHorizontal: BORDER_THIN, insideVertical: BORDER_THIN,
}

// Tab stop positions (dalam twips, 1 inch = 1440 twips)
// Label di posisi 0, colon di posisi 1700 twips (~1.18 inch), value mulai dari 1850 twips
const TAB_LABEL = 0
const TAB_COLON = 1700
const TAB_VALUE = 1850

// Helper: baris identitas dengan Tab stops (borderless table row)
function idRow(label: string, value: string, bold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_COLON }],
          children: [
            new TextRun({ text: label, bold, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t:', font: 'Times New Roman', size: 22 }),
          ],
        })],
      }),
      new TableCell({
        width: { size: 75, type: WidthType.PERCENTAGE },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({
          children: [new TextRun({ text: ` ${value}`, bold, font: 'Times New Roman', size: 22 })],
        })],
      }),
    ],
  })
}

// Helper: baris slip gaji (dengan border)
function slipRow(label: string, pendapatan: string, potongan: string, bold = false, bg?: string): TableRow {
  const shading = bg ? { fill: bg.replace('#', '') } : undefined
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 55, type: WidthType.PERCENTAGE },
        shading,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold, font: 'Times New Roman', size: 22 })] })],
      }),
      new TableCell({
        width: { size: 22.5, type: WidthType.PERCENTAGE },
        shading,
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: pendapatan, bold, font: 'Times New Roman', size: 22 })],
        })],
      }),
      new TableCell({
        width: { size: 22.5, type: WidthType.PERCENTAGE },
        shading,
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: potongan, bold, font: 'Times New Roman', size: 22 })],
        })],
      }),
    ],
  })
}

// Build SK Kerja section
function buildSkKerja(): (Paragraph | Table)[] {
  return [
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [new TextRun({ text: 'SURAT KETERANGAN KERJA', bold: true, size: 28, font: 'Times New Roman', underline: {} })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: 'No: .../SK/{bulan}/{tahun}', size: 22, font: 'Times New Roman' })],
    }),
    // Intro
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Yang bertanda tangan di bawah ini:', size: 22, font: 'Times New Roman' })],
    }),
    // Identity table 1 (borderless)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDER_NONE,
      rows: [
        idRow('Nama', 'Pimpinan {perusahaan}'),
        idRow('Jabatan', 'Pimpinan / Direktur'),
        idRow('Perusahaan', '{perusahaan}'),
        idRow('Alamat', '{alamat_perusahaan}'),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
    // Intro 2
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Dengan ini menerangkan bahwa:', size: 22, font: 'Times New Roman' })],
    }),
    // Identity table 2 (borderless)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDER_NONE,
      rows: [
        idRow('Nama', '{nama}', true),
        idRow('NIK', '{nik}'),
        idRow('Tempat/Tgl Lahir', '{tempat_lahir}, {tanggal_lahir}'),
        idRow('Jabatan', '{jabatan}'),
        idRow('Lama Bekerja', '{lama_bekerja} tahun'),
        idRow('Gaji per Bulan', '{gaji}'),
      ],
    }),
    new Paragraph({ spacing: { after: 300 }, children: [] }),
    // Body
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Benar bahwa yang bersangkutan adalah karyawan/pekerja tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR).', size: 22, font: 'Times New Roman' })],
    }),
    new Paragraph({
      spacing: { after: 800 },
      children: [new TextRun({ text: 'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.', size: 22, font: 'Times New Roman' })],
    }),
    // Signature (right-aligned)
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: '{kota}, {tanggal}', size: 22, font: 'Times New Roman' })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 1200 },
      children: [new TextRun({ text: 'Pimpinan {perusahaan},', size: 22, font: 'Times New Roman' })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: '( ............................. )', bold: true, underline: {}, size: 22, font: 'Times New Roman' })],
    }),
  ]
}

// Build Slip Gaji section (1 bulan)
function buildSlipGaji(upahLabel: string = 'Gaji'): (Paragraph | Table)[] {
  const headerBg = 'E8E8E8'
  const totalBg = 'F5F5F5'
  const bersihBg = 'E6F3FF'

  return [
    // Page break
    new Paragraph({ children: [new PageBreak()] }),
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [new TextRun({ text: `SLIP ${upahLabel.toUpperCase()}`, bold: true, size: 26, font: 'Times New Roman', underline: {} })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'Periode: {periode}', size: 22, font: 'Times New Roman' })],
    }),
    // Identity (borderless table)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDER_NONE,
      rows: [
        idRow('Nama', '{nama}', true),
        idRow('NIK', '{nik}'),
        idRow('Jabatan', '{jabatan}'),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
    // Pendapatan/Potongan table (with borders)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: BORDER_THICK, bottom: BORDER_THICK, left: BORDER_THICK, right: BORDER_THICK,
        insideHorizontal: BORDER_THIN, insideVertical: BORDER_THIN,
      },
      rows: [
        // Header
        new TableRow({
          children: [
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              shading: { fill: headerBg },
              children: [new Paragraph({ children: [new TextRun({ text: 'Keterangan', bold: true, size: 22, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 22.5, type: WidthType.PERCENTAGE },
              shading: { fill: headerBg },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Pendapatan', bold: true, size: 22, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 22.5, type: WidthType.PERCENTAGE },
              shading: { fill: headerBg },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Potongan', bold: true, size: 22, font: 'Times New Roman' })] })],
            }),
          ],
        }),
        // Gaji Pokok
        slipRow(`${upahLabel} Pokok`, '{gaji_pokok}', ''),
        // Tunjangan (placeholder loop — user edit di Google Docs)
        slipRow('{tunjangan_1_label}', '{tunjangan_1_amount}', ''),
        slipRow('{tunjangan_2_label}', '{tunjangan_2_amount}', ''),
        // Potongan
        slipRow('{potongan_1_label}', '', '{potongan_1_amount}'),
        // Total
        slipRow('Total', '{gaji_kotor}', '{total_potongan}', true, totalBg),
        // Gaji Bersih
        slipRow(`${upahLabel} Diterima (Bersih)`, '', '{gaji_bersih}', true, bersihBg),
      ],
    }),
    new Paragraph({ spacing: { after: 600 }, children: [] }),
    // Signature (2 columns: kiri=Diterima, kanan=Bagian Keuangan)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDER_NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              children: [
                new Paragraph({ children: [new TextRun({ text: 'Diterima oleh,', size: 22, font: 'Times New Roman' })] }),
                new Paragraph({ spacing: { before: 1000 }, children: [] }),
                new Paragraph({ children: [new TextRun({ text: '( {nama} )', bold: true, underline: {}, size: 22, font: 'Times New Roman' })] }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '{kota}, {tanggal_terima}', size: 22, font: 'Times New Roman' })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Bagian Keuangan,', size: 22, font: 'Times New Roman' })] }),
                new Paragraph({ spacing: { before: 1000 }, children: [] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '( ............................. )', bold: true, underline: {}, size: 22, font: 'Times New Roman' })] }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]
}

// Generate 1 template .docx
async function generateTemplate(style: typeof STYLES[0]): Promise<void> {
  const upahLabel = style.category.includes('Warung') || style.category.includes('UMKM') ? 'Upah' : 'Gaji'

  const sections = [
    ...buildSkKerja(),
    ...buildSlipGaji(upahLabel),
    // Repeat slip gaji 6 more times (7 total)
    ...Array.from({ length: 6 }, () => buildSlipGaji(upahLabel)).flat(),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch
        },
      },
      children: sections,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const filePath = path.join(TEMPLATES_DIR, `template-${style.id}.docx`)
  fs.writeFileSync(filePath, buffer)
  console.log(`✅ Generated template-${style.id}.docx (${style.name})`)
}

// Main
async function main() {
  console.log('=== Generate 30 .docx templates ===')
  console.log(`Output: ${TEMPLATES_DIR}`)
  console.log('')

  // Ensure directory exists
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
  }

  for (const style of STYLES) {
    try {
      await generateTemplate(style)
    } catch (err) {
      console.error(`❌ Failed template-${style.id}:`, err)
    }
  }

  console.log('')
  console.log('=== Done! ===')
  console.log(`Total templates: ${STYLES.length}`)
  console.log(`Location: ${TEMPLATES_DIR}`)
}

main().catch(console.error)
