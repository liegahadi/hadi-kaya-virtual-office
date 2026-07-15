// Mandiri PDF Overlay Generator

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { MANDIRI_DOCUMENTS, MandiriField } from './fields'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'

export async function generateMandiriPdf(state: BerkasState, docId: string): Promise<{ buffer: Uint8Array; overlayCount: number }> {
  const doc = MANDIRI_DOCUMENTS.find(d => d.id === docId)
  if (!doc) throw new Error(`Unknown Mandiri doc: ${docId}`)

  const fullPath = path.join(process.cwd(), doc.templatePath.replace(/^\//, ''))
  if (!fs.existsSync(fullPath)) throw new Error(`Template not found: ${doc.templatePath}`)

  const pdfDoc = await PDFDocument.load(fs.readFileSync(fullPath))
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const pages = pdfDoc.getPages()

  function getFieldValue(field: MandiriField): string {
    let rawVal: any
    if (field.source === 'applicant') rawVal = (state.applicant as any)[field.field]
    else if (field.source === 'spouse') rawVal = (state.spouse as any)?.[field.field]
    else if (field.source === 'company') rawVal = (COMPANY_INFO as any)[field.field]
    else if (field.source === 'property') rawVal = (state.property as any)[field.field]
    if (field.transform) return field.transform(rawVal, state, COMPANY_INFO)
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
