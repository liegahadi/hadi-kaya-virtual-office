// POST /api/documents/google-docs/upload-file
// Uploads a single file (KTP, KK, etc.) to customer's Google Drive folder
// Naming: [Nama Dokumen] - [Nama Debitur] - Blok dan No Rumah
// Example: "KTP - Jenni - E5"
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { ensureCustomerFolder } from '@/lib/google/folders'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({ success: false, error: 'GOOGLE_NOT_CONNECTED' }, { status: 401 })
    }

    const { dataUrl, docLabel, state, customerId, overwrite } = await req.json()
    if (!dataUrl || !docLabel || !state) {
      return NextResponse.json({ success: false, error: 'dataUrl, docLabel, state required' }, { status: 400 })
    }

    const drive = await getDriveClientOAuth()

    // Ensure customer folder exists
    const customerFolderId = await ensureCustomerFolder(state, customerId)

    // Build filename: [Nama Dokumen] - [Nama Debitur] - Blok dan No Rumah
    const customerName = state.applicant?.fullName || 'Konsumen'
    const block = state.property?.blockLetter || ''
    const houseNumber = state.property?.houseNumber || ''
    const blockUnit = block || houseNumber ? ` - ${block}${houseNumber}` : ''
    const fileName = `${docLabel} - ${customerName}${blockUnit}`

    // Parse data URL
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return NextResponse.json({ success: false, error: 'Invalid data URL' }, { status: 400 })
    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')

    // Determine file extension from mime type
    const ext = mimeType.includes('pdf') ? '.pdf' : mimeType.includes('png') ? '.png' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' : ''

    // If overwrite, search for existing file with same name and delete it
    if (overwrite) {
      try {
        const existing = await drive.files.list({
          q: `name='${fileName}${ext}' and '${customerFolderId}' in parents and trashed=false`,
          fields: 'files(id)',
          spaces: 'drive',
          pageSize: 1,
        })
        if (existing.data.files && existing.data.files.length > 0) {
          await drive.files.delete({ fileId: existing.data.files[0].id! })
        }
      } catch (e) {
        // Non-fatal - continue with upload
      }
    }

    // Upload file to Drive
    const uploadRes = await drive.files.create({
      requestBody: {
        name: `${fileName}${ext}`,
        parents: [customerFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id, name, webViewLink',
    })

    return NextResponse.json({
      success: true,
      fileId: uploadRes.data.id,
      fileName: uploadRes.data.name,
      webViewLink: uploadRes.data.webViewLink,
    })
  } catch (err: any) {
    console.error('upload-file error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
