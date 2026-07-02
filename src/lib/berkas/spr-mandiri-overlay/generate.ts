// SPR Mandiri PDF Overlay Generator
// Loads SPR MANDIRI.pdf template, overlays text at annotation coordinates
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { SPR_MANDIRI_FIELDS, SprMandiriField } from './fields'
import { BerkasState } from '@/lib/berkas/types'

// Get company settings from DB (or fallback to constants)
async function getCompanySettings(): Promise<any> {
  try {
    const { db } = await import('@/lib/db')
    const settings = await db.companySetting.findUnique({ where: { id: 'default' } })
    if (settings) return settings
  } catch {}
  // Fallback to constants
  const { COMPANY_INFO } = await import('@/lib/berkas/constants')
  return COMPANY_INFO
}

export async function generateSprMandiriPdf(state: BerkasState): Promise<{ buffer: Uint8Array; overlayCount: number }> {
  const fullPath = path.join(process.cwd(), SPR_MANDIRI_FIELDS[0] ? 'public/templates/spr-mandiri.pdf' : '')
  if (!fs.existsSync(fullPath)) throw new Error(`Template not found: ${fullPath}`)

  const pdfDoc = await PDFDocument.load(fs.readFileSync(fullPath))
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const pages = pdfDoc.getPages()

  const company = await getCompanySettings()

  function getFieldValue(field: SprMandiriField): string {
    let rawVal: any
    if (field.source === 'applicant') rawVal = (state.applicant as any)[field.field]
    else if (field.source === 'company') rawVal = (company as any)[field.field]
    else if (field.source === 'property') rawVal = (state.property as any)[field.field]
    else if (field.source === 'custom') rawVal = null
    if (field.transform) return field.transform(rawVal, state, company)
    return rawVal != null ? String(rawVal) : ''
  }

  let overlayCount = 0
  for (const field of SPR_MANDIRI_FIELDS) {
    const value = getFieldValue(field)
    if (!value || !value.trim()) continue

    const page = pages[field.page - 1]
    if (!page) continue

    const fontSize = field.fontSize || 10
    const font = timesRoman

    // Draw white background to cover annotation field
    let textWidth: number
    try { textWidth = font.widthOfTextAtSize(value, fontSize) } catch { continue }
    const bgWidth = Math.min(textWidth + 4, field.width + 20) // allow some overflow

    page.drawRectangle({
      x: field.x - 1,
      y: field.y,
      width: bgWidth,
      height: field.height,
      color: rgb(1, 1, 1),
      opacity: 1,
    })

    try {
      page.drawText(value, {
        x: field.x,
        y: field.y + (field.height - fontSize) / 2 + 1,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      overlayCount++
    } catch {
      const sanitized = value.replace(/[^\x20-\x7E\u00A0-\u024F\u2010-\u2027]/g, '?')
      try {
        page.drawText(sanitized, {
          x: field.x,
          y: field.y + (field.height - fontSize) / 2 + 1,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        overlayCount++
      } catch (e2) {
        console.error('Failed to draw:', value, e2)
      }
    }
  }

  return { buffer: new Uint8Array(await pdfDoc.save()), overlayCount }
}
