import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const stocks = await db.stock.findMany({ include: { material: { include: { category: true } } } })
    const totalValue = stocks.reduce((s, st) => s + st.quantity * st.avgPrice, 0)
    const totalQty = stocks.reduce((s, st) => s + st.quantity, 0)
    const byCategory = new Map<string, { value: number; count: number }>()
    for (const st of stocks) {
      const cat = st.material?.category?.name || 'Lainnya'
      const existing = byCategory.get(cat) || { value: 0, count: 0 }
      existing.value += st.quantity * st.avgPrice
      existing.count++
      byCategory.set(cat, existing)
    }
    const topMaterials = stocks.map(s => ({ name: s.material?.name || '', value: s.quantity * s.avgPrice, qty: s.quantity, avgPrice: s.avgPrice })).sort((a, b) => b.value - a.value).slice(0, 10)
    return NextResponse.json({ success: true, data: { totalValue, totalQty, materialCount: stocks.length, byCategory: Array.from(byCategory.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value), topMaterials } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
