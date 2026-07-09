import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { login, getCookieName, getCookieOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/auth/login
// Body: { email, password }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const result = await login(email, password)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(getCookieName(), result.token!, getCookieOptions())

    return NextResponse.json({
      success: true,
      data: result.user,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login gagal' },
      { status: 500 }
    )
  }
}
