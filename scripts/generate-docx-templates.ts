// Generate 20 generic .docx templates for SK Kerja + Slip Gaji (combined in 1 file)
// No categories - just Template 1-20 with brief descriptions of what's different
// Focus on informal/non-office jobs: bengkel, warung, kafe, toko sembako, dll
// Run: npx tsx scripts/generate-docx-templates.ts
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, PageBreak,
  Header, Footer, ShadingType,
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
        size: opts.size ? opts.size * 2 : 22,
        color: opts.color,
      }),
    ],
  })
}

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

function emptyCell(): TableCell {
  return new TableCell({ children: [new Paragraph({ children: [] })] })
}

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

// =========================================================
// TEMPLATE DEFINITIONS (20 generic templates)
// =========================================================

interface TemplateDef {
  id: string
  name: string
  description: string
  fontFamily: string
  titleColor?: string
  headerBg?: string
  signerRole: string
  useUpah: boolean
  kopStyle: 'formal' | 'modern' | 'simple' | 'boxed' | 'minimal' | 'gradient'
  kopColor?: string
}

const TEMPLATES: TemplateDef[] = [
  {
    id: '01',
    name: 'Template 1',
    description: 'Layout standar paling umum - kop surat border hitam, font Times New Roman. Cocok untuk semua jenis usaha.',
    fontFamily: 'Times New Roman',
    signerRole: 'Pemilik Usaha',
    useUpah: true,
    kopStyle: 'formal',
  },
  {
    id: '02',
    name: 'Template 2',
    description: 'Layout modern dengan accent biru, font Arial. Tampilan clean untuk usaha yang lebih kontemporer.',
    fontFamily: 'Arial',
    titleColor: '2563EB',
    headerBg: 'EFF6FF',
    signerRole: 'Pemilik',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: '2563EB',
  },
  {
    id: '03',
    name: 'Template 3',
    description: 'Sangat sederhana tanpa border - cocok untuk warung, warkop, usaha kecil. Font Calibri.',
    fontFamily: 'Calibri',
    signerRole: 'Pemilik Warung',
    useUpah: true,
    kopStyle: 'minimal',
  },
  {
    id: '04',
    name: 'Template 4',
    description: 'Layout dengan kotak kop surat (boxed) - font Tahoma. Untuk toko sembako / kelontong.',
    fontFamily: 'Tahoma',
    signerRole: 'Pemilik Toko',
    useUpah: true,
    kopStyle: 'boxed',
  },
  {
    id: '05',
    name: 'Template 5',
    description: 'Accent hijau segar, font Georgia. Cocok untuk kafe / restoran kecil dengan nuansa hangat.',
    fontFamily: 'Georgia',
    titleColor: '059669',
    headerBg: 'D1FAE5',
    signerRole: 'Pemilik Kafe',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: '059669',
  },
  {
    id: '06',
    name: 'Template 6',
    description: 'Accent oranye energik, font Verdana. Cocok untuk bengkel / jasa service.',
    fontFamily: 'Verdana',
    titleColor: 'EA580C',
    headerBg: 'FED7AA',
    signerRole: 'Pemilik Bengkel',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: 'EA580C',
  },
  {
    id: '07',
    name: 'Template 7',
    description: 'Layout formal dengan border ganda - font Cambria. Untuk CV / PT kecil yang butuh tampilan formal.',
    fontFamily: 'Cambria',
    signerRole: 'Pimpinan CV',
    useUpah: false,
    kopStyle: 'formal',
  },
  {
    id: '08',
    name: 'Template 8',
    description: 'Accent ungu, font Arial. Untuk salon / barbershop / jasa kecantikan.',
    fontFamily: 'Arial',
    titleColor: '7C3AED',
    headerBg: 'EDE9FE',
    signerRole: 'Pemilik Salon',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: '7C3AED',
  },
  {
    id: '09',
    name: 'Template 9',
    description: 'Layout simple dengan garis bawah saja - font Times New Roman. Untuk usaha perorangan / jasa mandiri.',
    fontFamily: 'Times New Roman',
    signerRole: 'Pengusaha Perorangan',
    useUpah: true,
    kopStyle: 'simple',
  },
  {
    id: '10',
    name: 'Template 10',
    description: 'Accent coklat tanah, font Georgia. Cocok untuk UD (Usaha Dagang) / toko bangunan.',
    fontFamily: 'Georgia',
    titleColor: '78350F',
    headerBg: 'FEF3C7',
    signerRole: 'Pemilik UD',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: '78350F',
  },
  {
    id: '11',
    name: 'Template 11',
    description: 'Gradient header oranye-kuning, font Calibri. Untuk warung makan / depot.',
    fontFamily: 'Calibri',
    titleColor: 'EA580C',
    headerBg: 'FED7AA',
    signerRole: 'Pemilik Warung',
    useUpah: true,
    kopStyle: 'gradient',
    kopColor: 'EA580C',
  },
  {
    id: '12',
    name: 'Template 12',
    description: 'Layout klasik dengan italic, font Georgia. Untuk hotel / penginapan kecil.',
    fontFamily: 'Georgia',
    titleColor: '92400E',
    headerBg: 'FEF3C7',
    signerRole: 'Pemilik Penginapan',
    useUpah: false,
    kopStyle: 'modern',
    kopColor: '92400E',
  },
  {
    id: '13',
    name: 'Template 13',
    description: 'Accent merah, font Arial. Untuk rumah makan / restoran dengan branding kuat.',
    fontFamily: 'Arial',
    titleColor: 'DC2626',
    headerBg: 'FEE2E2',
    signerRole: 'Pemilik Rumah Makan',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: 'DC2626',
  },
  {
    id: '14',
    name: 'Template 14',
    description: 'Layout super minimal tanpa warna - font Tahoma. Untuk jasa service (AC, kulkas, dll).',
    fontFamily: 'Tahoma',
    signerRole: 'Pemilik Jasa Service',
    useUpah: true,
    kopStyle: 'minimal',
  },
  {
    id: '15',
    name: 'Template 15',
    description: 'Accent teal/cyan, font Verdana. Untuk laundry / cuci sepatu.',
    fontFamily: 'Verdana',
    titleColor: '0891B2',
    headerBg: 'CFFAFE',
    signerRole: 'Pemilik Laundry',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: '0891B2',
  },
  {
    id: '16',
    name: 'Template 16',
    description: 'Layout dengan tabel rapi berborder - font Cambria. Untuk konveksi / penjahit rumahan.',
    fontFamily: 'Cambria',
    signerRole: 'Pemilik Konveksi',
    useUpah: true,
    kopStyle: 'boxed',
  },
  {
    id: '17',
    name: 'Template 17',
    description: 'Accent pink, font Arial. Untuk online shop / reseller rumahan.',
    fontFamily: 'Arial',
    titleColor: 'DB2777',
    headerBg: 'FCE7F3',
    signerRole: 'Pemilik Online Shop',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: 'DB2777',
  },
  {
    id: '18',
    name: 'Template 18',
    description: 'Layout formal standar dengan font Times New Roman. Untuk supir / delivery / ojol.',
    fontFamily: 'Times New Roman',
    signerRole: 'Pemilik Usaha',
    useUpah: true,
    kopStyle: 'formal',
  },
  {
    id: '19',
    name: 'Template 19',
    description: 'Accent navy biru tua, font Calibri. Untuk toko sembako grosir.',
    fontFamily: 'Calibri',
    titleColor: '1E3A8A',
    headerBg: 'DBEAFE',
    signerRole: 'Pemilik Toko',
    useUpah: true,
    kopStyle: 'modern',
    kopColor: '1E3A8A',
  },
  {
    id: '20',
    name: 'Template 20',
    description: 'Layout paling sederhana - hanya nama usaha dan alamat, tanpa warna. Font Arial. Universal untuk semua usaha informal.',
    fontFamily: 'Arial',
    signerRole: 'Pemilik Usaha',
    useUpah: true,
    kopStyle: 'minimal',
  },
]

// =========================================================
// BUILD KOP SURAT
// =========================================================

function buildKop(template: TemplateDef): Paragraph[] {
  const color = template.kopColor || '000000'

  switch (template.kopStyle) {
    case 'formal':
      return [
        p('[LOGO]', { align: 'center', size: 9, color: '999999', spacing: 60 }),
        p('{perusahaan}', { bold: true, align: 'center', size: 16, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }, spacing: { after: 240 } }),
      ]
    case 'modern':
      return [
        p('[L]', { bold: true, align: 'center', size: 18, color, spacing: 60 }),
        p('{perusahaan}', { bold: true, align: 'center', size: 16, color, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color } }, spacing: { after: 240 } }),
      ]
    case 'simple':
      return [
        p('{perusahaan}', { bold: true, align: 'center', size: 15, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } }, spacing: { after: 240 } }),
      ]
    case 'boxed':
      return [
        p('{perusahaan}', { bold: true, align: 'center', size: 15, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' }, top: { style: BorderStyle.SINGLE, size: 4, color: '000000' } }, spacing: { after: 240 } }),
      ]
    case 'minimal':
      return [
        p('{perusahaan}', { bold: true, align: 'center', size: 14, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ spacing: { after: 240 } }),
      ]
    case 'gradient':
      return [
        p('{perusahaan}', { bold: true, align: 'center', size: 15, color, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color } }, spacing: { after: 240 } }),
      ]
    default:
      return [
        p('{perusahaan}', { bold: true, align: 'center', size: 14, spacing: 60 }),
        p('{alamat_perusahaan}', { align: 'center', size: 9, color: '666666', spacing: 60 }),
        new Paragraph({ spacing: { after: 240 } }),
      ]
  }
}

// =========================================================
// BUILD SK KERJA SECTION
// =========================================================

function buildSkKerjaSection(template: TemplateDef): (Paragraph | Table)[] {
  const upahLabel = template.useUpah ? 'Upah' : 'Gaji'
  const elements: (Paragraph | Table)[] = []

  elements.push(...buildKop(template))

  elements.push(p('SURAT KETERANGAN KERJA', {
    bold: true, align: 'center', size: 14, color: template.titleColor, underline: true, spacing: 60,
  }))
  elements.push(p('No: .../SK/{bulan}/{tahun}', { align: 'center', size: 11, spacing: 240 }))

  elements.push(p('Yang bertanda tangan di bawah ini:'))
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({ children: [tc('Nama', { width: 30 }), tc(':'), tc(template.signerRole)] }),
      new TableRow({ children: [tc('Jabatan', { width: 30 }), tc(':'), tc('Pimpinan')] }),
      new TableRow({ children: [tc('Perusahaan', { width: 30 }), tc(':'), tc('{perusahaan}')] }),
      new TableRow({ children: [tc('Alamat', { width: 30 }), tc(':'), tc('{alamat_perusahaan}')] }),
    ],
  }))

  elements.push(p('Dengan ini menerangkan bahwa:', { spacing: 240 }))

  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
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
    `Benar bahwa yang bersangkutan bekerja di tempat kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR).`,
    { spacing: 240 }
  ))

  elements.push(p('Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.', { spacing: 360 }))

  // Signature
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [p('')] }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              p('{kota}, {tanggal}'),
              p(template.signerRole, { spacing: 120 }),
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
// BUILD SLIP GAJI SECTION (single sheet)
// =========================================================

function buildSlipGajiSection(template: TemplateDef): (Paragraph | Table)[] {
  const upahLabel = template.useUpah ? 'Upah' : 'Gaji'
  const elements: (Paragraph | Table)[] = []

  elements.push(...buildKop(template))

  elements.push(p(`SLIP ${upahLabel.toUpperCase()}`, {
    bold: true, align: 'center', size: 13, color: template.titleColor, underline: true, spacing: 60,
  }))
  elements.push(p('Periode: {periode}', { align: 'center', size: 11, spacing: 240 }))

  // Info row
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
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

  // Finance table
  const headerBg = template.headerBg || 'F0F0F0'
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
      new TableRow({
        children: [
          tc(`${upahLabel} Pokok`),
          tc('{gaji_pokok}', { align: 'right' }),
          tc(''),
        ],
      }),
      // Loop: tunjangan tetap
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '{#tunjangan_tetap}{label}', size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '{amount}', size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '{/tunjangan_tetap}', size: 22 })] })] }),
        ],
      }),
      // Loop: tunjangan variabel
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '{#tunjangan_variabel}{label}', size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '{amount}', size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '{/tunjangan_variabel}', size: 22 })] })] }),
        ],
      }),
      // Loop: potongan
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '{#potongan}{label}', size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '{/potongan}', size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '{amount}', size: 22 })] })] }),
        ],
      }),
      // Total
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
            children: [new Paragraph({ children: [new TextRun({ text: `${upahLabel} Diterima (Bersih)`, bold: true, size: 24 })] })],
            columnSpan: 2,
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'E6F3FF' },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '{gaji_bersih}', bold: true, size: 24 })] })],
          }),
        ],
      }),
    ],
  }))

  elements.push(p('', { spacing: 240 }))

  // Signature
  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [p('Tanggal Terima: {tanggal_terima}')] }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              p('{kota}, {tanggal_terima}', { align: 'right' }),
              p(template.signerRole, { align: 'right', spacing: 120 }),
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
// BUILD COMBINED DOCUMENT
// =========================================================

async function buildCombinedDoc(template: TemplateDef): Promise<Buffer> {
  const skSection = buildSkKerjaSection(template)
  const slipSection = buildSlipGajiSection(template)

  const allChildren: any[] = [
    ...skSection,
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ children: [new TextRun({ text: '{#slips}', size: 22 })] }),
    ...slipSection,
    new Paragraph({ children: [new TextRun({ text: '{/slips}', size: 22 })] }),
  ]

  const doc = new Document({
    creator: 'Hadi Kaya Virtual Office',
    title: `SK Kerja + Slip Gaji - ${template.name}`,
    styles: {
      default: {
        document: {
          run: { font: template.fontFamily, size: 22 },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
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

  // Clear old templates
  const oldFiles = fs.readdirSync(outputDir).filter(f => f.startsWith('template-') && f.endsWith('.docx'))
  for (const f of oldFiles) {
    fs.unlinkSync(path.join(outputDir, f))
  }
  console.log(`Cleared ${oldFiles.length} old templates`)

  console.log(`Generating ${TEMPLATES.length} generic templates...`)
  for (const template of TEMPLATES) {
    try {
      const buf = await buildCombinedDoc(template)
      const filename = `template-${template.id}.docx`
      fs.writeFileSync(path.join(outputDir, filename), buf)
      console.log(`  ✓ ${filename} (${buf.length} bytes) - ${template.name}`)
    } catch (err) {
      console.error(`  ✗ ${template.id}:`, err)
    }
  }

  // Verify: test fill one template
  console.log('\nVerifying template fill...')
  const PizZip = (await import('pizzip')).default
  const Docxtemplater = (await import('docxtemplater')).default
  const testBuf = fs.readFileSync(path.join(outputDir, 'template-01.docx'))
  const zip = new PizZip(testBuf)
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{', end: '}' },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })
  try {
    doc.render({
      nama: 'BUDI SANTOSO', nik: '1971040409720004', perusahaan: 'WARUNG TEST',
      alamat_perusahaan: 'Jl. Test', gaji: 'Rp. 3.000.000,-',
      jabatan: 'Kasir', tempat_lahir: 'Pangkalpinang', tanggal_lahir: '04 April 1990',
      tanggal: '30 Juni 2025', kota: 'Pangkalpinang', bulan: '6', tahun: '2025',
      lama_bekerja: '2', atasan: 'Andi', nip_atasan: '',
      slips: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - 6 + i)
        return {
          periode: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          tanggal_terima: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
          gaji_pokok: 'Rp. 3.000.000,-', gaji_kotor: 'Rp. 3.500.000,-',
          total_potongan: 'Rp. 200.000,-', gaji_bersih: 'Rp. 3.300.000,-',
          tunjangan_tetap: [{ label: 'Tunjangan Makan', amount: 'Rp. 500.000,-' }],
          tunjangan_variabel: [], potongan: [{ label: 'BPJS', amount: 'Rp. 200.000,-' }],
          nama: 'BUDI SANTOSO', nik: '1971040409720004', jabatan: 'Kasir',
        }
      }),
    })
    const filled = doc.getZip().generate({ type: 'nodebuffer' })
    console.log(`  ✓ Template fill verified (${filled.length} bytes)`)
  } catch (err: any) {
    console.error('  ✗ Template fill error:', err?.properties?.errors || err?.message)
  }

  console.log(`\nDone! ${TEMPLATES.length} templates saved to public/templates/combined/`)
}

main().catch(err => { console.error(err); process.exit(1) })
