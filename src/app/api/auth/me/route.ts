import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionFromToken, getCookieName } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/auth/me - Get current logged-in user
// ============================================================

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value
  const session = getSessionFromToken(token)

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  })
}
