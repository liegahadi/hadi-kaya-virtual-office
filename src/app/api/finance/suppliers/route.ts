import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/finance/suppliers - List all suppliers with their item prices
// ============================================================

export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { pos: true, itemPrices: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: suppliers.map(s => ({
        ...s,
        poCount: s._count.pos,
        priceCount: s._count.itemPrices,
        _count: undefined,
      })),
    })
  } catch (error) {
    console.error('GET /api/finance/suppliers error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// POST /api/finance/suppliers - Create new supplier
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, contactPerson, whatsappNumber, phone, address } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name required' },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.create({
      data: { name, contactPerson, whatsappNumber, phone, address },
    })

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('POST /api/finance/suppliers error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
