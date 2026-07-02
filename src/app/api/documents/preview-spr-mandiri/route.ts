// POST /api/documents/preview-spr-mandiri
// Generate SPR Mandiri PDF preview (returns blob, not attachment)
import { NextRequest, NextResponse } from 'next/server'
import { generateSprMandiriPdf } from '@/lib/berkas/spr-mandiri-overlay/generate'
import { BerkasState } from '@/lib/berkas/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json()
    if (!state) return NextResponse.json({ error: 'state is required' }, { status: 400 })

    const { buffer } = await generateSprMandiriPdf(state as BerkasState)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    })
  } catch (err: any) {
    console.error('preview-spr-mandiri error:', err)
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 })
  }
}
