// API: Merge Download - combine multiple uploaded files + generated docs into ONE PDF
// Receives: { files: [{docId, dataUrl, label}], state, docIds: [React component IDs] }
// Returns: single merged PDF

import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { files, templateDocs } = await req.json()
    const mergedPdf = await PDFDocument.create()

    // 1. Add uploaded files (images + PDFs)
    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (!file.dataUrl) continue
        try {
          if (file.dataUrl.startsWith('data:image/')) {
            // Embed image as full page
            const base64Data = file.dataUrl.split(',')[1]
            const imageBytes = Buffer.from(base64Data, 'base64')
            const isPng = file.dataUrl.includes('image/png')
            const img = isPng ? await mergedPdf.embedPng(imageBytes) : await mergedPdf.embedJpg(imageBytes)
            const page = mergedPdf.addPage([595.28, 841.89]) // A4
            const scale = Math.min(page.getWidth() / img.width, page.getHeight() / img.height)
            const w = img.width * scale
            const h = img.height * scale
            page.drawImage(img, { x: (page.getWidth() - w) / 2, y: (page.getHeight() - h) / 2, width: w, height: h })
          } else if (file.dataUrl.startsWith('data:application/pdf')) {
            // Embed PDF pages
            const base64Data = file.dataUrl.split(',')[1]
            const pdfBytes = Buffer.from(base64Data, 'base64')
            const srcPdf = await PDFDocument.load(pdfBytes)
            const pageIndices = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices())
            pageIndices.forEach(p => mergedPdf.addPage(p))
          }
        } catch (e) { console.error('Merge file error:', file.label, e.message?.substring(0, 100)) }
      }
    }

    // 2. Add template overlay PDFs (FLPP, AJB, Mandiri, BSB)
    if (templateDocs && Array.isArray(templateDocs)) {
      for (const tDoc of templateDocs) {
        if (!tDoc.templatePath) continue
        try {
          const fullPath = path.join(process.cwd(), tDoc.templatePath.replace(/^\//, ''))
          if (!fs.existsSync(fullPath)) continue
          const srcPdf = await PDFDocument.load(fs.readFileSync(fullPath))
          // Apply overlay if fields provided
          if (tDoc.fields && tDoc.fields.length > 0) {
            const { rgb, StandardFonts } = await import('pdf-lib')
            const timesRoman = await mergedPdf.embedFont(StandardFonts.TimesRoman)
            const timesBold = await mergedPdf.embedFont(StandardFonts.TimesRomanBold)
            for (const field of tDoc.fields) {
              const page = srcPdf.getPages()[field.page - 1]
              if (!page) continue
              const value = field.value
              if (!value || !value.trim()) continue
              const fontSize = 10
              const font = field.bold ? timesBold : timesRoman
              let textWidth
              try { textWidth = font.widthOfTextAtSize(value, fontSize) } catch { continue }
              page.drawRectangle({ x: field.x - 1, y: field.y, width: textWidth + 4, height: field.height, color: rgb(1,1,1) })
              try { page.drawText(value, { x: field.x, y: field.y + (field.height - fontSize)/2 + 1, size: fontSize, font, color: rgb(0,0,0) }) } catch {}
            }
          }
          const pageIndices = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices())
          pageIndices.forEach(p => mergedPdf.addPage(p))
        } catch (e) { console.error('Merge template error:', tDoc.templatePath, e.message?.substring(0, 100)) }
      }
    }

    const pdfBytes = await mergedPdf.save()
    const filename = `Berkas_${new Date().toISOString().split('T')[0]}.pdf`
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` },
    })
  } catch (error) {
    console.error('Merge download error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}
