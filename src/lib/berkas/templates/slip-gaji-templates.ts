// SLIP GAJI TEMPLATES - 20 diverse Indonesian company styles
// Each template is HTML with placeholders. For 7-sheet generation, the entire
// template body is wrapped in {#slips}...{/slips} loop and repeated 7 times.
// Per-sheet placeholders: {{periode}}, {{tanggal_terima}}, {{gaji_pokok}},
// {{total_tunjangan_tetap}}, {{total_tunjangan_variabel}}, {{total_potongan}},
// {{gaji_kotor}}, {{gaji_bersih}}, {{nama}}, {{nik}}, {{jabatan}}, {{perusahaan}}
// Loop placeholders inside: {{#tunjangan_tetap}}{{label}}: {{amount}}\n{{/tunjangan_tetap}}

export interface SlipGajiTemplate {
  id: string
  name: string
  category: string
  description: string
  // The body is the per-slip content. Engine will replace {#tunjangan_tetap}...{/} inline
  body: string
  // CSS for the document
  css: string
}

const COMMON_CSS = `
  body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  table { border-collapse: collapse; width: 100%; }
  .kop { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
  .kop h1 { margin: 0; font-size: 14pt; }
  .kop p { margin: 3px 0; font-size: 9pt; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table th { background: #f0f0f0; padding: 6px; border: 1px solid #000; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #ccc; }
  .finance-table .total { border-top: 2px solid #000; font-weight: bold; background: #f9f9f9; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #e6f3ff; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`

const MODERN_CSS = `
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #222; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { display: flex; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 15px; margin-bottom: 25px; gap: 15px; }
  .kop .logo { width: 55px; height: 55px; background: #2563eb; color: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18pt; }
  .kop h1 { margin: 0; font-size: 16pt; color: #2563eb; }
  .kop p { margin: 2px 0; font-size: 9pt; color: #666; }
  .title { font-size: 16pt; font-weight: bold; text-align: center; margin: 20px 0; }
  .subtitle { text-align: center; color: #666; font-size: 11pt; margin-bottom: 25px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 30px; margin-bottom: 25px; font-size: 11pt; }
  .info-grid .label { color: #666; }
  .finance-table { border-collapse: collapse; width: 100%; margin: 15px 0; }
  .finance-table th { background: #f8fafc; padding: 10px; border-bottom: 2px solid #2563eb; text-align: left; color: #666; font-weight: 600; }
  .finance-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  .finance-table .total { border-top: 2px solid #2563eb; font-weight: bold; background: #f8fafc; }
  .finance-table .grand-total { font-weight: bold; font-size: 13pt; background: #eff6ff; }
  .signature { text-align: right; margin-top: 50px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; border-top: 1px solid #222; padding-top: 5px; display: inline-block; }
`

export const SLIP_GAJI_TEMPLATES: SlipGajiTemplate[] = [
  // 1. Standard Formal
  {
    id: 'slip-standard',
    name: 'Standard Formal',
    category: 'Umum',
    description: 'Slip gaji format tradisional dengan tabel income/potongan',
    css: COMMON_CSS,
    body: `<div class="kop">
  <h1>{{perusahaan}}</h1>
  <p>{{alamat_perusahaan}}</p>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Bagian Keuangan</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 2. Modern Tech Style
  {
    id: 'slip-modern',
    name: 'Modern Tech',
    category: 'Tech/Startup',
    description: 'Slip gaji dengan layout modern, dua kolom info, accent biru',
    css: MODERN_CSS,
    body: `<div class="kop">
  <div class="logo">{{perusahaan}}</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>{{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">Slip Gaji</div>
<div class="subtitle">Periode: {{periode}}</div>
<div class="info-grid">
  <div><span class="label">Nama:</span> <strong>{{nama}}</strong></div>
  <div><span class="label">NIK:</span> {{nik}}</div>
  <div><span class="label">Jabatan:</span> {{jabatan}}</div>
  <div><span class="label">Tanggal Terima:</span> {{tanggal_terima}}</div>
</div>
<table class="finance-table">
  <thead>
    <tr><th>Pendapatan</th><th style="text-align:right;">Jumlah</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td></tr>{{/tunjangan_variabel}}
    <tr class="total"><td>Total Pendapatan</td><td style="text-align:right;">{{gaji_kotor}}</td></tr>
  </tbody>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Potongan</th><th style="text-align:right;">Jumlah</th></tr>
  </thead>
  <tbody>
    {{#potongan}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total Potongan</td><td style="text-align:right;">{{total_potongan}}</td></tr>
  </tbody>
</table>
<table class="finance-table">
  <tbody>
    <tr class="grand-total"><td>Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>{{tanggal_terima}}</p>
  <p>Bagian Keuangan</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 3. Pemerintah / Instansi
  {
    id: 'slip-pemerintah',
    name: 'Instansi Pemerintah',
    category: 'Pemerintahan',
    description: 'Slip gaji pegawai pemerintahan dengan format SNP',
    css: COMMON_CSS,
    body: `<div class="kop">
  <h1>PEMERINTAH KOTA PANGKALPINANG</h1>
  <h1 style="font-size:12pt;">{{perusahaan}}</h1>
  <p>{{alamat_perusahaan}}</p>
</div>
<div class="title">SLIP GAJI PEGAWAI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td><td>NIP</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td><td>Golongan</td><td>:</td><td>-</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Bendahara Pengeluaran</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 4. Bank Style
  {
    id: 'slip-bank',
    name: 'Bank / Keuangan',
    category: 'Perbankan',
    description: 'Slip gaji karyawan bank dengan accent biru navy',
    css: `
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { background: #1e3a8a; color: #fff; width: 55px; height: 55px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
  .kop h1 { margin: 0; font-size: 15pt; color: #1e3a8a; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; color: #1e3a8a; text-decoration: underline; margin: 20px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 25px; color: #666; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 20px; }
  .info-table td { padding: 5px 8px 5px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #1e3a8a; color: #fff; padding: 8px; border: 1px solid #1e3a8a; text-align: left; }
  .finance-table td { padding: 6px 8px; border: 1px solid #ccc; }
  .finance-table .total { border-top: 2px solid #1e3a8a; font-weight: bold; background: #eff6ff; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #dbeafe; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[L]</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>{{alamat_perusahaan}}</p>
    <p>Telp: (021) xxxxx | www.bank.co.id</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK Karyawan</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
  <tr><td>Tanggal Terima</td><td>:</td><td>{{tanggal_terima}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>HRD Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 5. Mining
  {
    id: 'slip-mining',
    name: 'Pertambangan',
    category: 'Mining',
    description: 'Slip gaji karyawan tambang dengan accent coklat',
    css: `
  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { background: #78350f; color: #fff; padding: 12px; margin-bottom: 20px; text-align: center; }
  .kop h1 { margin: 0; font-size: 14pt; }
  .kop p { margin: 3px 0; font-size: 9pt; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #78350f; }
  .finance-table th { background: #fef3c7; padding: 6px; border: 1px solid #78350f; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #d6b275; }
  .finance-table .total { border-top: 2px solid #78350f; font-weight: bold; background: #fef3c7; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #fde68a; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <h1>{{perusahaan}}</h1>
  <p>PT Tambang Indonesia | {{alamat_perusahaan}}</p>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
  <tr><td>Tanggal Terima</td><td>:</td><td>{{tanggal_terima}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>HRD Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 6. Sekolah
  {
    id: 'slip-sekolah',
    name: 'Sekolah / Pendidikan',
    category: 'Pendidikan',
    description: 'Slip gaji guru dengan kop sekolah',
    css: COMMON_CSS,
    body: `<div class="kop">
  <h1>YAYASAN PENDIDIKAN HARAPAN BANGSA</h1>
  <h1 style="font-size:12pt;color:#15803d;">{{perusahaan}}</h1>
  <p>{{alamat_perusahaan}}</p>
</div>
<div class="title">SLIP GAJI GURU</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIP / NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Bendahara Sekolah</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 7. Rumah Sakit
  {
    id: 'slip-rs',
    name: 'Rumah Sakit',
    category: 'Kesehatan',
    description: 'Slip gaji karyawan RS dengan accent merah',
    css: `
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { background: #dc2626; color: #fff; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18pt; font-weight: bold; }
  .kop h1 { margin: 0; font-size: 15pt; color: #dc2626; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 20px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 25px; color: #666; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 20px; }
  .info-table td { padding: 5px 8px 5px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #fee2e2; color: #dc2626; padding: 8px; border: 1px solid #dc2626; text-align: left; }
  .finance-table td { padding: 6px 8px; border: 1px solid #f3a3a3; }
  .finance-table .total { border-top: 2px solid #dc2626; font-weight: bold; background: #fee2e2; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #fecaca; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">+</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>{{alamat_perusahaan}}</p>
    <p>Telepon: (0717) xxxxx | IGD 24 Jam</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
  <tr><td>Tanggal Terima</td><td>:</td><td>{{tanggal_terima}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Bagian Keuangan</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 8. Retail
  {
    id: 'slip-retail',
    name: 'Retail / Supermarket',
    category: 'Retail',
    description: 'Slip gaji karyawan retail dengan accent oranye',
    css: `
  body { font-family: 'Verdana', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { background: linear-gradient(90deg, #ea580c 0%, #facc15 100%); color: #fff; padding: 12px 15px; border-radius: 4px 4px 0 0; margin-bottom: 20px; }
  .kop h1 { margin: 0; font-size: 15pt; }
  .kop p { margin: 3px 0 0; font-size: 9pt; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #fed7aa; padding: 6px; border: 1px solid #ea580c; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #fdba74; }
  .finance-table .total { border-top: 2px solid #ea580c; font-weight: bold; background: #fff7ed; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #ffedd5; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <h1>{{perusahaan}}</h1>
  <p>{{alamat_perusahaan}} | Telp: (0717) xxxxx</p>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>HRD Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 9. Konstruksi
  {
    id: 'slip-konstruksi',
    name: 'Konstruksi',
    category: 'Konstruksi',
    description: 'Slip gaji karyawan konstruksi dengan accent dark',
    css: `
  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { background: #1f2937; color: #fff; padding: 10px 15px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { background: #fbbf24; color: #1f2937; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18pt; }
  .kop h1 { margin: 0; font-size: 14pt; color: #fbbf24; }
  .kop p { margin: 3px 0 0; font-size: 9pt; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #1f2937; }
  .finance-table th { background: #f3f4f6; padding: 6px; border: 1px solid #1f2937; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #d1d5db; }
  .finance-table .total { border-top: 2px solid #1f2937; font-weight: bold; background: #f3f4f6; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #e5e7eb; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[L]</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>{{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Project Director</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 10. Pabrik
  {
    id: 'slip-pabrik',
    name: 'Manufaktur / Pabrik',
    category: 'Manufaktur',
    description: 'Slip gaji karyawan pabrik dengan tampilan formal',
    css: `
  body { font-family: 'Tahoma', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 3px solid #4b5563; padding-bottom: 10px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; border: 1px solid #4b5563; }
  .kop h1 { margin: 0; font-size: 14pt; color: #4b5563; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #e5e7eb; padding: 6px; border: 1px solid #4b5563; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #9ca3af; }
  .finance-table .total { border-top: 2px solid #4b5563; font-weight: bold; background: #f3f4f6; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #e5e7eb; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[LOGO]</div>
  <div>
    <h1>PT {{perusahaan}}</h1>
    <p>{{alamat_perusahaan}}</p>
    <p>Telp: (0717) xxxxx | Fax: (0717) xxxxx</p>
  </div>
</div>
<div class="title">SLIP GAJI KARYAWAN</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama Karyawan</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Plant Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 11. Hotel
  {
    id: 'slip-hotel',
    name: 'Perhotelan',
    category: 'Hospitality',
    description: 'Slip gaji karyawan hotel dengan style elegan',
    css: `
  body { font-family: 'Georgia', serif; font-size: 11pt; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 2px solid #92400e; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
  .kop h1 { margin: 0; font-size: 18pt; color: #92400e; font-style: italic; }
  .kop p { margin: 5px 0; font-size: 9pt; color: #666; letter-spacing: 1px; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; color: #92400e; text-decoration: underline; font-style: italic; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; color: #666; margin: 5px 0 25px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 20px; }
  .info-table td { padding: 5px 8px 5px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #fef3c7; color: #92400e; padding: 8px; border: 1px solid #92400e; text-align: left; font-style: italic; }
  .finance-table td { padding: 6px 8px; border: 1px solid #d6b275; }
  .finance-table .total { border-top: 2px solid #92400e; font-weight: bold; background: #fef3c7; }
  .finance-table .grand-total { font-weight: bold; font-size: 13pt; background: #fde68a; font-style: italic; }
  .signature { text-align: right; margin-top: 50px; font-style: italic; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <h1>{{perusahaan}}</h1>
  <p>HOTEL & RESORT</p>
  <p>{{alamat_perusahaan}}</p>
</div>
<div class="title">Slip Gaji</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>General Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 12. Restoran
  {
    id: 'slip-restoran',
    name: 'Restoran / F&B',
    category: 'F&B',
    description: 'Slip gaji karyawan restoran dengan style hangat',
    css: `
  body { font-family: 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { background: #fef3c7; border-left: 5px solid #d97706; padding: 12px 15px; margin-bottom: 20px; }
  .kop h1 { margin: 0; font-size: 16pt; color: #d97706; }
  .kop p { margin: 3px 0 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #fed7aa; padding: 6px; border: 1px solid #d97706; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #fdba74; }
  .finance-table .total { border-top: 2px solid #d97706; font-weight: bold; background: #fff7ed; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #ffedd5; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <h1>🍽️ {{perusahaan}}</h1>
  <p>{{alamat_perusahaan}} | Telp: (0717) xxxxx</p>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Operations Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 13. BUMN
  {
    id: 'slip-bumn',
    name: 'BUMN / BUMD',
    category: 'BUMN',
    description: 'Slip gaji pegawai BUMN dengan format resmi',
    css: COMMON_CSS,
    body: `<div class="kop">
  <h1>PEMERINTAH PROVINSI KEPULAUAN BANGKA BELITUNG</h1>
  <h1 style="font-size:13pt;color:#1e40af;">PERUMDA {{perusahaan}}</h1>
  <p>{{alamat_perusahaan}}</p>
</div>
<div class="title">SLIP GAJI PEGAWAI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIP / NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Bendahara Pengeluaran</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 14. Perkebunan
  {
    id: 'slip-kebun',
    name: 'Perkebunan',
    category: 'Agritech',
    description: 'Slip gaji karyawan perkebunan dengan accent hijau',
    css: `
  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 3px solid #166534; padding-bottom: 10px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { width: 55px; height: 55px; border: 1px solid #166534; display: flex; align-items: center; justify-content: center; }
  .kop h1 { margin: 0; font-size: 14pt; color: #166534; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #dcfce7; padding: 6px; border: 1px solid #166534; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #86efac; }
  .finance-table .total { border-top: 2px solid #166534; font-weight: bold; background: #dcfce7; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #bbf7d0; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[LOGO]</div>
  <div>
    <h1>PT {{perusahaan}}</h1>
    <p>PERKEBUNAN KELAPA SAWIT | {{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Estate Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 15. Logistik
  {
    id: 'slip-transport',
    name: 'Transportasi / Logistik',
    category: 'Logistik',
    description: 'Slip gaji karyawan logistik dengan accent biru tua',
    css: `
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { background: #0c4a6e; color: #fff; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
  .kop h1 { margin: 0; font-size: 16pt; }
  .kop p { margin: 3px 0 0; font-size: 9pt; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #e0f2fe; padding: 6px; border: 1px solid #0c4a6e; text-align: left; color: #0c4a6e; }
  .finance-table td { padding: 4px 6px; border: 1px solid #7dd3fc; }
  .finance-table .total { border-top: 2px solid #0c4a6e; font-weight: bold; background: #e0f2fe; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #bae6fd; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <h1>🚚 {{perusahaan}}</h1>
  <p>LOGISTIK & EKSPEDISI | {{alamat_perusahaan}}</p>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Operations Director</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 16. Apotek
  {
    id: 'slip-apotek',
    name: 'Apotek / Klinik',
    category: 'Kesehatan',
    description: 'Slip gaji karyawan apotek dengan accent hijau medis',
    css: `
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { background: #059669; color: #fff; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18pt; }
  .kop h1 { margin: 0; font-size: 14pt; color: #059669; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #d1fae5; padding: 6px; border: 1px solid #059669; text-align: left; color: #059669; }
  .finance-table td { padding: 4px 6px; border: 1px solid #6ee7b7; }
  .finance-table .total { border-top: 2px solid #059669; font-weight: bold; background: #d1fae5; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #a7f3d0; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">✚</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>APOTEK & KLINIK | {{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Apoteker Penanggung Jawab</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 17. Telco
  {
    id: 'slip-telco',
    name: 'Telekomunikasi',
    category: 'Telco',
    description: 'Slip gaji karyawan telco dengan accent ungu',
    css: `
  body { font-family: 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 3px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { background: #7c3aed; color: #fff; width: 55px; height: 55px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
  .kop h1 { margin: 0; font-size: 15pt; color: #7c3aed; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #ede9fe; padding: 6px; border: 1px solid #7c3aed; text-align: left; color: #7c3aed; }
  .finance-table td { padding: 4px 6px; border: 1px solid #c4b5fd; }
  .finance-table .total { border-top: 2px solid #7c3aed; font-weight: bold; background: #ede9fe; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #ddd6fe; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[L]</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>TELEKOMUNIKASI | {{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>HRD Director</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 18. Migas
  {
    id: 'slip-migas',
    name: 'Minyak & Gas',
    category: 'Oil & Gas',
    description: 'Slip gaji karyawan migas dengan accent dark + gold',
    css: `
  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { background: #1e293b; color: #fff; padding: 12px 15px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { background: #f59e0b; color: #1e293b; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
  .kop h1 { margin: 0; font-size: 14pt; color: #f59e0b; }
  .kop p { margin: 3px 0 0; font-size: 9pt; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #1e293b; }
  .finance-table th { background: #f1f5f9; padding: 6px; border: 1px solid #1e293b; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #cbd5e1; }
  .finance-table .total { border-top: 2px solid #1e293b; font-weight: bold; background: #f1f5f9; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #fef3c7; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[L]</div>
  <div>
    <h1>{{perusahaan}}</h1>
    <p>OIL & GAS | {{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>VP Human Resources</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 19. Perikanan
  {
    id: 'slip-perikanan',
    name: 'Perikanan',
    category: 'Maritime',
    description: 'Slip gaji karyawan perikanan dengan accent cyan',
    css: `
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { border-bottom: 3px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
  .kop .logo { width: 55px; height: 55px; border: 1px solid #0891b2; display: flex; align-items: center; justify-content: center; }
  .kop h1 { margin: 0; font-size: 14pt; color: #0891b2; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #cffafe; padding: 6px; border: 1px solid #0891b2; text-align: left; color: #0891b2; }
  .finance-table td { padding: 4px 6px; border: 1px solid #67e8f9; }
  .finance-table .total { border-top: 2px solid #0891b2; font-weight: bold; background: #cffafe; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #a5f3fc; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <div class="logo">[LOGO]</div>
  <div>
    <h1>PT {{perusahaan}}</h1>
    <p>⚓ PERIKANAN & KELAUTAN | {{alamat_perusahaan}}</p>
  </div>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Gaji Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Operations Manager</p>
  <p class="name">( ............................. )</p>
</div>`
  },

  // 20. UKM
  {
    id: 'slip-ukm',
    name: 'Wirausaha / UKM',
    category: 'UMKM',
    description: 'Slip gaji sederhana untuk usaha kecil',
    css: `
  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .slip-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .slip-page:last-child { page-break-after: auto; }
  .kop { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
  .kop h1 { margin: 0; font-size: 14pt; }
  .kop p { margin: 3px 0; font-size: 9pt; color: #666; }
  .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 15px 0 5px; }
  .subtitle { text-align: center; font-size: 11pt; margin: 5px 0 20px; }
  .info-table { width: 100%; font-size: 11pt; margin-bottom: 15px; }
  .info-table td { padding: 4px 8px 4px 0; }
  .info-table td:first-child { width: 30%; }
  .info-table td:nth-child(2) { width: 3%; }
  .finance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .finance-table th { background: #f0f0f0; padding: 6px; border: 1px solid #000; text-align: left; }
  .finance-table td { padding: 4px 6px; border: 1px solid #ccc; }
  .finance-table .total { border-top: 2px solid #000; font-weight: bold; background: #f9f9f9; }
  .finance-table .grand-total { font-weight: bold; font-size: 12pt; background: #e6f3ff; }
  .signature { text-align: right; margin-top: 40px; }
  .signature p { margin: 3px 0; }
  .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
`,
    body: `<div class="kop">
  <h1>{{perusahaan}}</h1>
  <p>{{alamat_perusahaan}}</p>
  <p>Telp: (0717) xxxxx</p>
</div>
<div class="title">SLIP GAJI</div>
<div class="subtitle">Periode: {{periode}}</div>
<table class="info-table">
  <tr><td>Nama</td><td>:</td><td><strong>{{nama}}</strong></td></tr>
  <tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
</table>
<table class="finance-table">
  <thead>
    <tr><th>Keterangan</th><th style="text-align:right;">Pendapatan</th><th style="text-align:right;">Potongan</th></tr>
  </thead>
  <tbody>
    <tr><td>Gaji Pokok</td><td style="text-align:right;">{{gaji_pokok}}</td><td></td></tr>
    {{#tunjangan_tetap}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_tetap}}
    {{#tunjangan_variabel}}<tr><td>{label}</td><td style="text-align:right;">{amount}</td><td></td></tr>{{/tunjangan_variabel}}
    {{#potongan}}<tr><td>{label}</td><td></td><td style="text-align:right;">{amount}</td></tr>{{/potongan}}
    <tr class="total"><td>Total</td><td style="text-align:right;">{{gaji_kotor}}</td><td style="text-align:right;">{{total_potongan}}</td></tr>
    <tr class="grand-total"><td colspan="2">Penghasilan Diterima (Bersih)</td><td style="text-align:right;">{{gaji_bersih}}</td></tr>
  </tbody>
</table>
<div class="signature">
  <p>Pangkalpinang, {{tanggal_terima}}</p>
  <p>Pemilik Usaha</p>
  <p class="name">( ............................. )</p>
</div>`
  },
]

export const SLIP_GAJI_CATEGORIES = [...new Set(SLIP_GAJI_TEMPLATES.map(t => t.category))]
