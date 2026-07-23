import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const materials = await db.material.findMany({ where: { isActive: true }, include: { stock: true, poItems: { include: { po: { include: { supplier: true } } }, take: 1, orderBy: { po: { poDate: 'desc' } } } } })
    const suggestions = materials.filter(m => {
      const current = m.stock?.quantity || 0
      return current <= m.minStock
    }).map(m => {
      const current = m.stock?.quantity || 0
      const shortfall = m.minStock - current
      const suggestedOrderQty = Math.max(shortfall * 2, m.minStock) // order 2x shortfall or minStock
      const lastSupplier = m.poItems[0]?.po?.supplier?.name || 'Unknown'
      const lastPrice = m.stock?.avgPrice || m.lastPrice || 0
      const estimatedCost = suggestedOrderQty * lastPrice
      return { materialId: m.id, name: m.name, unitMeasure: m.unitMeasure, currentStock: current, minStock: m.minStock, shortfall, suggestedOrderQty, lastSupplier, lastPrice, estimatedCost, priority: current === 0 ? 'CRITICAL' : 'HIGH' }
    }).sort((a, b) => b.priority === 'CRITICAL' ? 1 : -1 || b.estimatedCost - a.estimatedCost)
    return NextResponse.json({ success: true, data: suggestions, count: suggestions.length })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
