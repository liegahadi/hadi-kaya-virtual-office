// COMBINED DOCUMENT TEMPLATES - SK Kerja + Slip Gaji in ONE file
// SHARED KOP SURAT (header) + page break + 7 slip gaji sheets
// All layout uses DIV-based (NO TABLE) supaya Tiptap editor bisa render
// (Tiptap strips <table> karena tidak ada Table extension)
//
// Placeholders (filled by engine.ts):
//   SK: {nama}, {nik}, {tempat_lahir}, {tanggal_lahir}, {jabatan}, {perusahaan},
//       {alamat_perusahaan}, {gaji}, {lama_bekerja}, {tanggal}, {kota}, {atasan}
//   Slip: {periode}, {tanggal_terima}, {gaji_pokok}, {gaji_kotor}, {gaji_bersih},
//         {total_potongan}, plus inline loops {{#tunjangan_tetap}}{label} {amount}{{/}}

export interface CombinedTemplate {
  id: string
  name: string
  category: string
  description: string
}

// Helper: build kop surat (shared between SK and each Slip page)
// DIV-based (no table) — pakai flexbox via inline-block supaya Tiptap support
function buildKop(style: 'formal' | 'modern' | 'informal' | 'gov' | 'bank' | 'mining' | 'rs' | 'hotel' | 'retail' | 'konstruksi'): string {
  switch (style) {
    case 'formal':
      return `<div style="border-bottom:3px solid #000;padding-bottom:10px;margin-bottom:20px;text-align:center;">
<p style="font-size:9pt;color:#999;margin:0;">[LOGO] — paste di sini</p>
<p style="font-size:14pt;font-weight:bold;margin:5px 0 0 0;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0;color:#333;">{alamat_perusahaan}</p>
<p style="font-size:9pt;margin:0;color:#666;">Telp: (0717) xxxxx | Email: info@perusahaan.com</p>
</div>`
    case 'modern':
      return `<div style="border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;">
<p style="font-size:9pt;color:#999;margin:0;">[LOGO]</p>
<p style="font-size:16pt;font-weight:bold;margin:5px 0 0 0;color:#2563eb;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0 0 0;color:#666;">{alamat_perusahaan}</p>
</div>`
    case 'gov':
      return `<div style="border-bottom:3px double #000;padding-bottom:10px;margin-bottom:20px;text-align:center;">
<p style="font-size:9pt;color:#999;margin:0;">[GARUDA]</p>
<p style="font-size:11pt;font-weight:bold;margin:5px 0 0 0;">PEMERINTAH KOTA PANGKALPINANG</p>
<p style="font-size:14pt;font-weight:bold;margin:3px 0;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0;color:#333;">{alamat_perusahaan}</p>
</div>`
    case 'bank':
      return `<div style="border-bottom:3px solid #1e3a8a;padding-bottom:12px;margin-bottom:20px;">
<p style="font-size:9pt;color:#999;margin:0;">[LOGO]</p>
<p style="font-size:15pt;font-weight:bold;margin:5px 0 0 0;color:#1e3a8a;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0;color:#666;">{alamat_perusahaan}</p>
<p style="font-size:9pt;margin:0;color:#666;">Telp: (021) xxxxx | www.bank.co.id</p>
</div>`
    case 'mining':
      return `<div style="background:#78350f;color:#fff;padding:12px;margin-bottom:20px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0 0 0;">PT Tambang Indonesia | {alamat_perusahaan}</p>
</div>`
    case 'rs':
      return `<div style="border-bottom:3px solid #dc2626;padding-bottom:12px;margin-bottom:20px;">
<p style="font-size:9pt;color:#999;margin:0;">[LOGO +]</p>
<p style="font-size:15pt;font-weight:bold;margin:5px 0 0 0;color:#dc2626;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0;color:#666;">{alamat_perusahaan}</p>
<p style="font-size:9pt;margin:0;color:#666;">Telepon: (0717) xxxxx | IGD 24 Jam</p>
</div>`
    case 'hotel':
      return `<div style="border-bottom:2px solid #92400e;padding-bottom:15px;margin-bottom:20px;text-align:center;">
<p style="font-size:18pt;font-weight:bold;margin:0;color:#92400e;font-style:italic;">{perusahaan}</p>
<p style="font-size:9pt;margin:5px 0;color:#666;letter-spacing:1px;">HOTEL & RESORT</p>
<p style="font-size:9pt;margin:0;color:#666;">{alamat_perusahaan}</p>
</div>`
    case 'retail':
      return `<div style="background:#ea580c;color:#fff;padding:12px 15px;margin-bottom:20px;">
<p style="font-size:15pt;font-weight:bold;margin:0;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0 0 0;">{alamat_perusahaan} | Telp: (0717) xxxxx</p>
</div>`
    case 'konstruksi':
      return `<div style="background:#1f2937;color:#fff;padding:10px 15px;margin-bottom:20px;">
<p style="font-size:9pt;color:#fbbf24;margin:0;">[LOGO]</p>
<p style="font-size:14pt;font-weight:bold;margin:5px 0 0 0;color:#fbbf24;">{perusahaan}</p>
<p style="font-size:9pt;margin:3px 0 0 0;">{alamat_perusahaan}</p>
</div>`
    case 'informal':
    default:
      return `<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{perusahaan}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{alamat_perusahaan}</p>
</div>`
  }
}

// Helper: baris identitas — DIV-based (no table)
// Label lebar tetap 160px (inline-block) + separator ":" + value dengan dotted underline
// Tiptap support inline-block dengan width
function idRow(label: string, value: string, strong = false): string {
  return `<p style="margin:6px 0;font-size:11pt;line-height:1.8;">` +
    `<span style="display:inline-block;width:160px;vertical-align:bottom;">${label}</span>` +
    `<span style="display:inline-block;width:12px;">:</span>` +
    `<span style="display:inline-block;border-bottom:1px dotted #000;min-width:340px;padding:0 6px 1px;${strong ? 'font-weight:bold;' : ''}">${value}</span>` +
    `</p>`
}

// Helper: baris pendapatan/potongan untuk Slip Gaji — DIV-based (no table)
// Layout: label (kiri, lebar 55%) | pendapatan (kanan, 22.5%) | potongan (kanan, 22.5%)
// Pakai 3 span inline-block dengan width tetap
function slipRow(label: string, pendapatan: string, potongan: string, bold = false, bg = ''): string {
  const bgStyle = bg ? `background:${bg};` : ''
  const boldStyle = bold ? 'font-weight:bold;' : ''
  return `<p style="margin:0;padding:6px 10px;border-bottom:1px solid #ccc;font-size:11pt;${bgStyle}${boldStyle}">` +
    `<span style="display:inline-block;width:55%;vertical-align:middle;">${label}</span>` +
    `<span style="display:inline-block;width:22.5%;vertical-align:middle;text-align:right;">${pendapatan}</span>` +
    `<span style="display:inline-block;width:22.5%;vertical-align:middle;text-align:right;">${potongan}</span>` +
    `</p>`
}

// SK Kerja body — LAYOUT PARAGRAF (NO TABLE) dengan dotted underline
function buildSkBody(style: string): string {
  const kop = buildKop(style as any)
  const signatoryRole = style === 'gov' ? 'Kepala {perusahaan}' : style === 'informal' ? 'Pemilik Usaha' : 'Pimpinan {perusahaan}'

  return `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.6;color:#000;">

${kop}

<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:25px 0 5px;letter-spacing:0.5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 30px;">No: .../SK/{bulan}/{tahun}</p>

<p style="margin-bottom:18px;">Yang bertanda tangan di bawah ini:</p>

<div style="margin:0 0 25px 30px;">
${idRow('Nama', signatoryRole)}
${idRow('Jabatan', 'Pimpinan / Direktur')}
${idRow('Perusahaan', '{perusahaan}')}
${idRow('Alamat', '{alamat_perusahaan}')}
</div>

<p style="margin-bottom:18px;">Dengan ini menerangkan bahwa:</p>

<div style="margin:0 0 25px 30px;">
${idRow('Nama', '{nama}', true)}
${idRow('NIK', '{nik}')}
${idRow('Tempat/Tgl Lahir', '{tempat_lahir}, {tanggal_lahir}')}
${idRow('Jabatan', '{jabatan}')}
${idRow('Lama Bekerja', '{lama_bekerja} tahun')}
${idRow('Gaji per Bulan', '{gaji}')}
</div>

<p style="text-align:justify;margin:25px 0;text-indent:36px;line-height:1.7;">Benar bahwa yang bersangkutan adalah karyawan/pekerja tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR).</p>

<p style="margin-bottom:40px;text-indent:36px;">Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<div style="text-align:right;margin-top:40px;">
<p style="margin:0 0 6px 0;">{kota}, {tanggal}</p>
<p style="margin:0 0 80px 0;">${signatoryRole},</p>
<p style="margin:0;font-weight:bold;text-decoration:underline;display:inline-block;border-top:1px solid #000;padding-top:6px;min-width:200px;text-align:center;">( ............................. )</p>
</div>

</div>`
}

// Slip Gaji body (single sheet) — 1 BULAN = 1 HALAMAN
// DIV-based (NO TABLE) supaya Tiptap support
// Wrap dengan div yang paksa page-break + min-height
function buildSlipBody(style: string): string {
  const kop = buildKop(style as any)
  const signerRole = style === 'gov' ? 'Bendahara Pengeluaran' : style === 'informal' ? 'Pemilik Usaha' : 'Bagian Keuangan'
  const upahLabel = style === 'informal' ? 'Upah' : 'Gaji'

  return `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;width:100%;min-height:90vh;padding:20px 0;page-break-after:always;break-after:page;">

${kop}

<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">SLIP ${upahLabel.toUpperCase()}</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">Periode: {periode}</p>

<div style="margin:0 0 15px 0;">
${idRow('Nama', '{nama}', true)}
${idRow('NIK', '{nik}')}
${idRow('Jabatan', '{jabatan}')}
${idRow('Perusahaan', '{perusahaan}')}
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#e8e8e8;font-weight:bold;font-size:11pt;">
<span style="display:inline-block;width:55%;">Keterangan</span>
<span style="display:inline-block;width:22.5%;text-align:right;">Pendapatan</span>
<span style="display:inline-block;width:22.5%;text-align:right;">Potongan</span>
</p>
<div>
${slipRow(`${upahLabel} Pokok`, '{gaji_pokok}', '', false)}
{{#tunjangan_tetap}}${slipRow('{label}', '{amount}', '', false)}{{/tunjangan_tetap}}
{{#tunjangan_variabel}}${slipRow('{label}', '{amount}', '', false)}{{/tunjangan_variabel}}
{{#potongan}}${slipRow('{label}', '', '{amount}', false)}{{/potongan}}
${slipRow('Total', '{gaji_kotor}', '{total_potongan}', true, '#f5f5f5')}
${slipRow(`${upahLabel} Diterima (Bersih)`, '', '{gaji_bersih}', true, '#e6f3ff')}
</div>
</div>

<div style="margin-top:40px;">
<p style="margin:0 0 5px 0;">Tanggal Terima: {tanggal_terima}</p>
<p style="margin:0 0 5px 0;">Diterima oleh,</p>
<p style="margin:50px 0 0 0;font-weight:bold;text-decoration:underline;border-top:1px solid #000;padding-top:4px;display:inline-block;min-width:180px;text-align:center;">( {nama} )</p>
</div>

<div style="text-align:right;margin-top:-110px;">
<p style="margin:0 0 5px 0;">{kota}, {tanggal_terima}</p>
<p style="margin:0 0 5px 0;">${signerRole},</p>
<p style="margin:50px 0 0 0;font-weight:bold;text-decoration:underline;border-top:1px solid #000;padding-top:4px;display:inline-block;min-width:180px;text-align:center;">( ............................. )</p>
</div>

</div>`
}

// =========================================================
// COMBINED TEMPLATES (SK + 7 Slip)
// =========================================================
export const COMBINED_TEMPLATES: CombinedTemplate[] = [
  { id: 'combined-formal', name: 'Standard Formal', category: 'Umum', description: 'Format formal standar - kop surat dengan border, layout rapih' },
  { id: 'combined-modern', name: 'Modern Tech', category: 'Tech/Startup', description: 'Layout modern dengan accent biru, cocok untuk perusahaan teknologi' },
  { id: 'combined-pemerintah', name: 'Instansi Pemerintah', category: 'Pemerintahan', description: 'Format khas surat dinas pemerintahan dengan kop garuda' },
  { id: 'combined-bank', name: 'Bank / Keuangan', category: 'Perbankan', description: 'Format untuk karyawan bank dengan kop surat formal navy' },
  { id: 'combined-rs', name: 'Rumah Sakit', category: 'Kesehatan', description: 'Format untuk karyawan RS dengan kop medis merah' },
  { id: 'combined-mining', name: 'Pertambangan', category: 'Mining', description: 'Format karyawan tambang dengan header coklat' },
  { id: 'combined-hotel', name: 'Perhotelan', category: 'Hospitality', description: 'Format karyawan hotel dengan style elegan italic' },
  { id: 'combined-retail', name: 'Retail / Supermarket', category: 'Retail', description: 'Format karyawan retail dengan gradient oranye-kuning' },
  { id: 'combined-konstruksi', name: 'Konstruksi', category: 'Konstruksi', description: 'Format karyawan konstruksi dengan header dark + gold' },
  { id: 'combined-informal', name: 'Warung / Toko / Kafe (Informal)', category: 'Informal', description: 'Format sederhana untuk warung, toko sembako, kafe kecil - pakai "Upah" bukan "Gaji"' },
]

// Build combined HTML for a template (SK + 7 slip pages, all editable in Tiptap)
export function buildCombinedHtml(templateId: string): string {
  const template = COMBINED_TEMPLATES.find(t => t.id === templateId) || COMBINED_TEMPLATES[0]
  const style = template.id.replace('combined-', '') as any
  const skSection = buildSkBody(style)
  const slipSection = buildSlipBody(style)
  const slipLoop = `<!-- SLIP_LOOP_START -->${slipSection}<!-- SLIP_LOOP_END -->`
  return `${skSection}
<!-- SLIP_PAGES_WILL_BE_INSERTED_HERE_BY_ENGINE -->`
}

// Generate the actual full HTML for the editor (with 7 slips already expanded)
export function buildCombinedEditorHtml(templateId: string): string {
  const template = COMBINED_TEMPLATES.find(t => t.id === templateId) || COMBINED_TEMPLATES[0]
  const style = template.id.replace('combined-', '') as any
  return buildSkBody(style)
}

// Get just the slip body for a given style (used by engine to build 7 sheets)
export function getSlipBody(style: string): string {
  return buildSlipBody(style)
}

// Get just the SK body for a given style
export function getSkBody(style: string): string {
  return buildSkBody(style)
}

export const COMBINED_CATEGORIES = [...new Set(COMBINED_TEMPLATES.map(t => t.category))]
