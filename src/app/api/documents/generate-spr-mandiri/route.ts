// POST /api/documents/generate-spr-mandiri
// Generate SPR Mandiri PDF with overlay text
import { NextRequest, NextResponse } from 'next/server'
import { generateSprMandiriPdf } from '@/lib/berkas/spr-mandiri-overlay/generate'
import { BerkasState } from '@/lib/berkas/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json()
    if (!state) return NextResponse.json({ error: 'state is required' }, { status: 400 })

    const { buffer, overlayCount } = await generateSprMandiriPdf(state as BerkasState)

    const fileName = `SPR_Mandiri_${state.applicant?.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (err: any) {
    console.error('generate-spr-mandiri error:', err)
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 })
  }
}
