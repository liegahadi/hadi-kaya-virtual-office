// GET /api/finance/po/[id]/bundle — bundle PO + payments → 1 PDF arsip
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bundlePoPDF } from '@/lib/finance/pdf/bundle'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        items: { include: { material: true } },
        payments: { where: { voided: false }, orderBy: { paidAt: 'asc' } },
      },
    })
    if (!po) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })

    const pdfBuffer = await bundlePoPDF({
      poNumber: po.poNumber,
      poDate: po.poDate.toISOString(),
      supplier: { name: po.supplier.name, bankName: po.supplier.bankName, bankAccount: po.supplier.bankAccount },
      project: { name: po.project.name, code: po.project.code },
      items: po.items.map(it => ({ material: { name: it.material.name, unitMeasure: it.material.unitMeasure }, qty: it.qty, price: it.price, totalPrice: it.totalPrice })),
      plannedTotal: po.plannedTotal,
      actualTotal: po.actualTotal,
      notes: po.notes,
      payments: po.payments.map(p => ({ amount: p.amount, method: p.method, bankName: p.bankName, paidAt: p.paidAt.toISOString(), notes: p.notes })),
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Arsip-${po.poNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error('Bundle PO error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
