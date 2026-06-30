// Generate 10 .docx templates for SK Kerja + Slip Gaji (combined in 1 file)
// Each template has placeholders: {nama}, {nik}, {jabatan}, {perusahaan}, etc.
// For slip gaji, uses {#slips}...{/slips} loop for 7 sheets
// Run: npx tsx scripts/generate-docx-templates.ts
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, PageBreak,
  Header, Footer, ShadingType, convertInchesToTwip,
} from 'docx'
import * as fs from 'fs'
import * as path from 'path'

// =========================================================
// HELPERS
// =========================================================

function p(text: string, opts: { bold?: boolean; italics?: boolean; underline?: boolean; align?: 'left' | 'center' | 'right'; size?: number; color?: string; spacing?: number } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align === 'center' ? AlignmentType.CENTER : opts.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { after: opts.spacing ?? 120 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        underline: opts.underline ? {} : undefined,
        size: opts.size ? opts.size * 2 : 22, // half-points (11pt = 22)
        color: opts.color,
      }),
    ],
  })
}

function pMixed(runs: Array<{ text: string; bold?: boolean; italics?: boolean; underline?: boolean; size?: number; color?: string }>, align: 'left' | 'center' | 'right' = 'left'): Paragraph {
  return new Paragraph({
    alignment: align === 'center' ? AlignmentType.CENTER : align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { after: 120 },
    children: runs.map(r => new TextRun({
      text: r.text,
      bold: r.bold,
      italics: r.italics,
      underline: r.underline ? {} : undefined,
      size: r.size ? r.size * 2 : 22,
      color: r.color,
    })),
  })
}

// Table cell with text
function tc(text: string, opts: { bold?: boolean; width?: number; shading?: string; align?: 'left' | 'center' | 'right' } = {}): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    children: [new Paragraph({
      alignment: opts.align === 'center' ? AlignmentType.CENTER : opts.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text, bold: opts.bold, size: 22 })],
    })],
  })
}

// Empty cell (for spacing)
function emptyCell(): TableCell {
  return new TableCell({ children: [new Paragraph({ children: [] })] })
}

// =========================================================
// TEMPLATE STYLES
// =========================================================

interface TemplateStyle {
  id: string
  name: string
  category: string
  description: string
  // Kop surat as paragraphs
  kop: (perusahaanPlaceholder: string) => Paragraph[]
  // Title color
  titleColor?: string
  // Header bg color for tables
  tableHeaderBg?: string
  // Signer role label
  signerRole?: string
  // Use "Upah" instead of "Gaji"
  useUpah?: boolean
}

const STYLES: TemplateStyle[] = [
  {
    id: 'formal',
    name: 'Standard Formal',
    category: 'Umum',
    description: 'Format formal standar - kop surat dengan border, tabel rapih',
    kop: (perusahaan) => [
      p('[LOGO PERUSAHAAN]', { align: 'center', size: 9, color: '999999', spacing: 60 }),
      p(perusahaan, { bold: true, align: 'center', size: 16, spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      p('Telp: (0717) xxxxx | Email: info@perusahaan.com', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'Pimpinan Perusahaan',
  },
  {
    id: 'modern',
    name: 'Modern Tech',
    category: 'Tech/Startup',
    description: 'Layout modern dengan accent biru, cocok untuk perusahaan teknologi',
    titleColor: '2563EB',
    tableHeaderBg: 'EFF6FF',
    kop: (perusahaan) => [
      p('[L]', { bold: true, align: 'center', size: 18, color: '2563EB', spacing: 60 }),
      p(perusahaan, { bold: true, align: 'center', size: 16, color: '2563EB', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '2563EB' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'CEO',
  },
  {
    id: 'pemerintah',
    name: 'Instansi Pemerintah',
    category: 'Pemerintahan',
    description: 'Format khas surat dinas pemerintahan',
    kop: (perusahaan) => [
      p('[GARUDA]', { align: 'center', size: 9, color: '999999', spacing: 60 }),
      p('PEMERINTAH KOTA PANGKALPINANG', { bold: true, align: 'center', size: 12, spacing: 60 }),
      p(perusahaan, { bold: true, align: 'center', size: 14, spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.DOUBLE, size: 12, color: '000000' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'Kepala {perusahaan}',
  },
  {
    id: 'bank',
    name: 'Bank / Keuangan',
    category: 'Perbankan',
    description: 'Format untuk karyawan bank dengan kop surat formal navy',
    titleColor: '1E3A8A',
    tableHeaderBg: 'DBEAFE',
    kop: (perusahaan) => [
      p('[L]', { bold: true, align: 'center', size: 18, color: '1E3A8A', spacing: 60 }),
      p(perusahaan, { bold: true, align: 'center', size: 15, color: '1E3A8A', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      p('Telp: (021) xxxxx | www.bank.co.id', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '1E3A8A' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'HRD Manager',
  },
  {
    id: 'rs',
    name: 'Rumah Sakit',
    category: 'Kesehatan',
    description: 'Format untuk karyawan RS dengan kop medis merah',
    titleColor: 'DC2626',
    tableHeaderBg: 'FEE2E2',
    kop: (perusahaan) => [
      p('+', { bold: true, align: 'center', size: 20, color: 'DC2626', spacing: 60 }),
      p(perusahaan, { bold: true, align: 'center', size: 15, color: 'DC2626', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      p('Telepon: (0717) xxxxx | IGD 24 Jam', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'DC2626' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'Direktur RS',
  },
  {
    id: 'mining',
    name: 'Pertambangan',
    category: 'Mining',
    description: 'Format karyawan tambang dengan header coklat',
    titleColor: '78350F',
    tableHeaderBg: 'FEF3C7',
    kop: (perusahaan) => [
      p(perusahaan, { bold: true, align: 'center', size: 14, color: '78350F', spacing: 60 }),
      p('PT Tambang Indonesia', { align: 'center', size: 10, color: '666666', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '78350F' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'HRD Manager',
  },
  {
    id: 'hotel',
    name: 'Perhotelan',
    category: 'Hospitality',
    description: 'Format karyawan hotel dengan style elegan italic',
    titleColor: '92400E',
    tableHeaderBg: 'FEF3C7',
    kop: (perusahaan) => [
      p(perusahaan, { bold: true, italics: true, align: 'center', size: 18, color: '92400E', spacing: 60 }),
      p('HOTEL & RESORT', { italics: true, align: 'center', size: 10, color: '666666', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '92400E' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'General Manager',
  },
  {
    id: 'retail',
    name: 'Retail / Supermarket',
    category: 'Retail',
    description: 'Format karyawan retail dengan accent oranye',
    titleColor: 'EA580C',
    tableHeaderBg: 'FED7AA',
    kop: (perusahaan) => [
      p(perusahaan, { bold: true, align: 'center', size: 15, color: 'EA580C', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      p('Telp: (0717) xxxxx', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'EA580C' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'HRD Manager',
  },
  {
    id: 'konstruksi',
    name: 'Konstruksi',
    category: 'Konstruksi',
    description: 'Format karyawan konstruksi dengan header dark',
    titleColor: 'FBBF24',
    tableHeaderBg: 'F3F4F6',
    kop: (perusahaan) => [
      p('[L]', { bold: true, align: 'center', size: 18, color: 'FBBF24', spacing: 60 }),
      p(perusahaan, { bold: true, align: 'center', size: 14, color: '1F2937', spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '1F2937' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'Project Director',
  },
  {
    id: 'informal',
    name: 'Warung / Toko / Kafe (Informal)',
    category: 'Informal',
    description: 'Format sederhana untuk warung, toko sembako, kafe kecil - pakai "Upah" bukan "Gaji"',
    kop: (perusahaan) => [
      p(perusahaan, { bold: true, align: 'center', size: 14, spacing: 60 }),
      p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } }, spacing: { after: 240 } }),
    ],
    signerRole: 'Pemilik Usaha',
    useUpah: true,
  },
]

// =========================================================
// BUILD SK KERJA SECTION
// =========================================================
function buildSkKerjaSection(style: TemplateStyle): (Paragraph | Table)[] {
  const upahLabel = style.useUpah ? 'Upah' : 'Gaji'
  const elements: (Paragraph | Table)[] = []

  // Kop surat
  elements.push(...style.kop('{perusahaan}'))

  // Title
  elements.push(p('SURAT KETERANGAN KERJA', {
    bold: true, align: 'center', size: 14, color: style.titleColor, underline: true, spacing: 60,
  }))
  elements.push(p('No: .../SK/{bulan}/{tahun}', { align: 'center', size: 11, spacing: 240 }))

  // Penanda tangan
  elements.push(p('Yang bertanda tangan di bawah ini:'))
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({ children: [tc('Nama', { width: 30 }), tc(':'), tc(style.signerRole || 'Pimpinan')] }),
      new TableRow({ children: [tc('Jabatan', { width: 30 }), tc(':'), tc('Pimpinan / Direktur')] }),
      new TableRow({ children: [tc('Perusahaan', { width: 30 }), tc(':'), tc('{perusahaan}')] }),
      new TableRow({ children: [tc('Alamat', { width: 30 }), tc(':'), tc('{alamat_perusahaan}')] }),
    ],
  }))

  elements.push(p('Dengan ini menerangkan bahwa:', { spacing: 240 }))

  // Data karyawan
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({ children: [tc('Nama', { width: 30 }), tc(':'), tc('{nama}', { bold: true })] }),
      new TableRow({ children: [tc('NIK', { width: 30 }), tc(':'), tc('{nik}')] }),
      new TableRow({ children: [tc('Tempat/Tgl Lahir', { width: 30 }), tc(':'), tc('{tempat_lahir}, {tanggal_lahir}')] }),
      new TableRow({ children: [tc('Jabatan', { width: 30 }), tc(':'), tc('{jabatan}')] }),
      new TableRow({ children: [tc('Lama Bekerja', { width: 30 }), tc(':'), tc('{lama_bekerja} tahun')] }),
      new TableRow({ children: [tc(`${upahLabel} per Bulan`, { width: 30 }), tc(':'), tc('{gaji}')] }),
    ],
  }))

  elements.push(p(
    `Benar bahwa yang bersangkutan adalah karyawan/pekerja tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR).`,
    { spacing: 240 }
  ))

  elements.push(p('Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.', { spacing: 360 }))

  // Signature block
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [p('')] }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              p('{kota}, {tanggal}'),
              p(style.signerRole || 'Pimpinan', { spacing: 120 }),
              p('', { spacing: 120 }),
              p('', { spacing: 120 }),
              p('', { spacing: 120 }),
              p('( ............................. )', { bold: true, underline: true }),
            ],
          }),
        ],
      }),
    ],
  }))

  return elements
}

// =========================================================
// BUILD SLIP GAJI SECTION (single sheet - loop will be 7x via {#slips})
// =========================================================
function buildSlipGajiSection(style: TemplateStyle): (Paragraph | Table)[] {
  const upahLabel = style.useUpah ? 'Upah' : 'Gaji'
  const elements: (Paragraph | Table)[] = []

  // Kop surat (same as SK)
  elements.push(...style.kop('{perusahaan}'))

  // Title
  elements.push(p(`SLIP ${upahLabel.toUpperCase()}`, {
    bold: true, align: 'center', size: 13, color: style.titleColor, underline: true, spacing: 60,
  }))
  elements.push(p('Periode: {periode}', { align: 'center', size: 11, spacing: 240 }))

  // Info row (Nama + NIK)
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          tc('Nama', { width: 12 }),
          tc(':'),
          tc('{nama}', { width: 30, bold: true }),
          tc('NIK', { width: 8 }),
          tc(':'),
          tc('{nik}', { width: 30 }),
        ],
      }),
      new TableRow({
        children: [
          tc('Jabatan', { width: 12 }),
          tc(':'),
          tc('{jabatan}', { width: 30 }),
          tc('Periode', { width: 8 }),
          tc(':'),
          tc('{periode}', { width: 30 }),
        ],
      }),
    ],
  }))

  elements.push(p('', { spacing: 60 }))

  // Finance table header
  const headerBg = style.tableHeaderBg || 'F0F0F0'
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tc('Keterangan', { bold: true, width: 55, shading: headerBg }),
          tc('Pendapatan', { bold: true, width: 22, shading: headerBg, align: 'right' }),
          tc('Potongan', { bold: true, width: 23, shading: headerBg, align: 'right' }),
        ],
      }),
      // Gaji Pokok
      new TableRow({
        children: [
          tc(`${upahLabel} Pokok`),
          tc('{gaji_pokok}', { align: 'right' }),
          tc(''),
        ],
      }),
      // Loop: tunjangan tetap — {#} in first cell, {/} in last cell of SAME row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '{#tunjangan_tetap}{label}', size: 22 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: '{amount}', size: 22 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '{/tunjangan_tetap}', size: 22 })],
            })],
          }),
        ],
      }),
      // Loop: tunjangan variabel
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '{#tunjangan_variabel}{label}', size: 22 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: '{amount}', size: 22 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '{/tunjangan_variabel}', size: 22 })],
            })],
          }),
        ],
      }),
      // Loop: potongan
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '{#potongan}{label}', size: 22 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '{/potongan}', size: 22 })],
            })],
          }),
          new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: '{amount}', size: 22 })],
            })],
          }),
        ],
      }),
      // Total row
      new TableRow({
        children: [
          tc('Total', { bold: true, shading: 'F9F9F9' }),
          tc('{gaji_kotor}', { bold: true, align: 'right', shading: 'F9F9F9' }),
          tc('{total_potongan}', { bold: true, align: 'right', shading: 'F9F9F9' }),
        ],
      }),
      // Grand total
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'E6F3FF' },
            children: [new Paragraph({
              children: [new TextRun({ text: `${upahLabel} Diterima (Bersih)`, bold: true, size: 24 })],
            })],
            columnSpan: 2,
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'E6F3FF' },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: '{gaji_bersih}', bold: true, size: 24 })],
            })],
          }),
        ],
      }),
    ],
  }))

  elements.push(p('', { spacing: 240 }))

  // Signature
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [p('Tanggal Terima: {tanggal_terima}')],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              p('{kota}, {tanggal_terima}', { align: 'right' }),
              p(style.useUpah ? 'Pemilik Usaha' : 'Bagian Keuangan', { align: 'right', spacing: 120 }),
              p('', { spacing: 120 }),
              p('', { spacing: 120 }),
              p('', { spacing: 120 }),
              p('( ............................. )', { bold: true, underline: true, align: 'right' }),
            ],
          }),
        ],
      }),
    ],
  }))

  return elements
}

// =========================================================
// BUILD COMBINED DOCUMENT (SK + 7 Slip via {#slips} loop)
// =========================================================
async function buildCombinedDoc(style: TemplateStyle): Promise<Buffer> {
  const skSection = buildSkKerjaSection(style)
  const slipSection = buildSlipGajiSection(style)

  // Combine: SK + page break + {#slips} + slip section + {/slips}
  const allChildren: any[] = [
    ...skSection,
    new Paragraph({ children: [new PageBreak()] }),
    // Loop markers for slip gaji (7 sheets)
    new Paragraph({ children: [new TextRun({ text: '{#slips}', size: 22 })] }),
    ...slipSection,
    new Paragraph({ children: [new TextRun({ text: '{/slips}', size: 22 })] }),
  ]

  const doc = new Document({
    creator: 'Hadi Kaya Virtual Office',
    title: `SK Kerja + Slip Gaji - ${style.name}`,
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
        },
      },
      children: allChildren,
    }],
  })

  return Packer.toBuffer(doc) as Promise<Buffer>
}

// =========================================================
// MAIN
// =========================================================
async function main() {
  const outputDir = path.join(process.cwd(), 'public', 'templates', 'combined')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  console.log(`Generating ${STYLES.length} combined templates (SK + 7 Slip)...`)
  for (const style of STYLES) {
    try {
      const buf = await buildCombinedDoc(style)
      const filename = `template-${style.id}.docx`
      fs.writeFileSync(path.join(outputDir, filename), buf)
      console.log(`  ✓ ${filename} (${buf.length} bytes) - ${style.name}`)
    } catch (err) {
      console.error(`  ✗ ${style.id}:`, err)
    }
  }

  // Verify: test fill one template with docxtemplater
  console.log('\nVerifying template fill...')
  const PizZip = (await import('pizzip')).default
  const Docxtemplater = (await import('docxtemplater')).default
  const testBuf = fs.readFileSync(path.join(outputDir, 'template-formal.docx'))
  const zip = new PizZip(testBuf)
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{', end: '}' },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })
  try {
    doc.render({
      nama: 'BUDI SANTOSO', nik: '1971040409720004', perusahaan: 'PT TEST',
      alamat_perusahaan: 'Jl. Test No. 123', gaji: 'Rp. 5.000.000,-',
      jabatan: 'Manager', tempat_lahir: 'Pangkalpinang', tanggal_lahir: '04 April 1972',
      tanggal: '30 Juni 2025', kota: 'Pangkalpinang', bulan: '6', tahun: '2025',
      lama_bekerja: '3', atasan: 'Andi', nip_atasan: 'NIP001',
      slips: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - 6 + i)
        return {
          periode: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          tanggal_terima: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
          gaji_pokok: 'Rp. 5.000.000,-', gaji_kotor: 'Rp. 7.000.000,-',
          total_potongan: 'Rp. 500.000,-', gaji_bersih: 'Rp. 6.500.000,-',
          tunjangan_tetap: [{ label: 'Tunjangan Makan', amount: 'Rp. 1.000.000,-' }],
          tunjangan_variabel: [{ label: 'Bonus', amount: 'Rp. 1.000.000,-' }],
          potongan: [{ label: 'BPJS', amount: 'Rp. 500.000,-' }],
          nama: 'BUDI SANTOSO', nik: '1971040409720004', jabatan: 'Manager',
        }
      }),
    })
    const filled = doc.getZip().generate({ type: 'nodebuffer' })
    const verifyPath = path.join(outputDir, '_test-filled.docx')
    fs.writeFileSync(verifyPath, filled)
    console.log(`  ✓ Template fill verified (${filled.length} bytes)`)
    fs.unlinkSync(verifyPath)
  } catch (err: any) {
    console.error('  ✗ Template fill error:', err?.properties?.errors || err?.message)
  }

  console.log(`\nDone! ${STYLES.length} templates saved to public/templates/combined/`)
}

main().catch(err => { console.error(err); process.exit(1) })
