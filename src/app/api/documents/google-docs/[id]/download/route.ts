// GET /api/documents/google-docs/[id]/download
// Exports a Google Doc as .docx file (using Drive API export)
import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient, getDriveClientOAuth, isOAuthConfigured, isGoogleConnected, isGoogleConfigured } from '@/lib/google/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let drive: any
    if (isOAuthConfigured()) {
      const connected = await isGoogleConnected()
      if (!connected) {
        return NextResponse.json({ error: 'GOOGLE_NOT_CONNECTED', message: 'Owner belum login Google' }, { status: 401 })
      }
      drive = await getDriveClientOAuth()
    } else if (isGoogleConfigured()) {
      drive = getDriveClient()
    } else {
      return NextResponse.json({ error: 'Google not configured' }, { status: 500 })
    }

    const { id } = await params

    // Export the Google Doc as .docx
    const exportRes = await drive.files.export({
      fileId: id,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }, { responseType: 'arraybuffer' })

    const buffer = Buffer.from(exportRes.data as ArrayBuffer)

    // Get file metadata for filename
    const fileMeta = await drive.files.get({ fileId: id, fields: 'name' })
    const fileName = (fileMeta.data.name || 'document') + '.docx'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (err: any) {
    console.error('google-docs/download error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to download' }, { status: 500 })
  }
}
