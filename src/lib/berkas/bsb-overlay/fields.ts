// ============================================================
// BSB SYARIAH FIELD CONFIG
// 6 documents, 156 total fields from user annotations
// ============================================================

import type { BerkasState } from '@/lib/berkas/types'
import type { CompanyInfo } from '@/lib/berkas/types'

export interface BsbField {
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

export interface BsbDocConfig {
  id: string
  name: string
  templatePath: string
  fields: BsbField[]
}

function formatDate(d: string): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

function pobDobTransform(_v: any, s: BerkasState): string {
  return s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : ''
}

function spousePobDobTransform(_v: any, s: BerkasState): string {
  return s.spouse ? `${s.spouse.pob}, ${formatDate(s.spouse.dob)}` : ''
}

function todayDateTransform(): string {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function romanMonthTransform(): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romans[new Date().getMonth()]
}

function currentYearTransform(): string {
  return new Date().getFullYear().toString()
}

// ============================================================
// 1. BSB FLPP (14 pages, 109 annotations)
// ============================================================
const BSB_FLPP: BsbDocConfig = {
  id: 'bsb-flpp',
  name: 'Form FLPP (BSB)',
  templatePath: '/public/templates/bsb-flpp.pdf',
  fields: [
    // Page 1 - Pemohon
    { page: 1, x: 225.9, y: 635.6, width: 65.5, height: 12.6, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 225.9, y: 611.1, width: 129.8, height: 12.5, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 1, x: 229.3, y: 586.1, width: 84.3, height: 12.5, source: 'applicant', field: 'jobTitle' },
    { page: 1, x: 230.5, y: 560.8, width: 73.8, height: 12.5, source: 'applicant', field: 'ktpNumber' },
    { page: 1, x: 230.5, y: 534.3, width: 93.0, height: 12.5, source: 'applicant', field: 'address' },
    { page: 1, x: 435.6, y: 361.2, width: 66.8, height: 12.5, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 2 - Pemohon + income
    { page: 2, x: 260.0, y: 658.8, width: 65.0, height: 12.5, source: 'applicant', field: 'fullName', bold: true },
    { page: 2, x: 258.8, y: 632.0, width: 129.8, height: 12.5, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 2, x: 260.6, y: 609.8, width: 84.3, height: 12.5, source: 'applicant', field: 'jobTitle' },
    { page: 2, x: 260.6, y: 583.5, width: 73.8, height: 12.5, source: 'applicant', field: 'ktpNumber' },
    { page: 2, x: 262.3, y: 559.6, width: 93.0, height: 12.5, source: 'applicant', field: 'address' },
    { page: 2, x: 395.4, y: 517.0, width: 94.8, height: 12.5, source: 'computed', field: 'incomeFmt', transform: (_v, s) => s.applicant.monthlyIncome ? s.applicant.monthlyIncome.toLocaleString('id-ID') : '' },
    { page: 2, x: 90.8, y: 494.3, width: 212.0, height: 12.5, source: 'computed', field: 'incomeWords', transform: (_v, s) => s.applicant.monthlyIncome ? `(${numberToWords(s.applicant.monthlyIncome)} Rupiah) per-bulan.` : '' },
    { page: 2, x: 463.0, y: 386.3, width: 66.8, height: 12.5, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 3 - Pemohon + Pasangan + property + signatures
    { page: 3, x: 225.4, y: 710.2, width: 65.2, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 3, x: 223.9, y: 695.4, width: 129.8, height: 12.1, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 3, x: 224.8, y: 679.1, width: 84.2, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 3, x: 227.4, y: 663.8, width: 73.7, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 3, x: 228.5, y: 649.8, width: 93.1, height: 12.3, source: 'applicant', field: 'address' },
    { page: 3, x: 225.1, y: 622.0, width: 115.0, height: 12.1, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 3, x: 225.1, y: 606.9, width: 178.8, height: 12.1, source: 'computed', field: 'spousePobDob', transform: spousePobDobTransform, showWhen: s => !!s.spouse?.fullName },
    { page: 3, x: 223.9, y: 592.4, width: 134.5, height: 12.1, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 3, x: 225.1, y: 577.3, width: 123.7, height: 12.1, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 3, x: 224.7, y: 561.1, width: 143.0, height: 12.1, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    { page: 3, x: 144.2, y: 497.5, width: 93.0, height: 12.1, source: 'property', field: 'projectName' },
    { page: 3, x: 147.4, y: 462.5, width: 65.4, height: 12.1, source: 'computed', field: 'priceWords', transform: (_v, s) => s.property.price ? `(${numberToWords(s.property.price)})` : '' },
    { page: 3, x: 163.0, y: 450.6, width: 167.5, height: 12.1, source: 'company', field: 'name' },
    { page: 3, x: 139.9, y: 100.1, width: 113.3, height: 12.3, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 3, x: 413.4, y: 99.4, width: 65.1, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 3, x: 128.9, y: 217.7, width: 92.7, height: 12.1, source: 'computed', field: 'dateFull', transform: (_v, s) => s.dateOfDocument ? formatDate(s.dateOfDocument) : '' },
    // Page 4 - Data debitur (with Alamat Domisili + Email)
    { page: 4, x: 223.7, y: 506.5, width: 64.9, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 4, x: 222.6, y: 487.2, width: 73.7, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 4, x: 225.4, y: 470.0, width: 93.1, height: 12.3, source: 'applicant', field: 'address' },
    { page: 4, x: 228.1, y: 451.8, width: 104.7, height: 12.3, source: 'applicant', field: 'domicileAddress' },
    { page: 4, x: 225.9, y: 394.3, width: 84.2, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 4, x: 229.3, y: 377.1, width: 67.6, height: 12.3, source: 'applicant', field: 'phone' },
    { page: 4, x: 232.0, y: 358.1, width: 101.1, height: 12.6, source: 'applicant', field: 'email' },
    // Page 5 - Pemohon + Pasangan
    { page: 5, x: 188.2, y: 683.5, width: 65.0, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 5, x: 187.8, y: 667.5, width: 130.0, height: 12.3, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 5, x: 190.5, y: 652.8, width: 82.4, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 5, x: 191.4, y: 637.3, width: 73.7, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 5, x: 192.2, y: 621.7, width: 67.9, height: 12.3, source: 'applicant', field: 'address' },
    { page: 5, x: 193.3, y: 606.6, width: 65.9, height: 12.3, source: 'applicant', field: 'phone' },
    { page: 5, x: 187.8, y: 568.1, width: 120.9, height: 12.3, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 5, x: 187.8, y: 551.6, width: 179.1, height: 12.3, source: 'computed', field: 'spousePobDob', transform: spousePobDobTransform, showWhen: s => !!s.spouse?.fullName },
    { page: 5, x: 187.3, y: 537.8, width: 131.4, height: 12.3, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 5, x: 189.1, y: 521.8, width: 122.7, height: 12.3, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 5, x: 188.7, y: 506.2, width: 117.2, height: 12.3, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    { page: 5, x: 190.5, y: 490.6, width: 115.2, height: 12.3, source: 'spouse', field: 'phone', showWhen: s => !!s.spouse?.fullName },
    { page: 5, x: 75.1, y: 184.0, width: 92.9, height: 12.2, source: 'computed', field: 'dateFull', transform: (_v, s) => s.dateOfDocument ? formatDate(s.dateOfDocument) : '' },
    // Page 7 - Pemohon + Pasangan + property
    { page: 7, x: 263.8, y: 697.5, width: 63.2, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 7, x: 262.4, y: 678.8, width: 129.8, height: 12.2, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 7, x: 263.3, y: 658.6, width: 82.5, height: 12.2, source: 'applicant', field: 'jobTitle' },
    { page: 7, x: 264.4, y: 639.5, width: 73.4, height: 12.2, source: 'applicant', field: 'ktpNumber' },
    { page: 7, x: 263.8, y: 621.0, width: 67.9, height: 12.2, source: 'applicant', field: 'address' },
    { page: 7, x: 259.6, y: 587.7, width: 112.1, height: 12.2, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 7, x: 261.9, y: 570.1, width: 178.7, height: 12.2, source: 'computed', field: 'spousePobDob', transform: spousePobDobTransform, showWhen: s => !!s.spouse?.fullName },
    { page: 7, x: 262.2, y: 552.4, width: 130.3, height: 12.2, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 7, x: 261.9, y: 533.9, width: 122.7, height: 12.2, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 7, x: 266.1, y: 514.1, width: 116.4, height: 13.2, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    { page: 7, x: 285.6, y: 431.5, width: 167.9, height: 12.6, source: 'company', field: 'name' },
    { page: 7, x: 433.2, y: 239.7, width: 63.4, height: 12.2, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 8 - Pemohon (with Dinas/Instansi)
    { page: 8, x: 189.6, y: 708.2, width: 63.2, height: 12.6, source: 'applicant', field: 'fullName', bold: true },
    { page: 8, x: 194.5, y: 682.2, width: 73.7, height: 12.6, source: 'applicant', field: 'ktpNumber' },
    { page: 8, x: 193.8, y: 654.8, width: 69.6, height: 12.6, source: 'applicant', field: 'address' },
    { page: 8, x: 198.7, y: 627.4, width: 82.9, height: 12.6, source: 'applicant', field: 'jobTitle' },
    { page: 8, x: 200.9, y: 602.8, width: 95.5, height: 12.6, source: 'applicant', field: 'companyName' },
    { page: 8, x: 437.7, y: 245.4, width: 63.8, height: 12.5, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 9 - Pemohon
    { page: 9, x: 191.6, y: 675.3, width: 63.8, height: 12.5, source: 'applicant', field: 'fullName', bold: true },
    { page: 9, x: 191.6, y: 652.6, width: 127.5, height: 12.6, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 9, x: 194.9, y: 630.4, width: 81.4, height: 12.6, source: 'applicant', field: 'jobTitle' },
    { page: 9, x: 199.2, y: 609.3, width: 73.9, height: 12.6, source: 'applicant', field: 'ktpNumber' },
    { page: 9, x: 201.1, y: 585.7, width: 124.3, height: 12.2, source: 'applicant', field: 'address' },
    { page: 9, x: 468.3, y: 418.5, width: 63.3, height: 12.5, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 10 - Pemohon + Pasangan
    { page: 10, x: 190.7, y: 681.6, width: 63.3, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 10, x: 191.3, y: 663.3, width: 127.3, height: 12.3, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 10, x: 191.3, y: 649.4, width: 81.2, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 10, x: 192.6, y: 633.7, width: 73.5, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 10, x: 192.1, y: 618.5, width: 124.5, height: 12.3, source: 'applicant', field: 'address' },
    { page: 10, x: 192.5, y: 603.8, width: 65.0, height: 12.3, source: 'applicant', field: 'phone' },
    { page: 10, x: 188.6, y: 563.6, width: 112.1, height: 12.3, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 10, x: 187.7, y: 549.6, width: 176.4, height: 12.3, source: 'computed', field: 'spousePobDob', transform: spousePobDobTransform, showWhen: s => !!s.spouse?.fullName },
    { page: 10, x: 188.3, y: 534.9, width: 130.3, height: 12.3, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 10, x: 188.3, y: 518.7, width: 122.6, height: 12.3, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 10, x: 189.1, y: 504.3, width: 173.4, height: 12.3, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    { page: 10, x: 188.0, y: 489.1, width: 114.2, height: 12.3, source: 'spouse', field: 'phone', showWhen: s => !!s.spouse?.fullName },
    // Page 11 - Pemohon
    { page: 11, x: 193.8, y: 658.4, width: 65.1, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 11, x: 195.3, y: 630.8, width: 71.8, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 11, x: 197.2, y: 601.3, width: 68.0, height: 12.3, source: 'applicant', field: 'address' },
    { page: 11, x: 198.1, y: 576.5, width: 82.7, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 11, x: 460.0, y: 395.8, width: 65.4, height: 12.1, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 12 - Bendaharawan/Atasan (NIP, Jabatan, Instansi)
    { page: 12, x: 224.5, y: 624.3, width: 62.8, height: 12.4, source: 'applicant', field: 'fullName', bold: true },
    { page: 12, x: 228.1, y: 604.1, width: 101.6, height: 12.3, source: 'applicant', field: 'nip' },
    { page: 12, x: 228.9, y: 583.3, width: 72.5, height: 12.4, source: 'applicant', field: 'jobTitle' },
    { page: 12, x: 231.4, y: 561.8, width: 88.8, height: 12.4, source: 'applicant', field: 'companyName' },
    { page: 12, x: 232.6, y: 516.3, width: 63.2, height: 12.4, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 12, x: 234.2, y: 494.7, width: 103.8, height: 12.4, source: 'spouse', field: 'nip', showWhen: s => !!s.spouse?.fullName },
    { page: 12, x: 236.0, y: 476.1, width: 70.1, height: 12.4, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 12, x: 231.8, y: 454.5, width: 88.8, height: 12.4, source: 'spouse', field: 'companyName', showWhen: s => !!s.spouse?.fullName },
    { page: 12, x: 281.6, y: 385.6, width: 87.1, height: 12.4, source: 'company', field: 'name' },
    { page: 12, x: 440.1, y: 253.7, width: 63.2, height: 12.3, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    // Page 14 - Pemohon
    { page: 14, x: 191.3, y: 597.8, width: 63.2, height: 12.5, source: 'applicant', field: 'fullName', bold: true },
    { page: 14, x: 195.1, y: 573.3, width: 127.4, height: 12.5, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 14, x: 190.5, y: 547.7, width: 81.2, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 14, x: 193.2, y: 525.0, width: 66.6, height: 12.3, source: 'applicant', field: 'address' },
    { page: 14, x: 197.4, y: 499.2, width: 63.9, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 14, x: 466.7, y: 199.9, width: 63.4, height: 12.3, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
  ],
}

// ============================================================
// 2. BSB SPR / Surat Penawaran Rumah (1 page, 7 annotations)
// ============================================================
const BSB_SPR: BsbDocConfig = {
  id: 'bsb-spr',
  name: 'Surat Penawaran Rumah (BSB)',
  templatePath: '/public/templates/bsb-spr.pdf',
  fields: [
    { page: 1, x: 95.8, y: 593.9, width: 63.3, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 323.7, y: 446.5, width: 88.2, height: 12.1, source: 'computed', field: 'blokKavling', transform: (_v: any, s: BerkasState) => `${s.property.blockLetter || ''}-${s.property.houseNumber || ''}` },
    { page: 1, x: 216.6, y: 430.8, width: 52.1, height: 12.0, source: 'property', field: 'landSize' },
    { page: 1, x: 432.5, y: 745.4, width: 92.3, height: 12.2, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    { page: 1, x: 113.5, y: 721.5, width: 39.8, height: 12.2, source: 'computed', field: 'sprSeq', transform: () => '001' },
    { page: 1, x: 180.1, y: 720.1, width: 90.5, height: 12.2, source: 'computed', field: 'romanMonth', transform: () => romanMonthTransform() },
    { page: 1, x: 212.5, y: 719.5, width: 28.7, height: 12.2, source: 'computed', field: 'year', transform: () => currentYearTransform() },
  ],
}

// ============================================================
// 3. BSB Form Permohonan Fasilitas Pembiayaan (1 page, 7 annotations)
// ============================================================
const BSB_PERMOHONAN: BsbDocConfig = {
  id: 'bsb-permohonan',
  name: 'Form Permohonan (BSB)',
  templatePath: '/public/templates/bsb-permohonan.pdf',
  fields: [
    { page: 1, x: 298.4, y: 604.7, width: 63.0, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 298.7, y: 589.0, width: 162.0, height: 12.2, source: 'applicant', field: 'jobType' },
    { page: 1, x: 302.0, y: 574.9, width: 133.2, height: 12.2, source: 'applicant', field: 'companyAddress' },
    { page: 1, x: 301.6, y: 562.1, width: 91.5, height: 12.2, source: 'applicant', field: 'address' },
    { page: 1, x: 303.9, y: 548.3, width: 65.0, height: 12.2, source: 'applicant', field: 'phone' },
    { page: 1, x: 130.3, y: 190.8, width: 63.1, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 358.9, y: 191.2, width: 112.3, height: 12.2, source: 'company', field: 'director', bold: true },
  ],
}

// ============================================================
// 4. BSB Surat Kuasa Kepada Bendaharawan (2 pages, 12 annotations)
// ============================================================
const BSB_KUASA_BENDAHARAWAN: BsbDocConfig = {
  id: 'bsb-kuasa-bendaharawan',
  name: 'Surat Kuasa Bendaharawan (BSB)',
  templatePath: '/public/templates/bsb-kuasa-bendaharawan.pdf',
  fields: [
    // Page 1 - Pemberi Kuasa (debitur)
    { page: 1, x: 202.9, y: 704.8, width: 61.5, height: 12.0, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 201.9, y: 693.5, width: 66.6, height: 12.0, source: 'applicant', field: 'address' },
    { page: 1, x: 201.4, y: 681.9, width: 103.8, height: 12.2, source: 'applicant', field: 'nip' },
    { page: 1, x: 200.5, y: 670.8, width: 72.5, height: 12.2, source: 'applicant', field: 'jobTitle' },
    { page: 1, x: 201.0, y: 660.0, width: 93.0, height: 12.2, source: 'applicant', field: 'companyName' },
    { page: 1, x: 201.3, y: 649.5, width: 127.4, height: 12.2, source: 'applicant', field: 'companyAddress' },
    // Page 1 - Penerima Kuasa (bendaharawan)
    { page: 1, x: 201.6, y: 605.9, width: 256.5, height: 12.1, source: 'applicant', field: 'bendaharawanName' },
    { page: 1, x: 201.1, y: 595.4, width: 101.6, height: 12.1, source: 'applicant', field: 'bendaharawanNip' },
    // Page 1 - date + signatures
    { page: 1, x: 355.2, y: 194.6, width: 52.6, height: 12.0, source: 'computed', field: 'romanMonth', transform: () => romanMonthTransform() },
    { page: 1, x: 423.5, y: 194.9, width: 94.8, height: 12.0, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    { page: 1, x: 380.5, y: 84.7, width: 63.1, height: 12.1, source: 'applicant', field: 'bendaharawanName' },
    { page: 1, x: 120.6, y: 85.8, width: 256.5, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
  ],
}

// ============================================================
// 5. BSB Surat Pernyataan (3 pages, 8 annotations)
// ============================================================
const BSB_PERNYATAAN: BsbDocConfig = {
  id: 'bsb-pernyataan',
  name: 'Surat Pernyataan (BSB)',
  templatePath: '/public/templates/bsb-pernyataan.pdf',
  fields: [
    { page: 1, x: 204.8, y: 650.2, width: 256.4, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 205.3, y: 637.6, width: 299.0, height: 12.2, source: 'applicant', field: 'address' },
    { page: 1, x: 206.9, y: 625.0, width: 316.6, height: 12.1, source: 'applicant', field: 'nip' },
    { page: 1, x: 177.6, y: 588.8, width: 87.8, height: 12.3, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    { page: 1, x: 309.2, y: 589.2, width: 106.5, height: 12.3, source: 'computed', field: 'location', transform: () => 'Pangkalpinang' },
    { page: 1, x: 160.9, y: 576.4, width: 70.7, height: 12.3, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    { page: 1, x: 118.0, y: 118.6, width: 62.7, height: 12.4, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 367.7, y: 107.3, width: 238.7, height: 23.7, source: 'applicant', field: 'nip' },
  ],
}

// ============================================================
// 6. BSB SBUM (2 pages, 13 annotations)
// ============================================================
const BSB_SBUM: BsbDocConfig = {
  id: 'bsb-sbum',
  name: 'SBUM (BSB)',
  templatePath: '/public/templates/bsb-sbum.pdf',
  fields: [
    // Page 1
    { page: 1, x: 201.3, y: 622.7, width: 65.3, height: 12.5, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 201.1, y: 609.3, width: 73.4, height: 12.1, source: 'applicant', field: 'ktpNumber' },
    { page: 1, x: 199.5, y: 596.9, width: 129.8, height: 12.4, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 1, x: 200.3, y: 585.3, width: 82.4, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 1, x: 198.8, y: 571.8, width: 135.7, height: 12.1, source: 'applicant', field: 'address' },
    { page: 1, x: 401.9, y: 294.4, width: 92.3, height: 12.1, source: 'computed', field: 'todayDate', transform: () => todayDateTransform() },
    { page: 1, x: 389.5, y: 193.5, width: 61.5, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    // Page 2
    { page: 2, x: 202.1, y: 725.3, width: 65.0, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    { page: 2, x: 202.1, y: 710.5, width: 73.9, height: 12.5, source: 'applicant', field: 'ktpNumber' },
    { page: 2, x: 200.9, y: 696.7, width: 129.8, height: 12.4, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 2, x: 205.1, y: 685.2, width: 82.7, height: 12.2, source: 'applicant', field: 'jobTitle' },
    { page: 2, x: 205.2, y: 672.7, width: 136.1, height: 12.7, source: 'applicant', field: 'address' },
    { page: 2, x: 379.2, y: 370.0, width: 63.7, height: 12.7, source: 'company', field: 'director', bold: true },
  ],
}

// ============================================================
// ALL BSB DOCUMENTS
// ============================================================
export const BSB_DOCUMENTS: BsbDocConfig[] = [
  BSB_FLPP, BSB_SPR, BSB_PERMOHONAN, BSB_KUASA_BENDAHARAWAN, BSB_PERNYATAAN, BSB_SBUM,
]

export function getBsbDoc(docId: string): BsbDocConfig | undefined {
  return BSB_DOCUMENTS.find(d => d.id === docId)
}

function numberToWords(num: number): string {
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
