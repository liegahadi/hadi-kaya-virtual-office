// BSB Syariah PDF Overlay Generator

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { BSB_DOCUMENTS, BsbField } from './fields'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'

// Get company settings from DB (or fallback to constants)
async function getCompanySettings(): Promise<any> {
  try {
    const { db } = await import('@/lib/db')
    const settings = await db.companySetting.findUnique({ where: { id: 'default' } })
    if (settings) {
      return {
        ...COMPANY_INFO,
        name: settings.companyName || COMPANY_INFO.name,
        director: settings.directorName || COMPANY_INFO.director,
        directorKtp: settings.directorNik || (COMPANY_INFO as any).directorKtp || '',
        directorPhone: settings.directorPhone || '',
        directorAddress: settings.directorAddress || '',
        officeAddress: settings.officeAddress || '',
        address: settings.officeAddress || (COMPANY_INFO as any).address || '',
        city: settings.city || COMPANY_INFO.city,
        btnAccount: settings.btnAccount || COMPANY_INFO.btnAccount || '',
        mandiriAccount: settings.mandiriAccount || '',
        bsbAccount: settings.bsbAccount || '',
      }
    }
  } catch {}
  return COMPANY_INFO
}

export async function generateBsbPdf(state: BerkasState, docId: string): Promise<{ buffer: Uint8Array; overlayCount: number }> {
  const doc = BSB_DOCUMENTS.find(d => d.id === docId)
  if (!doc) throw new Error(`Unknown BSB doc: ${docId}`)

  const fullPath = path.join(process.cwd(), doc.templatePath.replace(/^\//, ''))
  if (!fs.existsSync(fullPath)) throw new Error(`Template not found: ${doc.templatePath}`)

  const pdfDoc = await PDFDocument.load(fs.readFileSync(fullPath))
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  // Issue 10: Remove page 2 from BSB Pernyataan (user request)
  if (docId === 'bsb-pernyataan') {
    const allPages = pdfDoc.getPages()
    if (allPages.length >= 2) {
      pdfDoc.removePage(1)  // remove page 2 (0-indexed: 1)
    }
  }

  const pages = pdfDoc.getPages()

  const company = await getCompanySettings()

  function getFieldValue(field: BsbField): string {
    let rawVal: any
    if (field.source === 'applicant') rawVal = (state.applicant as any)[field.field]
    else if (field.source === 'spouse') rawVal = (state.spouse as any)?.[field.field]
    else if (field.source === 'company') rawVal = (company as any)[field.field]
    else if (field.source === 'property') rawVal = (state.property as any)[field.field]
    if (field.transform) return field.transform(rawVal, state, company)
    return rawVal != null ? String(rawVal) : ''
  }

  let overlayCount = 0
  for (const field of doc.fields) {
    if (field.showWhen && !field.showWhen(state)) continue
    const value = getFieldValue(field)
    if (!value || !value.trim()) continue
    const page = pages[field.page - 1]
    if (!page) continue

    const fontSize = 10
    const font = field.bold ? timesRomanBold : timesRoman
    let textWidth: number
    try { textWidth = font.widthOfTextAtSize(value, fontSize) } catch { continue }

    const bgWidth = textWidth + 4
    page.drawRectangle({ x: field.x - 1, y: field.y, width: bgWidth, height: field.height, color: rgb(1, 1, 1), opacity: 1 })

    try {
      page.drawText(value, { x: field.x, y: field.y + (field.height - fontSize) / 2 + 1, size: fontSize, font, color: rgb(0, 0, 0) })
      overlayCount++
    } catch {
      const sanitized = value.replace(/[^\x20-\x7E\u00A0-\u024F\u2010-\u2027]/g, '?')
      try {
        page.drawText(sanitized, { x: field.x, y: field.y + (field.height - fontSize) / 2 + 1, size: fontSize, font, color: rgb(0, 0, 0) })
        overlayCount++
      } catch (e2) { console.error('Failed:', value, e2) }
    }
  }

  return { buffer: new Uint8Array(await pdfDoc.save()), overlayCount }
}
