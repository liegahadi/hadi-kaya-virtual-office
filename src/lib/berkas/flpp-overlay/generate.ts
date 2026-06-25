// ============================================================
// FLPP PDF Overlay Generator
// Loads template PDF, overlays text at exact annotation coordinates
// White background expands to fit FULL text (no truncation)
// ============================================================

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { FLPP_FIELDS, FlppField } from '@/lib/berkas/flpp-overlay/fields'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'

/**
 * Generate FLPP BTN PDF with overlay text on top of template
 * @returns { buffer: Uint8Array, overlayCount: number }
 */
export async function generateFlppPdf(state: BerkasState): Promise<{ buffer: Uint8Array; overlayCount: number }> {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'btn-flpp-template.pdf')
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template PDF not found at /templates/btn-flpp-template.pdf')
  }
  const templateBytes = fs.readFileSync(templatePath)
  const pdfDoc = await PDFDocument.load(templateBytes)

  // Embed standard fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const pages = pdfDoc.getPages()

  // Resolve field values from state
  function getFieldValue(field: FlppField): string {
    const { source, field: fieldName, transform } = field
    let rawVal: any
    if (source === 'applicant') rawVal = (state.applicant as any)[fieldName]
    else if (source === 'spouse') rawVal = (state.spouse as any)?.[fieldName]
    else if (source === 'company') rawVal = (COMPANY_INFO as any)[fieldName]
    else if (source === 'property') rawVal = (state.property as any)[fieldName]
    else if (source === 'computed') rawVal = undefined

    if (transform) return transform(rawVal, state, COMPANY_INFO)
    return rawVal != null ? String(rawVal) : ''
  }

  // Overlay each field
  let overlayCount = 0
  for (const field of FLPP_FIELDS) {
    if (field.showWhen && !field.showWhen(state)) continue

    const value = getFieldValue(field)
    if (!value || !value.trim()) continue

    const page = pages[field.page - 1]
    if (!page) continue

    const fontSize = field.fontSize || 10
    const font = field.bold ? timesRomanBold : timesRoman

    // Measure FULL text width (NO truncation - user wants complete values)
    let textWidth: number
    try {
      textWidth = font.widthOfTextAtSize(value, fontSize)
    } catch {
      // Skip chars that can't be encoded
      continue
    }

    // White background EXPANDS to fit full text (min = annotation width, max = page width - x)
    const pageWidth = page.getWidth()
    const maxAvailableWidth = pageWidth - field.x - 10 // 10pt right margin
    const bgWidth = Math.max(field.width, Math.min(textWidth + 4, maxAvailableWidth))
    const bgHeight = field.height

    // Draw WHITE BACKGROUND RECTANGLE
    page.drawRectangle({
      x: field.x - 1,
      y: field.y,
      width: bgWidth + 2,
      height: bgHeight,
      color: rgb(1, 1, 1),
      opacity: 1,
    })

    // Draw FULL text (no truncation)
    try {
      const textY = field.y + (bgHeight - fontSize) / 2 + 1
      page.drawText(value, {
        x: field.x,
        y: textY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      overlayCount++
    } catch (e) {
      // Sanitize for chars that can't be encoded
      const sanitized = value.replace(/[^\x20-\x7E\u00A0-\u024F\u2010-\u2027]/g, '?')
      try {
        const textY = field.y + (bgHeight - fontSize) / 2 + 1
        page.drawText(sanitized, {
          x: field.x,
          y: textY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        overlayCount++
      } catch (e2) {
        console.error('Failed to draw text:', value, e2)
      }
    }
  }

  const modifiedBytes = await pdfDoc.save()
  return {
    buffer: new Uint8Array(modifiedBytes),
    overlayCount,
  }
}
