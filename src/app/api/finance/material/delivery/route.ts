import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // POs that are ORDERED but not yet RECEIVED (no receivedAt)
    const pendingDeliveries = await db.purchaseOrder.findMany({
      where: { status: 'ORDERED', receivedAt: null },
      include: { supplier: true, project: true, items: { include: { material: true } } },
      orderBy: { poDate: 'asc' },
    })
    const overdue = await db.purchaseOrder.findMany({
      where: { status: 'ORDERED', receivedAt: null, poDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { supplier: true },
    })
    return NextResponse.json({ success: true, data: { pending: pendingDeliveries.map(po => ({ poId: po.id, poNumber: po.poNumber.replace(/-/g, '/'), supplier: po.supplier?.name, project: po.project?.name, poDate: po.poDate, ageDays: Math.floor((Date.now() - po.poDate.getTime()) / (1000*60*60*24)), items: po.items.map(it => ({ name: it.material?.name, qty: it.qty, unit: it.material?.unitMeasure })) })), overdueCount: overdue.length } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
