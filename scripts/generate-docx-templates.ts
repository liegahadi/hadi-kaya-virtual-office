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
  { id: '01', name: 'Standard Formal', category: 'Umum', accent: '000000', font: 'Times New Roman', titleSize: 28, bodySize: 22, headerBg: 'E8E8E8' },
  { id: '02', name: 'Modern Minimalis', category: 'Umum', accent: '2563eb', font: 'Arial', titleSize: 26, bodySize: 21, headerBg: 'DBEAFE' },
  { id: '03', name: 'Sederhana', category: 'Warung/UMKM', accent: '000000', font: 'Calibri', titleSize: 26, bodySize: 21, headerBg: 'F3F4F6' },
  { id: '04', name: 'Kop Boxed', category: 'Warung/UMKM', accent: '000000', font: 'Tahoma', titleSize: 26, bodySize: 21, headerBg: 'F3F4F6' },
  { id: '05', name: 'Accent Hijau', category: 'Kafe/Restoran', accent: '16a34a', font: 'Georgia', titleSize: 28, bodySize: 22, headerBg: 'DCFCE7' },
  { id: '06', name: 'Accent Oranye', category: 'Jasa Service', accent: 'ea580c', font: 'Verdana', titleSize: 24, bodySize: 20, headerBg: 'FED7AA' },
  { id: '07', name: 'Formal Double Border', category: 'Perusahaan', accent: '000000', font: 'Cambria', titleSize: 28, bodySize: 22, headerBg: 'E8E8E8' },
  { id: '08', name: 'Accent Ungu', category: 'Jasa Beauty', accent: '7c3aed', font: 'Arial', titleSize: 26, bodySize: 21, headerBg: 'E9D5FF' },
  { id: '09', name: 'Simple Underline', category: 'Personal', accent: '000000', font: 'Times New Roman', titleSize: 28, bodySize: 22, headerBg: 'F3F4F6' },
  { id: '10', name: 'Accent Coklat', category: 'Toko Bangunan', accent: '92400e', font: 'Georgia' },
  { id: '11', name: 'Gradient Oranye-Kuning', category: 'Warung Makan', accent: 'ea580c', font: 'Calibri', titleSize: 26, bodySize: 21, headerBg: 'FEF3C7' },
  { id: '12', name: 'Klasik Italic', category: 'Hotel', accent: '92400e', font: 'Georgia', titleSize: 28, bodySize: 22, headerBg: 'F3F4F6' },
  { id: '13', name: 'Accent Merah', category: 'Restoran', accent: 'dc2626', font: 'Arial', titleSize: 26, bodySize: 21, headerBg: 'FEE2E2' },
  { id: '14', name: 'Minimal No Color', category: 'Jasa Service', accent: '000000', font: 'Tahoma' },
  { id: '15', name: 'Accent Navy', category: 'Perbankan', accent: '1e3a8a', font: 'Calibri', titleSize: 26, bodySize: 21, headerBg: 'DBEAFE' },
  { id: '16', name: 'Accent Cyan', category: 'Jasa Service', accent: '0891b2', font: 'Arial' },
  { id: '17', name: 'Accent Pink', category: 'Jasa Beauty', accent: 'db2777', font: 'Georgia' },
  { id: '18', name: 'Accent Dark Gold', category: 'Konstruksi', accent: 'fbbf24', font: 'Cambria', titleSize: 28, bodySize: 22, headerBg: 'FEF3C7' },
  { id: '19', name: 'Accent Forest Green', category: 'Pertanian', accent: '166534', font: 'Times New Roman' },
  { id: '20', name: 'Accent Burgundy', category: 'Fashion', accent: '881337', font: 'Georgia', titleSize: 28, bodySize: 22, headerBg: 'FCE7F3' },
  { id: '21', name: 'Warung Sembako', category: 'Warung/UMKM', accent: '000000', font: 'Times New Roman' },
  { id: '22', name: 'Toko Kelontong', category: 'Warung/UMKM', accent: '92400e', font: 'Calibri' },
  { id: '23', name: 'Kafe Coffee Shop', category: 'Kafe/Restoran', accent: '16a34a', font: 'Georgia' },
  { id: '24', name: 'Barbershop Salon', category: 'Jasa', accent: '1e293b', font: 'Arial', titleSize: 26, bodySize: 21, headerBg: 'E2E8F0' },
  { id: '25', name: 'Laundry', category: 'Jasa', accent: '0ea5e9', font: 'Calibri', titleSize: 26, bodySize: 21, headerBg: 'CFFAFE' },
  { id: '26', name: 'Online Shop', category: 'Online', accent: '8b5cf6', font: 'Arial', titleSize: 26, bodySize: 21, headerBg: 'E9D5FF' },
  { id: '27', name: 'Pabrik Manufaktur', category: 'Perusahaan', accent: '374151', font: 'Tahoma', titleSize: 24, bodySize: 20, headerBg: 'E2E8F0' },
  { id: '28', name: 'Minimarket Franchise', category: 'Retail', accent: 'dc2626', font: 'Arial', titleSize: 26, bodySize: 21, headerBg: 'FEE2E2' },
  { id: '29', name: 'Startup Tech', category: 'Tech', accent: '8b5cf6', font: 'Segoe UI', titleSize: 26, bodySize: 21, headerBg: 'E9D5FF' },
  { id: '30', name: 'CV Profesional', category: 'Perusahaan', accent: '1e3a8a', font: 'Cambria', titleSize: 28, bodySize: 22, headerBg: 'DBEAFE' },
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
// Width dalam DXA (twips): 1 inch = 1440 twips
// Kolom 1: 2800 twips (~1.94 inch) untuk label
// Kolom 2: 200 twips (~0.14 inch) untuk ':'
// Kolom 3: 6800 twips (~4.72 inch) untuk value
// Total: 9800 twips (~6.8 inch, muat di A4 dengan margin 0.5 inch)
function idRow(label: string, value: string, bold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({
          children: [
            new TextRun({ text: `${label}\t:`, bold, font: 'Times New Roman', size: 22 }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: 2700 }],
        })],
      }),
      new TableCell({
        width: { size: 6800, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({
          children: [new TextRun({ text: ` ${value}`, bold, font: 'Times New Roman', size: 22 })],
        })],
      }),
    ],
  })
}

// Helper: baris slip gaji (dengan border)
// Kolom 1: 5400 twips (~3.75 inch) untuk label
// Kolom 2: 2200 twips (~1.53 inch) untuk pendapatan
// Kolom 3: 2200 twips (~1.53 inch) untuk potongan
// Total: 9800 twips
function slipRow(label: string, pendapatan: string, potongan: string, bold = false, bg?: string): TableRow {
  const shading = bg ? { fill: bg.replace('#', '') } : undefined
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 5400, type: WidthType.DXA },
        shading,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold, font: 'Times New Roman', size: 22 })] })],
      }),
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
        shading,
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: pendapatan, bold, font: 'Times New Roman', size: 22 })],
        })],
      }),
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
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
function buildSkKerja(style: any): (Paragraph | Table)[] {
  return [
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [new TextRun({ text: 'SURAT KETERANGAN KERJA', bold: true, size: style.titleSize, font: style.font, underline: {} })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: 'No: .../SK/{bulan}/{tahun}', size: style.bodySize, font: style.font })],
    }),
    // Intro
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Yang bertanda tangan di bawah ini:', size: style.bodySize, font: style.font })],
    }),
    // Identity table 1 (borderless) — width 9800 twips total
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      borders: BORDER_NONE,
      columnWidths: [2800, 6800],
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
      children: [new TextRun({ text: 'Dengan ini menerangkan bahwa:', size: style.bodySize, font: style.font })],
    }),
    // Identity table 2 (borderless) — width 9800 twips
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      borders: BORDER_NONE,
      columnWidths: [2800, 6800],
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
      children: [new TextRun({ text: 'Benar bahwa yang bersangkutan adalah karyawan/pekerja tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR).', size: style.bodySize, font: style.font })],
    }),
    new Paragraph({
      spacing: { after: 800 },
      children: [new TextRun({ text: 'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.', size: style.bodySize, font: style.font })],
    }),
    // Signature (right-aligned)
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: '{kota}, {tanggal}', size: style.bodySize, font: style.font })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 1200 },
      children: [new TextRun({ text: 'Pimpinan {perusahaan},', size: style.bodySize, font: style.font })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: '( ............................. )', bold: true, underline: {}, size: style.bodySize, font: style.font })],
    }),
  ]
}

// Build Slip Gaji section (1 bulan) — FORMAT BARU (section-based, sub-items a./b./c.)
// Struktur:
//   Gaji Pokok | {gaji_pokok_N}
//   ───────────
//   Tunjangan | {tunjangan_total_N}
//     a. {tunjangan_N_1_label} | {tunjangan_N_1_amount}
//     b. {tunjangan_N_2_label} | {tunjangan_N_2_amount}
//     ... (5 rows)
//   ───────────
//   Bonus | {bonus_total_N}
//     a. {bonus_N_1_label} | {bonus_N_1_amount}
//     ... (5 rows)
//   ───────────
//   Potongan | {potongan_total_N}
//     a. {potongan_N_1_label} | {potongan_N_1_amount}
//     ... (5 rows)
//   ───────────
//   TOTAL GAJI | {gaji_bersih_N}  (= Gaji Pokok + Tunjangan + Bonus - Potongan)
function buildSlipGaji(style: any, upahLabel: string, slipIndex: number = 0): (Paragraph | Table)[] {
  const headerBg = style.headerBg
  const totalBg = 'F5F5F5'
  const bersihBg = 'E6F3FF'

  const idx = slipIndex + 1
  const periodeKey = `{periode_${idx}}`
  const gajiPokokKey = `{gaji_pokok_${idx}}`
  const tunjanganTotalKey = `{tunjangan_total_${idx}}`
  const bonusTotalKey = `{bonus_total_${idx}}`
  const potonganTotalKey = `{total_potongan_${idx}}`
  const gajiBersihKey = `{gaji_bersih_${idx}}`
  const tanggalTerimaKey = `{tanggal_terima_${idx}}`

  // Helper: section header row (label | total amount) — bold + border-bottom + light bg
  const sectionHeader = (label: string, amountKey: string): TableRow => new TableRow({
    children: [
      new TableCell({
        width: { size: 7000, type: WidthType.DXA },
        shading: { fill: totalBg },
        borders: { top: BORDER_THIN, bottom: BORDER_THIN, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: style.bodySize, font: style.font })] })],
      }),
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        shading: { fill: totalBg },
        borders: { top: BORDER_THIN, bottom: BORDER_THIN, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: amountKey, bold: true, size: style.bodySize, font: style.font })] })],
      }),
    ],
  })

  // Helper: sub-item row (a./b./c. + label | amount) — indent label
  const subItemRow = (letter: string, labelKey: string, amountKey: string): TableRow => new TableRow({
    children: [
      new TableCell({
        width: { size: 7000, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({
          indent: { left: 720 }, // 0.5 inch indent
          children: [new TextRun({ text: `${letter}. ${labelKey}`, size: style.bodySize, font: style.font })],
        })],
      }),
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: amountKey, size: style.bodySize, font: style.font })] })],
      }),
    ],
  })

  // Helper: separator row (full-width border-bottom only)
  const separatorRow = (): TableRow => new TableRow({
    children: [
      new TableCell({
        width: { size: 9800, type: WidthType.DXA },
        columnSpan: 2,
        borders: { top: NO_BORDER, bottom: BORDER_THIN, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({ children: [] })],
      }),
    ],
  })

  const letters = ['a', 'b', 'c', 'd', 'e']

  return [
    // Page break SEBELUM setiap slip gaji (termasuk slip pertama, untuk pisah dari SK Kerja)
    new Paragraph({ children: [new PageBreak()] }),
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [new TextRun({ text: `SLIP ${upahLabel.toUpperCase()}`, bold: true, size: style.titleSize, font: style.font, underline: {} })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: `Periode: ${periodeKey}`, size: style.bodySize, font: style.font })],
    }),
    // Identity (borderless table)
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      borders: BORDER_NONE,
      columnWidths: [2800, 6800],
      rows: [
        idRow('Nama', '{nama}', true),
        idRow('NIK', '{nik}'),
        idRow('Jabatan', '{jabatan}'),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
    // Slip Gaji section-based layout (2-column borderless with separators)
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      columnWidths: [7000, 2800],
      borders: {
        top: BORDER_THIN, bottom: BORDER_THIN, left: NO_BORDER, right: NO_BORDER,
        insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
      },
      rows: [
        // Section: Gaji Pokok
        sectionHeader(`${upahLabel} Pokok`, gajiPokokKey),
        separatorRow(),
        // Section: Tunjangan
        sectionHeader('Tunjangan', tunjanganTotalKey),
        ...letters.map((l, i) => subItemRow(l, `{tunjangan_${idx}_${i + 1}_label}`, `{tunjangan_${idx}_${i + 1}_amount}`)),
        separatorRow(),
        // Section: Bonus
        sectionHeader('Bonus', bonusTotalKey),
        ...letters.map((l, i) => subItemRow(l, `{bonus_${idx}_${i + 1}_label}`, `{bonus_${idx}_${i + 1}_amount}`)),
        separatorRow(),
        // Section: Potongan
        sectionHeader('Potongan', potonganTotalKey),
        ...letters.map((l, i) => subItemRow(l, `{potongan_${idx}_${i + 1}_label}`, `{potongan_${idx}_${i + 1}_amount}`)),
        separatorRow(),
        // Total Gaji (Gaji Pokok + Tunjangan + Bonus - Potongan)
        new TableRow({
          children: [
            new TableCell({
              width: { size: 7000, type: WidthType.DXA },
              shading: { fill: bersihBg },
              borders: { top: BORDER_THICK, bottom: BORDER_THICK, left: NO_BORDER, right: NO_BORDER },
              children: [new Paragraph({ children: [new TextRun({ text: `TOTAL ${upahLabel.toUpperCase()} DITERIMA`, bold: true, size: style.bodySize, font: style.font })] })],
            }),
            new TableCell({
              width: { size: 2800, type: WidthType.DXA },
              shading: { fill: bersihBg },
              borders: { top: BORDER_THICK, bottom: BORDER_THICK, left: NO_BORDER, right: NO_BORDER },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: gajiBersihKey, bold: true, size: style.bodySize, font: style.font })] })],
            }),
          ],
        }),
      ],
    }),
    // Note line: formula explanation
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100, after: 400 },
      children: [new TextRun({ text: `(${upahLabel} Pokok + Tunjangan + Bonus - Potongan)`, italics: true, size: 18, font: style.font, color: '666666' })],
    }),
    // Signature (2 columns)
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      borders: BORDER_NONE,
      columnWidths: [4900, 4900],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 4900, type: WidthType.DXA },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              children: [
                new Paragraph({ children: [new TextRun({ text: 'Diterima oleh,', size: style.bodySize, font: style.font })] }),
                new Paragraph({ spacing: { before: 1000 }, children: [] }),
                new Paragraph({ children: [new TextRun({ text: '( {nama} )', bold: true, underline: {}, size: style.bodySize, font: style.font })] }),
              ],
            }),
            new TableCell({
              width: { size: 4900, type: WidthType.DXA },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `{kota}, ${tanggalTerimaKey}`, size: style.bodySize, font: style.font })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Bagian Keuangan,', size: style.bodySize, font: style.font })] }),
                new Paragraph({ spacing: { before: 1000 }, children: [] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '( ............................. )', bold: true, underline: {}, size: style.bodySize, font: style.font })] }),
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
    ...buildSkKerja(style),
    // 7 hard-coded slip sections dengan index suffix (1-7)
    ...Array.from({ length: 7 }, (_, i) => buildSlipGaji(style, upahLabel, i)).flat(),
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
