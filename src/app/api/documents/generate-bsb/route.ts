import { NextRequest, NextResponse } from 'next/server'
import { generateBsbPdf } from '@/lib/berkas/bsb-overlay/generate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { state, docId } = await req.json()
    if (!state || !state.applicant) return NextResponse.json({ success: false, error: 'state required' }, { status: 400 })
    if (!docId) return NextResponse.json({ success: false, error: 'docId required' }, { status: 400 })
    const { buffer, overlayCount } = await generateBsbPdf(state, docId)
    const filename = `${docId.replace(/-/g, '_').toUpperCase()}_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.pdf`
    return new NextResponse(Buffer.from(buffer), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`, 'Content-Length': buffer.length.toString() } })
  } catch (error) { console.error('Generate BSB error:', error); return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 }) }
}
