// LAPORAN KEUANGAN TEMPLATES — Wirausaha (UMKM)
// 20 template untuk wirausaha: UMKM makanan, toko, gerobak, MUA, jasa foto, kafe, dll
// Setiap template = 1 file dengan 7 halaman (6 bulan terakhir + bulan ini)
// Setiap halaman = Laporan Keuangan 1 bulan (Pendapatan + Pengeluaran + Laba Bersih)
// PLUS 1 halaman akumulatif 6 bulan di akhir
//
// Layout: DIV-based (NO TABLE) supaya Tiptap support
// Value: Range Min-Max (bukan nominal pasti) — bank biasanya minta range

export interface LaporanKeuanganTemplate {
  id: string
  name: string
  category: string  // jenis usaha
  description: string
}

// Helper: baris pendapatan/pengeluaran untuk Laporan Keuangan
// Layout: label (kiri, 50%) | range min-max (kanan, 50%)
// Range format: "Rp. 1.000.000 - Rp. 2.000.000"
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
  return `<p style="margin:0;padding:6px 10px;border-bottom:1px solid #ccc;font-size:11pt;${bgStyle}${boldStyle}">` +
    `<span style="display:inline-block;width:55%;vertical-align:middle;">${label}</span>` +
    `<span style="display:inline-block;width:45%;vertical-align:middle;text-align:right;">${range}</span>` +
    `</p>`
}

// Helper: baris identitas
function idRow(label: string, value: string, strong = false): string {
  return `<p style="margin:6px 0;font-size:11pt;line-height:1.8;">` +
    `<span style="display:inline-block;width:160px;vertical-align:bottom;">${label}</span>` +
    `<span style="display:inline-block;width:12px;">:</span>` +
    `<span style="display:inline-block;border-bottom:1px dotted #000;min-width:340px;padding:0 6px 1px;${strong ? 'font-weight:bold;' : ''}">${value}</span>` +
    `</p>`
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

// Build 1 halaman Laporan Keuangan (1 bulan)
// Layout: kop + identitas + pendapatan + pengeluaran + laba bersih
function buildLaporanBulanan(style: string): string {
  const kop = buildKopLaporan(style)
  const upahLabel = 'Laba'

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

<div style="border:1.5px solid #000;margin-bottom:15px;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#16a34a;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
PENDAPATAN
</p>
<div>
{{#pendapatan}}${lapRow('{label}', '{min}', '{max}', false)}{{/pendapatan}}
${lapRow('Total Pendapatan', '{total_pendapatan_min}', '{total_pendapatan_max}', true, '#f0fdf4')}
</div>
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#dc2626;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
PENGELUARAN
</p>
<div>
{{#pengeluaran}}${lapRow('{label}', '{min}', '{max}', false)}{{/pengeluaran}}
${lapRow('Total Pengeluaran', '{total_pengeluaran_min}', '{total_pengeluaran_max}', true, '#fef2f2')}
</div>
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;background:#e6f3ff;">
<p style="margin:0;padding:10px;border-bottom:1.5px solid #000;background:#1e3a8a;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
LABA BERSIH
</p>
<p style="margin:0;padding:12px 10px;font-size:14pt;font-weight:bold;text-align:center;">
Rp. {laba_min} - Rp. {laba_max}
</p>
</div>

<div style="margin-top:40px;text-align:right;">
<p style="margin:0 0 6px 0;">{kota}, {tanggal}</p>
<p style="margin:0 0 80px 0;">Pemilik Usaha,</p>
<p style="margin:0;font-weight:bold;text-decoration:underline;display:inline-block;border-top:1px solid #000;padding-top:6px;min-width:200px;text-align:center;">( {nama} )</p>
</div>

</div>`
}

// Build halaman akumulatif 6 bulan
function buildLaporanAkumulatif(style: string): string {
  const kop = buildKopLaporan(style)

  return `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;width:100%;min-height:90vh;padding:20px 0;">

${kop}

<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">REKAPITULASI LAPORAN KEUANGAN</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">6 Bulan Terakhir (Akumulatif)</p>

<div style="margin:0 0 15px 0;">
${idRow('Nama Usaha', '{nama_usaha}', true)}
${idRow('Jenis Usaha', '{jenis_usaha}')}
${idRow('Pemilik', '{nama}', true)}
${idRow('Periode', '{periode_awal} - {periode_akhir}')}
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#16a34a;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
TOTAL PENDAPATAN 6 BULAN
</p>
<p style="margin:0;padding:12px 10px;font-size:14pt;font-weight:bold;text-align:center;">
Rp. {total_pendapatan_6bln_min} - Rp. {total_pendapatan_6bln_max}
</p>
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#dc2626;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
TOTAL PENGELUARAN 6 BULAN
</p>
<p style="margin:0;padding:12px 10px;font-size:14pt;font-weight:bold;text-align:center;">
Rp. {total_pengeluaran_6bln_min} - Rp. {total_pengeluaran_6bln_max}
</p>
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;background:#e6f3ff;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#1e3a8a;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
RATA-RATA LABA BERSIH PER BULAN
</p>
<p style="margin:0;padding:12px 10px;font-size:14pt;font-weight:bold;text-align:center;">
Rp. {rata_laba_min} - Rp. {rata_laba_max}
</p>
</div>

<div style="border:1.5px solid #000;margin-bottom:15px;background:#fefce8;">
<p style="margin:0;padding:8px 10px;border-bottom:1.5px solid #000;background:#ca8a04;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">
TOTAL LABA BERSIH 6 BULAN
</p>
<p style="margin:0;padding:12px 10px;font-size:16pt;font-weight:bold;text-align:center;">
Rp. {total_laba_6bln_min} - Rp. {total_laba_6bln_max}
</p>
</div>

<p style="text-align:justify;margin:25px 0;text-indent:36px;line-height:1.7;">Demikian laporan keuangan usaha ini dibuat dengan sebenarnya untuk keperluan pengajuan Kredit Pemilikan Rumah (KPR). Data yang tercantum adalah perkiraan rentang (min-max) pendapatan dan pengeluaran usaha berdasarkan catatan keuangan 6 bulan terakhir.</p>

<div style="text-align:right;margin-top:40px;">
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

// Get body laporan akumulatif (1 halaman terakhir) — used by engine
export function getLaporanAkumulatifBody(style: string): string {
  return buildLaporanAkumulatif(style)
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
