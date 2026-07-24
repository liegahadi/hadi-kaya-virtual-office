import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId')
    if (!materialId) {
      // Return all low/out-of-stock materials with suggestions
      const stocks = await db.stock.findMany({ where: { quantity: { lte: 0 } }, include: { material: { include: { category: true } } } })
      const suggestions: any[] = []
      for (const s of stocks) {
        const sameCategory = await db.material.findMany({ where: { categoryId: s.material.categoryId, id: { not: s.materialId }, isActive: true }, include: { stock: true } })
        const alternatives = sameCategory.filter(m => (m.stock?.quantity || 0) > 0).map(m => ({ materialId: m.id, name: m.name, stock: m.stock?.quantity || 0, avgPrice: m.stock?.avgPrice || 0, unitMeasure: m.unitMeasure }))
        if (alternatives.length > 0) suggestions.push({ original: { materialId: s.materialId, name: s.material.name, stock: s.quantity }, alternatives })
      }
      return NextResponse.json({ success: true, data: suggestions })
    }
    // Specific material substitution
    const material = await db.material.findUnique({ where: { id: materialId }, include: { category: true } })
    if (!material) return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 })
    const sameCategory = await db.material.findMany({ where: { categoryId: material.categoryId, id: { not: materialId }, isActive: true }, include: { stock: true } })
    const alternatives = sameCategory.filter(m => (m.stock?.quantity || 0) > 0).map(m => ({ materialId: m.id, name: m.name, stock: m.stock?.quantity || 0, avgPrice: m.stock?.avgPrice || 0, unitMeasure: m.unitMeasure }))
    return NextResponse.json({ success: true, data: { original: { name: material.name, stock: 0 }, alternatives } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
