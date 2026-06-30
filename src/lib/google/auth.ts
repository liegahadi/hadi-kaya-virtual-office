// Google Service Account Auth Helper
// Authenticates with Google using Service Account credentials (env vars)
// Required env vars:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL - service account email (xxx@project.iam.gserviceaccount.com)
//   GOOGLE_PRIVATE_KEY           - private key (PEM format, with \n for newlines)
//   GOOGLE_PROJECT_ID            - Google Cloud project ID (optional)
import { google } from 'googleapis'

let _jwtClient: any = null

export function getGoogleAuth() {
  if (_jwtClient) return _jwtClient

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials not set. Required env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY')
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
