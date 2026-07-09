// API: Preview FLPP BTN DOCX as HTML (POST - returns HTML for iframe)
// Uses mammoth to convert generated DOCX → HTML for inline preview

import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { generateFlppDocx } from '@/lib/berkas/docx-template/flpp-generate'
import { BerkasState } from '@/lib/berkas/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const state: BerkasState = body.state

    if (!state || !state.applicant) {
      return NextResponse.json({ success: false, error: 'state.applicant required' }, { status: 400 })
    }

    const { buffer, replacedCount } = await generateFlppDocx(state)
    console.log(`FLPP DOCX preview: ${replacedCount} fields replaced`)

    // Convert DOCX buffer to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer })
    const html = result.value

    // Wrap in a styled HTML document for iframe display
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FLPP BTN Preview</title>
<style>
  body {
    font-family: 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  h1, h2, h3 { text-align: center; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 8px; vertical-align: top; }
  p { margin: 8px 0; }
  /* Style for bold fields - mammoth wraps bold in <strong> */
  strong { font-weight: bold; }
</style>
</head>
<body>
${html}
</body>
</html>`

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Replaced-Count': replacedCount.toString(),
      },
    })
  } catch (error) {
    console.error('Preview FLPP DOCX error:', error)
    return NextResponse.json({
      success: false,
      error: String(error).substring(0, 500),
    }, { status: 500 })
  }
}
