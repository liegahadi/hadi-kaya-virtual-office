// ============================================================
// FLPP BTN FIELD CONFIG - Based on USER'S OWN ANNOTATIONS (102 fields)
// User manually marked EVERY fillable field across pages 1-6, 9-13
// with FreeText annotations. We extracted exact x,y,width,height.
//
// Coordinate system: PDF native (bottom-left origin)
// Annotation rect = [x1, y1_bottom, x2, y2_top]
// ============================================================

import type { BerkasState } from '@/lib/berkas/types'
import type { CompanyInfo } from '@/lib/berkas/types'

export interface FlppField {
  page: number
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  source: 'applicant' | 'spouse' | 'company' | 'property' | 'computed'
  field: string
  transform?: (val: any, state: BerkasState, company: CompanyInfo) => string
  showWhen?: (state: BerkasState) => boolean
  bold?: boolean
}

// ============================================================
// PAGE 1: Lampiran III - 18 annotations
// ============================================================
const PAGE_1_FIELDS: FlppField[] = [
  { page: 1, x: 170.22, y: 677.85, width: 64.86, height: 12.60, source: 'applicant', field: 'fullName', bold: true },
  { page: 1, x: 170.09, y: 664.69, width: 73.54, height: 12.54, source: 'applicant', field: 'ktpNumber' },
  { page: 1, x: 172.62, y: 653.32, width: 133.91, height: 12.24, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 1, x: 170.85, y: 641.30, width: 84.30, height: 12.07, source: 'applicant', field: 'jobTitle' },
  { page: 1, x: 172.88, y: 630.10, width: 127.81, height: 12.62, source: 'applicant', field: 'address' },
  { page: 1, x: 167.29, y: 588.23, width: 115.15, height: 12.11, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
  { page: 1, x: 169.83, y: 575.79, width: 123.77, height: 12.11, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
  { page: 1, x: 171.35, y: 564.37, width: 187.22, height: 12.11, source: 'computed', field: 'spousePobDob', transform: (_v, s) => s.spouse ? `${s.spouse.pob}, ${formatDate(s.spouse.dob)}` : '', showWhen: s => !!s.spouse?.fullName },
  { page: 1, x: 171.86, y: 552.19, width: 134.43, height: 12.11, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
  { page: 1, x: 172.88, y: 539.76, width: 178.07, height: 12.10, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
  { page: 1, x: 182.27, y: 438.75, width: 85.45, height: 12.11, source: 'property', field: 'projectName' },
  { page: 1, x: 49.80, y: 425.05, width: 57.28, height: 12.11, source: 'company', field: 'name' },
  { page: 1, x: 221.60, y: 425.81, width: 101.44, height: 12.11, source: 'company', field: 'name' },
  { page: 1, x: 299.56, y: 283.54, width: 85.34, height: 12.13, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
  { page: 1, x: 108.92, y: 208.12, width: 115.29, height: 12.30, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
  { page: 1, x: 361.78, y: 203.70, width: 65.13, height: 12.41, source: 'applicant', field: 'fullName', bold: true },
  { page: 1, x: 270.64, y: 172.69, width: 101.73, height: 12.32, source: 'company', field: 'name' },
  { page: 1, x: 225.19, y: 117.05, width: 125.27, height: 12.23, source: 'company', field: 'director', bold: true },
]

// ============================================================
// PAGE 2: Lampiran IV - 10 annotations
// ============================================================
const PAGE_2_FIELDS: FlppField[] = [
  { page: 2, x: 166.17, y: 695.23, width: 125.08, height: 12.23, source: 'company', field: 'director', bold: true },
  { page: 2, x: 166.21, y: 679.90, width: 151.63, height: 12.17, source: 'company', field: 'directorKtp', transform: (_v, _s, c) => (c as any).directorKtp || '' },
  { page: 2, x: 168.35, y: 669.38, width: 36.89, height: 12.17, source: 'computed', field: 'jabatan', transform: () => 'Direktur' },
  { page: 2, x: 180.37, y: 656.39, width: 101.39, height: 12.11, source: 'company', field: 'name', bold: true },
  { page: 2, x: 170.37, y: 643.80, width: 123.95, height: 12.25, source: 'company', field: 'address', transform: (_v, _s, c) => (c as any).address || c.city },
  { page: 2, x: 166.24, y: 594.52, width: 66.17, height: 12.25, source: 'applicant', field: 'fullName', bold: true },
  { page: 2, x: 169.33, y: 581.11, width: 73.40, height: 12.25, source: 'applicant', field: 'ktpNumber' },
  { page: 2, x: 170.37, y: 570.01, width: 89.90, height: 12.25, source: 'property', field: 'houseAddress' },
  { page: 2, x: 300.23, y: 492.07, width: 85.96, height: 12.74, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
  { page: 2, x: 342.03, y: 382.21, width: 125.32, height: 12.59, source: 'company', field: 'director', bold: true },
]

// ============================================================
// PAGE 3: Lampiran VI - 13 annotations
// ============================================================
const PAGE_3_FIELDS: FlppField[] = [
  { page: 3, x: 169.33, y: 649.27, width: 65.31, height: 12.55, source: 'applicant', field: 'fullName', bold: true },
  { page: 3, x: 169.86, y: 636.04, width: 133.83, height: 12.30, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 3, x: 166.82, y: 621.44, width: 84.52, height: 12.40, source: 'applicant', field: 'jobTitle' },
  { page: 3, x: 167.33, y: 604.98, width: 73.54, height: 12.54, source: 'applicant', field: 'ktpNumber' },
  { page: 3, x: 168.13, y: 591.05, width: 128.39, height: 12.57, source: 'applicant', field: 'address' },
  { page: 3, x: 167.18, y: 548.36, width: 115.05, height: 12.04, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
  { page: 3, x: 166.34, y: 532.39, width: 187.21, height: 12.30, source: 'computed', field: 'spousePobDob', transform: (_v, s) => s.spouse ? `${s.spouse.pob}, ${formatDate(s.spouse.dob)}` : '', showWhen: s => !!s.spouse?.fullName },
  { page: 3, x: 166.77, y: 517.71, width: 134.52, height: 12.00, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
  { page: 3, x: 168.54, y: 503.77, width: 123.82, height: 12.31, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
  { page: 3, x: 166.94, y: 489.02, width: 178.26, height: 12.12, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
  { page: 3, x: 436.85, y: 433.97, width: 94.96, height: 12.12, source: 'computed', field: 'incomeFmt', transform: (_v, s) => s.applicant.monthlyIncome ? `${s.applicant.monthlyIncome.toLocaleString('id-ID')},-` : '' },
  { page: 3, x: 417.73, y: 344.76, width: 97.70, height: 12.12, source: 'computed', field: 'priceFmt', transform: (_v, s) => s.property.price ? `${s.property.price.toLocaleString('id-ID')},-` : '' },
  { page: 3, x: 245.45, y: 330.38, width: 101.42, height: 12.23, source: 'company', field: 'name' },
]

// ============================================================
// PAGE 4: 3 annotations (date + 2 signatures)
// ============================================================
const PAGE_4_FIELDS: FlppField[] = [
  { page: 4, x: 302.09, y: 762.23, width: 85.34, height: 12.14, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
  { page: 4, x: 376.14, y: 653.67, width: 65.52, height: 12.22, source: 'applicant', field: 'fullName', bold: true },
  { page: 4, x: 110.49, y: 650.75, width: 115.03, height: 12.17, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
]

// ============================================================
// PAGE 5: 7 annotations
// ============================================================
const PAGE_5_FIELDS: FlppField[] = [
  { page: 5, x: 168.05, y: 674.09, width: 65.02, height: 12.22, source: 'applicant', field: 'fullName', bold: true },
  { page: 5, x: 167.34, y: 658.52, width: 73.65, height: 12.21, source: 'applicant', field: 'ktpNumber' },
  { page: 5, x: 166.87, y: 645.08, width: 133.83, height: 12.30, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 5, x: 168.14, y: 632.30, width: 84.52, height: 12.57, source: 'applicant', field: 'jobTitle' },
  { page: 5, x: 166.39, y: 619.33, width: 128.34, height: 12.13, source: 'applicant', field: 'address' },
  { page: 5, x: 302.26, y: 426.65, width: 85.46, height: 12.53, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
  { page: 5, x: 367.68, y: 338.73, width: 65.02, height: 12.54, source: 'applicant', field: 'fullName', bold: true },
]

// ============================================================
// PAGE 6: Lampiran VIII - 12 annotations
// ============================================================
const PAGE_6_FIELDS: FlppField[] = [
  { page: 6, x: 212.43, y: 656.33, width: 65.27, height: 12.08, source: 'applicant', field: 'fullName', bold: true },
  { page: 6, x: 211.68, y: 644.26, width: 73.80, height: 12.08, source: 'applicant', field: 'ktpNumber' },
  { page: 6, x: 209.49, y: 632.53, width: 128.35, height: 12.12, source: 'applicant', field: 'address' },
  { page: 6, x: 210.84, y: 621.14, width: 66.59, height: 12.03, source: 'applicant', field: 'phone' },
  { page: 6, x: 210.58, y: 581.94, width: 85.33, height: 12.08, source: 'property', field: 'projectName' },
  { page: 6, x: 210.58, y: 568.98, width: 60.43, height: 12.14, source: 'property', field: 'kavlingNumber' },
  { page: 6, x: 213.14, y: 557.86, width: 151.20, height: 12.13, source: 'computed', field: 'luas', transform: (_v, s) => s.property.landSize ? `${s.property.landSize} m²` : '' },
  { page: 6, x: 212.30, y: 546.64, width: 90.02, height: 12.14, source: 'property', field: 'houseAddress' },
  { page: 6, x: 212.30, y: 535.64, width: 79.02, height: 12.13, source: 'computed', field: 'kota', transform: () => 'Pangkalpinang, KBB' },
  { page: 6, x: 375.93, y: 317.82, width: 65.27, height: 12.09, source: 'applicant', field: 'fullName', bold: true },
  { page: 6, x: 103.45, y: 317.86, width: 125.01, height: 12.36, source: 'company', field: 'name', bold: true },
  { page: 6, x: 115.54, y: 371.76, width: 101.51, height: 12.39, source: 'company', field: 'name' },
]

// ============================================================
// PAGE 9: 10 annotations
// ============================================================
const PAGE_9_FIELDS: FlppField[] = [
  { page: 9, x: 163.86, y: 633.22, width: 65.38, height: 12.04, source: 'applicant', field: 'fullName', bold: true },
  { page: 9, x: 165.58, y: 616.57, width: 57.12, height: 12.04, source: 'applicant', field: 'ktpNumber' },
  { page: 9, x: 163.97, y: 603.72, width: 131.57, height: 12.07, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 9, x: 167.08, y: 590.12, width: 84.13, height: 12.43, source: 'applicant', field: 'jobTitle' },
  { page: 9, x: 167.92, y: 576.44, width: 92.75, height: 12.34, source: 'applicant', field: 'address' },
  { page: 9, x: 164.78, y: 529.10, width: 115.10, height: 12.38, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
  { page: 9, x: 164.32, y: 515.82, width: 107.40, height: 12.34, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
  { page: 9, x: 162.94, y: 502.05, width: 180.41, height: 12.33, source: 'computed', field: 'spousePobDob', transform: (_v, s) => s.spouse ? `${s.spouse.pob}, ${formatDate(s.spouse.dob)}` : '', showWhen: s => !!s.spouse?.fullName },
  { page: 9, x: 166.16, y: 487.81, width: 134.49, height: 12.34, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
  { page: 9, x: 166.16, y: 473.70, width: 143.29, height: 12.67, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
]

// ============================================================
// PAGE 10: 3 annotations
// ============================================================
const PAGE_10_FIELDS: FlppField[] = [
  { page: 10, x: 298.39, y: 758.53, width: 85.08, height: 12.38, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
  { page: 10, x: 367.27, y: 679.87, width: 65.02, height: 12.48, source: 'applicant', field: 'fullName', bold: true },
  { page: 10, x: 98.44, y: 679.95, width: 116.39, height: 13.68, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
]

// ============================================================
// PAGE 11: 8 annotations (Surat Kuasa)
// ============================================================
const PAGE_11_FIELDS: FlppField[] = [
  { page: 11, x: 174.75, y: 682.31, width: 65.33, height: 12.34, source: 'applicant', field: 'fullName', bold: true },
  { page: 11, x: 174.75, y: 665.31, width: 73.47, height: 12.51, source: 'applicant', field: 'ktpNumber' },
  { page: 11, x: 172.23, y: 653.00, width: 131.38, height: 12.44, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 11, x: 172.00, y: 629.44, width: 66.86, height: 12.41, source: 'applicant', field: 'phone' },
  { page: 11, x: 171.33, y: 641.24, width: 84.08, height: 12.02, source: 'applicant', field: 'jobTitle' },
  { page: 11, x: 169.93, y: 616.08, width: 126.19, height: 12.30, source: 'applicant', field: 'address' },
  { page: 11, x: 365.42, y: 79.02, width: 65.02, height: 12.32, source: 'applicant', field: 'fullName', bold: true },
  { page: 11, x: 296.58, y: 171.43, width: 85.67, height: 12.61, source: 'computed', field: 'penerimaKuasa', transform: () => 'PT. Bank BTN' },
]

// ============================================================
// PAGE 12: 10 annotations
// ============================================================
const PAGE_12_FIELDS: FlppField[] = [
  { page: 12, x: 167.26, y: 591.55, width: 64.98, height: 12.29, source: 'applicant', field: 'fullName', bold: true },
  { page: 12, x: 170.46, y: 576.01, width: 131.38, height: 12.60, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 12, x: 171.26, y: 562.13, width: 84.39, height: 12.47, source: 'applicant', field: 'jobTitle' },
  { page: 12, x: 172.14, y: 547.92, width: 73.42, height: 12.05, source: 'applicant', field: 'ktpNumber' },
  { page: 12, x: 170.56, y: 532.76, width: 126.51, height: 12.31, source: 'applicant', field: 'address' },
  { page: 12, x: 171.22, y: 465.57, width: 101.65, height: 12.58, source: 'company', field: 'name' },
  { page: 12, x: 174.91, y: 444.63, width: 90.23, height: 12.02, source: 'property', field: 'houseAddress' },
  { page: 12, x: 175.00, y: 421.49, width: 65.46, height: 12.38, source: 'computed', field: 'priceFmt', transform: (_v, s) => s.property.price ? `Rp. ${s.property.price.toLocaleString('id-ID')}` : '' },
  { page: 12, x: 284.28, y: 327.73, width: 85.72, height: 12.43, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
  { page: 12, x: 360.79, y: 231.83, width: 68.08, height: 12.43, source: 'applicant', field: 'fullName', bold: true },
]

// ============================================================
// PAGE 13: 8 annotations
// ============================================================
const PAGE_13_FIELDS: FlppField[] = [
  { page: 13, x: 171.72, y: 689.41, width: 64.85, height: 12.01, source: 'applicant', field: 'fullName', bold: true },
  { page: 13, x: 171.96, y: 672.98, width: 131.38, height: 12.60, source: 'computed', field: 'pobDob', transform: (_v, s) => s.applicant.pob ? `${s.applicant.pob}, ${formatDate(s.applicant.dob)}` : '' },
  { page: 13, x: 170.94, y: 659.81, width: 84.08, height: 12.02, source: 'applicant', field: 'jobTitle' },
  { page: 13, x: 169.83, y: 644.93, width: 73.69, height: 12.73, source: 'applicant', field: 'ktpNumber' },
  { page: 13, x: 169.81, y: 630.40, width: 126.52, height: 12.31, source: 'applicant', field: 'address' },
  { page: 13, x: 173.27, y: 528.29, width: 89.89, height: 12.18, source: 'property', field: 'houseAddress' },
  { page: 13, x: 370.88, y: 274.07, width: 64.85, height: 12.02, source: 'company', field: 'director', bold: true },
  { page: 13, x: 292.03, y: 384.52, width: 85.43, height: 12.48, source: 'computed', field: 'dateFull', transform: (_v, s) => {
    if (!s.dateOfDocument) return ''
    const d = new Date(s.dateOfDocument)
    return `Pangkalpinang, ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })} ${d.getFullYear()}`
  }},
]

// ============================================================
// ALL FIELDS - combined (102 total)
// ============================================================
export const FLPP_FIELDS: FlppField[] = [
  ...PAGE_1_FIELDS,
  ...PAGE_2_FIELDS,
  ...PAGE_3_FIELDS,
  ...PAGE_4_FIELDS,
  ...PAGE_5_FIELDS,
  ...PAGE_6_FIELDS,
  ...PAGE_9_FIELDS,
  ...PAGE_10_FIELDS,
  ...PAGE_11_FIELDS,
  ...PAGE_12_FIELDS,
  ...PAGE_13_FIELDS,
]

// ============================================================
// HELPERS
// ============================================================
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}
