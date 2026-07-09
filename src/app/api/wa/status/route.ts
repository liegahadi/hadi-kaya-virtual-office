// WA Bridge proxy endpoints - forward to mini-service on port 3001
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const WA_BRIDGE_URL = 'http://localhost:3001'

export async function GET() {
  try {
    const res = await fetch(`${WA_BRIDGE_URL}/status`, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      success: false,
      error: 'WA Bridge not running. Start mini-service first.',
    }, { status: 503 })
  }
}
