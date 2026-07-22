import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/database-explorer/material?q=search
// Returns materials + stock + suppliers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    // Fetch Materials (new schema, with stock + category)
    let materials: any[] = []
    try {
      const where: any = q ? { name: { contains: q, mode: 'insensitive' } } : {}
      materials = await db.material.findMany({
        where,
        include: { stock: true, category: true },
        orderBy: { name: 'asc' },
        take: 200,
      })
    } catch {
      // Table might not exist yet
    }

    // Fetch suppliers
    let suppliers: any[] = []
    try {
      const where: any = q ? { name: { contains: q, mode: 'insensitive' } } : {}
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
        name: m.name,
        unit: m.unitMeasure || null,
        stock: m.stock?.quantity ?? null,
        avgPrice: m.stock?.avgPrice ?? null,
        minStock: m.minStock ?? null,
        category: m.category?.name || null,
        supplierName: null,
      })),
      ...suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        unit: null,
        stock: null,
        avgPrice: null,
        minStock: null,
        category: null,
        supplierName: s.name,
      })),
    ]

    return NextResponse.json({ success: true, data, meta: { total: data.length } })
  } catch (err: any) {
    console.error('Database explorer material error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
