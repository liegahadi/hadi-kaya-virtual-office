// API: Download FLPP BTN DOCX with placeholder replacements (POST - returns DOCX attachment)

import { NextRequest, NextResponse } from 'next/server'
import { generateFlppDocx } from '@/lib/berkas/docx-template/flpp-generate'
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

    const { buffer, replacedCount } = await generateFlppDocx(state)
    console.log(`FLPP DOCX generated: ${replacedCount} fields replaced`)

    const filename = `FLPP_BTN_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.docx`

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Generate FLPP DOCX error:', error)
    return NextResponse.json({
      success: false,
      error: String(error).substring(0, 500),
    }, { status: 500 })
  }
}
