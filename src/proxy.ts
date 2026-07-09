import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromToken, getCookieName } from '@/lib/auth'

// ============================================================
// PROXY (Next.js 16 - replaces middleware)
// Protect dashboard routes
// - Allow: /login, /api/auth/*, static assets
// - Redirect to /login if no valid session
// ============================================================

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow login page and auth API
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/agents/') ||
    pathname.startsWith('/office-background') ||
    pathname.startsWith('/siteplan') ||
    pathname.startsWith('/rumor') ||
    pathname.startsWith('/rumah') ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next()
  }

  // Check session
  const token = req.cookies.get(getCookieName())?.value
  const session = getSessionFromToken(token)

  if (!session) {
    // Return 401 for API requests
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Redirect to login for page requests
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
