import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const notifications: any[] = []
    // Low stock
    const stocks = await db.stock.findMany({ include: { material: true } })
    for (const s of stocks) { if (s.quantity <= s.material.minStock) notifications.push({ type: 'LOW_STOCK', severity: s.quantity === 0 ? 'CRITICAL' : 'WARNING', title: `${s.material.name} low stock`, message: `Stok: ${s.quantity} ${s.material.unitMeasure} (min: ${s.material.minStock})`, action: '/material' }) }
    // Budget alert
    const units = await db.unit.findMany({ include: { project: true } })
    for (const u of units) {
      const usages = await db.materialUsage.findMany({ where: { unitId: u.id }, include: { items: true } })
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id } })
      const totalCost = usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0) + wages.reduce((s, w) => s + w.amount, 0)
      if (totalCost > 73800000 * 0.9) notifications.push({ type: 'BUDGET_ALERT', severity: totalCost > 73800000 ? 'CRITICAL' : 'WARNING', title: `Unit ${u.blockNumber} over budget`, message: `Cost: Rp ${totalCost.toLocaleString('id-ID')} (RAB: Rp 73.8M)`, action: '/finance' })
    }
    // Outstanding aging
    const unpaidPos = await db.purchaseOrder.findMany({ where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } }, include: { supplier: true } })
    const now = new Date()
    for (const po of unpaidPos) { const age = Math.floor((now.getTime() - po.poDate.getTime()) / (1000 * 60 * 60 * 24)); if (age > 30) notifications.push({ type: 'OUTSTANDING_AGING', severity: 'CRITICAL', title: `PO ${po.poNumber.replace(/-/g, '/')} > 30 hari`, message: `${po.supplier?.name} — ${age} hari unpaid`, action: '/finance' }) }
    return NextResponse.json({ success: true, data: notifications, count: notifications.length })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
