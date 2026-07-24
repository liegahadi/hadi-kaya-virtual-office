import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const stocks = await db.stock.findMany({ include: { material: true }, where: { material: { isActive: true } } })
    const lowStock = stocks.filter(s => s.quantity <= s.material.minStock).map(s => ({ materialId: s.materialId, name: s.material.name, currentQty: s.quantity, minStock: s.material.minStock, unit: s.material.unitMeasure, shortage: s.material.minStock - s.quantity }))
    return NextResponse.json({ success: true, data: lowStock, count: lowStock.length })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
