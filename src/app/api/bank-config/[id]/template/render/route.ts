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
      const value = formData[ann.fieldMapping] || ''
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
