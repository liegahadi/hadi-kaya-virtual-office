// GET /api/documents/google-docs/status
// Returns Google connection status + OAuth configuration info
import { NextResponse } from 'next/server'
import {
  isOAuthConfigured, isGoogleConfigured, isGoogleConnected,
  getConnectedAccountInfo, debugCredentials, getRedirectUri
} from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET() {
  const connected = await isGoogleConnected()
  const accountInfo = connected ? await getConnectedAccountInfo() : null

  return NextResponse.json({
    success: true,
    // OAuth config (preferred)
    oauthConfigured: isOAuthConfigured(),
    // Service Account config (legacy)
    serviceAccountConfigured: isGoogleConfigured(),
    // Whether owner has logged in (only relevant for OAuth)
    connected,
    account: accountInfo,
    // What redirect URI the user needs to add to Google Console
    redirectUri: getRedirectUri(),
    debug: debugCredentials(),
  })
}
