import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const mappings = await db.supplierMaterial.findMany({ include: { supplier: { select: { name: true } }, material: { select: { name: true, unitMeasure: true } } }, orderBy: { supplier: { name: 'asc' } } })
    return NextResponse.json({ success: true, data: mappings })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    const { supplierId, materialId, defaultPrice } = await req.json()
    const mapping = await db.supplierMaterial.upsert({ where: { supplierId_materialId: { supplierId, materialId } }, update: { defaultPrice: defaultPrice || null }, create: { supplierId, materialId, defaultPrice: defaultPrice || null } })
    return NextResponse.json({ success: true, data: mapping })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
