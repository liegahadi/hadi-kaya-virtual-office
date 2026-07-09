import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const WA_BRIDGE_URL = 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'to and message required' },
        { status: 400 }
      )
    }

    const res = await fetch(`${WA_BRIDGE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      success: false,
      error: 'WA Bridge not running',
    }, { status: 503 })
  }
}
