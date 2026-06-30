// POST /api/documents/google-docs/create
// Creates a Google Doc from a .docx template, fills placeholders with form data,
// sets "anyone with link can edit" permission, returns doc ID + URLs (edit, embed, download)
//
// Request body: { templatePath: string, state: BerkasState }
// Response: { success: true, docId, editUrl, embedUrl, downloadUrl }
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getDriveClient, getDocsClient, isGoogleConfigured } from '@/lib/google/auth'
import { fillGoogleDocPlaceholders } from '@/lib/google/template-filler'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Google Service Account belum dikonfigurasi. Set env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY',
      }, { status: 500 })
    }

    const { templatePath, state, folderId } = await req.json()
    if (!templatePath || !state) {
      return NextResponse.json({ success: false, error: 'templatePath and state are required' }, { status: 400 })
    }

    // Step 1: Fetch the .docx template from public folder
    // templatePath is like "/templates/combined/template-formal.docx"
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const templateUrl = templatePath.startsWith('http') ? templatePath : `${baseUrl}${templatePath}`
    const templateRes = await fetch(templateUrl)
    if (!templateRes.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch template: ${templateRes.status}` }, { status: 500 })
    }
    const templateBuffer = Buffer.from(await templateRes.arrayBuffer())

    // Step 2: Upload to Google Drive and convert to Google Docs format
    // googleapis requires a readable stream (not a Buffer) for media uploads
    // If folderId is provided, create the file in that folder (uses folder owner's storage quota)
    // If not provided, tries to create in Service Account's own Drive (may fail with quota error on free tier)
    const drive = getDriveClient()
    const fileName = `SK_Slip_Gaji_${state.applicant?.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}`

    const requestBody: any = {
      name: fileName,
      mimeType: 'application/vnd.google-apps.document', // Convert to Google Docs
    }
    // Add folder parent if provided (either from request body or env var)
    const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID
    if (targetFolderId) {
      requestBody.parents = [targetFolderId]
    }

    const uploadRes = await drive.files.create({
      requestBody,
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Readable.from(templateBuffer),
      },
      fields: 'id, name, webViewLink',
    })

    const docId = uploadRes.data.id
    if (!docId) {
      return NextResponse.json({ success: false, error: 'Failed to create Google Doc (no ID returned)' }, { status: 500 })
    }

    // Step 3: Fill placeholders with form data
    try {
      await fillGoogleDocPlaceholders(docId, state)
    } catch (fillErr: any) {
      console.error('Placeholder fill error (non-fatal):', fillErr?.message)
      // Continue — user can still edit manually
    }

    // Step 4: Set permission to "Anyone with link can edit"
    // This allows embedding in iframe and editing without OAuth
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    })

    // Step 5: Build URLs
    const editUrl = `https://docs.google.com/document/d/${docId}/edit`
    const embedUrl = `https://docs.google.com/document/d/${docId}/edit?rm=minimal` // minimal editor (no menu bar)
    const downloadUrl = `/api/documents/google-docs/${docId}/download`

    return NextResponse.json({
      success: true,
      docId,
      fileName: uploadRes.data.name,
      editUrl,
      embedUrl,
      downloadUrl,
    })
  } catch (err: any) {
    console.error('google-docs/create error:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to create Google Doc',
    }, { status: 500 })
  }
}
