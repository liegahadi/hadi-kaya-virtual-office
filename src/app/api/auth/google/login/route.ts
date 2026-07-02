// GET /api/auth/google/login
// Redirects user to Google OAuth consent screen
// After consent, Google redirects to /api/auth/google/callback
import { NextResponse } from 'next/server'
import { getAuthUrl, isOAuthConfigured } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET() {
  if (!isOAuthConfigured()) {
    return NextResponse.json({
      error: 'OAuth not configured. Set env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET',
    }, { status: 500 })
  }

  const authUrl = getAuthUrl()
  return NextResponse.redirect(authUrl)
}
