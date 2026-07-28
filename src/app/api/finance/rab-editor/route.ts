import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url); const projectId = searchParams.get('projectId'); const type = searchParams.get('type') || 'upah'
    if (!projectId) return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 })
    if (type === 'upah') { const wageTypes = await db.wageType.findMany({ where: { projectId }, orderBy: { name: 'asc' } }); return NextResponse.json({ success: true, data: wageTypes }) }
    else { const rabs = await db.rAB.findMany({ where: { projectId }, include: { lines: { orderBy: { workItem: 'asc' } } } }); return NextResponse.json({ success: true, data: rabs }) }
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); const { type, projectId } = body
    if (type === 'wagetype') { const wt = await db.wageType.create({ data: { projectId, name: body.name, price: body.price || 0, unitMeasure: 'termin' } }); return NextResponse.json({ success: true, data: wt }) }
    if (type === 'rabline') { let rab = await db.rAB.findFirst({ where: { projectId } }); if (!rab) { rab = await db.rAB.create({ data: { projectId, name: 'RAB Material', totalBudget: 0 } }) }; const line = await db.rABLine.create({ data: { rabId: rab.id, projectId, workItem: body.workItem, materialName: body.materialName, quantity: body.quantity, unitMeasure: body.unitMeasure, unitPrice: body.unitPrice, totalPrice: body.quantity * body.unitPrice } }); return NextResponse.json({ success: true, data: line }) }
    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}

// DELETE — single rabline or bulk
// Body: { id: "..." }            → hapus 1 line
// Body: { ids: ["a","b","c"] }   → hapus banyak line (bulk)
// Body: { wageTypeId: "..." }    → hapus wage type
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()

    // Bulk delete rablines
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const r = await db.rABLine.deleteMany({ where: { id: { in: body.ids } } })
      return NextResponse.json({ success: true, deleted: r.count })
    }

    // Single rabline delete
    if (body.id) {
      await db.rABLine.delete({ where: { id: body.id } })
      return NextResponse.json({ success: true, deleted: 1 })
    }

    // WageType delete
    if (body.wageTypeId) {
      await db.wageType.delete({ where: { id: body.wageTypeId } })
      return NextResponse.json({ success: true, deleted: 1 })
    }

    return NextResponse.json({ success: false, error: 'id or ids required' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
