import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId')
    if (materialId) {
      // Recommend best supplier for specific material
      const poItems = await db.pOItem.findMany({ where: { materialId }, include: { po: { include: { supplier: true } } }, orderBy: { po: { poDate: 'desc' } } })
      const supplierMap = new Map<string, { name: string; poCount: number; avgPrice: number; latestPrice: number; totalQty: number; lastDate: Date }>()
      for (const it of poItems) {
        const supName = it.po?.supplier?.name || 'Unknown'
        const existing = supplierMap.get(supName) || { name: supName, poCount: 0, avgPrice: 0, latestPrice: 0, totalQty: 0, lastDate: new Date(0) }
        existing.avgPrice = (existing.avgPrice * existing.poCount + it.price) / (existing.poCount + 1)
        existing.poCount++
        existing.totalQty += it.qty
        if (it.po?.poDate > existing.lastDate) { existing.lastDate = it.po.poDate; existing.latestPrice = it.price }
        supplierMap.set(supName, existing)
      }
      const recommendations = Array.from(supplierMap.values()).map(s => ({ ...s, score: s.poCount * 10 + (1 / s.avgPrice) * 1000000 })).sort((a, b) => b.score - a.score)
      return NextResponse.json({ success: true, data: recommendations })
    }
    // General: recommend best supplier per material category
    const materials = await db.material.findMany({ where: { isActive: true }, include: { poItems: { include: { po: { include: { supplier: true } } }, take: 5, orderBy: { po: { poDate: 'desc' } } } } })
    const result = materials.filter(m => m.poItems.length > 0).map(m => {
      const suppliers = m.poItems.map(it => ({ name: it.po?.supplier?.name || 'Unknown', price: it.price, date: it.po?.poDate }))
      const cheapest = suppliers.reduce((min, s) => s.price < min.price ? s : min, suppliers[0])
      return { materialId: m.id, name: m.name, unit: m.unitMeasure, supplierCount: new Set(suppliers.map(s => s.name)).size, cheapestSupplier: cheapest.name, cheapestPrice: cheapest.price, allSuppliers: suppliers }
    })
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
