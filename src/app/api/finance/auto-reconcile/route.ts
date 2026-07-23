import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const { poId, notaItems } = await req.json()
    if (!poId || !notaItems?.length) return NextResponse.json({ success: false, error: 'poId + notaItems required' }, { status: 400 })
    const po = await db.purchaseOrder.findUnique({ where: { id: poId }, include: { items: { include: { material: true } } } })
    if (!po) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    // Match nota items with PO items by material name (fuzzy)
    const matched: any[] = []
    const unmatched: any[] = []
    for (const notaItem of notaItems) {
      const poItem = po.items.find(it => it.material?.name.toLowerCase().includes(notaItem.name.toLowerCase()) || notaItem.name.toLowerCase().includes(it.material?.name.toLowerCase()))
      if (poItem) {
        const variance = (notaItem.qty * notaItem.price) - poItem.totalPrice
        matched.push({ notaName: notaItem.name, poName: poItem.material?.name, notaQty: notaItem.qty, poQty: poItem.qty, notaPrice: notaItem.price, poPrice: poItem.price, notaTotal: notaItem.qty * notaItem.price, poTotal: poItem.totalPrice, variance })
      } else { unmatched.push(notaItem) }
    }
    const totalNota = notaItems.reduce((s: number, it: any) => s + it.qty * it.price, 0)
    const totalPO = po.plannedTotal
    return NextResponse.json({ success: true, data: { matched, unmatched, totalNota, totalPO, variance: totalNota - totalPO } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
