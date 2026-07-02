// POST /api/auth/google/disconnect
// Disconnects Google account - deletes tokens from DB
import { NextResponse } from 'next/server'
import { disconnectGoogle } from '@/lib/google/auth'

export const runtime = 'nodejs'

export async function POST() {
  const success = await disconnectGoogle()
  return NextResponse.json({ success, message: success ? 'Disconnected' : 'Nothing to disconnect' })
}
