import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const WA_BRIDGE_URL = 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'agentId required' },
        { status: 400 }
      )
    }

    const res = await fetch(`${WA_BRIDGE_URL}/connect/${agentId}`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      success: false,
      error: 'WA Bridge not running. Start mini-service first.',
    }, { status: 503 })
  }
}
