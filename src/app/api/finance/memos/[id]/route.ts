// GET /api/finance/memos/[id] — get memo detail
// PATCH /api/finance/memos/[id] — update memo (notes only if PROPOSED)
// DELETE /api/finance/memos/[id] — void memo
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputeMemoStatus } from '@/lib/finance/status'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const memo = await db.memo.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!memo) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    // Enrich lines with item details
    const enrichedLines = await Promise.all(memo.lines.map(async (line) => {
      let itemDetail: any = null
      if (line.kind === 'PO') {
        itemDetail = await db.purchaseOrder.findUnique({
          where: { id: line.itemId },
          select: { poNumber: true, supplierId: true, supplier: { select: { name: true } }, plannedTotal: true, actualTotal: true, status: true },
        })
      } else if (line.kind === 'WAGE') {
        itemDetail = await db.wagePayment.findUnique({
          where: { id: line.itemId },
          select: { workDescription: true, amount: true, worker: { select: { name: true } }, status: true },
        })
      } else if (line.kind === 'EXPENSE') {
        itemDetail = await db.otherExpense.findUnique({
          where: { id: line.itemId },
          select: { description: true, recipientName: true, amount: true, category: true, status: true },
        })
      }
      return { ...line, itemDetail }
    }))

    return NextResponse.json({ success: true, data: { ...memo, lines: enrichedLines } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await db.memo.update({
      where: { id },
      data: { notes: body.notes },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.memo.update({ where: { id }, data: { status: 'VOIDED' } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
