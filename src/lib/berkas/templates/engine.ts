// TEMPLATE ENGINE - Fill HTML templates with form data
// For Slip Gaji: generates 7 sheets (6 months back + current + 1 forward) using {#slips} loop
// For inline item loops: {{#tunjangan_tetap}}{label}: {amount}{{/tunjangan_tetap}}

import { BerkasState } from '@/lib/berkas/types'

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

// Replace simple {placeholder} (single curly braces) in text
function replacePlaceholders(text: string, data: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in data) return String(data[key] ?? '')
    return match
  })
}

// Replace inline loops {{#items}}content with {label} {amount}{{/items}}
// Renders each item as a separate row
function replaceInlineLoops(text: string, data: Record<string, any>): string {
  // Pattern: {{#arrayName}}content{{/arrayName}}
  return text.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const items = data[key]
    if (!Array.isArray(items)) return ''
    return items.map(item => {
      // Replace {label} and {amount} in content
      return content
        .replace(/\{label\}/g, String(item.label ?? ''))
        .replace(/\{amount\}/g, String(item.amount ?? ''))
    }).join('')
  })
}

// Build SK Kerja data
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

// Build Slip Gaji data — wraps in {#slips} array for 7-sheet generation
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

  // Build 7 slips: 6 months back → current → next month
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
      // Items for inline loops — converted to display format
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
      nama: a.fullName || '',
      nik: a.ktpNumber || '',
      jabatan: a.jobTitle || '',
      perusahaan: a.companyName || '',
    })
  }

  return { slips }
}

// Fill SK Kerja template HTML with form data
export function fillSkKerjaTemplate(templateHtml: string, state: BerkasState): string {
  const data = buildSkKerjaData(state)
  let html = templateHtml
  // First replace inline loops (none for SK Kerja)
  html = replaceInlineLoops(html, data)
  // Then replace simple placeholders
  html = replacePlaceholders(html, data)
  return html
}

// Fill Slip Gaji template HTML with form data — generates 7 sheets
// Wraps the body in a loop that produces 7 pages
export function fillSlipGajiTemplate(templateBody: string, css: string, state: BerkasState): string {
  const data = buildSlipGajiData(state)
  const slips = data.slips

  // Generate 7 pages by repeating the body for each slip
  const pagesHtml = slips.map(slip => {
    let pageHtml = templateBody
    // First replace inline loops {{#tunjangan_tetap}}...{{/}}
    pageHtml = replaceInlineLoops(pageHtml, slip)
    // Then replace simple {placeholder}
    pageHtml = replacePlaceholders(pageHtml, slip)
    return `<div class="slip-page">${pageHtml}</div>`
  }).join('\n')

  // Wrap in full HTML document
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Slip Gaji - ${state.applicant.fullName || 'Konsumen'}</title>
<style>
${css}
@media print {
  body { margin: 0; }
  .slip-page { page-break-after: always; }
}
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}

// Wrap SK Kerja HTML in full document
export function wrapSkKerjaHtml(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>SK Kerja</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  .doc-page { width: 210mm; min-height: 297mm; padding: 20mm 25mm; box-sizing: border-box; margin: 0 auto; background: #fff; }
  @media print {
    body { margin: 0; }
  }
  @media screen {
    body { background: #f0f0f0; padding: 20px 0; }
    .doc-page { box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 20px; }
  }
</style>
</head>
<body>
<div class="doc-page">${innerHtml}</div>
</body>
</html>`
}
