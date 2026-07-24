import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest, { params }: { params: Promise<{ materialId: string }> }) {
  try {
    const { materialId } = await params
    const { qty, reason, unitId } = await req.json()
    if (!qty || qty <= 0) return NextResponse.json({ success: false, error: 'qty required' }, { status: 400 })
    const stock = await db.stock.findUnique({ where: { materialId } })
    if (!stock) return NextResponse.json({ success: false, error: 'Stock not found' }, { status: 404 })
    const newQty = stock.quantity + qty
    await db.stock.update({ where: { materialId }, data: { quantity: newQty } })
    await db.stockAdjustment.create({ data: { materialId, deltaQty: qty, reason: reason || 'Return sisa material dari unit', type: 'RETURN_TO_STOCK', prevQty: stock.quantity, newQty, refId: unitId || null, date: new Date() } })
    return NextResponse.json({ success: true, data: { newQty } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
