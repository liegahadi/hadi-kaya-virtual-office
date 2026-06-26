// API: Preview FLPP BTN PDF (POST - returns inline PDF for iframe)

import { NextRequest, NextResponse } from 'next/server'
import { generateFlppPdf } from '@/lib/berkas/flpp-overlay/generate'
import { BerkasState } from '@/lib/berkas/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const state: BerkasState = body.state

    if (!state || !state.applicant) {
      return NextResponse.json({ success: false, error: 'state.applicant required' }, { status: 400 })
    }

    const { buffer, overlayCount } = await generateFlppPdf(state)

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Overlay-Count': overlayCount.toString(),
      },
    })
  } catch (error) {
    console.error('Preview FLPP error:', error)
    return NextResponse.json({
      success: false,
      error: String(error).substring(0, 500),
    }, { status: 500 })
  }
}
