// POST /api/bank-config/[id]/template/render
// Render template PDF with annotation data overlaid
// Input: { fileId, annotations, formData }
// Output: PDF blob with text overlaid at annotation positions

import { NextRequest, NextResponse } from 'next/server'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankId } = await params
    const body = await req.json()
    const { fileId, annotations, formData } = body

    if (!fileId || !annotations) {
      return NextResponse.json({ error: 'fileId + annotations required' }, { status: 400 })
    }

    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 })
    }

    // Fetch template PDF from Drive
    const drive: any = await getDriveClientOAuth()
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    )
    const pdfBuffer = Buffer.from(response.data)

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
      // PDF coordinate system: origin at bottom-left, Y goes up
      // Our annotation: origin at top-left, Y goes down
      const x = ann.x * pageWidth
      const y = pageHeight - (ann.y * pageHeight) - (ann.height * pageHeight) // flip Y
      const fontSize = ann.fontSize || 10

      // Draw text
      try {
        page.drawText(String(value), {
          x: x + 2, // small padding
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
