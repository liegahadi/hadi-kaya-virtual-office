// GET /api/auth/google/callback
// Handles OAuth callback: exchanges code for tokens, saves to DB, redirects to dashboard
import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client, saveGoogleTokens, isOAuthConfigured } from '@/lib/google/auth'

export const runtime = 'nodejs'

// Always redirect to production URL (not unique deploy URL with hash)
// This prevents Vercel Authentication issues on preview deployments
function getProductionBaseUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://hadi-kaya-virtual-office.vercel.app'
  }
  // Dev mode
  return 'http://localhost:3000'
}

export async function GET(req: NextRequest) {
  const prodUrl = getProductionBaseUrl()

  if (!isOAuthConfigured()) {
    return NextResponse.redirect(`${prodUrl}/?google_error=oauth_not_configured`)
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${prodUrl}/?google_error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${prodUrl}/?google_error=no_code`)
  }

  try {
    const oauth2Client = getOAuth2Client()

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Token exchange failed:', { has_access: !!tokens.access_token, has_refresh: !!tokens.refresh_token })
      return NextResponse.redirect(`${prodUrl}/?google_error=missing_tokens`)
    }

    // Get user email from ID token
    let email: string | undefined
    if (tokens.id_token) {
      try {
        const payloadB64 = tokens.id_token.split('.')[1]
        const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8')
        const payload = JSON.parse(payloadJson)
        email = payload.email
      } catch {}
    }

    // Save tokens to DB
    await saveGoogleTokens(tokens, email)

    // Redirect back to production URL with success flag
    return NextResponse.redirect(`${prodUrl}/?google_connected=true`)
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${prodUrl}/?google_error=${encodeURIComponent(err?.message || 'callback_failed')}`)
  }
}
