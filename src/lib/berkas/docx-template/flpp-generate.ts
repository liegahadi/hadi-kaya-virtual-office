// ============================================================
// FLPP DOCX Template Generator
// Approach: Context-aware XML replacement
//
// CRITICAL CONSTRAINTS (per user):
// 1. Position, layout, page count MUST NOT change
// 2. Page numbering MUST NOT be modified
// 3. ONLY replace dotted placeholders (.... and dotted-underline-tabs)
// 4. Customer name fields should be BOLD
//
// HOW IT WORKS:
// 1. Load original DOCX as zip (PizZip)
// 2. Read word/document.xml
// 3. Find all <w:r> runs with <w:u w:val="dotted"/> + <w:tab/> → these are form fields
// 4. For each, extract preceding text to identify the LABEL
// 5. Map label → data field via LABEL_TO_FIELD config
// 6. Replace <w:tab/> with <w:t>VALUE</w:t> in that run (preserves <w:rPr>)
// 7. For BOLD fields (customer names), inject <w:b/> into <w:rPr>
// 8. Also replace literal "...." dots in specific contexts (signatures, dates)
// 9. Re-zip and return as Buffer
//
// What stays UNCHANGED:
// - All other XML files (header1, footer1, numbering, styles, etc.)
// - All <w:p>, <w:tbl>, <w:tr>, <w:tc> structure
// - All other <w:r> runs (non-dotted)
// - Page breaks, section breaks, margins
// ============================================================

import PizZip from 'pizzip'
import fs from 'fs'
import path from 'path'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'

// ============================================================
// DATA CONTEXT BUILDER
// Builds flat object with all possible values to fill
// ============================================================
function buildContext(state: BerkasState): Record<string, string> {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return dateStr }
  }
  const formatCurrency = (n: number) => n ? `Rp. ${n.toLocaleString('id-ID')},-` : ''
  const numberToWords = (num: number): string => {
    if (!num || num === 0) return ''
    const u = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
    if (num < 12) return u[num]
    if (num < 20) return u[num - 10] + ' belas'
    if (num < 100) return u[Math.floor(num / 10)] + ' puluh' + (num % 10 ? ' ' + u[num % 10] : '')
    if (num < 200) return 'seratus' + (num - 100 > 0 ? ' ' + numberToWords(num - 100) : '')
    if (num < 1000) return u[Math.floor(num / 100)] + ' ratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '')
    if (num < 2000) return 'seribu' + (num - 1000 > 0 ? ' ' + numberToWords(num - 1000) : '')
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' ribu' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' juta' + (num % 1000000 ? ' ' + numberToWords(num % 1000000) : '')
    return numberToWords(Math.floor(num / 1000000000)) + ' miliar' + (num % 1000000000 ? ' ' + numberToWords(num % 1000000000) : '')
  }

  return {
    // Applicant (Pemohon)
    applicant_full_name: state.applicant.fullName || '',
    applicant_nik: state.applicant.ktpNumber || '',
    applicant_npwp: state.applicant.npwpNumber || '',
    applicant_pob: state.applicant.pob || '',
    applicant_dob: formatDate(state.applicant.dob),
    applicant_pob_dob: state.applicant.pob ? `${state.applicant.pob}, ${formatDate(state.applicant.dob)}` : '',
    applicant_job: state.applicant.jobTitle || state.applicant.jobType || '',
    applicant_address: state.applicant.address || '',
    applicant_phone: state.applicant.phone || '',
    applicant_company: state.applicant.companyName || '',
    applicant_income: formatCurrency(state.applicant.monthlyIncome),
    applicant_income_words: state.applicant.monthlyIncome ? `(${numberToWords(state.applicant.monthlyIncome)} Rupiah)` : '',
    applicant_btn_account: state.applicant.btnAccountNumber || '',

    // Spouse (Pasangan)
    spouse_full_name: state.spouse?.fullName || '',
    spouse_nik: state.spouse?.ktpNumber || '',
    spouse_pob_dob: state.spouse?.pob ? `${state.spouse.pob}, ${formatDate(state.spouse.dob)}` : '',
    spouse_job: state.spouse?.job || '',
    spouse_address: state.spouse?.address || state.applicant.address || '',

    // Company (Developer)
    company_name: COMPANY_INFO.name,
    company_director: COMPANY_INFO.director,
    company_director_nik: (COMPANY_INFO as any).directorKtp || '',
    company_city: COMPANY_INFO.city,
    company_address: (COMPANY_INFO as any).address || COMPANY_INFO.city,
    company_btn_account: COMPANY_INFO.btnAccount,
    company_jabatan: 'Direktur',

    // Property
    property_project: state.property.projectName,
    property_address: state.property.houseAddress,
    property_kavling: state.property.kavlingNumber,
    property_land_size: state.property.landSize ? `${state.property.landSize} m²` : '',
    property_nib: state.property.nibNumber || '',
    property_price: formatCurrency(state.property.price),
    property_price_words: state.property.price ? `(${numberToWords(state.property.price)} Rupiah)` : '',
    property_dp: formatCurrency(state.property.downPayment),
    property_kpr_plafon: formatCurrency(state.property.kprPlafon),

    // Dates
    date_city: 'Pangkalpinang',
    date_full: formatDate(state.dateOfDocument),
    date_day_month: state.dateOfDocument ? new Date(state.dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' }) : '',
    date_year: state.dateOfDocument ? new Date(state.dateOfDocument).getFullYear().toString() : new Date().getFullYear().toString(),
  }
}

// ============================================================
// FIELD MAPPING CONFIG
// Maps label patterns (from preceding text) to context keys
// Format: [regex_pattern, contextKey, shouldBold]
// ============================================================
type FieldMapping = {
  pattern: RegExp
  key: string
  bold?: boolean
}

// Mapping for dotted-underline-tab fields (form fields with labels)
// IMPORTANT: Order matters! More specific patterns first.
const DOTTED_FIELD_MAPPINGS: FieldMapping[] = [
  // === Identitas utama ===
  { pattern: /Nama Lengkap\s*:\s*$/i, key: 'applicant_full_name', bold: true },
  { pattern: /No\.?\s*KTP\/NIK\s*:\s*$/i, key: 'applicant_nik' },
  { pattern: /No\.?\s*KTP\s*:\s*$/i, key: 'applicant_nik' },
  { pattern: /NIK\s*:\s*$/i, key: 'applicant_nik' },
  { pattern: /Tempat,?\s*\/?\s*Tanggal Lahir\s*:\s*$/i, key: 'applicant_pob_dob' },
  { pattern: /Pekerjaan\s*:\s*$/i, key: 'applicant_job' },
  { pattern: /Alamat\s*Perumahan\s*:\s*$/i, key: 'property_address' },
  { pattern: /Alamat\s*:\s*$/i, key: 'applicant_address' },
  { pattern: /Nomor\s*Telp\.?\/?HP\s*:\s*$/i, key: 'applicant_phone' },
  { pattern: /Nama\s*:\s*$/i, key: 'applicant_full_name', bold: true },
  { pattern: /Jabatan\s*:\s*$/i, key: 'company_jabatan' },
  { pattern: /Nama\s*Developer\s*:\s*PT\.?\s*$/i, key: 'company_name', bold: true },
  { pattern: /Nama\s*Perumahan\s*:\s*$/i, key: 'property_project' },
  { pattern: /No\.?\s*Rumah\s*:\s*$/i, key: 'property_kavling' },
  { pattern: /Luas\s*Tanah.*Rumah\s*:\s*$/i, key: 'property_land_size' },
  { pattern: /Kota\/?\s*Kabupaten\/?\s*Provinsi\s*:\s*$/i, key: 'company_city' },
  { pattern: /Email\s*:\s*$/i, key: 'applicant_phone' }, // reuse phone for email placeholder
]

// ============================================================
// SECTION DETECTOR
// Determines if we're in Pemohon, Spouse, Developer, or Debitur section
// by looking at the broader context (last 3000 chars before the field)
// ============================================================
function detectSection(precedingText: string): 'pemohon' | 'spouse' | 'developer' | 'debitur' | 'pembeli' | 'unknown' {
  // Find the last "Selaku" marker which indicates section transitions
  const lastPemohon = precedingText.lastIndexOf('Selaku pemohon')
  const lastSpouse = precedingText.lastIndexOf('Selaku istri/suami')
  const lastSuamiIstri = precedingText.lastIndexOf('Selaku suami/istri')
  const lastDeveloper = precedingText.lastIndexOf('Yang bertanda tangan di bawah ini')

  // If "Selaku istri/suami" or "Selaku suami/istri" is the most recent Selaku marker → spouse section
  if (lastSpouse > lastPemohon || lastSuamiIstri > lastPemohon) {
    return 'spouse'
  }

  // Check if we're in developer section (after "Nama Developer" or "Pengembang PT")
  if (precedingText.includes('Nama Developer') && !precedingText.includes('debitur')) {
    return 'developer'
  }

  // Check if we're in debitur section
  if (precedingText.includes('debitur')) {
    return 'debitur'
  }

  // Check if we're in pembeli section (Berita Acara)
  if (precedingText.includes('Kepada pembeli') || precedingText.includes('pembeli:')) {
    return 'pembeli'
  }

  // Default: pemohon
  return 'pemohon'
}

// ============================================================
// RESOLVE FIELD VALUE
// Given preceding text + section, determine which context key to use
// ============================================================
function resolveField(precedingText: string, section: string, ctx: Record<string, string>): { value: string; bold: boolean } | null {
  // Try each mapping pattern
  for (const mapping of DOTTED_FIELD_MAPPINGS) {
    // Get the last 80 chars of preceding text for pattern matching
    const recentText = precedingText.slice(-80).trim()
    if (mapping.pattern.test(recentText)) {
      // For "Nama Lengkap" in spouse section → use spouse name
      let key = mapping.key
      let bold = mapping.bold || false

      if (section === 'spouse') {
        if (key === 'applicant_full_name') key = 'spouse_full_name'
        else if (key === 'applicant_nik') key = 'spouse_nik'
        else if (key === 'applicant_pob_dob') key = 'spouse_pob_dob'
        else if (key === 'applicant_job') key = 'spouse_job'
        else if (key === 'applicant_address') key = 'spouse_address'
      } else if (section === 'developer') {
        if (key === 'applicant_full_name') {
          key = 'company_director'
          bold = true
        } else if (key === 'applicant_nik') {
          key = 'company_director_nik'
        } else if (key === 'applicant_address') {
          key = 'company_address'
        }
      } else if (section === 'debitur') {
        // Debitur uses applicant data
        if (key === 'applicant_full_name') bold = true
      } else if (section === 'pembeli') {
        if (key === 'applicant_full_name') bold = true
      }

      const value = ctx[key] || ''
      return { value, bold }
    }
  }
  return null
}

// ============================================================
// MAIN GENERATE FUNCTION
// ============================================================
export async function generateFlppDocx(state: BerkasState): Promise<{ buffer: Buffer; replacedCount: number }> {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'btn-flpp.docx')
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template DOCX not found. Please copy the original DOCX to /public/templates/btn-flpp.docx')
  }

  const templateBuffer = fs.readFileSync(templatePath)
  const zip = new PizZip(templateBuffer)

  // Read document.xml
  const docFile = zip.file('word/document.xml')
  if (!docFile) {
    throw new Error('Invalid DOCX: word/document.xml not found')
  }
  let xml = docFile.asText()
  const ctx = buildContext(state)

  let replacedCount = 0

  // === STRATEGY 1: Replace dotted-underline-tab runs ===
  // Pattern: <w:r ...>...<w:rPr>...<w:u w:val="dotted"/>...</w:rPr>...<w:tab/>...</w:r>
  const dottedRunRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g
  const matches: Array<{ fullMatch: string; startIndex: number; runContent: string }> = []
  let m
  while ((m = dottedRunRegex.exec(xml)) !== null) {
    const runContent = m[1]
    if (runContent.includes('<w:u w:val="dotted"') && runContent.includes('<w:tab/>')) {
      matches.push({
        fullMatch: m[0],
        startIndex: m.index,
        runContent,
      })
    }
  }

  // Process matches in REVERSE order so indices don't shift
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    // Get preceding text (last 3000 chars before this run)
    const beforeXml = xml.substring(Math.max(0, match.startIndex - 3000), match.startIndex)
    // Extract text content from <w:t> tags
    const textMatches = [...beforeXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    const precedingText = textMatches.map(tm => tm[1]).join('')

    const section = detectSection(precedingText)
    const resolved = resolveField(precedingText, section, ctx)

    if (resolved && resolved.value) {
      // Replace <w:tab/> with <w:t>VALUE</w:t> in this run
      let newRunContent = match.runContent.replace('<w:tab/>', `<w:t xml:space="preserve">${escapeXml(resolved.value)}</w:t>`)

      // If bold, inject <w:b/> into <w:rPr>
      if (resolved.bold) {
        // Find <w:rPr>...</w:rPr> and add <w:b/> after opening tag
        newRunContent = newRunContent.replace(/<w:rPr>/, '<w:rPr><w:b/>')
        // Also handle self-closing or no rPr case
        if (!newRunContent.includes('<w:rPr>')) {
          // Add rPr right after <w:r ...> tag
          newRunContent = newRunContent.replace(/(<w:r[^>]*>)/, '$1<w:rPr><w:b/></w:rPr>')
        }
      }

      const newRun = `<w:r${match.fullMatch.match(/<w:r([^>]*)>/)?.[1] || ''}>${newRunContent}</w:r>`
      xml = xml.substring(0, match.startIndex) + newRun + xml.substring(match.startIndex + match.fullMatch.length)
      replacedCount++
    }
  }

  // === STRATEGY 2: Replace literal dots in specific contexts ===
  // These are inline placeholders like "proyek perumahan ....." or signature "( .... )"

  // 2a: "proyek perumahan ...." → property_project
  xml = xml.replace(
    /(proyek perumahan\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.property_project)
    }
  )

  // 2b: "Cluster ...." → property_project (cluster name = project name)
  xml = xml.replace(
    /(Cluster\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.property_project)
    }
  )

  // 2c: "Blok/No ...." → property_kavling
  xml = xml.replace(
    /(Blok\/No\.?\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.property_kavling)
    }
  )

  // 2d: "PT. ...." (after "dikembangkan oleh") → company_name
  xml = xml.replace(
    /(dikembangkan oleh PT\.\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.company_name)
    }
  )

  // 2e: "Nomor Rekening: ...." → company_btn_account
  xml = xml.replace(
    /(Nomor Rekening:\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.company_btn_account)
    }
  )

  // 2f: "atas nama ...." → company_name
  xml = xml.replace(
    /(atas nama\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.company_name)
    }
  )

  // 2g: "Pengembang PT. ...." → company_name
  xml = xml.replace(
    /(Pengembang PT\.\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.company_name)
    }
  )

  // 2h: Date pattern "...., .......... 20.." → city, day-month, year
  xml = xml.replace(
    /([…\u2026\.]{3,},\s*)([…\u2026\.]{3,})\s*(20[…\u2026\.]{1,3})/g,
    (match, cityDots, dateDots, yearDots) => {
      replacedCount++
      return escapeXml(ctx.date_city) + ', ' + escapeXml(ctx.date_day_month) + ' ' + escapeXml(ctx.date_year)
    }
  )

  // 2i: "Rp. ...." (income) → applicant_income (only first occurrence in income context)
  // Be careful: only replace if preceded by "sebesar Rp." or "penghasilan bersih"
  xml = xml.replace(
    /(sebesar Rp\.\s*)([…\u2026\.]{3,})/gi,
    (match, prefix, dots) => {
      replacedCount++
      return prefix + escapeXml(ctx.applicant_income.replace('Rp. ', '').replace(',-', ''))
    }
  )

  // 2j: "( .... )" signature lines - leave empty (user will sign physically)
  // Don't replace - leave the dots for manual signature

  // Write modified XML back to zip
  zip.file('word/document.xml', xml)

  // Generate output buffer
  const outputBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })

  return {
    buffer: Buffer.from(outputBuffer),
    replacedCount,
  }
}

// ============================================================
// HELPER: Escape XML special characters
// ============================================================
function escapeXml(s: string): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
