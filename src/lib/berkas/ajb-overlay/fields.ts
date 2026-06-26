// ============================================================
// AJB BTN FIELD CONFIG - Post-SP3K Documents
// 2 files, 3 documents, 93 total fields from user annotations
// ============================================================

import type { BerkasState } from '@/lib/berkas/types'
import type { CompanyInfo } from '@/lib/berkas/types'

export interface AjbField {
  page: number
  x: number
  y: number
  width: number
  height: number
  source: 'applicant' | 'spouse' | 'company' | 'property' | 'computed'
  field: string
  transform?: (val: any, state: BerkasState, company: CompanyInfo) => string
  showWhen?: (state: BerkasState) => boolean
  bold?: boolean
}

export interface AjbDocConfig {
  id: string
  name: string
  templatePath: string
  fields: AjbField[]
}

function formatDate(d: string): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

// AJB date format: ONLY tanggal bulan tahun (NO city prefix)
// User request: "ga usah ada kota pangkalpinangnya ya... hanya tanggal bulan tahun aja"
function akadDateTransform(_v: any, s: BerkasState): string {
  // Fallback: akadDate → lpaDate → dateOfDocument
  const dateStr = s.akadDate || s.lpaDate || s.dateOfDocument
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function lpaDateTransform(_v: any, s: BerkasState): string {
  // Fallback: lpaDate → akadDate → dateOfDocument
  const dateStr = s.lpaDate || s.akadDate || s.dateOfDocument
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function pobDobTransform(_v: any, s: BerkasState): string {
  return s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : ''
}

function spousePobDobTransform(_v: any, s: BerkasState): string {
  return s.spouse ? `${s.spouse.pob}, ${formatDate(s.spouse.dob)}` : ''
}

// Type Luas format: [luas bangunan]/[luas tanah] = houseSize/landSize
// User request: "formatnya spt ini [Luas bangunan]/[luas tanah]"
function typeLuasTransform(_v: any, s: BerkasState): string {
  if (!s.property.houseSize) return ''
  return `${s.property.houseSize}/${s.property.landSize || 84}`
}

// Blok Kavling format: "E6" (blockLetter + houseNumber)
function blokKavlingTransform(_v: any, s: BerkasState): string {
  return `${s.property.blockLetter || ''}${s.property.houseNumber || ''}`
}

// Today's date (realtime) - format: "25 Juni 2026" (NO city prefix)
// User: "tanggal bulan tahun = realtime mksdnya"
function todayDateTransform(): string {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Roman numeral month for document number (I-XII)
// User: "Bulan huruf romawi = bulan pembuatan surat ini menggunakan huruf romawi"
function romanMonthTransform(): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romans[new Date().getMonth()]
}

// Current year
// User: "tahun = tahun ini"
function currentYearTransform(): string {
  return new Date().getFullYear().toString()
}

// LPA date from form: "Senin, 25 Juni 2026" (with day name)
// User: "Hari Tanggal bulan tahun LPA = dari box form Tanggal LPA"
function lpaDateFullTransform(_v: any, s: BerkasState): string {
  const dateStr = s.lpaDate || s.dateOfDocument
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

// Akad date from form: "Senin, 25 Juni 2026"
function akadDateFullTransform(_v: any, s: BerkasState): string {
  const dateStr = s.akadDate || s.dateOfDocument
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

// ============================================================
// 1. AJB BANK (btn-ajb-bank.pdf, 11 pages, 73 annotations)
// ============================================================
const AJB_BANK: AjbDocConfig = {
  id: 'ajb-bank',
  name: 'AJB Bank',
  templatePath: '/public/templates/btn-ajb-bank.pdf',
  fields: [
    // Page 1 - Data debitur utama
    { page: 1, x: 261.9, y: 692.2, width: 64.8, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 262.9, y: 672.5, width: 98.2, height: 12.3, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 1, x: 263.3, y: 652.6, width: 56.0, height: 12.3, source: 'applicant', field: 'address' },
    { page: 1, x: 265.3, y: 633.5, width: 54.9, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 1, x: 417.9, y: 243.0, width: 98.1, height: 12.0, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 1, x: 388.7, y: 119.8, width: 64.9, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    // Page 2 - Data debitur + property + signatures
    { page: 2, x: 216.7, y: 690.9, width: 64.9, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    { page: 2, x: 217.2, y: 677.0, width: 73.4, height: 12.1, source: 'applicant', field: 'ktpNumber' },
    { page: 2, x: 218.1, y: 665.0, width: 129.7, height: 12.1, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 2, x: 219.0, y: 652.0, width: 84.1, height: 12.1, source: 'applicant', field: 'jobTitle' },
    { page: 2, x: 219.4, y: 639.5, width: 66.7, height: 12.1, source: 'applicant', field: 'phone' },
    { page: 2, x: 216.6, y: 627.4, width: 96.3, height: 12.1, source: 'applicant', field: 'address' },
    // Property fields - CORRECTED mappings
    { page: 2, x: 217.6, y: 565.7, width: 85.4, height: 12.1, source: 'property', field: 'projectName' },           // Perumahan
    { page: 2, x: 218.5, y: 553.7, width: 57.3, height: 12.1, source: 'computed', field: 'blokKavling', transform: blokKavlingTransform }, // Blok Kavling No (E6)
    { page: 2, x: 223.9, y: 539.8, width: 137.3, height: 12.1, source: 'computed', field: 'typeLuas', transform: typeLuasTransform },     // Type Luas (84/36)
    { page: 2, x: 223.0, y: 526.0, width: 89.0, height: 12.1, source: 'property', field: 'houseAddress' },          // Alamat rumah yang dibeli
    { page: 2, x: 433.9, y: 316.4, width: 94.8, height: 12.1, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 2, x: 414.7, y: 227.4, width: 63.1, height: 12.1, source: 'applicant', field: 'fullName', bold: true },  // (Nama Debitur) signature
    { page: 2, x: 461.6, y: 483.4, width: 64.9, height: 12.2, source: 'applicant', field: 'fullName', bold: true },  // (Nama Debitur) - corrected from company.director
    // Page 4 - Data debitur (form lain)
    { page: 4, x: 207.4, y: 634.6, width: 65.0, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 4, x: 206.5, y: 617.2, width: 73.6, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 4, x: 211.1, y: 603.1, width: 129.7, height: 12.3, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 4, x: 206.8, y: 587.4, width: 84.1, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 4, x: 209.4, y: 572.3, width: 65.1, height: 12.3, source: 'applicant', field: 'phone' },
    { page: 4, x: 212.4, y: 556.2, width: 124.4, height: 12.3, source: 'applicant', field: 'address' },
    // Page 5 - Standing Instruction
    { page: 5, x: 189.6, y: 708.3, width: 63.2, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    { page: 5, x: 190.3, y: 696.0, width: 82.5, height: 12.2, source: 'applicant', field: 'jobTitle' },
    { page: 5, x: 191.2, y: 683.6, width: 68.0, height: 12.2, source: 'applicant', field: 'address' },
    { page: 5, x: 190.9, y: 659.8, width: 71.7, height: 12.2, source: 'applicant', field: 'ktpNumber' },
    { page: 5, x: 190.6, y: 646.7, width: 164.4, height: 12.2, source: 'applicant', field: 'btnAccountNumber' },
    { page: 5, x: 401.7, y: 404.9, width: 92.5, height: 12.2, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 5, x: 363.0, y: 290.7, width: 64.9, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 5, x: 131.2, y: 291.0, width: 115.2, height: 12.2, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    // Page 6 - Pernyataan (pemohon + pasangan + property)
    { page: 6, x: 184.5, y: 734.8, width: 64.9, height: 12.0, source: 'applicant', field: 'fullName', bold: true },
    { page: 6, x: 186.0, y: 716.9, width: 73.5, height: 12.0, source: 'applicant', field: 'ktpNumber' },
    { page: 6, x: 186.0, y: 702.6, width: 132.8, height: 12.0, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 6, x: 187.3, y: 688.1, width: 84.1, height: 12.0, source: 'applicant', field: 'jobTitle' },
    { page: 6, x: 187.2, y: 674.5, width: 92.9, height: 12.0, source: 'applicant', field: 'address' },
    { page: 6, x: 185.4, y: 624.7, width: 115.1, height: 12.0, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 6, x: 185.4, y: 609.0, width: 123.9, height: 12.0, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 6, x: 185.4, y: 594.6, width: 181.5, height: 12.0, source: 'computed', field: 'spousePobDob', transform: spousePobDobTransform, showWhen: s => !!s.spouse?.fullName },
    { page: 6, x: 188.1, y: 581.9, width: 131.7, height: 12.0, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 6, x: 187.2, y: 566.6, width: 143.1, height: 12.0, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    // Page 6 property: Klaster/Blok (annotation 11) + No (annotation 12) - CORRECTED
    { page: 6, x: 216.5, y: 488.4, width: 57.5, height: 12.0, source: 'property', field: 'blockLetter' },     // Klaster/Blok (huruf: E)
    { page: 6, x: 248.3, y: 487.5, width: 68.4, height: 12.0, source: 'property', field: 'houseNumber' },    // No (angka: 6)
    { page: 6, x: 116.8, y: 256.0, width: 115.4, height: 12.2, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 6, x: 360.4, y: 256.6, width: 65.1, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 6, x: 412.0, y: 339.9, width: 94.9, height: 12.2, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    // Page 7 - CORRECTED per user feedback
    // #1 (x=93) = No KTP Debitur → ktpNumber (was blockLetter)
    { page: 7, x: 93.0, y: 461.6, width: 73.5, height: 12.0, source: 'applicant', field: 'ktpNumber' },
    // #2 (x=200) = Nama Lengkap Debitur → fullName (was houseNumber)
    { page: 7, x: 200.2, y: 462.3, width: 108.0, height: 12.0, source: 'applicant', field: 'fullName', bold: true },
    // #3 (x=410) = Blok dan No Rumah → blokKavling E6 (was houseAddress)
    { page: 7, x: 410.2, y: 461.6, width: 94.5, height: 12.0, source: 'computed', field: 'blokKavling', transform: blokKavlingTransform },
    { page: 7, x: 394.7, y: 392.8, width: 94.9, height: 12.2, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 7, x: 379.5, y: 269.6, width: 68.3, height: 12.0, source: 'company', field: 'director', bold: true },
    // Page 8 - PSU page 1
    { page: 8, x: 223.4, y: 414.3, width: 57.3, height: 12.0, source: 'property', field: 'blockLetter' },     // Blok (huruf)
    { page: 8, x: 288.4, y: 413.7, width: 68.6, height: 12.0, source: 'property', field: 'houseNumber' },    // Nomor (angka)
    { page: 8, x: 451.0, y: 281.8, width: 94.7, height: 12.2, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
    // Page 9 - PSU page 2 (pemohon + pasangan)
    { page: 9, x: 188.8, y: 621.8, width: 64.9, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 9, x: 189.9, y: 605.2, width: 73.6, height: 12.2, source: 'applicant', field: 'ktpNumber' },
    { page: 9, x: 190.9, y: 581.4, width: 84.1, height: 12.2, source: 'applicant', field: 'jobTitle' },
    { page: 9, x: 192.0, y: 561.9, width: 67.9, height: 12.2, source: 'applicant', field: 'address' },
    { page: 9, x: 189.1, y: 520.0, width: 112.3, height: 12.2, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 9, x: 189.5, y: 499.7, width: 103.6, height: 12.2, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 9, x: 190.6, y: 479.9, width: 131.4, height: 12.2, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 9, x: 189.9, y: 458.2, width: 139.0, height: 12.2, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    // Page 9 property: Blok (annotation 9) + Nomor (annotation 10) - CORRECTED
    { page: 9, x: 110.0, y: 398.9, width: 53.6, height: 12.1, source: 'property', field: 'blockLetter' },     // Blok (huruf)
    { page: 9, x: 168.3, y: 398.4, width: 62.5, height: 12.1, source: 'property', field: 'houseNumber' },    // Nomor (angka)
    { page: 9, x: 457.9, y: 307.6, width: 92.8, height: 12.1, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
    { page: 9, x: 389.6, y: 199.5, width: 63.1, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    // Page 10 - PSU page 3
    { page: 10, x: 280.6, y: 368.1, width: 106.3, height: 12.3, source: 'computed', field: 'blokKavling', transform: blokKavlingTransform }, // Blok (E6)
    { page: 10, x: 424.3, y: 225.2, width: 92.6, height: 12.1, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
    // Page 11 - CORRECTED per user feedback
    // #1 (x=104) = Nama Debitur → fullName (was blockLetter)
    { page: 11, x: 104.7, y: 394.8, width: 63.2, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    // #2 (x=236) = Nama Perumahan → projectName (was houseNumber)
    { page: 11, x: 236.0, y: 394.3, width: 84.2, height: 12.2, source: 'property', field: 'projectName' },
    { page: 11, x: 434.5, y: 234.9, width: 92.5, height: 12.3, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
  ],
}

// ============================================================
// 2. SURAT LPA & AKAD (btn-surat-lpa-akad.pdf, 2 pages, 20 annotations)
//    Page 1 = Surat LPA, Page 2 = Surat Akad
// ============================================================
const SURAT_LPA: AjbDocConfig = {
  id: 'surat-lpa',
  name: 'Surat LPA & Akad',
  templatePath: '/public/templates/btn-surat-lpa-akad.pdf',
  fields: [
    // === PAGE 1 = SURAT LPA ===
    // Nomor: [lpaNumber]/MBP/LPA/[romanMonth]/[year]
    { page: 1, x: 149.4, y: 714.8, width: 78.7, height: 12.4, source: 'computed', field: 'lpaNumber', transform: (_v, s) => s.lpaNumber || '001' },
    { page: 1, x: 238.6, y: 714.7, width: 91.1, height: 12.5, source: 'computed', field: 'romanMonth', transform: () => romanMonthTransform() },
    { page: 1, x: 262.2, y: 714.2, width: 26.4, height: 12.0, source: 'computed', field: 'year', transform: () => currentYearTransform() },
    // Date "Pangkalpinang," → today's date (realtime)
    { page: 1, x: 435.0, y: 741.6, width: 92.4, height: 12.5, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Property table (5 fields, y~438) — SHIFTED LEFT by 1 position per user feedback:
    // #5 (x=109.5) = Nama Debitur (was blokKavling)
    { page: 1, x: 109.5, y: 438.2, width: 63.3, height: 12.5, source: 'applicant', field: 'fullName', bold: true },
    // #6 (x=258.3) = Luas Tanah (was fullName)
    { page: 1, x: 258.3, y: 438.7, width: 52.1, height: 12.5, source: 'property', field: 'landSize' },
    // #7 (x=304.4) = Luas Bangunan (was landSize)
    { page: 1, x: 304.4, y: 437.8, width: 73.9, height: 12.5, source: 'property', field: 'houseSize' },
    // #8 (x=372.1) = Blok dan No rumah (was houseSize)
    { page: 1, x: 372.1, y: 437.3, width: 90.4, height: 12.5, source: 'computed', field: 'blokKavling', transform: blokKavlingTransform },
    // #9 (x=408.1) = Nomor Sertipikat (stays shmNumber)
    { page: 1, x: 408.1, y: 436.8, width: 78.5, height: 12.5, source: 'property', field: 'shmNumber' },
    // #10 = "Pada" → Hari Tanggal bulan tahun LPA from form
    { page: 1, x: 335.3, y: 507.7, width: 138.8, height: 12.0, source: 'computed', field: 'lpaDateFull', transform: lpaDateFullTransform },

    // === PAGE 2 = SURAT AKAD ===
    // #1 = "Pada" → Hari Tanggal bulan tahun Akad from form
    { page: 2, x: 260.2, y: 508.1, width: 143.3, height: 12.5, source: 'computed', field: 'akadDateFull', transform: akadDateFullTransform },
    // Nomor: [akadNumber]/MBP/Akad/[romanMonth]/[year]
    { page: 2, x: 149.5, y: 714.9, width: 78.7, height: 12.3, source: 'computed', field: 'akadNumber', transform: (_v, s) => s.akadNumber || '001' },
    { page: 2, x: 242.2, y: 714.7, width: 91.1, height: 12.5, source: 'computed', field: 'romanMonth', transform: () => romanMonthTransform() },
    { page: 2, x: 275.2, y: 714.0, width: 26.3, height: 12.5, source: 'computed', field: 'year', transform: () => currentYearTransform() },
    // Date "Pangkalpinang," → today's date (realtime)
    { page: 2, x: 433.9, y: 741.1, width: 92.4, height: 12.5, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Property table (5 fields, y~438) — SHIFTED LEFT by 1 position per user feedback:
    { page: 2, x: 107.4, y: 439.1, width: 63.3, height: 12.5, source: 'applicant', field: 'fullName', bold: true },  // Nama Debitur (was blokKavling)
    { page: 2, x: 260.0, y: 438.4, width: 52.1, height: 12.5, source: 'property', field: 'landSize' },               // Luas Tanah (was fullName)
    { page: 2, x: 303.7, y: 437.8, width: 73.9, height: 12.5, source: 'property', field: 'houseSize' },              // Luas Bangunan (was landSize)
    { page: 2, x: 370.4, y: 437.8, width: 90.4, height: 12.5, source: 'computed', field: 'blokKavling', transform: blokKavlingTransform }, // Blok dan No rumah (was houseSize)
    { page: 2, x: 408.1, y: 437.8, width: 78.5, height: 12.5, source: 'property', field: 'shmNumber' },              // Nomor Sertipikat (stays)
  ],
}

// ============================================================
// ALL AJB DOCUMENTS (2 docs - Surat LPA includes Akad in same file)
// ============================================================
export const AJB_DOCUMENTS: AjbDocConfig[] = [AJB_BANK, SURAT_LPA]

export function getAjbDoc(docId: string): AjbDocConfig | undefined {
  return AJB_DOCUMENTS.find(d => d.id === docId)
}
