// GET /api/bank-config/[id]/template/pdf-proxy
// Proxy PDF dari Google Drive ATAU local template path ke frontend (avoid CORS issue dengan pdfjs)
// Support 2 sumber:
// 1. Google Drive (fileId) — untuk template yang di-upload via Bank Builder
// 2. Local file (templatePath) — untuk template existing (BTN FLPP, BSB, Mandiri, dll)

import { NextRequest, NextResponse } from 'next/server'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankId } = await params
    const url = new URL(req.url)
    const fileIdParam = url.searchParams.get('fileId')
    const templateId = url.searchParams.get('templateId')

    // Get bank
    const bank = await db.bankConfig.findUnique({ where: { id: bankId } })
    if (!bank) {
      return NextResponse.json({ error: 'Bank not found' }, { status: 404 })
    }

    // Parse documents JSON
    let docs: any = {}
    try {
      if (bank.documents) docs = JSON.parse(bank.documents)
    } catch {}

    // Find the specific template (by templateId or fileId param)
    let template: any = null

    if (templateId && docs.templates) {
      template = docs.templates.find((t: any) => t.id === templateId)
    }

    if (!template && fileIdParam && docs.templates) {
      template = docs.templates.find((t: any) => t.fileId === fileIdParam)
    }

    if (!template && docs.templates && docs.templates.length > 0) {
      template = docs.templates[0]
    }

    // Legacy fallback
    if (!template && docs.fileId) {
      template = { fileId: docs.fileId }
    }

    if (!template) {
      return NextResponse.json({ error: 'No template found' }, { status: 404 })
    }

    // === PRIORITY 1: Local templatePath (existing code templates) ===
    if (template.templatePath) {
      const localPath = path.join(process.cwd(), template.templatePath.replace(/^\//, ''))
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath)
        return new NextResponse(buffer as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': buffer.length.toString(),
          },
        })
      }
    }

    // === PRIORITY 2: Google Drive (fileId) ===
    if (template.fileId) {
      if (!isOAuthConfigured() || !(await isGoogleConnected())) {
        return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 })
      }

      const drive: any = await getDriveClientOAuth()
      const response = await drive.files.get(
        { fileId: template.fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      )

      const buffer = Buffer.from(response.data)
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'public, max-age=3600',
          'Content-Length': buffer.length.toString(),
        },
      })
    }

    // === No PDF available (React component docs) ===
    if (template.isReact) {
      return NextResponse.json({ error: 'React component — no PDF template. Upload PDF via Template PDF tab.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'No fileId or templatePath found' }, { status: 404 })
  } catch (err: any) {
    console.error('PDF proxy error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch PDF' },
      { status: 500 }
    )
  }
}
