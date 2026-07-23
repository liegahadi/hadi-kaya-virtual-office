import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId')
    if (materialId) {
      const material = await db.material.findUnique({ where: { id: materialId }, include: { stock: true, category: true } })
      if (!material) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      // Return QR data (can be rendered as QR code image on frontend)
      return NextResponse.json({ success: true, data: { id: material.id, name: material.name, unit: material.unitMeasure, stock: material.stock?.quantity || 0, avgPrice: material.stock?.avgPrice || 0, category: material.category?.name || '-', qrData: JSON.stringify({ id: material.id, name: material.name }) } })
    }
    // Return all materials for QR label generation
    const materials = await db.material.findMany({ where: { isActive: true }, include: { stock: true, category: true }, select: { id: true, name: true, unitMeasure: true, stock: true, category: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: materials.map(m => ({ id: m.id, name: m.name, unit: m.unitMeasure, stock: m.stock?.quantity || 0, category: m.category?.name || '-', qrData: JSON.stringify({ id: m.id, name: m.name }) })) })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
