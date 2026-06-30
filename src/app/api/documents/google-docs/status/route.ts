// GET /api/documents/google-docs/status
// Returns whether Google Service Account is configured + debug info
import { NextResponse } from 'next/server'
import { isGoogleConfigured, debugCredentials } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isGoogleConfigured(),
    hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ? process.env.GOOGLE_DRIVE_FOLDER_ID.substring(0, 8) + '...' : null,
    message: isGoogleConfigured()
      ? 'Google Service Account is configured'
      : 'Google Service Account not configured. Set env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY',
    debug: isGoogleConfigured() ? debugCredentials() : null,
  })
}
