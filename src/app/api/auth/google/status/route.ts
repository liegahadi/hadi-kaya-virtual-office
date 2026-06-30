// GET /api/auth/google/status
// Returns Google connection status + OAuth configuration info
import { NextResponse } from 'next/server'
import { isOAuthConfigured, isGoogleConnected, getConnectedAccountInfo, debugCredentials, getRedirectUri } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function GET() {
  const connected = await isGoogleConnected()
  const accountInfo = connected ? await getConnectedAccountInfo() : null

  return NextResponse.json({
    success: true,
    oauthConfigured: isOAuthConfigured(),
    connected,
    account: accountInfo,
    redirectUri: getRedirectUri(), // show what redirect URI the user needs to add to Google Console
    debug: debugCredentials(),
  })
}
