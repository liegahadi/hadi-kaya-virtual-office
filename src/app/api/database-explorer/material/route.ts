import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/database-explorer/material?q=search
// Returns material stock + suppliers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    // Fetch MaterialStock
    let materials: any[] = []
    try {
      const where = q ? { materialName: { contains: q } } : {}
      materials = await db.materialStock.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 200,
      })
    } catch {
      // Table might not exist yet
    }

    // Fetch suppliers
    let suppliers: any[] = []
    try {
      const where = q ? { name: { contains: q } } : {}
      suppliers = await db.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 50,
      })
    } catch {
      // Table might not exist
    }

    const data = [
      ...materials.map((m) => ({
        id: m.id,
        name: m.materialName,
        unit: m.unitMeasure || null,
        stock: m.quantity ?? null,
        price: m.unitPrice ?? null,
        supplierName: null,
      })),
      ...suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        unit: null,
        stock: null,
        price: null,
        supplierName: s.contactPerson || s.phone || null,
      })),
    ]

    return NextResponse.json({ success: true, data, meta: { total: data.length } })
  } catch (err: any) {
    console.error('[database-explorer/material] error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
