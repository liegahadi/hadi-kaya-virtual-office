// COMBINED DOCUMENT TEMPLATES - SK Kerja + Slip Gaji in ONE file
// Shared kop surat (header) + page break + 7 slip gaji sheets
// Each template produces ONE complete .docx with both documents
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
  // Returns full HTML body (without <html>/<head>) containing SK + 7 slips
  // Shared kop surat appears once at top of SK, and once on each slip (since they're separate pages)
}

// Helper: build kop surat (shared between SK and each Slip page)
function buildKop(style: 'formal' | 'modern' | 'informal' | 'gov' | 'bank' | 'mining' | 'rs' | 'hotel' | 'retail' | 'konstruksi'): string {
  switch (style) {
    case 'formal':
      return `<table style="width:100%;border-bottom:3px solid #000;padding-bottom:10px;margin-bottom:20px;"><tbody><tr>
<td style="width:80px;text-align:center;vertical-align:middle;border-right:2px solid #000;padding-right:10px;">
<p style="font-size:9pt;color:#999;margin:0;">[LOGO]</p>
<p style="font-size:8pt;color:#999;margin:5px 0 0 0;">paste di sini</p>
</td>
<td style="padding-left:15px;text-align:center;vertical-align:middle;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;color:#333;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;margin:0;color:#666;">Telp: (0717) xxxxx | Email: info@perusahaan.com</p>
</td>
</tr></tbody></table>`
    case 'modern':
      return `<div style="display:flex;align-items:center;gap:15px;border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;">
<div style="width:60px;height:60px;background:#2563eb;color:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18pt;">[L]</div>
<div>
<p style="font-size:16pt;font-weight:bold;margin:0;color:#2563eb;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;color:#666;">{{alamat_perusahaan}}</p>
</div>
</div>`
    case 'gov':
      return `<table style="width:100%;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:20px;"><tbody><tr>
<td style="width:80px;text-align:center;vertical-align:middle;border-right:2px solid #000;padding-right:10px;">
<p style="font-size:9pt;color:#999;">[GARUDA]</p>
</td>
<td style="padding-left:15px;text-align:center;">
<p style="font-size:11pt;font-weight:bold;margin:0;">PEMERINTAH KOTA PANGKALPINANG</p>
<p style="font-size:14pt;font-weight:bold;margin:3px 0;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;color:#333;">{{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>`
    case 'bank':
      return `<table style="width:100%;border-bottom:3px solid #1e3a8a;padding-bottom:12px;margin-bottom:20px;"><tbody><tr>
<td style="width:60px;vertical-align:middle;">
<div style="background:#1e3a8a;color:#fff;width:55px;height:55px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18pt;">[L]</div>
</td>
<td style="padding-left:15px;">
<p style="font-size:15pt;font-weight:bold;margin:0;color:#1e3a8a;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;color:#666;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;margin:0;color:#666;">Telp: (021) xxxxx | www.bank.co.id</p>
</td>
</tr></tbody></table>`
    case 'mining':
      return `<div style="background:#78350f;color:#fff;padding:12px;margin-bottom:20px;border-radius:4px;">
<p style="font-size:14pt;font-weight:bold;margin:0;text-align:center;">{{perusahaan}}</p>
<p style="font-size:9pt;text-align:center;margin:3px 0 0;">PT Tambang Indonesia | {{alamat_perusahaan}}</p>
</div>`
    case 'rs':
      return `<table style="width:100%;border-bottom:3px solid #dc2626;padding-bottom:12px;margin-bottom:20px;"><tbody><tr>
<td style="width:60px;vertical-align:middle;text-align:center;">
<div style="background:#dc2626;color:#fff;width:55px;height:55px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20pt;font-weight:bold;">+</div>
</td>
<td style="padding-left:15px;">
<p style="font-size:15pt;font-weight:bold;margin:0;color:#dc2626;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;color:#666;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;margin:0;color:#666;">Telepon: (0717) xxxxx | IGD 24 Jam</p>
</td>
</tr></tbody></table>`
    case 'hotel':
      return `<div style="border-bottom:2px solid #92400e;padding-bottom:15px;margin-bottom:20px;text-align:center;">
<p style="font-size:18pt;font-weight:bold;margin:0;color:#92400e;font-style:italic;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:5px 0;color:#666;letter-spacing:1px;">HOTEL & RESORT</p>
<p style="font-size:9pt;margin:0;color:#666;">{{alamat_perusahaan}}</p>
</div>`
    case 'retail':
      return `<div style="background:linear-gradient(90deg,#ea580c 0%,#facc15 100%);color:#fff;padding:12px 15px;border-radius:4px 4px 0 0;margin-bottom:20px;">
<p style="font-size:15pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;">{{alamat_perusahaan}} | Telp: (0717) xxxxx</p>
</div>`
    case 'konstruksi':
      return `<table style="width:100%;background:#1f2937;color:#fff;padding:10px 15px;margin-bottom:20px;border-radius:4px;"><tbody><tr>
<td style="width:60px;">
<div style="background:#fbbf24;color:#1f2937;width:50px;height:50px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18pt;">[L]</div>
</td>
<td style="padding-left:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#fbbf24;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;">{{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>`
    case 'informal':
    default:
      return `<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
</div>`
  }
}

// SK Kerja body — LAYOUT PARAGRAF (NO TABLE) dengan dotted underline
// Setiap baris: label (lebar tetap) + : + value (dotted underline)
// Lebih rapih, lebih mudah dibaca, sesuai standar surat resmi Indonesia
function buildSkBody(style: string): string {
  const kop = buildKop(style as any)
  const signatoryRole = style === 'gov' ? 'Kepala {{perusahaan}}' : style === 'informal' ? 'Pemilik Usaha' : 'Pimpinan {{perusahaan}}'

  // Helper: baris identitas dengan dotted underline
  // label lebar 160px, separator ":", value dengan border-bottom dotted
  const idRow = (label: string, value: string, strong = false) =>
    `<p style="margin:6px 0;font-size:11pt;line-height:1.8;">` +
    `<span style="display:inline-block;width:160px;vertical-align:bottom;">${label}</span>` +
    `<span style="display:inline-block;width:12px;">:</span>` +
    `<span style="display:inline-block;border-bottom:1px dotted #000;min-width:340px;padding:0 6px 1px;${strong ? 'font-weight:bold;' : ''}">${value}</span>` +
    `</p>`

  return `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.6;color:#000;">

${kop}

<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:25px 0 5px;letter-spacing:0.5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 30px;">No: .../SK/{{bulan}}/{{tahun}}</p>

<p style="margin-bottom:18px;">Yang bertanda tangan di bawah ini:</p>

<div style="margin:0 0 25px 30px;">
${idRow('Nama', signatoryRole)}
${idRow('Jabatan', 'Pimpinan / Direktur')}
${idRow('Perusahaan', '{{perusahaan}}')}
${idRow('Alamat', '{{alamat_perusahaan}}')}
</div>

<p style="margin-bottom:18px;">Dengan ini menerangkan bahwa:</p>

<div style="margin:0 0 25px 30px;">
${idRow('Nama', '{{nama}}', true)}
${idRow('NIK', '{{nik}}')}
${idRow('Tempat/Tgl Lahir', '{{tempat_lahir}}, {{tanggal_lahir}}')}
${idRow('Jabatan', '{{jabatan}}')}
${idRow('Lama Bekerja', '{{lama_bekerja}} tahun')}
${idRow('Gaji per Bulan', '{{gaji}}')}
</div>

<p style="text-align:justify;margin:25px 0;text-indent:36px;line-height:1.7;">Benar bahwa yang bersangkutan adalah karyawan/pekerja tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR).</p>

<p style="margin-bottom:40px;text-indent:36px;">Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<div style="text-align:right;margin-top:40px;">
<p style="margin:0 0 6px 0;">{{kota}}, {{tanggal}}</p>
<p style="margin:0 0 80px 0;">${signatoryRole},</p>
<p style="margin:0;font-weight:bold;text-decoration:underline;display:inline-block;border-top:1px solid #000;padding-top:6px;min-width:200px;text-align:center;">( ............................. )</p>
</div>

</div>`
}

// Slip Gaji body (single sheet) — 1 BULAN = 1 HALAMAN
// Wrap dengan div yang paksa page-break + min-height supaya 1 slip muat 1 halaman
// Kop surat di-include di tiap slip page (auto-repeat per halaman)
// Table BOLEH untuk slip gaji (struktur kolom pendapatan/potongan)
function buildSlipBody(style: string): string {
  const kop = buildKop(style as any)
  const signerRole = style === 'gov' ? 'Bendahara Pengeluaran' : style === 'informal' ? 'Pemilik Usaha' : 'Bagian Keuangan'
  const upahLabel = style === 'informal' ? 'Upah' : 'Gaji'

  return `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;width:100%;min-height:90vh;padding:20px 0;page-break-after:always;break-after:page;">

${kop}

<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">SLIP ${upahLabel.toUpperCase()}</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">Periode: {{periode}}</p>

<p style="margin:8px 0;"><span style="display:inline-block;width:120px;">Nama</span>: <strong>{{nama}}</strong></p>
<p style="margin:8px 0;"><span style="display:inline-block;width:120px;">NIK</span>: {{nik}}</p>
<p style="margin:8px 0;"><span style="display:inline-block;width:120px;">Jabatan</span>: {{jabatan}}</p>
<p style="margin:8px 0 15px;"><span style="display:inline-block;width:120px;">Perusahaan</span>: {{perusahaan}}</p>

<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;">
<thead>
<tr style="background:#e8e8e8;">
<th style="padding:8px 10px;border:1px solid #000;text-align:left;width:55%;">Keterangan</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;width:22.5%;">Pendapatan</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;width:22.5%;">Potongan</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px 10px;border:1px solid #999;">${upahLabel} Pokok</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">{{gaji_pokok}}</td><td style="padding:6px 10px;border:1px solid #999;"></td></tr>
{{#tunjangan_tetap}}<tr><td style="padding:6px 10px;border:1px solid #999;">{label}</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">{amount}</td><td style="padding:6px 10px;border:1px solid #999;"></td></tr>{{/tunjangan_tetap}}
{{#tunjangan_variabel}}<tr><td style="padding:6px 10px;border:1px solid #999;">{label}</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">{amount}</td><td style="padding:6px 10px;border:1px solid #999;"></td></tr>{{/tunjangan_variabel}}
{{#potongan}}<tr><td style="padding:6px 10px;border:1px solid #999;">{label}</td><td style="padding:6px 10px;border:1px solid #999;"></td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">{amount}</td></tr>{{/potongan}}
<tr style="background:#f5f5f5;font-weight:bold;"><td style="padding:8px 10px;border:1.5px solid #000;">Total</td><td style="padding:8px 10px;border:1.5px solid #000;text-align:right;">{{gaji_kotor}}</td><td style="padding:8px 10px;border:1.5px solid #000;text-align:right;">{{total_potongan}}</td></tr>
<tr style="font-weight:bold;font-size:12pt;background:#e6f3ff;"><td style="padding:10px;border:1.5px solid #000;" colspan="2">${upahLabel} Diterima (Bersih)</td><td style="padding:10px;border:1.5px solid #000;text-align:right;">{{gaji_bersih}}</td></tr>
</tbody>
</table>

<div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-start;">
<div style="text-align:left;">
<p style="margin:0;">Tanggal Terima: {{tanggal_terima}}</p>
<p style="margin:8px 0 0;">Diterima oleh,</p>
<p style="margin:60px 0 0;font-weight:bold;text-decoration:underline;border-top:1px solid #000;padding-top:4px;display:inline-block;min-width:180px;text-align:center;">( {{nama}} )</p>
</div>
<div style="text-align:right;">
<p style="margin:0;">{{kota}}, {{tanggal_terima}}</p>
<p style="margin:8px 0 0;">${signerRole},</p>
<p style="margin:60px 0 0;font-weight:bold;text-decoration:underline;border-top:1px solid #000;padding-top:4px;display:inline-block;min-width:180px;text-align:center;">( ............................. )</p>
</div>
</div>

</div>`
}

// Page break helper
const PAGE_BREAK = '<p style="page-break-after:always;"></p><div style="page-break-after:always;"></div>'

// =========================================================
// COMBINED TEMPLATES (SK + 7 Slip)
// =========================================================
export const COMBINED_TEMPLATES: CombinedTemplate[] = [
  {
    id: 'combined-formal',
    name: 'Standard Formal',
    category: 'Umum',
    description: 'Format formal standar - kop surat dengan border, tabel rapih',
  },
  {
    id: 'combined-modern',
    name: 'Modern Tech',
    category: 'Tech/Startup',
    description: 'Layout modern dengan accent biru, cocok untuk perusahaan teknologi',
  },
  {
    id: 'combined-pemerintah',
    name: 'Instansi Pemerintah',
    category: 'Pemerintahan',
    description: 'Format khas surat dinas pemerintahan dengan kop garuda',
  },
  {
    id: 'combined-bank',
    name: 'Bank / Keuangan',
    category: 'Perbankan',
    description: 'Format untuk karyawan bank dengan kop surat formal navy',
  },
  {
    id: 'combined-rs',
    name: 'Rumah Sakit',
    category: 'Kesehatan',
    description: 'Format untuk karyawan RS dengan kop medis merah',
  },
  {
    id: 'combined-mining',
    name: 'Pertambangan',
    category: 'Mining',
    description: 'Format karyawan tambang dengan header coklat',
  },
  {
    id: 'combined-hotel',
    name: 'Perhotelan',
    category: 'Hospitality',
    description: 'Format karyawan hotel dengan style elegan italic',
  },
  {
    id: 'combined-retail',
    name: 'Retail / Supermarket',
    category: 'Retail',
    description: 'Format karyawan retail dengan gradient oranye-kuning',
  },
  {
    id: 'combined-konstruksi',
    name: 'Konstruksi',
    category: 'Konstruksi',
    description: 'Format karyawan konstruksi dengan header dark + gold',
  },
  {
    id: 'combined-informal',
    name: 'Warung / Toko / Kafe (Informal)',
    category: 'Informal',
    description: 'Format sederhana untuk warung, toko sembako, kafe kecil, CV abal-abal - pakai "Upah" bukan "Gaji"',
  },
]

// Build combined HTML for a template (SK + 7 slip pages, all editable in Tiptap)
export function buildCombinedHtml(templateId: string): string {
  const template = COMBINED_TEMPLATES.find(t => t.id === templateId) || COMBINED_TEMPLATES[0]
  // Determine style from template id
  const style = template.id.replace('combined-', '') as any

  // Build SK section (1 page)
  const skSection = buildSkBody(style)

  // Build 7 slip sections (will be repeated by engine with different per-slip data)
  // We use placeholder markers that the engine will replace with 7 copies
  // Each slip section is wrapped in {#slips}...{/slips} for loop
  // But since Tiptap editor doesn't know about loops, we generate 7 copies directly
  // For the EDITOR view, we generate 7 copies with placeholder data
  // For the FINAL output (download), same 7 copies but with real data
  //
  // Actually, the simpler approach: the engine fills placeholders BEFORE setting Tiptap content.
  // So we generate 7 copies of slip body, each with its own slip data already filled.
  // The {#tunjangan_tetap} loops inside are also expanded by engine.
  //
  // So this function returns TEMPLATE with {{#slips}}...{{/slips}} markers,
  // and engine.ts expands them.
  const slipSection = buildSlipBody(style)

  // Wrap slip section in slips loop marker
  // The engine will repeat this 7 times with different slip data
  const slipLoop = `<!-- SLIP_LOOP_START -->${slipSection}<!-- SLIP_LOOP_END -->`

  return `${skSection}
${PAGE_BREAK}
<!-- SLIP_PAGES_WILL_BE_INSERTED_HERE_BY_ENGINE -->`
}

// Generate the actual full HTML for the editor (with 7 slips already expanded)
// Called by engine.ts after filling all placeholders
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
