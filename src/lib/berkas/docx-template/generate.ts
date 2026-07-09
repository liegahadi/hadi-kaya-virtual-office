// ============================================================
// DOCX Template Generator
// Uses docxtemplater + pizzip to replace {{placeholders}} in DOCX
// with data from BerkasState (applicant, spouse, company, property)
//
// Approach:
// 1. User provides original DOCX from bank (with "...." placeholders)
// 2. We manually create a TEMPLATE version with {{field_name}} syntax
//    by editing the original DOCX (replacing "...." with placeholders)
// 3. Template DOCX stored at /public/templates/btn-*.docx
// 4. This module loads template, replaces placeholders, returns DOCX buffer
//
// Why this is better than PDF overlay:
// - Text-based: replacements happen inline, no coordinate guessing
// - Format preserved: original DOCX layout untouched
// - Editable: user can further edit the output in Word
// - Convertible: DOCX → PDF via Word/LibreOffice/Google Docs
// ============================================================

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'

export interface DocxTemplateConfig {
  /** Path to template DOCX relative to project root (e.g. '/public/templates/btn-flpp.docx') */
  templatePath: string
  /** Template name for logging */
  name: string
}

/**
 * Build the data context object that will be passed to docxtemplater.
 * All placeholders in template should match keys in this object.
 *
 * Placeholder naming convention (use snake_case in DOCX):
 *   {{applicant_full_name}}, {{applicant_nik}}, {{applicant_pob_dob}},
 *   {{spouse_full_name}}, {{spouse_nik}},
 *   {{company_name}}, {{company_director}},
 *   {{property_project}}, {{property_kavling}}, {{property_address}},
 *   {{date_city}}, {{date_str}}, {{date_year}}, ...
 */
function buildContext(state: BerkasState): Record<string, any> {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return dateStr }
  }

  const formatCurrency = (n: number) => {
    if (!n) return ''
    return `Rp. ${n.toLocaleString('id-ID')},-`
  }

  const numberToWords = (num: number): string => {
    if (num === 0) return 'nol'
    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
    if (num < 12) return units[num]
    if (num < 20) return units[num - 10] + ' belas'
    if (num < 100) return units[Math.floor(num / 10)] + ' puluh' + (num % 10 ? ' ' + units[num % 10] : '')
    if (num < 200) return 'seratus' + (num - 100 > 0 ? ' ' + numberToWords(num - 100) : '')
    if (num < 1000) return units[Math.floor(num / 100)] + ' ratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '')
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
    applicant_company_address: state.applicant.companyAddress || '',
    applicant_income: formatCurrency(state.applicant.monthlyIncome),
    applicant_income_words: state.applicant.monthlyIncome ? `(${numberToWords(state.applicant.monthlyIncome)} Rupiah)` : '',
    applicant_btn_account: state.applicant.btnAccountNumber || '',

    // Spouse (Pasangan)
    spouse_full_name: state.spouse?.fullName || '',
    spouse_nik: state.spouse?.ktpNumber || '',
    spouse_pob: state.spouse?.pob || '',
    spouse_dob: formatDate(state.spouse?.dob || ''),
    spouse_pob_dob: state.spouse?.pob ? `${state.spouse.pob}, ${formatDate(state.spouse.dob)}` : '',
    spouse_job: state.spouse?.job || '',
    spouse_address: state.spouse?.address || state.applicant.address || '',

    // Company (Developer)
    company_name: COMPANY_INFO.name,
    company_director: COMPANY_INFO.director,
    company_city: COMPANY_INFO.city,
    company_address: (COMPANY_INFO as any).address || COMPANY_INFO.city,
    company_btn_account: COMPANY_INFO.btnAccount,
    company_bank_name: COMPANY_INFO.bankName,
    company_bank_address: COMPANY_INFO.bankAddress,

    // Property
    property_project: state.property.projectName,
    property_address: state.property.houseAddress,
    property_kavling: state.property.kavlingNumber,
    property_land_size: state.property.landSize ? `${state.property.landSize} m²` : '',
    property_nib: state.property.nibNumber || '',
    property_pbg: state.property.pbgNumber || '',
    property_price: formatCurrency(state.property.price),
    property_price_words: state.property.price ? `(${numberToWords(state.property.price)} Rupiah)` : '',
    property_dp: formatCurrency(state.property.downPayment),
    property_sbum: formatCurrency(state.property.sbumAmount),
    property_kpr_plafon: formatCurrency(state.property.kprPlafon),
    property_kpr_term: state.property.kprTerm ? `${state.property.kprTerm} tahun` : '',
    property_spr_number: state.property.sprNumber || '',

    // Dates
    date_city: 'Pangkalpinang',
    date_full: formatDate(state.dateOfDocument),
    date_str: state.dateOfDocument ? new Date(state.dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' }) : '',
    date_year: state.dateOfDocument ? new Date(state.dateOfDocument).getFullYear().toString() : new Date().getFullYear().toString(),
  }
}

/**
 * Generate DOCX from template by replacing {{placeholders}} with data
 * @param state - BerkasState with all customer data
 * @param config - Template config with path to DOCX template
 * @returns { buffer: Buffer, replacements: number }
 */
export async function generateDocxFromTemplate(
  state: BerkasState,
  config: DocxTemplateConfig
): Promise<{ buffer: Buffer; replacements: number }> {
  const fullPath = path.join(process.cwd(), config.templatePath.replace(/^\//, ''))
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template DOCX not found: ${config.templatePath}`)
  }

  const templateBuffer = fs.readFileSync(fullPath)

  // Load DOCX as zip
  const zip = new PizZip(templateBuffer)

  // Initialize docxtemplater
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Better error handling
    errorLogging: true,
  })

  // Build context data
  const context = buildContext(state)

  // Render - this replaces all {{placeholders}} with values
  doc.render(context)

  // Generate output buffer
  const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' })

  // Count replacements made (approximate by counting non-empty context values)
  const replacements = Object.values(context).filter(v => v && String(v).trim()).length

  return {
    buffer: Buffer.from(outputBuffer),
    replacements,
  }
}
