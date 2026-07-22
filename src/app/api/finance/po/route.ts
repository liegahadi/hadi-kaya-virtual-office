// GET /api/finance/po — list POs (with filter)
// POST /api/finance/po — create new PO (auto-generate poNumber)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePoNumber } from '@/lib/finance/po-number'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const supplierId = searchParams.get('supplierId')

    const where: any = {}
    if (status) where.status = status
    if (projectId) where.projectId = projectId
    if (supplierId) where.supplierId = supplierId

    const pos = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        project: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, blockNumber: true } },
        items: { include: { material: true } },
        payments: { where: { voided: false }, select: { amount: true } },
        _count: { select: { notas: true } },
      },
      orderBy: { poDate: 'desc' },
      take: 100,
    })

    // Add computed: totalPaid, remaining
    const posWithComputed = pos.map(po => {
      const totalPaid = po.payments.reduce((s, p) => s + p.amount, 0)
      const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
      return {
        ...po,
        totalPaid,
        remaining: Math.max(0, target - totalPaid),
        displayPoNumber: po.poNumber.replace(/-/g, '/'),
      }
    })

    return NextResponse.json({ success: true, data: posWithComputed })
  } catch (err: any) {
    console.error('PO list error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { supplierId, projectId, unitId, poDate, notes, items } = body

    if (!supplierId || !projectId || !items?.length) {
      return NextResponse.json({ success: false, error: 'supplierId, projectId, items required' }, { status: 400 })
    }

    // Generate PO number
    const poDateObj = poDate ? new Date(poDate) : new Date()
    const poNumber = await generatePoNumber(projectId, unitId || null, poDateObj)

    // Compute plannedTotal
    const plannedTotal = items.reduce((s: number, it: any) => s + (it.qty || 0) * (it.price || 0), 0)

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        projectId,
        unitId: unitId || null,
        status: 'DRAFT',
        plannedTotal,
        actualTotal: plannedTotal, // initial: actual = planned
        poDate: poDateObj,
        notes: notes || null,
        items: {
          create: items.map((it: any) => ({
            materialId: it.materialId,
            qty: it.qty || 0,
            price: it.price || 0,
            totalPrice: (it.qty || 0) * (it.price || 0),
            block: it.block || null,
            directUse: it.directUse || false,
            note: it.note || null,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: po })
  } catch (err: any) {
    console.error('PO create error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
