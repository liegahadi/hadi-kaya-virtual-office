import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId')
    if (!materialId) return NextResponse.json({ success: false, error: 'materialId required' }, { status: 400 })
    const poItems = await db.pOItem.findMany({
      where: { materialId }, include: { po: { select: { poDate: true, poNumber: true, supplier: { select: { name: true } } } } },
      orderBy: { po: { poDate: 'desc' } }, take: 30,
    })
    const history = poItems.map(it => ({ date: it.po?.poDate, poNumber: it.po?.poNumber, supplier: it.po?.supplier?.name, qty: it.qty, price: it.price, total: it.totalPrice }))
    return NextResponse.json({ success: true, data: history })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
