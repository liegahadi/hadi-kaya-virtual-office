// GET /api/bank-config/[id]/template/pdf-proxy
// Proxy PDF dari Google Drive ke frontend (avoid CORS issue dengan pdfjs)
// Frontend bisa fetch PDF blob dari endpoint ini tanpa CORS error

import { NextRequest, NextResponse } from 'next/server'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankId } = await params

    // Get bank + template info
    const bank = await db.bankConfig.findUnique({ where: { id: bankId } })
    if (!bank) {
      return NextResponse.json({ error: 'Bank not found' }, { status: 404 })
    }

    let fileId: string | null = null
    if (bank.documents) {
      try {
        const docs = JSON.parse(bank.documents)
        fileId = docs.fileId
      } catch {}
    }

    if (!fileId) {
      return NextResponse.json({ error: 'No template uploaded' }, { status: 404 })
    }

    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 401 })
    }

    const drive: any = await getDriveClientOAuth()
    const response = await drive.files.get(
      { fileId, alt: 'media' },
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
  } catch (err: any) {
    console.error('PDF proxy error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch PDF' },
      { status: 500 }
    )
  }
}
