// Google Docs Template Filler
// Replaces {placeholders} in a Google Doc using the Docs API batchUpdate method
// Each placeholder like {nama} gets replaced with the actual value
// For loops like {#items}...{/items}, we expand them by inserting multiple rows
import { getDocsClient, getDocsClientOAuth, isOAuthConfigured, isGoogleConnected } from './auth'

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

// Build SK Kerja data (top-level fields)
export function buildSkKerjaData(state: any): Record<string, string> {
  const a = state.applicant
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

// Build 7 slip gaji data (each slip is one period)
// Generate INDEXED placeholders: {periode_1}, {periode_2}, ... {periode_7}
// Template has 7 hard-coded slip sections with {periode_N} placeholders
export function buildSlipGajiData(state: any): any[] {
  const a = state.applicant
  const now = new Date()

  // Cek apakah ada slipBulanan data (dari form per-bulan)
  const slipBulanan = a.slipBulanan
  if (slipBulanan && Array.isArray(slipBulanan) && slipBulanan.length === 7) {
    return slipBulanan.map((slip: any, idx: number) => {
      const totalTunjangan = (slip.tunjangan || []).reduce((s: number, t: any) => s + (t.amount || 0), 0)
      const totalBonus = (slip.bonus || []).reduce((s: number, b: any) => s + (b.amount || 0), 0)
      const totalPotongan = (slip.potongan || []).reduce((s: number, p: any) => s + (p.amount || 0), 0)
      const gajiKotor = (slip.gajiPokok || 0) + totalTunjangan + totalBonus
      const gajiBersih = gajiKotor - totalPotongan

      // Calculate periode based on modePeriode
      const baseDate = new Date(now.getFullYear(), now.getMonth() - 6 + idx, 15)
      let periodeDate = baseDate
      if (slip.modePeriode === 'plus-1-bulan') {
        periodeDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, slip.tanggalTerima || 25)
      } else {
        periodeDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), slip.tanggalTerima || 25)
      }

      // Build indexed placeholders for this slip (idx+1)
      const slipNum = idx + 1
      const data: Record<string, string> = {
        [`periode_${slipNum}`]: periodeDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        [`gaji_pokok_${slipNum}`]: formatRupiah(slip.gajiPokok || 0),
        [`tunjangan_total_${slipNum}`]: formatRupiah(totalTunjangan),
        [`bonus_total_${slipNum}`]: formatRupiah(totalBonus),
        [`gaji_kotor_${slipNum}`]: formatRupiah(gajiKotor),
        [`total_potongan_${slipNum}`]: formatRupiah(totalPotongan),
        [`gaji_bersih_${slipNum}`]: formatRupiah(gajiBersih),
        [`total_gaji_${slipNum}`]: formatRupiah(gajiBersih), // alias for "Total Gaji Diterima"
        [`tanggal_terima_${slipNum}`]: formatDateID(periodeDate),
      }

      // Tunjangan items (up to 5, fill with "-" if empty)
      for (let n = 1; n <= 5; n++) {
        const item = (slip.tunjangan || [])[n - 1]
        data[`tunjangan_${slipNum}_${n}_label`] = item?.label || ''
        data[`tunjangan_${slipNum}_${n}_amount`] = (item?.amount || item?.amount === 0) ? formatRupiah(item.amount) : ''
      }

      // Bonus items (up to 5)
      for (let n = 1; n <= 5; n++) {
        const item = (slip.bonus || [])[n - 1]
        data[`bonus_${slipNum}_${n}_label`] = item?.label || ''
        data[`bonus_${slipNum}_${n}_amount`] = (item?.amount || item?.amount === 0) ? formatRupiah(item.amount) : ''
      }

      // Potongan items (up to 5)
      for (let n = 1; n <= 5; n++) {
        const item = (slip.potongan || [])[n - 1]
        data[`potongan_${slipNum}_${n}_label`] = item?.label || ''
        data[`potongan_${slipNum}_${n}_amount`] = (item?.amount || item?.amount === 0) ? formatRupiah(item.amount) : ''
      }

      return data
    })
  }

  // Fallback: pakai data global (lama) — generate indexed placeholders
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

  const slips: any[] = []
  for (let i = 6; i >= 0; i--) {
    const slipDate = new Date(now.getFullYear(), now.getMonth() - 6 + i, tanggalTerima)
    const slipNum = 7 - i // 1 to 7
    const data: Record<string, string> = {
      [`periode_${slipNum}`]: slipDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      [`gaji_pokok_${slipNum}`]: formatRupiah(gajiPokok),
      [`tunjangan_total_${slipNum}`]: formatRupiah(totalTunjanganTetap),
      [`bonus_total_${slipNum}`]: formatRupiah(totalTunjanganVariabel),
      [`gaji_kotor_${slipNum}`]: formatRupiah(gajiKotor),
      [`total_potongan_${slipNum}`]: formatRupiah(totalPotongan),
      [`gaji_bersih_${slipNum}`]: formatRupiah(gajiBersih),
      [`total_gaji_${slipNum}`]: formatRupiah(gajiBersih),
      [`tanggal_terima_${slipNum}`]: formatDateID(slipDate),
    }
    // Tunjangan (up to 5)
    for (let n = 1; n <= 5; n++) {
      const item = tunjanganTetap[n - 1]
      data[`tunjangan_${slipNum}_${n}_label`] = item?.label || ''
      data[`tunjangan_${slipNum}_${n}_amount`] = (item?.amount || item?.amount === 0) ? formatRupiah(item.amount) : ''
    }
    // Bonus (up to 5)
    for (let n = 1; n <= 5; n++) {
      const item = tunjanganVariabel[n - 1]
      data[`bonus_${slipNum}_${n}_label`] = item?.label || ''
      data[`bonus_${slipNum}_${n}_amount`] = (item?.amount || item?.amount === 0) ? formatRupiah(item.amount) : ''
    }
    // Potongan (up to 5)
    for (let n = 1; n <= 5; n++) {
      const item = potongan[n - 1]
      data[`potongan_${slipNum}_${n}_label`] = item?.label || ''
      data[`potongan_${slipNum}_${n}_amount`] = (item?.amount || item?.amount === 0) ? formatRupiah(item.amount) : ''
    }
    slips.push(data)
  }
  return slips
}

// Build laporan keuangan data (wirausaha) — OPSI A: parent+child structure
// Placeholders:
//   {nama_usaha}, {alamat_usaha}, {ig_usaha}, {jenis_usaha}, {nama}, {tanggal}
//   Per periode (N = 1..7):
//     {periode_N}, {total_pendapatan_N}, {total_pengeluaran_N}, {laba_bersih_N}
//     For P = 1..5 parents, C = 1..3 children:
//       {pendapatan_parent_N_P_label}, {pendapatan_parent_N_P_subtotal}
//       {pendapatan_child_N_P_C_label}, {pendapatan_child_N_P_C_qty},
//       {pendapatan_child_N_P_C_price}, {pendapatan_child_N_P_C_total}
//     Same pattern for pengeluaran
export function buildLaporanKeuanganData(state: any): Record<string, string> {
  const a = state.applicant
  const now = new Date()
  const data: Record<string, string> = {
    nama_usaha: a.companyName || '',
    alamat_usaha: a.companyAddress || '',
    ig_usaha: (a as any).ig || '',
    jenis_usaha: a.jobTitle || '',
    nama: a.fullName || '',
    tanggal: formatDateID(state.dateOfDocument),
  }

  // Cek apakah ada lapBulanan data (dari form wirausaha)
  const lapBulanan = (a as any).lapBulanan
  if (lapBulanan && Array.isArray(lapBulanan) && lapBulanan.length === 7) {
    lapBulanan.forEach((lap: any, idx: number) => {
      const slipNum = idx + 1
      const baseDate = new Date(now.getFullYear(), now.getMonth() - 6 + idx, 15)
      data[`periode_${slipNum}`] = baseDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

      // Process PENDAPATAN (5 parents × 3 children = 15 items max)
      let totalPendapatan = 0
      const pendapatanParents = lap.pendapatan || []
      for (let p = 1; p <= 5; p++) {
        const parent = pendapatanParents[p - 1]
        const parentLabel = parent?.label || ''
        data[`pendapatan_parent_${slipNum}_${p}_label`] = parentLabel

        let parentSubtotal = 0
        const subItems = parent?.subItems || []
        for (let c = 1; c <= 3; c++) {
          const sub = subItems[c - 1]
          const qty = sub?.qty || 0
          const price = sub?.price || 0
          const subTotal = qty * price
          parentSubtotal += subTotal
          data[`pendapatan_child_${slipNum}_${p}_${c}_label`] = sub?.label || ''
          data[`pendapatan_child_${slipNum}_${p}_${c}_qty`] = qty ? String(qty) : ''
          data[`pendapatan_child_${slipNum}_${p}_${c}_price`] = price ? formatRupiah(price) : ''
          data[`pendapatan_child_${slipNum}_${p}_${c}_total`] = subTotal ? formatRupiah(subTotal) : ''
        }
        data[`pendapatan_parent_${slipNum}_${p}_subtotal`] = parentSubtotal ? formatRupiah(parentSubtotal) : ''
        totalPendapatan += parentSubtotal
      }
      data[`total_pendapatan_${slipNum}`] = formatRupiah(totalPendapatan)

      // Process PENGELUARAN (5 parents × 3 children = 15 items max)
      let totalPengeluaran = 0
      const pengeluaranParents = lap.pengeluaran || []
      for (let p = 1; p <= 5; p++) {
        const parent = pengeluaranParents[p - 1]
        const parentLabel = parent?.label || ''
        data[`pengeluaran_parent_${slipNum}_${p}_label`] = parentLabel

        let parentSubtotal = 0
        const subItems = parent?.subItems || []
        for (let c = 1; c <= 3; c++) {
          const sub = subItems[c - 1]
          const qty = sub?.qty || 0
          const price = sub?.price || 0
          const subTotal = qty * price
          parentSubtotal += subTotal
          data[`pengeluaran_child_${slipNum}_${p}_${c}_label`] = sub?.label || ''
          data[`pengeluaran_child_${slipNum}_${p}_${c}_qty`] = qty ? String(qty) : ''
          data[`pengeluaran_child_${slipNum}_${p}_${c}_price`] = price ? formatRupiah(price) : ''
          data[`pengeluaran_child_${slipNum}_${p}_${c}_total`] = subTotal ? formatRupiah(subTotal) : ''
        }
        data[`pengeluaran_parent_${slipNum}_${p}_subtotal`] = parentSubtotal ? formatRupiah(parentSubtotal) : ''
        totalPengeluaran += parentSubtotal
      }
      data[`total_pengeluaran_${slipNum}`] = formatRupiah(totalPengeluaran)

      // Laba Bersih
      data[`laba_bersih_${slipNum}`] = formatRupiah(totalPendapatan - totalPengeluaran)
    })
  }

  return data
}

// Fill placeholders in a Google Doc using Docs API
// Strategy:
// 1. Get all text content from the doc
// 2. Find all {placeholder} occurrences and their positions
// 3. Use batchUpdate with replaceText (for simple placeholders)
// 4. For loop placeholders {#items}...{/items}, use a more complex approach:
//    - Get the doc structure
//    - Find the loop range
//    - For each item, duplicate the content and replace {label}/{amount}
//    - Delete the original
export async function fillGoogleDocPlaceholders(docId: string, state: any): Promise<void> {
  // Prefer OAuth (user login) - works because file is owned by user
  // Fall back to Service Account if OAuth not configured
  let docs: any
  if (isOAuthConfigured()) {
    const connected = await isGoogleConnected()
    if (!connected) {
      throw new Error('Google not connected. Owner needs to login first.')
    }
    docs = await getDocsClientOAuth()
  } else {
    docs = getDocsClient()
  }

  // Step 1: Get document content
  const doc = await docs.documents.get({ documentId: docId })
  const content = doc.data.body?.content || []

  // Collect all text from the doc
  let allText = ''
  const textRanges: Array<{ startIndex: number; endIndex: number; text: string }> = []
  for (const element of content) {
    if (element.paragraph?.elements) {
      for (const e of element.paragraph.elements) {
        if (e.textRun?.content) {
          textRanges.push({
            startIndex: Number(e.startIndex) || 0,
            endIndex: Number(e.endIndex) || 0,
            text: e.textRun.content,
          })
          allText += e.textRun.content
        }
      }
    }
  }

  // Step 2: Find all {placeholders} and replace
  const skData = buildSkKerjaData(state)
  const slips = buildSlipGajiData(state)

  // Build replacement requests — SK data + all slip data (indexed)
  const replacements: any[] = []

  // Simple SK placeholders (shared across all sections)
  for (const [key, value] of Object.entries(skData)) {
    replacements.push({
      replaceAllText: {
        replaceText: String(value),
        containsText: { text: `{${key}}`, matchCase: false },
      },
    })
  }

  // Indexed slip placeholders: {periode_1}, {periode_2}, ... {tunjangan_1_1_label}, dll
  for (const slip of slips) {
    for (const [key, value] of Object.entries(slip)) {
      replacements.push({
        replaceAllText: {
          replaceText: String(value),
          containsText: { text: `{${key}}`, matchCase: false },
        },
      })
    }
  }

  // Laporan Keuangan placeholders (wirausaha)
  const lapData = buildLaporanKeuanganData(state)
  for (const [key, value] of Object.entries(lapData)) {
    replacements.push({
      replaceAllText: {
        replaceText: String(value),
        containsText: { text: `{${key}}`, matchCase: false },
      },
    })
  }

  // Execute all replacements
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: replacements },
  })
}

// Expand the {#slips}...{/slips} loop in the Google Doc
// This finds the markers, duplicates the content 7 times (one per slip),
// and replaces each slip's placeholders inline
async function expandSlipsLoop(docs: any, docId: string, allText: string, slips: any[]): Promise<void> {
  // Find {#slips} and {/slips} markers
  const startMarker = '{#slips}'
  const endMarker = '{/slips}'
  const startIdx = allText.indexOf(startMarker)
  const endIdx = allText.indexOf(endMarker)

  if (startIdx === -1 || endIdx === -1) {
    // No loop markers — skip (template might already be expanded)
    return
  }

  // Get the content between markers
  const loopContent = allText.substring(startIdx + startMarker.length, endIdx)

  // Build expanded text (7 copies, each with slip-specific placeholders replaced)
  const expandedText = slips.map(slip => {
    let copy = loopContent
    // Replace slip-specific placeholders
    for (const [key, value] of Object.entries(slip)) {
      if (key === 'tunjangan_tetap' || key === 'tunjangan_variabel' || key === 'potongan') {
        // Inline loop for items: {#tunjangan_tetap}...{label}...{amount}...{/tunjangan_tetap}
        const items = value as any[]
        const loopRegex = new RegExp(`\\{#${key}\\}([\\s\\S]*?)\\{/${key}\\}`, 'g')
        copy = copy.replace(loopRegex, (_match, inner) => {
          return items.map(item => {
            return inner
              .replace(/\{label\}/g, String(item.label || ''))
              .replace(/\{amount\}/g, String(item.amount || ''))
          }).join('')
        })
      } else {
        // Simple placeholder
        copy = copy.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value || ''))
      }
    }
    return copy
  }).join('\n\n--- Page Break ---\n\n')

  // Replace the entire {#slips}...{/slips} block with the expanded text
  // First, find the actual text range in the doc (using the marker positions)
  // Since Google Docs API uses indices, we need to delete the range and insert the new text
  // Get the full document to find exact indices
  const doc = await docs.documents.get({ documentId: docId })
  const content = doc.data.body?.content || []

  // Find the start and end indices of {#slips} and {/slips} in the actual doc
  let docStartIndex = -1
  let docEndIndex = -1
  let textSoFar = ''
  for (const element of content) {
    if (element.paragraph?.elements) {
      for (const e of element.paragraph.elements) {
        if (e.textRun?.content) {
          const start = Number(e.startIndex) || 0
          const end = Number(e.endIndex) || 0
          const text = e.textRun.content

          // Check if {#slips} starts in this run
          if (docStartIndex === -1 && text.includes(startMarker)) {
            docStartIndex = start + String(text).indexOf(startMarker)
          }
          // Check if {/slips} ends in this run
          if (docEndIndex === -1 && text.includes(endMarker)) {
            docEndIndex = start + String(text).indexOf(endMarker) + endMarker.length
          }
          textSoFar += text
        }
      }
    }
  }

  if (docStartIndex === -1 || docEndIndex === -1) return

  // Build batch update requests:
  // 1. Delete the entire {#slips}...{/slips} range
  // 2. Insert the expanded text at the start position
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        // Delete the loop block
        {
          deleteContentRange: {
            range: {
              startIndex: docStartIndex,
              endIndex: docEndIndex,
            },
          },
        },
        // Insert expanded text at the start position
        {
          insertText: {
            location: { index: docStartIndex },
            text: expandedText,
          },
        },
      ],
    },
  })
}
