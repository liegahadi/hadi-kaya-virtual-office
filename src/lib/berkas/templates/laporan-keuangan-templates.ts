// LAPORAN KEUANGAN TEMPLATES — Wirausaha (UMKM)
// 20 template untuk wirausaha: UMKM makanan, toko, gerobak, MUA, jasa foto, kafe, dll
// Setiap template = 1 file dengan 6-7 halaman (1 halaman per bulan)
// Setiap halaman = Laporan Keuangan 1 bulan (Pendapatan + Pengeluaran + Laba Bersih)
// NO akumulatif — mengikuti pola real-world (jarang usaha UMKM pakai akumulatif)
//
// Layout: REAL TABLE (Tiptap Table extension sudah installed) untuk pendapatan/pengeluaran
// Identitas pakai display:table (CSS) supaya rapih
// Value: Range Min-Max (bukan nominal pasti) — bank biasanya minta range

export interface LaporanKeuanganTemplate {
  id: string
  name: string
  category: string  // jenis usaha
  description: string
}

// Helper: baris identitas — display:table (CSS) supaya kolom rapih align
function idRow(label: string, value: string, strong = false): string {
  const strongStyle = strong ? 'font-weight:bold;' : ''
  return `<div style="display:table;width:100%;margin:4px 0;font-size:11pt;line-height:1.7;">
<div style="display:table-cell;width:170px;vertical-align:bottom;padding-right:8px;">${label}</div>
<div style="display:table-cell;width:14px;vertical-align:bottom;">:</div>
<div style="display:table-cell;vertical-align:bottom;border-bottom:1px dotted #000;padding:0 6px 2px;${strongStyle}">${value}</div>
</div>`
}

// Helper: baris pendapatan/pengeluaran untuk Laporan Keuangan (REAL TABLE row)
function lapRow(label: string, rangeMin: string, rangeMax: string, bold = false, bg = ''): string {
  const bgStyle = bg ? `background:${bg};` : ''
  const boldStyle = bold ? 'font-weight:bold;' : ''
  const range = rangeMin && rangeMax
    ? `Rp. ${rangeMin} - Rp. ${rangeMax}`
    : rangeMin
      ? `Rp. ${rangeMin}`
      : rangeMax
        ? `Rp. ${rangeMax}`
        : '-'
  return `<tr style="${bgStyle}${boldStyle}">
<td style="padding:6px 10px;border:1px solid #999;font-size:11pt;">${label}</td>
<td style="padding:6px 10px;border:1px solid #999;font-size:11pt;text-align:right;">${range}</td>
</tr>`
}

// Helper: build kop surat untuk wirausaha
function buildKopLaporan(style: string): string {
  switch (style) {
    case 'umkm-makanan':
      return `<div style="border-bottom:2px solid #16a34a;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:9pt;color:#999;margin:0;">[LOGO USAHA]</p>
<p style="font-size:14pt;font-weight:bold;margin:5px 0 0 0;color:#16a34a;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{jenis_usaha} • {alamat_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (0717) xxxxx</p>
</div>`
    case 'toko-kelontong':
      return `<div style="border-bottom:2px solid #92400e;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#92400e;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Toko Sembako • Kelontong • Kebutuhan Harian</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'gerobak-keliling':
      return `<div style="border-bottom:2px dashed #ea580c;padding-bottom:8px;margin-bottom:15px;text-align:center;">
<p style="font-size:13pt;font-weight:bold;margin:0;color:#ea580c;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Gerobak Keliling • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">Area: {alamat_usaha}</p>
</div>`
    case 'jasa-mua':
      return `<div style="border-bottom:2px solid #db2777;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#db2777;font-style:italic;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:5px 0;letter-spacing:1px;">MAKEUP ARTIST • BEAUTY SERVICES</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'jasa-foto':
      return `<div style="border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#1e293b;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:5px 0;letter-spacing:1px;">PHOTOGRAPHY • VIDEOGRAPHY</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'kafe':
      return `<div style="border-bottom:2px solid #16a34a;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:15pt;font-weight:bold;margin:0;color:#16a34a;font-style:italic;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:5px 0;letter-spacing:1px;">CAFÉ • KEDAI • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'warung-makan':
      return `<div style="border-bottom:2px solid #dc2626;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#dc2626;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Warung Makan • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'online-shop':
      return `<div style="border-bottom:2px solid #8b5cf6;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#8b5cf6;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Online Shop • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha} | IG: @{nama_usaha_ig}</p>
</div>`
    case 'jasa-service':
      return `<div style="border-bottom:2px solid #0891b2;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#0891b2;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:5px 0;letter-spacing:1px;">JASA SERVICE • TERPECAYA</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'toko-bangunan':
      return `<div style="border-bottom:2px solid #ea580c;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#ea580c;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Toko Bangunan • Material • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-fashion':
      return `<div style="border-bottom:2px solid #1e3a8a;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#1e3a8a;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Fashion • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-kuliner':
      return `<div style="border-bottom:2px solid #facc15;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#92400e;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Kuliner • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-jasa-laundry':
      return `<div style="border-bottom:2px solid #0ea5e9;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#0ea5e9;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:5px 0;letter-spacing:1px;">LAUNDRY • CLEAN SERVICE</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-jasa-antar':
      return `<div style="border-bottom:2px solid #facc15;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#ca8a04;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Jasa Antar • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-pertanian':
      return `<div style="border-bottom:2px solid #16a34a;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#16a34a;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Pertanian • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-peternakan':
      return `<div style="border-bottom:2px solid #a16207;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#a16207;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Peternakan • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-handicraft':
      return `<div style="border-bottom:2px solid #9333ea;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#9333ea;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Handicraft • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-konsultan':
      return `<div style="border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#1e293b;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Konsultan • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-event-organizer':
      return `<div style="border-bottom:2px solid #db2777;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#db2777;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Event Organizer • {jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
    case 'umkm-generic':
    default:
      return `<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{nama_usaha}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{jenis_usaha}</p>
<p style="font-size:9pt;color:#666;margin:0;">{alamat_usaha}</p>
</div>`
  }
}

// Build 1 halaman Laporan Keuangan (1 bulan) — REAL TABLE untuk pendapatan/pengeluaran
function buildLaporanBulanan(style: string): string {
  const kop = buildKopLaporan(style)

  return `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;width:100%;min-height:90vh;padding:20px 0;page-break-after:always;break-after:page;">

${kop}

<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">LAPORAN KEUANGAN USAHA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">Periode: {periode}</p>

<div style="margin:0 0 15px 0;">
${idRow('Nama Usaha', '{nama_usaha}', true)}
${idRow('Jenis Usaha', '{jenis_usaha}')}
${idRow('Pemilik', '{nama}', true)}
${idRow('Alamat Usaha', '{alamat_usaha}')}
${idRow('NIB', '{nib}')}
</div>

<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;">
<thead>
<tr style="background:#16a34a;color:#fff;">
<th style="padding:8px 10px;border:1px solid #000;text-align:left;">PENDAPATAN</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;">Range (Rp)</th>
</tr>
</thead>
<tbody>
{{#pendapatan}}${lapRow('{label}', '{min}', '{max}', false)}{{/pendapatan}}
${lapRow('Total Pendapatan', '{total_pendapatan_min}', '{total_pendapatan_max}', true, '#f0fdf4')}
</tbody>
</table>

<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;">
<thead>
<tr style="background:#dc2626;color:#fff;">
<th style="padding:8px 10px;border:1px solid #000;text-align:left;">PENGELUARAN</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;">Range (Rp)</th>
</tr>
</thead>
<tbody>
{{#pengeluaran}}${lapRow('{label}', '{min}', '{max}', false)}{{/pengeluaran}}
${lapRow('Total Pengeluaran', '{total_pengeluaran_min}', '{total_pengeluaran_max}', true, '#fef2f2')}
</tbody>
</table>

<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;background:#e6f3ff;">
<thead>
<tr style="background:#1e3a8a;color:#fff;">
<th style="padding:10px;border:1px solid #000;text-align:center;font-size:12pt;">LABA BERSIH</th>
<th style="padding:10px;border:1px solid #000;text-align:right;font-size:12pt;">Rp. {laba_min} - Rp. {laba_max}</th>
</tr>
</thead>
</table>

<div style="margin-top:40px;text-align:right;">
<p style="margin:0 0 6px 0;">{kota}, {tanggal}</p>
<p style="margin:0 0 80px 0;">Pemilik Usaha,</p>
<p style="margin:0;font-weight:bold;text-decoration:underline;display:inline-block;border-top:1px solid #000;padding-top:6px;min-width:200px;text-align:center;">( {nama} )</p>
</div>

</div>`
}

// Get body laporan bulanan (1 halaman) — used by engine
export function getLaporanBulananBody(style: string): string {
  return buildLaporanBulanan(style)
}

// Get body laporan akumulatif — DEPRECATED (jarang dipakai, dipertahankan untuk backward compat)
export function getLaporanAkumulatifBody(style: string): string {
  // Return empty string — akumulatif tidak digunakan lagi
  // (jika diperlukan di masa depan, bisa diimplementasi ulang)
  return ''
}

// =========================================================
// LAPORAN KEUANGAN TEMPLATES — 20 templates untuk wirausaha
// =========================================================
export const LAPORAN_KEUANGAN_TEMPLATES: LaporanKeuanganTemplate[] = [
  { id: 'lap-umkm-makanan', name: 'UMKM Makanan', category: 'UMKM Kuliner', description: 'Warung makan, jajan pasar, katering rumahan - kop hijau' },
  { id: 'lap-toko-kelontong', name: 'Toko Kelontong', category: 'Toko', description: 'Toko sembako, kios kelontong, grosir kecil - kop coklat' },
  { id: 'lap-gerobak-keliling', name: 'Gerobak Keliling', category: 'Mobile', description: 'Jualan gerobak keliling, mobile vendor - kop oranye dashed' },
  { id: 'lap-jasa-mua', name: 'Jasa MUA', category: 'Jasa Beauty', description: 'Makeup artist, beauty services - kop pink italic' },
  { id: 'lap-jasa-foto', name: 'Jasa Foto / Potret', category: 'Jasa Creative', description: 'Studio foto, prewedding, photography - kop dark elegant' },
  { id: 'lap-kafe', name: 'Kafe / Coffee Shop', category: 'F&B', description: 'Kafe modern, coffee shop - kop hijau italic dengan tagline café' },
  { id: 'lap-warung-makan', name: 'Warung Makan', category: 'F&B', description: 'Warung makan/rumah makan kecil - kop merah dengan tagline kuliner' },
  { id: 'lap-online-shop', name: 'Online Shop', category: 'Online', description: 'Tokopedia/Shopee/Instagram shop - kop ungu modern' },
  { id: 'lap-jasa-service', name: 'Jasa Service AC/Elektronik', category: 'Jasa Service', description: 'Service AC, kulkas, elektronik - kop cyan' },
  { id: 'lap-toko-bangunan', name: 'Toko Bangunan', category: 'Toko', description: 'Toko bangunan/material/grosir - kop oranye strong' },
  { id: 'lap-umkm-fashion', name: 'UMKM Fashion', category: 'Fashion', description: 'Konveksi baju, butik, jualan pakaian - kop navy blue' },
  { id: 'lap-umkm-kuliner', name: 'UMKM Kuliner Lain', category: 'UMKM Kuliner', description: 'Berbagai jenis kuliner (bakso, sate, nasi goreng, dll) - kop kuning' },
  { id: 'lap-umkm-laundry', name: 'Laundry', category: 'Jasa', description: 'Jasa laundry kiloan - kop biru muda' },
  { id: 'lap-umkm-jasa-antar', name: 'Jasa Antar/Kurir', category: 'Jasa', description: 'Jasa antar barang, kurir, ojek online - kop kuning' },
  { id: 'lap-umkm-pertanian', name: 'Pertanian', category: 'Agribisnis', description: 'Petani, hasil bumi, sayur mayur - kop hijau' },
  { id: 'lap-umkm-peternakan', name: 'Peternakan', category: 'Agribisnis', description: 'Peternakan ayam, ikan, ternak lain - kop coklat tua' },
  { id: 'lap-umkm-handicraft', name: 'Handicraft/Kerajinan', category: 'Kerajinan', description: 'Kerajinan tangan, souvenir, craft - kop ungu' },
  { id: 'lap-umkm-konsultan', name: 'Konsultan/Jasa Profesional', category: 'Jasa Profesional', description: 'Konsultan, jasa profesional, freelancer - kop dark' },
  { id: 'lap-umkm-event-organizer', name: 'Event Organizer', category: 'Jasa', description: 'EO, wedding organizer, jasa event - kop pink' },
  { id: 'lap-umkm-generic', name: 'UMKM Umum', category: 'Umum', description: 'Format generic untuk semua jenis UMKM - kop hitam simple' },
]

export const LAPORAN_KEUANGAN_CATEGORIES = [...new Set(LAPORAN_KEUANGAN_TEMPLATES.map(t => t.category))]
