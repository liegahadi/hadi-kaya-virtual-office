// GET /api/finance/material/stock — list stock (with low-stock filter)
// POST /api/finance/material/stock — manual stock opname (with reason wajib)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lowStock = searchParams.get('lowStock') === 'true'

    const stocks = await db.stock.findMany({
      include: {
        material: { include: { category: true } },
      },
      orderBy: { material: { name: 'asc' } },
    })

    let result = stocks
    if (lowStock) {
      result = stocks.filter(s => s.material && s.quantity <= s.material.minStock)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
