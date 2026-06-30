// GET /api/auth/google/callback
// Handles OAuth callback: exchanges code for tokens, saves to DB, redirects to dashboard
import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client, saveGoogleTokens, isOAuthConfigured, getRedirectUri } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/?google_error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 })
  }

  try {
    const oauth2Client = getOAuth2Client()

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({
        error: 'Failed to get tokens. Make sure consent screen grants offline access.',
        tokens: { has_access: !!tokens.access_token, has_refresh: !!tokens.refresh_token },
      }, { status: 500 })
    }

    // Get user email from ID token (if available)
    let email: string | undefined
    if (tokens.id_token) {
      try {
        const payload = oauth2Client.verifyIdToken({ idToken: tokens.id_token })
        // verifyIdToken is async but synchronous in some versions — wrap in try
      } catch {}
      // Decode JWT payload manually (no signature verification needed here — we just got it from Google)
      try {
        const payloadB64 = tokens.id_token.split('.')[1]
        const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8')
        const payload = JSON.parse(payloadJson)
        email = payload.email
      } catch {}
    }

    // Save tokens to DB
    await saveGoogleTokens(tokens, email)

    // Redirect back to dashboard with success flag
    return NextResponse.redirect(new URL('/?google_connected=true', req.url))
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL(`/?google_error=${encodeURIComponent(err?.message || 'callback_failed')}`, req.url))
  }
}
