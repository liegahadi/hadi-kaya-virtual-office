// Google Docs Template Filler
// Replaces {placeholders} in a Google Doc using the Docs API batchUpdate method
// Each placeholder like {nama} gets replaced with the actual value
// For loops like {#items}...{/items}, we expand them by inserting multiple rows
import { getDocsClient } from './auth'

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
export function buildSlipGajiData(state: any): any[] {
  const a = state.applicant
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
      nama: a.fullName || '',
      nik: a.ktpNumber || '',
      jabatan: a.jobTitle || '',
      perusahaan: a.companyName || '',
      alamat_perusahaan: a.companyAddress || '',
      kota: 'Pangkalpinang',
    })
  }
  return slips
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
  const docs = getDocsClient()

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

  // Step 2: Find all simple {placeholders} (no loop syntax)
  const skData = buildSkKerjaData(state)
  const slips = buildSlipGajiData(state)

  // Build replacement requests for simple placeholders
  const replacements: any[] = []

  // Simple SK placeholders
  for (const [key, value] of Object.entries(skData)) {
    replacements.push({
      replaceText: {
        text: String(value),
        replaceAll: true,
        containsText: {
          text: `{${key}}`,
          matchCase: false,
        },
      },
    })
  }

  // For slip placeholders, we use the FIRST slip's data to replace all
  // (since each slip has the same placeholders, and we've already generated
  // 7 copies of the slip section in the template via docxtemplater loop)
  // Wait — we uploaded the .docx template which has {#slips}...{/slips} markers
  // We need to expand those first BEFORE replacing individual fields
  // Strategy:
  //   1. Find {#slips} and {/slips} markers
  //   2. Extract the content between them
  //   3. For each of 7 slips, duplicate the content (with slip-specific replacements)
  //   4. Replace the {#slips}...{/slips} block with the duplicated content
  //   5. Then replace all remaining {placeholders}

  // First, expand the {#slips}...{/slips} loop
  await expandSlipsLoop(docs, docId, allText, slips)

  // Then replace all simple placeholders
  // (Re-fetch the doc after loop expansion to get fresh indices)
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
