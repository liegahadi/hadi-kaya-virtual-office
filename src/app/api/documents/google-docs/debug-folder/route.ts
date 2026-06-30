// GET /api/documents/google-docs/debug-folder
// Debug endpoint - checks if Service Account can access the target folder
// Returns: folder info, permissions, who owns it
import { NextResponse } from 'next/server'
import { getDriveClient, isGoogleConfigured } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) {
    return NextResponse.json({ error: 'GOOGLE_DRIVE_FOLDER_ID not set' }, { status: 400 })
  }

  try {
    const drive = getDriveClient()

    // 1. Get folder info
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, owners, shared, capabilities',
      supportsAllDrives: true,
    })

    // 2. Get permissions
    const perms = await drive.permissions.list({
      fileId: folderId,
      fields: 'permissions(id, type, role, emailAddress, domain)',
      supportsAllDrives: true,
    })

    return NextResponse.json({
      success: true,
      folder: {
        id: folder.data.id,
        name: folder.data.name,
        mimeType: folder.data.mimeType,
        owners: folder.data.owners,
        shared: folder.data.shared,
      },
      permissions: perms.data.permissions,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    })
  } catch (err: any) {
    console.error('debug-folder error:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to access folder',
      code: err?.code,
      status: err?.status,
      errors: err?.errors,
    }, { status: 500 })
  }
}
