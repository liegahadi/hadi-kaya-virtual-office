// Google Service Account Auth Helper
// Authenticates with Google using Service Account credentials (env vars)
// Required env vars:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL - service account email (xxx@project.iam.gserviceaccount.com)
//   GOOGLE_PRIVATE_KEY           - private key (PEM format)
import { google } from 'googleapis'

let _jwtClient: any = null

// Parse private key from env var - handles various formats:
// 1. With literal \n (from JSON file): "-----BEGIN...\nMIIE...\n-----END..."
// 2. With actual newlines (already converted)
// 3. With surrounding double quotes (user pasted with quotes)
// 4. With escaped quotes \"\"
function parsePrivateKey(rawKey: string): string {
  let key = rawKey.trim()

  // Strip surrounding double quotes (if user pasted with quotes)
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }

  // Unescape any \" to "
  key = key.replace(/\\"/g, '"')

  // Convert literal \n to actual newlines
  key = key.replace(/\\n/g, '\n')

  // Trim any leading/trailing whitespace per line
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

  // Validate PEM format
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Expected PEM format starting with "-----BEGIN PRIVATE KEY-----"')
  }

  _jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents',
    ],
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

// Check if Google credentials are configured
export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
}

// Debug helper - returns info about the private key format (for troubleshooting)
export function debugCredentials(): { hasEmail: boolean; hasKey: boolean; keyStart: string; keyLength: number; hasBeginMarker: boolean; hasEndMarker: boolean; parsedKeyStart: string; parsedKeyLength: number; parsedHasBeginMarker: boolean } {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || ''
  const parsed = parsePrivateKey(rawKey)
  return {
    hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    hasKey: !!rawKey,
    keyStart: rawKey.substring(0, 30) + '...',
    keyLength: rawKey.length,
    hasBeginMarker: rawKey.includes('-----BEGIN PRIVATE KEY-----'),
    hasEndMarker: rawKey.includes('-----END PRIVATE KEY-----'),
    parsedKeyStart: parsed.substring(0, 30) + '...',
    parsedKeyLength: parsed.length,
    parsedHasBeginMarker: parsed.includes('-----BEGIN PRIVATE KEY-----'),
  }
}
