// GET /api/documents/google-docs/status
// Returns whether Google Service Account is configured
import { NextResponse } from 'next/server'
import { isGoogleConfigured } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isGoogleConfigured(),
    message: isGoogleConfigured()
      ? 'Google Service Account is configured'
      : 'Google Service Account not configured. Set env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY',
  })
}
