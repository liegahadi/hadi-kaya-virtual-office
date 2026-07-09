import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const customerId = url.searchParams.get('customerId')
    const pipelines = await db.bankPipeline.findMany({
      where: customerId ? { customerId } : {},
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ success: true, data: pipelines })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, bankName, status, notes, rejectReason } = body
    if (!customerId || !bankName) return NextResponse.json({ success: false, error: 'customerId and bankName required' }, { status: 400 })
    
    const existing = await db.bankPipeline.findUnique({ where: { customerId_bankName: { customerId, bankName } } })
    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      if (status === 'BERKAS_MASUK') updateData.submittedAt = new Date()
      if (status === 'SP3K' || status === 'SPPK' || status === 'SP4K') updateData.sp3kAt = new Date()
      if (status === 'AKAD') updateData.akadAt = new Date()
      if (status === 'REJECT') { updateData.rejectAt = new Date(); updateData.rejectReason = rejectReason || null }
    }
    if (notes !== undefined) updateData.notes = notes

    if (existing) {
      const updated = await db.bankPipeline.update({ where: { id: existing.id }, data: updateData })
      return NextResponse.json({ success: true, data: updated })
    } else {
      const created = await db.bankPipeline.create({ data: { customerId, bankName, status: status || 'NOT_SUBMITTED', notes: notes || null } })
      return NextResponse.json({ success: true, data: created })
    }
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
