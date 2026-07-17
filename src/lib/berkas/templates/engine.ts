// TEMPLATE ENGINE - Fill HTML templates with form data
// Combined mode: SK Kerja + 7 Slip Gaji sheets in ONE document with shared kop surat
// Laporan Keuangan mode: 7 Laporan Bulanan + 1 Akumulatif (untuk wirausaha)

import { BerkasState } from '@/lib/berkas/types'
import { getSkBody, getSlipBody, COMBINED_TEMPLATES } from '@/lib/berkas/templates/combined-templates'
import { getLaporanBulananBody, getLaporanAkumulatifBody, LAPORAN_KEUANGAN_TEMPLATES } from '@/lib/berkas/templates/laporan-keuangan-templates'

interface SlipItem { label: string; amount: number }

function formatRupiah(n: number): string {
  return 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'
}

function formatDateID(d: string | Date): string {
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    if (isNaN(date.getTime())) return '...'
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return '...' }
}

// Replace simple {placeholder} in text
function replacePlaceholders(text: string, data: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in data) return String(data[key] ?? '')
    return match
  })
}

// Replace inline loops {{#items}}content with {label} {amount}{{/items}}
function replaceInlineLoops(text: string, data: Record<string, any>): string {
  return text.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const items = data[key]
    if (!Array.isArray(items)) return ''
    return items.map(item => {
      return content
        .replace(/\{label\}/g, String(item.label ?? ''))
        .replace(/\{amount\}/g, String(item.amount ?? ''))
    }).join('')
  })
}

// Build SK Kerja data (single set, shared across document)
export function buildSkKerjaData(state: BerkasState): Record<string, any> {
  const a = state.applicant as any
  return {
    nama: a.fullName || '',
    nik: a.ktpNumber || '',
    tempat_lahir: a.pob || '',
    tanggal_lahir: formatDateID(a.dob),
    jabatan: a.jobTitle || '',
    perusahaan: a.companyName || '',
    alamat_perusahaan: a.companyAddress || '',
    gaji: formatRupiah(a.monthlyIncome || 0),
    gaji_pokok: formatRupiah(a.gajiPokok || a.monthlyIncome || 0),
    tanggal: formatDateID(state.dateOfDocument),
    kota: 'Pangkalpinang',
    tahun: new Date().getFullYear().toString(),
    bulan: (new Date().getMonth() + 1).toString(),
    lama_bekerja: a.workDuration || '...',
    atasan: a.atasanName || '',
    nip_atasan: a.atasanNip || '',
    nama_pasangan: state.spouse?.fullName || '',
    nik_pasangan: state.spouse?.ktpNumber || '',
  }
}

// Build Slip Gaji data — 7 sheets (6 months back + current)
export function buildSlipGajiData(state: BerkasState): Record<string, any> {
  const a = state.applicant as any
  const gajiPokok = a.gajiPokok || a.monthlyIncome || 0
  const tunjanganTetap: SlipItem[] = a.tunjanganTetap || []
  const tunjanganVariabel: SlipItem[] = a.tunjanganVariabel || []
  const potongan: SlipItem[] = a.potongan || []
  const tanggalTerima = a.tanggalTerimaGaji ? parseInt(a.tanggalTerimaGaji) : 25

  const totalTunjanganTetap = tunjanganTetap.reduce((s, t) => s + (t.amount || 0), 0)
  const totalTunjanganVariabel = tunjanganVariabel.reduce((s, t) => s + (t.amount || 0), 0)
  const totalPotongan = potongan.reduce((s, p) => s + (p.amount || 0), 0)
  const gajiKotor = gajiPokok + totalTunjanganTetap + totalTunjanganVariabel
  const gajiBersih = gajiKotor - totalPotongan

  const now = new Date()
  const slips: any[] = []
  for (let i = 6; i >= 0; i--) {
    const slipDate = new Date(now.getFullYear(), now.getMonth() - 6 + i, tanggalTerima)
    slips.push({
      periode: slipDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      tanggal_terima: formatDateID(slipDate),
      gaji_pokok: formatRupiah(gajiPokok),
      total_tunjangan_tetap: formatRupiah(totalTunjanganTetap),
      total_tunjangan_variabel: formatRupiah(totalTunjanganVariabel),
      total_potongan: formatRupiah(totalPotongan),
      gaji_kotor: formatRupiah(gajiKotor),
      gaji_bersih: formatRupiah(gajiBersih),
      tunjangan_tetap: tunjanganTetap.map(t => ({
        label: t.label,
        amount: formatRupiah(t.amount),
      })),
      tunjangan_variabel: tunjanganVariabel.map(t => ({
        label: t.label,
        amount: formatRupiah(t.amount),
      })),
      potongan: potongan.map(p => ({
        label: p.label,
        amount: formatRupiah(p.amount),
      })),
      // Shared fields from SK (so kop surat has same data)
      nama: a.fullName || '',
      nik: a.ktpNumber || '',
      jabatan: a.jobTitle || '',
      perusahaan: a.companyName || '',
      alamat_perusahaan: a.companyAddress || '',
      kota: 'Pangkalpinang',
    })
  }

  return { slips }
}

// Fill a section (SK or slip) with data: replace placeholders + inline loops
function fillSection(html: string, data: Record<string, any>): string {
  let result = html
  result = replaceInlineLoops(result, data)
  result = replacePlaceholders(result, data)
  return result
}

// Build the COMBINED document: SK + page break + 7 slip sheets
// All in one HTML string ready to be loaded into Tiptap editor
// NOTE: Slip body sudah punya page-break-after:always di div outer-nya,
// jadi TIDAK perlu tambah PAGE_BREAK helper antar slip (double page break = halaman kosong)
export function buildCombinedDocument(templateId: string, state: BerkasState): string {
  const template = COMBINED_TEMPLATES.find(t => t.id === templateId) || COMBINED_TEMPLATES[0]
  const style = template.id.replace('combined-', '')

  const skData = buildSkKerjaData(state)
  const slipData = buildSlipGajiData(state)

  // Build SK section (filled)
  const skHtml = fillSection(getSkBody(style), skData)

  // Build 7 slip sections (each filled with its own slip data)
  // Slip body sudah punya page-break-after:always, jadi langsung concatenate tanpa PAGE_BREAK
  const slipPages = slipData.slips.map((slip: any) => {
    return fillSection(getSlipBody(style), slip)
  }).join('\n')

  // Combine: SK + slips (slip pertama akan auto page-break dari SK section)
  // Tambah 1 page break setelah SK section supaya slip pertama mulai di halaman baru
  const pageBreak = '<div style="page-break-after:always;break-after:page;"></div>'
  return `${skHtml}
${pageBreak}
${slipPages}`
}

// =========================================================
// LAPORAN KEUANGAN (Wirausaha) — Range Min-Max per bulan
// =========================================================

// Format number to "1.000.000" (tanpa Rp, untuk dipakai di range)
function formatNum(n: number): string {
  return (n || 0).toLocaleString('id-ID')
}

// Build Laporan Keuangan data — 7 bulan (6 bulan ke belakang + bulan ini)
// Setiap bulan punya: pendapatan (array of {label, min, max}) + pengeluaran (array of {label, min, max})
// Plus total min/max yang dihitung dari array
export function buildLaporanKeuanganData(state: BerkasState): Record<string, any> {
  const a = state.applicant as any
  const w = (a as any).wirausaha || {}  // data wirausaha dari formbox

  // Default pendapatan items (kalau user belum input detail)
  const pendapatanDefault = w.pendapatanDetail && w.pendapatanDetail.length > 0
    ? w.pendapatanDetail
    : [
        { label: 'Penjualan Barang/Jasa', min: w.pendapatanMin || 0, max: w.pendapatanMax || 0 },
      ]

  // Default pengeluaran items
  const pengeluaranDefault = w.pengeluaranDetail && w.pengeluaranDetail.length > 0
    ? w.pengeluaranDetail
    : [
        { label: 'Pembelian Bahan Baku', min: w.pengeluaranMin || 0, max: w.pengeluaranMax || 0 },
      ]

  // Hitung total per bulan
  const totalPendapatanMin = pendapatanDefault.reduce((s: number, p: any) => s + (p.min || 0), 0)
  const totalPendapatanMax = pendapatanDefault.reduce((s: number, p: any) => s + (p.max || 0), 0)
  const totalPengeluaranMin = pengeluaranDefault.reduce((s: number, p: any) => s + (p.min || 0), 0)
  const totalPengeluaranMax = pengeluaranDefault.reduce((s: number, p: any) => s + (p.max || 0), 0)
  const labaMin = totalPendapatanMin - totalPengeluaranMax  // worst case
  const labaMax = totalPendapatanMax - totalPengeluaranMin  // best case

  const now = new Date()
  const laporan: any[] = []
  for (let i = 6; i >= 0; i--) {
    const lapDate = new Date(now.getFullYear(), now.getMonth() - 6 + i, 25)
    laporan.push({
      periode: lapDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      pendapatan: pendapatanDefault.map((p: any) => ({
        label: p.label,
        min: formatNum(p.min || 0),
        max: formatNum(p.max || 0),
      })),
      pengeluaran: pengeluaranDefault.map((p: any) => ({
        label: p.label,
        min: formatNum(p.min || 0),
        max: formatNum(p.max || 0),
      })),
      total_pendapatan_min: formatNum(totalPendapatanMin),
      total_pendapatan_max: formatNum(totalPendapatanMax),
      total_pengeluaran_min: formatNum(totalPengeluaranMin),
      total_pengeluaran_max: formatNum(totalPengeluaranMax),
      laba_min: formatNum(labaMin),
      laba_max: formatNum(labaMax),
      // Shared fields
      nama_usaha: w.namaUsaha || a.companyName || '',
      jenis_usaha: w.jenisUsaha || a.jobTitle || '',
      alamat_usaha: w.alamatUsaha || a.companyAddress || '',
      nib: w.nib || '-',
      nama: a.fullName || '',
      kota: 'Pangkalpinang',
      tanggal: formatDateID(state.dateOfDocument),
    })
  }

  // Hitung akumulatif 6 bulan
  const totalPendapatan6BlnMin = totalPendapatanMin * 6
  const totalPendapatan6BlnMax = totalPendapatanMax * 6
  const totalPengeluaran6BlnMin = totalPengeluaranMin * 6
  const totalPengeluaran6BlnMax = totalPengeluaranMax * 6
  const totalLaba6BlnMin = labaMin * 6
  const totalLaba6BlnMax = labaMax * 6
  const rataLabaMin = labaMin
  const rataLabaMax = labaMax

  const akumulatif = {
    periode_awal: laporan[0]?.periode || '',
    periode_akhir: laporan[6]?.periode || '',
    total_pendapatan_6bln_min: formatNum(totalPendapatan6BlnMin),
    total_pendapatan_6bln_max: formatNum(totalPendapatan6BlnMax),
    total_pengeluaran_6bln_min: formatNum(totalPengeluaran6BlnMin),
    total_pengeluaran_6bln_max: formatNum(totalPengeluaran6BlnMax),
    rata_laba_min: formatNum(rataLabaMin),
    rata_laba_max: formatNum(rataLabaMax),
    total_laba_6bln_min: formatNum(totalLaba6BlnMin),
    total_laba_6bln_max: formatNum(totalLaba6BlnMax),
    nama_usaha: w.namaUsaha || a.companyName || '',
    jenis_usaha: w.jenisUsaha || a.jobTitle || '',
    nama: a.fullName || '',
    kota: 'Pangkalpinang',
    tanggal: formatDateID(state.dateOfDocument),
  }

  return { laporan, akumulatif }
}

// Build the LAPORAN KEUANGAN document (untuk wirausaha):
// 7 halaman laporan bulanan + 1 halaman akumulatif = 8 halaman total
// NO SK Kerja (wirausaha tidak butuh SK Kerja)
export function buildLaporanKeuanganDocument(templateId: string, state: BerkasState): string {
  const template = LAPORAN_KEUANGAN_TEMPLATES.find(t => t.id === templateId) || LAPORAN_KEUANGAN_TEMPLATES[0]
  const style = template.id.replace('lap-', '').replace('umkm-', '').replace('-', '-')

  const data = buildLaporanKeuanganData(state)

  // Build 7 laporan bulanan (masing-masing 1 halaman dengan page-break-after)
  const laporanPages = data.laporan.map((lap: any) => {
    return fillSection(getLaporanBulananBody(style), lap)
  }).join('\n')

  // Build 1 halaman akumulatif (halaman terakhir, tanpa page-break-after)
  const akumulatifHtml = fillSection(getLaporanAkumulatifBody(style), data.akumulatif)

  // Combine: 7 laporan bulanan + 1 akumulatif
  // Laporan bulanan sudah punya page-break-after, jadi langsung concatenate
  return `${laporanPages}
${akumulatifHtml}`
}

// Auto-switch: karyawan → SK+Slip, wirausaha → Laporan Keuangan
// Ini function utama yang dipanggil CombinedDocumentEditorModal
export function buildDocumentByJobType(templateId: string, state: BerkasState): string {
  const isWirausaha = state.applicant.jobType === 'wirausaha' || state.applicant.jobType === 'Wirausaha'
  if (isWirausaha) {
    // Wirausaha: skip SK Kerja, hanya Laporan Keuangan
    return buildLaporanKeuanganDocument(templateId, state)
  }
  // Karyawan: SK Kerja + 7 Slip Gaji
  return buildCombinedDocument(templateId, state)
}
