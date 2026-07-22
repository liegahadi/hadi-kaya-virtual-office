// GET /api/finance/po/[id] — get PO detail
// PATCH /api/finance/po/[id] — update PO (only if not locked)
// DELETE /api/finance/po/[id] — void PO (soft delete, status=VOIDED)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        unit: true,
        items: { include: { material: true } },
        notas: true,
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })
    if (!po) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const totalPaid = po.payments.filter(p => !p.voided).reduce((s, p) => s + p.amount, 0)
    const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal

    return NextResponse.json({
      success: true,
      data: { ...po, totalPaid, remaining: Math.max(0, target - totalPaid), displayPoNumber: po.poNumber.replace(/-/g, '/') },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (existing.locked) {
      return NextResponse.json({ success: false, error: 'PO is locked (nota already uploaded). Cannot edit.' }, { status: 400 })
    }

    const { notes, items } = body
    const updateData: any = {}
    if (notes !== undefined) updateData.notes = notes

    if (items?.length) {
      // Recompute plannedTotal
      updateData.plannedTotal = items.reduce((s: number, it: any) => s + (it.qty || 0) * (it.price || 0), 0)
      updateData.actualTotal = updateData.plannedTotal // re-sync since not locked yet

      // Delete old items, create new
      await db.pOItem.deleteMany({ where: { poId: id } })
      await db.pOItem.createMany({
        data: items.map((it: any) => ({
          poId: id,
          materialId: it.materialId,
          qty: it.qty || 0,
          price: it.price || 0,
          totalPrice: (it.qty || 0) * (it.price || 0),
          block: it.block || null,
          directUse: it.directUse || false,
          note: it.note || null,
        })),
      })
    }

    const updated = await db.purchaseOrder.update({ where: { id }, data: updateData, include: { items: true } })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Soft delete: set status VOIDED
    const updated = await db.purchaseOrder.update({
      where: { id },
      data: { status: 'VOIDED' },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
