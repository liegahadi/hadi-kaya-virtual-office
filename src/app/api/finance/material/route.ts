// GET /api/finance/material — list materials + stock + category
// POST /api/finance/material — create material
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const categoryId = searchParams.get('categoryId')
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: any = { isActive: true }
    if (q) {
      where.name = { contains: q, mode: 'insensitive' }
    }
    if (categoryId) where.categoryId = categoryId

    const materials = await db.material.findMany({
      where,
      include: {
        category: true,
        stock: true,
      },
      orderBy: { name: 'asc' },
    })

    let result = materials
    if (lowStock) {
      result = materials.filter(m => m.stock && m.stock.quantity <= m.minStock)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const material = await db.material.create({
      data: {
        name: body.name,
        categoryId: body.categoryId || null,
        unitMeasure: body.unitMeasure || 'Pcs',
        minStock: body.minStock || 0,
        lastPrice: body.lastPrice || null,
      },
    })

    // Init stock record
    await db.stock.create({
      data: { materialId: material.id, quantity: 0, avgPrice: 0 },
    })
    await db.stockAdjustment.create({
      data: {
        materialId: material.id,
        deltaQty: 0,
        reason: 'Initial stock creation',
        type: 'INITIAL',
        prevQty: 0,
        newQty: 0,
      },
    })

    return NextResponse.json({ success: true, data: material })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
