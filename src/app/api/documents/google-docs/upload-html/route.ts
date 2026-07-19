// POST /api/documents/google-docs/upload-html
// Upload HTML content ke Google Drive sebagai Google Doc (convert=true)
// Used by WirausahaAiPanel — AI generate HTML → upload ke Drive → return doc URLs
import { NextRequest, NextResponse } from 'next/server'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { ensureCustomerFolder } from '@/lib/google/folders'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { html, fileName, customerId } = await req.json()

    if (!html) {
      return NextResponse.json({ success: false, error: 'html required' }, { status: 400 })
    }

    // Check Google OAuth
    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({
        success: false,
        error: 'GOOGLE_NOT_CONNECTED',
        message: 'Owner belum login Google.',
      }, { status: 401 })
    }

    const drive = await getDriveClientOAuth()

    // Get customer folder
    let folderId: string | undefined
    if (customerId) {
      try {
        const folder = await ensureCustomerFolder(drive, customerId)
        folderId = folder?.id
      } catch {}
    }

    // Upload HTML as Google Doc (convert=true → Google Docs format)
    // Wrap HTML in full HTML document
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${fileName}</title>
<style>
@page { size: A4; margin: 1.5cm 2cm; }
body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; }
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #999; padding: 6px 10px; }
</style>
</head>
<body>
${html}
</body>
</html>`

    // Create a Blob from HTML
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const buffer = Buffer.from(await blob.arrayBuffer())

    // Upload to Drive with convert=true (converts HTML → Google Doc)
    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
        mimeType: 'application/vnd.google-apps.document',
      },
      media: {
        mimeType: 'text/html',
        body: fullHtml,
      },
      fields: 'id, name, webViewLink, exportLinks',
    })

    const docId = uploadRes.data.id
    if (!docId) {
      throw new Error('Failed to create Google Doc')
    }

    // Set permission: anyone with link can edit
    try {
      await drive.permissions.create({
        fileId: docId,
        requestBody: { role: 'writer', type: 'anyone' },
      })
    } catch {}

    const editUrl = `https://docs.google.com/document/d/${docId}/edit`
    const embedUrl = `https://docs.google.com/document/d/${docId}/edit?rm=minimal&embedded=true`
    const downloadUrl = `/api/documents/google-docs/${docId}/download`

    return NextResponse.json({
      success: true,
      docId,
      fileName: uploadRes.data.name || fileName,
      editUrl,
      embedUrl,
      downloadUrl,
    })
  } catch (err: any) {
    console.error('[upload-html] error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to upload HTML' },
      { status: 500 }
    )
  }
}
