// Google Auth Helper - supports BOTH Service Account AND OAuth (user login)
// OAuth is preferred because Service Accounts don't have Drive storage quota.
//
// Required env vars for OAuth:
//   GOOGLE_OAUTH_CLIENT_ID     - OAuth 2.0 Client ID (Web application)
//   GOOGLE_OAUTH_CLIENT_SECRET - OAuth 2.0 Client Secret
//   GOOGLE_REDIRECT_URI        - e.g. https://hadi-kaya-virtual-office.vercel.app/api/auth/google/callback
//
// Required env vars for Service Account (fallback):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_PRIVATE_KEY
import { google } from 'googleapis'
import { db } from '@/lib/db'

let _jwtClient: any = null

// =====================
// SERVICE ACCOUNT (legacy, doesn't have Drive storage quota)
// =====================

function parsePrivateKey(rawKey: string): string {
  let key = rawKey.trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  key = key.replace(/\\"/g, '"')
  key = key.replace(/\\n/g, '\n')
  key = key.split('\n').map(l => l.trim()).filter(l => l).join('\n')
  return key
}

export function getGoogleAuth() {
  if (_jwtClient) return _jwtClient
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY || ''
  if (!clientEmail || !rawPrivateKey) {
    throw new Error('Google Service Account credentials not set. Required env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY')
  }
  const privateKey = parsePrivateKey(rawPrivateKey)
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Expected PEM format starting with "-----BEGIN PRIVATE KEY-----"')
  }
  _jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/documents'],
  })
  return _jwtClient
}

export function getDriveClient() {
  const auth = getGoogleAuth()
  return google.drive({ version: 'v3', auth })
}

export function getDocsClient() {
  const auth = getGoogleAuth()
  return google.docs({ version: 'v1', auth })
}

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
}

// =====================
// OAUTH (USER LOGIN) - preferred
// =====================

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
  'openid',
  'email',
  'profile',
]

export function isOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET)
}

export function getRedirectUri(): string {
  // Use env var if set, otherwise auto-detect from VERCEL_URL or localhost
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/auth/google/callback`
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/auth/google/callback`
  return 'http://localhost:3000/api/auth/google/callback'
}

// Create OAuth2 client (no credentials yet)
export function getOAuth2Client() {
  if (!isOAuthConfigured()) {
    throw new Error('OAuth not configured. Set env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET')
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    getRedirectUri(),
  )
}

// Generate Google consent URL
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh_token
    prompt: 'consent', // Force consent screen so we always get a fresh refresh_token
    scope: OAUTH_SCOPES,
    include_granted_scopes: true,
  })
}

// Check if owner has connected Google (token saved in DB)
export async function isGoogleConnected(): Promise<boolean> {
  try {
    const token = await db.googleToken.findUnique({ where: { id: 'owner' } })
    return !!(token && token.refreshToken)
  } catch {
    return false
  }
}

// Get OAuth2 client with stored credentials (auto-refresh access token if expired)
// Returns null if not connected
export async function getAuthenticatedOAuth2Client(): Promise<any | null> {
  if (!isOAuthConfigured()) return null

  const token = await db.googleToken.findUnique({ where: { id: 'owner' } })
  if (!token) return null

  const oauth2Client = getOAuth2Client()

  // Set credentials from DB
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate ? token.expiryDate.getTime() : null,
    token_type: token.tokenType || 'Bearer',
    scope: token.scope,
  })

  // Auto-refresh if expired (or about to expire in next 60s)
  const now = Date.now()
  const expiry = token.expiryDate ? token.expiryDate.getTime() : 0
  if (expiry - now < 60000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      // Save new credentials to DB
      await db.googleToken.update({
        where: { id: 'owner' },
        data: {
          accessToken: credentials.access_token || token.accessToken,
          refreshToken: credentials.refresh_token || token.refreshToken, // keep old if not returned
          expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          tokenType: credentials.token_type || 'Bearer',
          scope: credentials.scope || token.scope,
        },
      })
    } catch (err) {
      console.error('Failed to refresh Google token:', err)
      // Continue with old token — might still work or fail gracefully
    }
  }

  return oauth2Client
}

// Get Drive client authenticated as user (OAuth)
export async function getDriveClientOAuth() {
  const auth = await getAuthenticatedOAuth2Client()
  if (!auth) throw new Error('Google not connected. Owner needs to login first.')
  return google.drive({ version: 'v3', auth })
}

// Get Docs client authenticated as user (OAuth)
export async function getDocsClientOAuth() {
  const auth = await getAuthenticatedOAuth2Client()
  if (!auth) throw new Error('Google not connected. Owner needs to login first.')
  return google.docs({ version: 'v1', auth })
}

// Save tokens to DB (after OAuth callback)
export async function saveGoogleTokens(tokens: any, email?: string) {
  const data = {
    id: 'owner',
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token || '',
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    tokenType: tokens.token_type || 'Bearer',
    scope: tokens.scope || '',
    email: email || null,
  }

  // upsert: create if not exists, update if exists
  return await db.googleToken.upsert({
    where: { id: 'owner' },
    create: data,
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || undefined, // don't overwrite if not provided
      expiryDate: data.expiryDate,
      tokenType: data.tokenType,
      scope: data.scope,
      email: data.email || undefined,
    },
  })
}

// Disconnect - delete tokens from DB
export async function disconnectGoogle() {
  try {
    await db.googleToken.delete({ where: { id: 'owner' } })
    return true
  } catch {
    return false
  }
}

// Get connected Google account info
export async function getConnectedAccountInfo() {
  const token = await db.googleToken.findUnique({ where: { id: 'owner' } })
  if (!token) return null
  return {
    email: token.email,
    connectedAt: token.createdAt,
    updatedAt: token.updatedAt,
    scopes: token.scope?.split(' ') || [],
  }
}

// Debug helper - returns info about credentials configuration
export function debugCredentials() {
  return {
    oauth: {
      configured: isOAuthConfigured(),
      hasClientId: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: getRedirectUri(),
    },
    serviceAccount: {
      configured: isGoogleConfigured(),
      hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
    },
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || null,
  }
}
