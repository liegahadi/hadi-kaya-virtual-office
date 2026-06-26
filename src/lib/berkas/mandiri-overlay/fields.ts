// ============================================================
// MANDIRI FIELD CONFIG
// Surat Pernyataan Pemohon KPR Bersubsidi (2 pages, 16 annotations)
// ============================================================

import type { BerkasState } from '@/lib/berkas/types'
import type { CompanyInfo } from '@/lib/berkas/types'

export interface MandiriField {
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

export interface MandiriDocConfig {
  id: string
  name: string
  templatePath: string
  fields: MandiriField[]
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

// ============================================================
// SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI MANDIRI
// ============================================================
const MANDIRI_PERNYATAAN_PEMOHON: MandiriDocConfig = {
  id: 'mandiri-pernyataan-pemohon',
  name: 'Surat Pernyataan Pemohon (Mandiri)',
  templatePath: '/public/templates/mandiri-pernyataan-pemohon.pdf',
  fields: [
    // Page 1 - Pemohon (annotations 1-5)
    { page: 1, x: 226.3, y: 638.7, width: 64.8, height: 12.3, source: 'applicant', field: 'fullName', bold: true },
    { page: 1, x: 225.7, y: 624.9, width: 137.0, height: 12.3, source: 'computed', field: 'pobDob', transform: pobDobTransform },
    { page: 1, x: 227.3, y: 612.6, width: 84.2, height: 12.3, source: 'applicant', field: 'jobTitle' },
    { page: 1, x: 227.3, y: 600.6, width: 73.4, height: 12.3, source: 'applicant', field: 'ktpNumber' },
    { page: 1, x: 226.7, y: 588.6, width: 92.8, height: 12.3, source: 'applicant', field: 'address' },
    // Page 1 - Pasangan (annotations 6-10)
    { page: 1, x: 225.4, y: 541.6, width: 115.2, height: 12.3, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 1, x: 225.4, y: 529.3, width: 187.4, height: 12.3, source: 'computed', field: 'spousePobDob', transform: spousePobDobTransform, showWhen: s => !!s.spouse?.fullName },
    { page: 1, x: 227.9, y: 516.1, width: 134.5, height: 12.3, source: 'spouse', field: 'job', showWhen: s => !!s.spouse?.fullName },
    { page: 1, x: 227.6, y: 503.2, width: 123.8, height: 12.3, source: 'spouse', field: 'ktpNumber', showWhen: s => !!s.spouse?.fullName },
    { page: 1, x: 227.5, y: 491.5, width: 143.0, height: 12.3, source: 'spouse', field: 'address', showWhen: s => !!s.spouse?.fullName },
    // Page 1 - Income (annotation 11)
    { page: 1, x: 489.8, y: 431.5, width: 94.7, height: 12.2, source: 'computed', field: 'incomeFmt', transform: (_v, s) => s.applicant.monthlyIncome ? `${s.applicant.monthlyIncome.toLocaleString('id-ID')},-` : '' },
    // Page 1 - Property price + PT (annotations 12-13)
    { page: 1, x: 353.2, y: 346.7, width: 65.8, height: 12.2, source: 'computed', field: 'priceFmt', transform: (_v, s) => s.property.price ? `${s.property.price.toLocaleString('id-ID')},-` : '' },
    { page: 1, x: 106.7, y: 332.7, width: 100.3, height: 12.2, source: 'company', field: 'name' },
    // Page 2 - Signatures (annotations 1-3)
    { page: 2, x: 79.2, y: 562.9, width: 115.2, height: 12.2, source: 'spouse', field: 'fullName', bold: true, showWhen: s => !!s.spouse?.fullName },
    { page: 2, x: 398.9, y: 565.2, width: 64.9, height: 12.2, source: 'applicant', field: 'fullName', bold: true },
    { page: 2, x: 458.6, y: 657.5, width: 92.4, height: 12.2, source: 'computed', field: 'dateFull', transform: (_v, s) => {
      if (!s.dateOfDocument) return ''
      const d = new Date(s.dateOfDocument)
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    }},
  ],
}

export const MANDIRI_DOCUMENTS: MandiriDocConfig[] = [MANDIRI_PERNYATAAN_PEMOHON]

export function getMandiriDoc(docId: string): MandiriDocConfig | undefined {
  return MANDIRI_DOCUMENTS.find(d => d.id === docId)
}
