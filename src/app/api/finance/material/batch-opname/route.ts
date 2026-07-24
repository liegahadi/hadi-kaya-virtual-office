import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, reason } = body
    if (!items?.length) return NextResponse.json({ success: false, error: 'items required' }, { status: 400 })
    if (!reason) return NextResponse.json({ success: false, error: 'reason required (audit log)' }, { status: 400 })
    let updated = 0
    for (const item of items) {
      const stock = await db.stock.findUnique({ where: { materialId: item.materialId } })
      if (!stock) continue
      const newQty = item.actualQty
      const delta = newQty - stock.quantity
      if (delta === 0) continue
      await db.stock.update({ where: { materialId: item.materialId }, data: { quantity: newQty } })
      await db.stockAdjustment.create({ data: { materialId: item.materialId, deltaQty: delta, reason, type: 'OPNAME', prevQty: stock.quantity, newQty, date: new Date() } })
      updated++
    }
    return NextResponse.json({ success: true, data: { updated } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
