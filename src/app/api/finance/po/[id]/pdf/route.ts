// GET /api/finance/po/[id]/pdf — generate PO PDF
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePoPDF } from '@/lib/finance/pdf/po-pdf'

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
      },
    })

    if (!po) {
      return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    }

    const pdfBuffer = await generatePoPDF({
      poNumber: po.poNumber,
      poDate: po.poDate.toISOString(),
      supplier: {
        name: po.supplier.name,
        owner: po.supplier.contactPerson,
        phone: po.supplier.phone,
        address: po.supplier.address,
        bankName: po.supplier.bankName,
        bankAccount: po.supplier.bankAccount,
        bankHolder: po.supplier.bankHolder,
      },
      project: { name: po.project.name, code: po.project.code },
      unit: po.unit ? { blockNumber: po.unit.blockNumber } : null,
      items: po.items.map(it => ({
        material: { name: it.material.name, unitMeasure: it.material.unitMeasure },
        qty: it.qty,
        price: it.price,
        totalPrice: it.totalPrice,
      })),
      plannedTotal: po.plannedTotal,
      notes: po.notes,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${po.poNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error('PO PDF error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
