// GET /api/documents/google-docs/status
// Returns Google connection status + OAuth configuration info
import { NextResponse } from 'next/server'
import {
  isOAuthConfigured, isGoogleConfigured, isGoogleConnected,
  getConnectedAccountInfo, debugCredentials, getRedirectUri
} from '@/lib/google/auth'
import { hasMapsApiKey } from '@/lib/google/static-map'

export const runtime = 'nodejs'

export async function GET() {
  const connected = await isGoogleConnected()
  const accountInfo = connected ? await getConnectedAccountInfo() : null

  const debug = debugCredentials()
  ;(debug as any).mapsApiKey = hasMapsApiKey()

  return NextResponse.json({
    success: true,
    oauthConfigured: isOAuthConfigured(),
    serviceAccountConfigured: isGoogleConfigured(),
    connected,
    account: accountInfo,
    redirectUri: getRedirectUri(),
    debug,
  })
}
