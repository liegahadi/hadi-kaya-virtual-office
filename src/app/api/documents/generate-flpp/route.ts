// API: Download FLPP BTN PDF with overlay text (POST - returns PDF attachment)

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
    console.log(`FLPP PDF generated: ${overlayCount} fields overlaid`)

    const filename = `FLPP_BTN_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Generate FLPP error:', error)
    return NextResponse.json({
      success: false,
      error: String(error).substring(0, 500),
    }, { status: 500 })
  }
}
