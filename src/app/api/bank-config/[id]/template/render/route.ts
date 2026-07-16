// POST /api/bank-config/[id]/template/render
// Render template PDF with annotation data overlaid (server-side, for download)
// Support BOTH Google Drive (fileId) AND local template (templatePath)
// Input: { fileId?, templatePath?, templateId?, annotations, formData }
// Output: PDF blob with text overlaid at annotation positions

import { NextRequest, NextResponse } from 'next/server'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankId } = await params
    const body = await req.json()
    const { fileId, templatePath, templateId, annotations, formData } = body

    if (!annotations) {
      return NextResponse.json({ error: 'annotations required' }, { status: 400 })
    }

    let pdfBuffer: Buffer

    // === PRIORITY 1: Local templatePath (existing imported templates) ===
    if (templatePath) {
      const localPath = path.join(process.cwd(), templatePath.replace(/^\//, ''))
      if (!fs.existsSync(localPath)) {
        return NextResponse.json({ error: `Template not found: ${localPath}` }, { status: 404 })
      }
      pdfBuffer = fs.readFileSync(localPath)
    }
    // === PRIORITY 2: Google Drive (fileId) ===
    else if (fileId) {
      if (!isOAuthConfigured() || !(await isGoogleConnected())) {
        return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 })
      }
      const drive: any = await getDriveClientOAuth()
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      )
      pdfBuffer = Buffer.from(response.data)
    }
    // === PRIORITY 3: Fallback to DB templatePath ===
    else if (templateId) {
      const bank = await db.bankConfig.findUnique({ where: { id: bankId } })
      if (bank?.documents) {
        try {
          const docs = JSON.parse(bank.documents)
          const tpl = (docs.templates || []).find((t: any) => t.id === templateId)
          if (tpl?.templatePath) {
            const localPath = path.join(process.cwd(), tpl.templatePath.replace(/^\//, ''))
            if (fs.existsSync(localPath)) {
              pdfBuffer = fs.readFileSync(localPath)
            } else {
              return NextResponse.json({ error: 'Template file not found' }, { status: 404 })
            }
          } else if (tpl?.fileId) {
            if (!isOAuthConfigured() || !(await isGoogleConnected())) {
              return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 })
            }
            const drive: any = await getDriveClientOAuth()
            const response = await drive.files.get(
              { fileId: tpl.fileId, alt: 'media' },
              { responseType: 'arraybuffer' }
            )
            pdfBuffer = Buffer.from(response.data)
          } else {
            return NextResponse.json({ error: 'No template source' }, { status: 404 })
          }
        } catch {
          return NextResponse.json({ error: 'Failed to parse bank config' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'No templates found' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'fileId, templatePath, or templateId required' }, { status: 400 })
    }

    // Use pdf-lib to overlay text
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()

    // Process each annotation
    for (const ann of annotations) {
      if (!ann.page || ann.page < 1 || ann.page > pages.length) continue
      if (!ann.fieldMapping) continue

      // Get value from formData
      let value = formData[ann.fieldMapping] || ''
      
      // === Handle auto-derived composite + transform field types ===
      // Composite: gabungan 2+ fields
      // Transform: derive dari 1 date field (default: dateOfDocument)
      const ROMAN_MONTHS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
      const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

      function formatDateLong(dateStr: string): string {
        if (!dateStr) return ''
        try { return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }
        catch { return dateStr }
      }
      function formatDateShort(dateStr: string): string {
        if (!dateStr) return ''
        try {
          const d = new Date(dateStr)
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          return `${dd}/${mm}/${d.getFullYear()}`
        } catch { return dateStr }
      }
      function getMonthIdx(dateStr: string): number {
        try { return new Date(dateStr).getMonth() } catch { return -1 }
      }

      if (ann.fieldMapping === 'applicant.pobDobComposite') {
        // composite_pob_dob: applicant.pob + applicant.dob → "Jakarta, 17 Agustus 1990"
        // Form data uses 'customer.birthPlace' + 'customer.birthDate' (mapped values)
        const pob = formData['customer.birthPlace'] || formData['applicant.pob'] || ''
        const dob = formData['customer.birthDate'] || formData['applicant.dob'] || ''
        if (pob && dob) value = `${pob}, ${formatDateLong(dob)}`
        else if (pob) value = pob
        else if (dob) value = formatDateLong(dob)
      } else if (ann.fieldMapping === 'company.cityLongDateComposite') {
        // composite_city_long_date: company.city + dateOfDocument → "Pangkalpinang, 17 Agustus 2026"
        const city = formData['company.city'] || formData['customer.city'] || ''
        const dateStr = formData['customer.dateOfDocument'] || formData['dateOfDocument'] || ''
        if (city && dateStr) value = `${city}, ${formatDateLong(dateStr)}`
        else if (city) value = city
        else if (dateStr) value = formatDateLong(dateStr)
      } else if (ann.fieldMapping === 'property.sprRomanMonth') {
        // roman_month: dari dateOfDocument → "VIII" (untuk Agustus)
        const dateStr = formData['customer.dateOfDocument'] || formData['dateOfDocument'] || ''
        const idx = getMonthIdx(dateStr)
        if (idx >= 0) value = ROMAN_MONTHS[idx]
      } else if (ann.fieldMapping === 'property.sprMonthName') {
        // month_name: dari dateOfDocument → "Agustus"
        const dateStr = formData['customer.dateOfDocument'] || formData['dateOfDocument'] || ''
        const idx = getMonthIdx(dateStr)
        if (idx >= 0) value = MONTH_NAMES[idx]
      } else if (ann.fieldMapping === 'property.sprLongDate') {
        // date_long: dari dateOfDocument → "17 Agustus 2026"
        const dateStr = formData['customer.dateOfDocument'] || formData['dateOfDocument'] || ''
        value = formatDateLong(dateStr)
      } else if (ann.fieldMapping === 'property.sprShortDate') {
        // date_short: dari dateOfDocument → "17/08/2026"
        const dateStr = formData['customer.dateOfDocument'] || formData['dateOfDocument'] || ''
        value = formatDateShort(dateStr)
      }
      // Legacy combined fields (kept for backward compat — old annotations might still use these)
      else if (ann.fieldMapping === 'customer.pobDob') {
        const pob = formData['customer.birthPlace'] || ''
        const dob = formData['customer.birthDate'] || ''
        if (pob && dob) value = `${pob}, ${formatDateLong(dob)}`
      } else if (ann.fieldMapping === 'customer.spousePobDob') {
        const pob = formData['customer.spouseBirthPlace'] || formData['customer.spousePob'] || ''
        const dob = formData['customer.spouseBirthDate'] || formData['customer.spouseDob'] || ''
        if (pob && dob) value = `${pob}, ${formatDateLong(dob)}`
      }
      
      if (!value) continue

      const page = pages[ann.page - 1]
      const { width: pageWidth, height: pageHeight } = page.getSize()

      // Convert relative coordinates (0-1) to absolute PDF coordinates
      // PDF: origin bottom-left, Y goes up
      // Annotation: origin top-left, Y goes down
      const x = ann.x * pageWidth
      const y = pageHeight - (ann.y * pageHeight) - (ann.height * pageHeight) // flip Y
      const fontSize = ann.fontSize || 10

      // Draw text
      try {
        page.drawText(String(value), {
          x: x + 2,
          y: y + 2,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        })
      } catch (drawErr) {
        console.error('Draw text error for annotation:', ann.id, drawErr)
      }
    }

    // Save modified PDF
    const modifiedPdf = await pdfDoc.save()
    const buffer = Buffer.from(modifiedPdf)

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-cache',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err: any) {
    console.error('Render template error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to render template' },
      { status: 500 }
    )
  }
}
