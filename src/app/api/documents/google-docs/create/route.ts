// POST /api/documents/google-docs/create
// Creates a Google Doc from a .docx template, fills placeholders with form data,
// sets "anyone with link can edit" permission, returns doc ID + URLs (edit, embed, download)
//
// Request body: { templatePath: string, state: BerkasState }
// Response: { success: true, docId, editUrl, embedUrl, downloadUrl }
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getDriveClientOAuth, getDocsClientOAuth, isOAuthConfigured, isGoogleConnected, getDriveClient, isGoogleConfigured } from '@/lib/google/auth'
import { fillGoogleDocPlaceholders } from '@/lib/google/template-filler'
import { ensureCustomerFolder } from '@/lib/google/folders'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // Prefer OAuth (user login) - works because files saved in user's Drive (has storage quota)
    // Fall back to Service Account only if OAuth not configured
    let drive: any
    let usingOAuth = false

    if (isOAuthConfigured()) {
      const connected = await isGoogleConnected()
      if (!connected) {
        return NextResponse.json({
          success: false,
          error: 'GOOGLE_NOT_CONNECTED',
          message: 'Owner belum login Google. Klik tombol "Connect Google Drive" untuk login.',
        }, { status: 401 })
      }
      drive = await getDriveClientOAuth()
      usingOAuth = true
    } else if (isGoogleConfigured()) {
      drive = getDriveClient() // Service Account (legacy)
    } else {
      return NextResponse.json({
        success: false,
        error: 'Google not configured. Set OAuth env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET',
      }, { status: 500 })
    }

    const { templatePath, state, folderId, customerId } = await req.json()
    if (!templatePath || !state) {
      return NextResponse.json({ success: false, error: 'templatePath and state are required' }, { status: 400 })
    }

    // Step 1: Fetch the .docx template from public folder
    // IMPORTANT: Must use PRODUCTION URL, not VERCEL_URL (which has hash and is protected by Vercel Authentication)
    // If we use VERCEL_URL, the fetch returns Vercel login HTML instead of the .docx file
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process.env.VERCEL_ENV === 'production'
      ? 'https://hadi-kaya-virtual-office.vercel.app'
      : 'http://localhost:3000'

    const templateUrl = templatePath.startsWith('http') ? templatePath : `${baseUrl}${templatePath}`
    const templateRes = await fetch(templateUrl)
    if (!templateRes.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch template: ${templateRes.status}` }, { status: 500 })
    }

    // Verify we got actual .docx content, not Vercel login HTML page
    const contentType = templateRes.headers.get('content-type') || ''
    if (!contentType.includes('application/vnd.openxmlformats-officedocument') && !contentType.includes('application/octet-stream') && !contentType.includes('application/zip')) {
      // Probably got HTML (Vercel login page or 404)
      const bodyPreview = (await templateRes.text()).substring(0, 200)
      return NextResponse.json({
        success: false,
        error: `Template fetch returned wrong content type: ${contentType}. Expected .docx. Body preview: ${bodyPreview}`,
      }, { status: 500 })
    }

    const templateBuffer = Buffer.from(await templateRes.arrayBuffer())

    // Step 2: Ensure customer folder structure exists in Google Drive
    // Structure: Hadi Kaya Docs > [Perumahan] > Berkas Konsumen > [Nama Konsumen - Blok Unit]
    // For OAuth: ALWAYS auto-create folder structure (ignore GOOGLE_DRIVE_FOLDER_ID which was for Service Account)
    // For Service Account: use GOOGLE_DRIVE_FOLDER_ID if set (legacy)
    let customerFolderId: string | undefined = undefined

    if (usingOAuth) {
      // Auto-create nested folder structure for OAuth (file saved in user's Drive)
      try {
        customerFolderId = await ensureCustomerFolder(state, customerId)
      } catch (folderErr: any) {
        console.error('Folder creation error (non-fatal, will create in root):', folderErr?.message)
        // Continue without folder — file will be created in root Drive
      }
    } else {
      // Service Account: use explicit folderId from request or env var
      customerFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID
    }

    // Step 3: Upload to Google Drive and convert to Google Docs format
    // OVERWRITE: Delete existing SK_Slip_Gaji file for this customer before creating new one
    const fileName = `SK_Slip_Gaji_${state.applicant?.fullName || 'Konsumen'}`
    const targetFolderId = customerFolderId
    let docId: string | undefined

    // Delete existing file(s) with same prefix in customer folder (overwrite system)
    if (targetFolderId) {
      try {
        const existing = await drive.files.list({
          q: `name contains 'SK_Slip_Gaji_' and '${targetFolderId}' in parents and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive',
          pageSize: 10,
        })
        if (existing.data.files) {
          for (const f of existing.data.files) {
            await drive.files.delete({ fileId: f.id! })
          }
        }
      } catch (e) {
        console.error('Delete existing (non-fatal):', e)
      }
    }

    if (usingOAuth) {
      // OAUTH: Direct create with conversion - file saved in user's Drive (has storage quota)
      const requestBody: any = {
        name: fileName,
        mimeType: 'application/vnd.google-apps.document',
      }
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
      docId = uploadRes.data.id || undefined
      if (!docId) {
        return NextResponse.json({ success: false, error: 'Failed to create Google Doc' }, { status: 500 })
      }
    } else if (targetFolderId) {
      // SERVICE ACCOUNT + folder: upload .docx then copy-convert (legacy)
      const uploadRes = await drive.files.create({
        requestBody: { name: `${fileName}.docx`, parents: [targetFolderId] },
        media: {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          body: Readable.from(templateBuffer),
        },
        fields: 'id, name',
      })
      const docxFileId = uploadRes.data.id
      if (!docxFileId) {
        return NextResponse.json({ success: false, error: 'Failed to upload .docx template' }, { status: 500 })
      }
      const copyRes = await drive.files.copy({
        fileId: docxFileId,
        requestBody: { name: fileName, mimeType: 'application/vnd.google-apps.document', parents: [targetFolderId] },
        fields: 'id, name, webViewLink',
      })
      docId = copyRes.data.id || undefined
      try { await drive.files.delete({ fileId: docxFileId }) } catch (e) { console.error('Failed to delete original .docx (non-fatal):', e) }
      if (!docId) {
        return NextResponse.json({ success: false, error: 'Failed to convert to Google Docs format' }, { status: 500 })
      }
    } else {
      // SERVICE ACCOUNT no folder: direct create (will likely fail with quota)
      const uploadRes = await drive.files.create({
        requestBody: { name: fileName, mimeType: 'application/vnd.google-apps.document' },
        media: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', body: Readable.from(templateBuffer) },
        fields: 'id, name, webViewLink',
      })
      docId = uploadRes.data.id || undefined
      if (!docId) {
        return NextResponse.json({ success: false, error: 'Failed to create Google Doc' }, { status: 500 })
      }
    }

    // Step 3: Fill placeholders with form data
    let fillError: string | null = null
    try {
      await fillGoogleDocPlaceholders(docId, state)
    } catch (fillErr: any) {
      console.error('Placeholder fill error:', fillErr?.message)
      fillError = fillErr?.message || 'Unknown fill error'
      // Continue — user can still edit manually, but return the error info
    }

    // Step 4: Set permission to "Anyone with link can edit" (only needed for Service Account / shared folders)
    // For OAuth: file is already owned by user, they can share manually if needed
    if (!usingOAuth) {
      try {
        await drive.permissions.create({
          fileId: docId,
          requestBody: { role: 'writer', type: 'anyone' },
        })
      } catch (e) {
        console.error('Failed to set permission (non-fatal):', e)
      }
    }

    // Step 5: Build URLs
    const editUrl = `https://docs.google.com/document/d/${docId}/edit`
    const embedUrl = `https://docs.google.com/document/d/${docId}/edit?rm=minimal&ui=2`
    const downloadUrl = `/api/documents/google-docs/${docId}/download`

    // Step 6: Save doc metadata to database (overwrite existing record for same customer + docType)
    try {
      // Delete existing GoogleDoc record for this customer + docType
      if (customerId) {
        await db.googleDoc.deleteMany({ where: { customerId, docType: 'sk-slip-gaji' } })
      }
      await db.googleDoc.create({
        data: {
          docId,
          customerId: customerId || null,
          fileName,
          folderId: targetFolderId || null,
          docType: 'sk-slip-gaji',
          editUrl,
        },
      })
    } catch (dbErr: any) {
      console.error('DB save error (non-fatal):', dbErr?.message)
      // Continue — the Google Doc is already created, just DB tracking failed
    }

    return NextResponse.json({
      success: true,
      docId,
      fileName,
      editUrl,
      embedUrl,
      downloadUrl,
      usingOAuth,
      fillError, // null if success, error message if placeholder filling failed
      folderId: targetFolderId, // customer folder ID in Google Drive
    })
  } catch (err: any) {
    console.error('google-docs/create error:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to create Google Doc',
    }, { status: 500 })
  }
}
