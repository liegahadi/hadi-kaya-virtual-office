import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/finance/suppliers/[id]/prices - Get all item prices for a supplier
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const materialFilter = url.searchParams.get('material')

    const where: Record<string, unknown> = { supplierId: id }
    if (materialFilter) {
      where.materialName = { contains: materialFilter.toUpperCase() }
    }

    const prices = await db.supplierItemPrice.findMany({
      where,
      orderBy: { materialName: 'asc' },
    })

    return NextResponse.json({ success: true, data: prices })
  } catch (error) {
    console.error('GET supplier prices error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// POST /api/finance/suppliers/[id]/prices - Add/update item price
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params
    const body = await req.json()
    const { materialName, unitMeasure, price, source, notes } = body

    if (!materialName || !unitMeasure || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'materialName, unitMeasure, price required' },
        { status: 400 }
      )
    }

    // Upsert (don't average, just update if same material+unit)
    const priceRecord = await db.supplierItemPrice.upsert({
      where: {
        supplierId_materialName_unitMeasure: {
          supplierId,
          materialName: materialName.toUpperCase(),
          unitMeasure,
        },
      },
      update: {
        price,
        quotedAt: new Date(),
        source: source || 'MANUAL',
        notes: notes || null,
        isActive: true,
      },
      create: {
        supplierId,
        materialName: materialName.toUpperCase(),
        unitMeasure,
        price,
        source: source || 'MANUAL',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: priceRecord })
  } catch (error) {
    console.error('POST supplier prices error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
