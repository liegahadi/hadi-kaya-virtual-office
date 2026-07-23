import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { notaNumber, totalAmount, notes } = body
    const po = await db.purchaseOrder.findUnique({ where: { id } })
    if (!po) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    if (po.locked) return NextResponse.json({ success: false, error: 'PO is locked' }, { status: 400 })
    const nota = await db.nota.create({ data: { poId: id, notaNumber, totalAmount, notes } })
    // Lock PO + update actualTotal
    const allNotas = await db.nota.findMany({ where: { poId: id } })
    const actualTotal = allNotas.reduce((s, n) => s + n.totalAmount, 0)
    await db.purchaseOrder.update({ where: { id }, data: { locked: true, actualTotal, receivedAt: new Date() } })
    return NextResponse.json({ success: true, data: nota })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
