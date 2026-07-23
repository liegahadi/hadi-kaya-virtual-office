// POST /api/finance/material/stock/[materialId]/adjust — stock opname (manual adjust)
// Body: { deltaQty, reason, type?, unitCost? }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ materialId: string }> }) {
  try {
    const { materialId } = await params
    const body = await req.json()
    const { deltaQty, reason, type, unitCost } = body

    if (!reason) {
      return NextResponse.json({ success: false, error: 'reason required (audit log mandatory)' }, { status: 400 })
    }
    if (deltaQty === undefined || deltaQty === null) {
      return NextResponse.json({ success: false, error: 'deltaQty required' }, { status: 400 })
    }

    const stock = await db.stock.findUnique({ where: { materialId } })
    if (!stock) return NextResponse.json({ success: false, error: 'Stock not found' }, { status: 404 })

    const prevQty = stock.quantity
    const newQty = prevQty + deltaQty

    // Update stock
    await db.stock.update({
      where: { materialId },
      data: { quantity: newQty },
    })

    // Insert StockAdjustment (audit log)
    const adjustment = await db.stockAdjustment.create({
      data: {
        materialId,
        deltaQty,
        reason,
        type: type || 'OPNAME',
        prevQty,
        newQty,
        unitCost: unitCost || null,
        date: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: { adjustment, newQty } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
