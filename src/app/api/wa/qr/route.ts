import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const WA_BRIDGE_URL = 'http://localhost:3001'

export async function GET() {
  try {
    const res = await fetch(`${WA_BRIDGE_URL}/qr`, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      success: false,
      error: 'WA Bridge not running or no QR available',
    }, { status: 503 })
  }
}
