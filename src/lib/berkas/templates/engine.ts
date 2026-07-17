// TEMPLATE ENGINE - Fill HTML templates with form data
// Combined mode: SK Kerja + 7 Slip Gaji sheets in ONE document with shared kop surat

import { BerkasState } from '@/lib/berkas/types'
import { getSkBody, getSlipBody, COMBINED_TEMPLATES } from '@/lib/berkas/templates/combined-templates'

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
