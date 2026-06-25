// ============================================================
// AJB BTN FIELD CONFIG - Post-SP3K Documents
// 2 files, 3 documents, 93 total fields from user annotations
//
// Files:
// 1. btn-ajb-bank.pdf (11 pages, 73 annotations) - AJB Bank document
// 2. btn-surat-lpa-akad.pdf (2 pages, 20 annotations)
//    - Page 1 = Surat LPA (10 annotations)
//    - Page 2 = Surat Akad (10 annotations)
//
// NOTE: Annotations NOT removed yet (user wants to verify first)
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

function akadDateTransform(_v: any, s: BerkasState): string {
  if (!s.akadDate) return ''
  const d = new Date(s.akadDate)
  return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
}

function lpaDateTransform(_v: any, s: BerkasState): string {
  if (!s.lpaDate) return ''
  const d = new Date(s.lpaDate)
  return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
}

function pobDobTransform(_v: any, s: BerkasState): string {
  return s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : ''
}

function spousePobDobTransform(_v: any, s: BerkasState): string {
  return s.spouse ? `${s.spouse.pob}, ${formatDate(s.spouse.dob)}` : ''
}

function typeLuasTransform(_v: any, s: BerkasState): string {
  return s.property.landSize ? `${s.property.landSize} / ${s.property.houseSize || 36} m²` : ''
}

// ============================================================
// 1. AJB BANK (btn-ajb-bank.pdf, 11 pages, 73 annotations)
//    File ini berisi multiple dokumen dalam 1 PDF:
//    - Pages 1-2: Form utama AJB Bank
//    - Pages 4-5: Surat lain (Standing Instruction, dll)
//    - Pages 6-11: Dokumen tambahan (SPSU, PSU, dll yang user gabung)
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
    { page: 2, x: 217.6, y: 565.7, width: 85.4, height: 12.1, source: 'property', field: 'projectName' },
    { page: 2, x: 218.5, y: 553.7, width: 57.3, height: 12.1, source: 'property', field: 'kavlingNumber' },
    { page: 2, x: 223.9, y: 539.8, width: 137.3, height: 12.1, source: 'computed', field: 'typeLuas', transform: typeLuasTransform },
    { page: 2, x: 223.0, y: 526.0, width: 89.0, height: 12.1, source: 'property', field: 'houseAddress' },
    { page: 2, x: 433.9, y: 316.4, width: 94.8, height: 12.1, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 2, x: 414.7, y: 227.4, width: 63.1, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    { page: 2, x: 461.6, y: 483.4, width: 64.9, height: 12.2, source: 'company', field: 'director', bold: true },
    // Page 4 - Data debitur (form lain)
    { page: 4, x: 207.4, y: 634.6, width: 65.0, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 4, x: 206.5, y: 617.2, width: 73.6, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 4, x: 211.1, y: 603.1, width: 129.7, height: 12.3, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 4, x: 206.8, y: 587.4, width: 84.1, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 4, x: 209.4, y: 572.3, width: 65.1, height: 12.3, source: 'applicant', field: 'phone' },
    { page: 4, x: 212.4, y: 556.2, width: 124.4, height: 12.3, source: 'applicant', field: 'address' },
    // Page 5 - Standing Instruction / form lain
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
    { page: 6, x: 216.5, y: 488.4, width: 57.5, height: 12.0, source: 'property', field: 'kavlingNumber' },
    { page: 6, x: 248.3, y: 487.5, width: 68.4, height: 12.0, source: 'property', field: 'projectName' },
    { page: 6, x: 116.8, y: 256.0, width: 115.4, height: 12.2, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 6, x: 360.4, y: 256.6, width: 65.1, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 6, x: 412.0, y: 339.9, width: 94.9, height: 12.2, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    // Page 7 - SPSU page 1
    { page: 7, x: 93.0, y: 461.6, width: 73.5, height: 12.0, source: 'property', field: 'kavlingNumber' },
    { page: 7, x: 200.2, y: 462.3, width: 108.0, height: 12.0, source: 'property', field: 'projectName' },
    { page: 7, x: 410.2, y: 461.6, width: 94.5, height: 12.0, source: 'property', field: 'houseAddress' },
    { page: 7, x: 394.7, y: 392.8, width: 94.9, height: 12.2, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 7, x: 379.5, y: 269.6, width: 68.3, height: 12.0, source: 'company', field: 'director', bold: true },
    // Page 8 - PSU page 1
    { page: 8, x: 223.4, y: 414.3, width: 57.3, height: 12.0, source: 'property', field: 'projectName' },
    { page: 8, x: 288.4, y: 413.7, width: 68.6, height: 12.0, source: 'property', field: 'kavlingNumber' },
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
    { page: 9, x: 110.0, y: 398.9, width: 53.6, height: 12.1, source: 'property', field: 'kavlingNumber' },
    { page: 9, x: 168.3, y: 398.4, width: 62.5, height: 12.1, source: 'property', field: 'projectName' },
    { page: 9, x: 457.9, y: 307.6, width: 92.8, height: 12.1, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
    { page: 9, x: 389.6, y: 199.5, width: 63.1, height: 12.1, source: 'applicant', field: 'fullName', bold: true },
    // Page 10 - PSU page 3
    { page: 10, x: 280.6, y: 368.1, width: 106.3, height: 12.3, source: 'property', field: 'kavlingNumber' },
    { page: 10, x: 424.3, y: 225.2, width: 92.6, height: 12.1, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
    // Page 11 - PSU page 4
    { page: 11, x: 104.7, y: 394.8, width: 63.2, height: 12.2, source: 'property', field: 'kavlingNumber' },
    { page: 11, x: 236.0, y: 394.3, width: 84.2, height: 12.2, source: 'property', field: 'projectName' },
    { page: 11, x: 434.5, y: 234.9, width: 92.5, height: 12.3, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
  ],
}

// ============================================================
// 2. SURAT LPA (page 1 of btn-surat-lpa-akad.pdf, 10 annotations)
// ============================================================
const SURAT_LPA: AjbDocConfig = {
  id: 'surat-lpa',
  name: 'Surat LPA',
  templatePath: '/public/templates/btn-surat-lpa-akad.pdf',
  fields: [
    { page: 1, x: 149.4, y: 714.8, width: 78.7, height: 12.4, source: 'computed', field: 'lpaNumber', transform: (_v, s) => s.lpaNumber || '001' },
    { page: 1, x: 238.6, y: 714.7, width: 91.1, height: 12.5, source: 'computed', field: 'lpaMonth', transform: (_v, s) => s.lpaDate ? new Date(s.lpaDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '' },
    { page: 1, x: 262.2, y: 714.2, width: 26.4, height: 12.0, source: 'computed', field: 'lpaDay', transform: (_v, s) => s.lpaDate ? new Date(s.lpaDate).toLocaleDateString('id-ID', { day: '2-digit' }) : '' },
    { page: 1, x: 435.0, y: 741.6, width: 92.4, height: 12.5, source: 'computed', field: 'dateFull', transform: lpaDateTransform },
    { page: 1, x: 109.5, y: 438.2, width: 63.3, height: 12.5, source: 'property', field: 'kavlingNumber' },
    { page: 1, x: 258.3, y: 438.7, width: 52.1, height: 12.5, source: 'property', field: 'projectName' },
    { page: 1, x: 304.4, y: 437.8, width: 73.9, height: 12.5, source: 'property', field: 'houseAddress' },
    { page: 1, x: 372.1, y: 437.3, width: 90.4, height: 12.5, source: 'computed', field: 'luas', transform: (_v, s) => s.property.landSize ? `${s.property.landSize} m²` : '' },
    { page: 1, x: 408.1, y: 436.8, width: 78.5, height: 12.5, source: 'property', field: 'nibNumber' },
    { page: 1, x: 335.3, y: 507.7, width: 138.8, height: 12.0, source: 'computed', field: 'location', transform: () => 'Gabek Dua, Pangkalpinang' },
  ],
}

// ============================================================
// 3. SURAT AKAD (page 2 of btn-surat-lpa-akad.pdf, 10 annotations)
// ============================================================
const SURAT_AKAD: AjbDocConfig = {
  id: 'surat-akad',
  name: 'Surat Akad',
  templatePath: '/public/templates/btn-surat-lpa-akad.pdf',
  fields: [
    { page: 2, x: 149.5, y: 714.9, width: 78.7, height: 12.3, source: 'computed', field: 'akadNumber', transform: (_v, s) => s.akadNumber || '001' },
    { page: 2, x: 242.2, y: 714.7, width: 91.1, height: 12.5, source: 'computed', field: 'akadMonth', transform: (_v, s) => s.akadDate ? new Date(s.akadDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '' },
    { page: 2, x: 275.2, y: 714.0, width: 26.3, height: 12.5, source: 'computed', field: 'akadDay', transform: (_v, s) => s.akadDate ? new Date(s.akadDate).toLocaleDateString('id-ID', { day: '2-digit' }) : '' },
    { page: 2, x: 433.9, y: 741.1, width: 92.4, height: 12.5, source: 'computed', field: 'dateFull', transform: akadDateTransform },
    { page: 2, x: 107.4, y: 439.1, width: 63.3, height: 12.5, source: 'property', field: 'kavlingNumber' },
    { page: 2, x: 260.0, y: 438.4, width: 52.1, height: 12.5, source: 'property', field: 'projectName' },
    { page: 2, x: 303.7, y: 437.8, width: 73.9, height: 12.5, source: 'property', field: 'houseAddress' },
    { page: 2, x: 370.4, y: 437.8, width: 90.4, height: 12.5, source: 'computed', field: 'luas', transform: (_v, s) => s.property.landSize ? `${s.property.landSize} m²` : '' },
    { page: 2, x: 408.1, y: 437.8, width: 78.5, height: 12.5, source: 'property', field: 'nibNumber' },
    { page: 2, x: 260.2, y: 508.1, width: 143.3, height: 12.5, source: 'computed', field: 'location', transform: () => 'Gabek Dua, Pangkalpinang' },
  ],
}

// ============================================================
// ALL AJB DOCUMENTS (only 3 now)
// ============================================================
export const AJB_DOCUMENTS: AjbDocConfig[] = [AJB_BANK, SURAT_LPA, SURAT_AKAD]

export function getAjbDoc(docId: string): AjbDocConfig | undefined {
  return AJB_DOCUMENTS.find(d => d.id === docId)
}
