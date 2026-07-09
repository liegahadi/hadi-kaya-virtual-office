import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCookieName } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/auth/logout - Clear session cookie
// ============================================================

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(getCookieName())

  return NextResponse.json({
    success: true,
    message: 'Logout berhasil',
  })
}
