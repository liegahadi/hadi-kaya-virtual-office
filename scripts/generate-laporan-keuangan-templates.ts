// Generate .docx templates for Laporan Keuangan Wirausaha (5 styles)
// Structure per halaman: Kop + Judul + Periode + Pendapatan table + Pengeluaran table + Laba Bersih + Signature
// 7 hard-coded sections dengan indexed placeholders

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, TabStopType, TabStopPosition } from 'docx'
import fs from 'fs'
import path from 'path'

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates', 'laporan-keuangan')

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const BORDER_NONE = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
const BORDER_THIN = { style: BorderStyle.SINGLE, size: 1, color: '999999' }
const BORDER_THICK = { style: BorderStyle.SINGLE, size: 2, color: '000000' }

// 5 styles dengan visual differences
const STYLES = [
  { id: '01', name: 'Formal Standard', font: 'Times New Roman', titleSize: 26, bodySize: 22, accentColor: '000000', headerBgPendapatan: '16A34A', headerBgPengeluaran: 'DC2626', headerBgLaba: '1E3A8A' },
  { id: '02', name: 'Modern Clean', font: 'Arial', titleSize: 24, bodySize: 21, accentColor: '2563EB', headerBgPendapatan: '2563EB', headerBgPengeluaran: 'DC2626', headerBgLaba: '1E3A8A' },
  { id: '03', name: 'Minimal UMKM', font: 'Calibri', titleSize: 24, bodySize: 21, accentColor: '16A34A', headerBgPendapatan: '16A34A', headerBgPengeluaran: 'EA580C', headerBgLaba: '166534' },
  { id: '04', name: 'Klasik Elegant', font: 'Georgia', titleSize: 26, bodySize: 22, accentColor: '92400E', headerBgPendapatan: '166534', headerBgPengeluaran: '991B1B', headerBgLaba: '78350F' },
  { id: '05', name: 'Simple Formal', font: 'Tahoma', titleSize: 24, bodySize: 21, accentColor: '000000', headerBgPendapatan: 'E8E8E8', headerBgPengeluaran: 'E8E8E8', headerBgLaba: 'E6F3FF' },
]

// Helper: baris identitas (borderless table)
function idRow(label: string, value: string, font: string, bodySize: number, bold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({ children: [new TextRun({ text: `${label}\t:`, bold, font, size: bodySize })], tabStops: [{ type: TabStopType.RIGHT, position: 2700 }] })],
      }),
      new TableCell({
        width: { size: 6800, type: WidthType.DXA },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
        children: [new Paragraph({ children: [new TextRun({ text: ` ${value}`, bold, font, size: bodySize })] })],
      }),
    ],
  })
}

// Helper: baris pendapatan/pengeluaran (dengan border)
function lapRow(label: string, amount: string, font: string, bodySize: number, bold = false, bg?: string): TableRow {
  const shading = bg ? { fill: bg.replace('#', '') } : undefined
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 7000, type: WidthType.DXA },
        shading,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold, font, size: bodySize })] })],
      }),
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        shading,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: amount, bold, font, size: bodySize })] })],
      }),
    ],
  })
}

// Build 1 halaman laporan keuangan
function buildLaporanBulanan(style: typeof STYLES[0], slipIndex: number): (Paragraph | Table)[] {
  const { font, titleSize, bodySize, headerBgPendapatan, headerBgPengeluaran, headerBgLaba } = style
  const idx = slipIndex + 1

  return [
    // Page break (kecuali halaman pertama)
    ...(slipIndex > 0 ? [new Paragraph({ children: [new PageBreak()] })] : []),

    // Kop surat placeholder
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 50 },
      children: [new TextRun({ text: '{nama_usaha}', bold: true, size: 28, font })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [new TextRun({ text: '{alamat_usaha}', size: 18, font, color: '666666' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'IG: @{ig_usaha}', size: 18, font, color: '666666' })],
    }),

    // Judul
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 50 },
      children: [new TextRun({ text: 'LAPORAN LABA RUGI', bold: true, size: titleSize, font, underline: {} })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: `Periode: {periode_${idx}}`, size: bodySize, font })],
    }),

    // Identitas (borderless table)
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      borders: BORDER_NONE,
      columnWidths: [2800, 6800],
      rows: [
        idRow('Nama Usaha', '{nama_usaha}', font, bodySize, true),
        idRow('Jenis Usaha', '{jenis_usaha}', font, bodySize),
        idRow('Pemilik', '{nama}', font, bodySize, true),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),

    // Tabel Pendapatan
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      columnWidths: [7000, 2800],
      borders: { top: BORDER_THICK, bottom: BORDER_THICK, left: BORDER_THICK, right: BORDER_THICK, insideHorizontal: BORDER_THIN, insideVertical: BORDER_THIN },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 7000, type: WidthType.DXA },
              shading: { fill: headerBgPendapatan },
              children: [new Paragraph({ children: [new TextRun({ text: 'PENDAPATAN', bold: true, size: bodySize, font, color: 'FFFFFF' })] })],
            }),
            new TableCell({
              width: { size: 2800, type: WidthType.DXA },
              shading: { fill: headerBgPendapatan },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Jumlah (Rp)', bold: true, size: bodySize, font, color: 'FFFFFF' })] })],
            }),
          ],
        }),
        // 5 pendapatan rows (indexed)
        ...[1, 2, 3, 4, 5].map(n => lapRow(`{pendapatan_${idx}_${n}_label}`, `{pendapatan_${idx}_${n}_amount}`, font, bodySize)),
        // Total Pendapatan
        lapRow('Total Pendapatan', `{total_pendapatan_${idx}}`, font, bodySize, true, 'F0FDF4'),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),

    // Tabel Pengeluaran
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      columnWidths: [7000, 2800],
      borders: { top: BORDER_THICK, bottom: BORDER_THICK, left: BORDER_THICK, right: BORDER_THICK, insideHorizontal: BORDER_THIN, insideVertical: BORDER_THIN },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 7000, type: WidthType.DXA },
              shading: { fill: headerBgPengeluaran },
              children: [new Paragraph({ children: [new TextRun({ text: 'PENGELUARAN', bold: true, size: bodySize, font, color: 'FFFFFF' })] })],
            }),
            new TableCell({
              width: { size: 2800, type: WidthType.DXA },
              shading: { fill: headerBgPengeluaran },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Jumlah (Rp)', bold: true, size: bodySize, font, color: 'FFFFFF' })] })],
            }),
          ],
        }),
        // 5 pengeluaran rows (indexed)
        ...[1, 2, 3, 4, 5].map(n => lapRow(`{pengeluaran_${idx}_${n}_label}`, `{pengeluaran_${idx}_${n}_amount}`, font, bodySize)),
        // Total Pengeluaran
        lapRow('Total Pengeluaran', `{total_pengeluaran_${idx}}`, font, bodySize, true, 'FEF2F2'),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),

    // Laba Bersih (highlight)
    new Table({
      width: { size: 9800, type: WidthType.DXA },
      columnWidths: [7000, 2800],
      borders: { top: BORDER_THICK, bottom: BORDER_THICK, left: BORDER_THICK, right: BORDER_THICK, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 7000, type: WidthType.DXA },
              shading: { fill: headerBgLaba },
              children: [new Paragraph({ children: [new TextRun({ text: 'LABA BERSIH (NETT)', bold: true, size: bodySize + 2, font, color: 'FFFFFF' })] })],
            }),
            new TableCell({
              width: { size: 2800, type: WidthType.DXA },
              shading: { fill: headerBgLaba },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `{laba_bersih_${idx}}`, bold: true, size: bodySize + 2, font, color: 'FFFFFF' })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 400 }, children: [] }),

    // Signature
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Pangkalpinang, {tanggal}', size: bodySize, font })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 1000 },
      children: [new TextRun({ text: 'Pemilik Usaha,', size: bodySize, font })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: '( {nama} )', bold: true, underline: {}, size: bodySize, font })],
    }),
  ]
}

// Generate 1 template
async function generateTemplate(style: typeof STYLES[0]): Promise<void> {
  const sections = Array.from({ length: 7 }, (_, i) => buildLaporanBulanan(style, i)).flat()

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: sections,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const filePath = path.join(TEMPLATES_DIR, `laporan-${style.id}.docx`)
  fs.writeFileSync(filePath, buffer)
  console.log(`✅ Generated laporan-${style.id}.docx (${style.name})`)
}

async function main() {
  console.log('=== Generate 5 Laporan Keuangan templates ===')
  if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
  for (const style of STYLES) {
    try { await generateTemplate(style) } catch (err) { console.error(`❌ ${style.id}:`, err) }
  }
  console.log('=== Done! ===')
}

main().catch(console.error)
