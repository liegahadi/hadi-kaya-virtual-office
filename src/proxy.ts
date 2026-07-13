import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// PROXY (Next.js 16 - replaces middleware)
// AUTH DISABLED — all routes accessible without login.
// To re-enable auth, restore the original proxy logic.
// ============================================================

export default function proxy(_req: NextRequest) {
  // Pass through — no auth check
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
