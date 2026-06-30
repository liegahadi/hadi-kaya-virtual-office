// HTML → DOCX conversion API
// Receives HTML content + filename, returns .docx file using html-to-docx
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { html, fileName, orientation } = await req.json()
    if (!html) {
      return NextResponse.json({ error: 'html is required' }, { status: 400 })
    }

    // Dynamic import to avoid build issues
    const HTMLtoDOCX = (await import('html-to-docx')).default

    // Wrap HTML with full document structure required by html-to-docx
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${fileName || 'Document'}</title>
</head>
<body>${html}</body>
</html>`

    const docxBuffer = await HTMLtoDOCX(fullHtml, undefined, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
      orientation: orientation || 'portrait',
      pageSize: { width: 12240, height: 15840 }, // A4 in twips (8.5" x 11" → use A4)
    }, {
      orientation: orientation || 'portrait',
    })

    const safeFileName = (fileName || 'document').replace(/[^\w\-_\. ]/g, '_')

    return new NextResponse(docxBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFileName)}.docx"`,
      },
    })
  } catch (err: any) {
    console.error('html-to-docx error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to convert HTML to DOCX' }, { status: 500 })
  }
}
