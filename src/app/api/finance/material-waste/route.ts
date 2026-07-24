import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // Compare: material bought (PO items) vs material used (Usage items)
    const materials = await db.material.findMany({ include: { poItems: true, usageItems: true, stock: true } })
    const result = materials.map(m => {
      const totalBought = m.poItems.reduce((s, it) => s + it.qty, 0)
      const totalUsed = m.usageItems.reduce((s, it) => s + it.qty, 0)
      const currentStock = m.stock?.quantity || 0
      const waste = totalBought - totalUsed - currentStock
      const wastePercent = totalBought > 0 ? (waste / totalBought) * 100 : 0
      return { materialId: m.id, name: m.name, unitMeasure: m.unitMeasure, totalBought, totalUsed, currentStock, waste, wastePercent, status: wastePercent > 10 ? 'HIGH_WASTE' : wastePercent > 5 ? 'MEDIUM' : 'NORMAL' }
    }).filter(r => r.totalBought > 0).sort((a, b) => b.wastePercent - a.wastePercent)
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
