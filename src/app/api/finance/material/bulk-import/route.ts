import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { materials } = body
    if (!materials?.length) return NextResponse.json({ success: false, error: 'materials array required' }, { status: 400 })
    let created = 0, updated = 0
    for (const m of materials) {
      if (!m.name) continue
      const existing = await db.material.findUnique({ where: { name: m.name } })
      if (existing) {
        await db.material.update({ where: { id: existing.id }, data: { unitMeasure: m.unitMeasure || existing.unitMeasure, minStock: m.minStock ?? existing.minStock, lastPrice: m.lastPrice ?? existing.lastPrice } })
        updated++
      } else {
        const mat = await db.material.create({ data: { name: m.name, unitMeasure: m.unitMeasure || 'Pcs', minStock: m.minStock || 0, lastPrice: m.lastPrice || null } })
        await db.stock.create({ data: { materialId: mat.id, quantity: 0, avgPrice: 0 } })
        await db.stockAdjustment.create({ data: { materialId: mat.id, deltaQty: 0, reason: 'Initial creation via bulk import', type: 'INITIAL', prevQty: 0, newQty: 0, date: new Date() } })
        created++
      }
    }
    return NextResponse.json({ success: true, data: { created, updated } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
