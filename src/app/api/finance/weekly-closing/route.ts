import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const payments = await db.payment.findMany({ where: { paidAt: { gte: weekAgo, lte: now }, voided: false }, include: { purchaseOrder: { include: { supplier: true } }, wagePayment: { include: { worker: true } }, otherExpense: true } })
    const newPOs = await db.purchaseOrder.findMany({ where: { poDate: { gte: weekAgo, lte: now } }, include: { supplier: true } })
    const unpaidPos = await db.purchaseOrder.findMany({ where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } }, include: { supplier: true } })
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
    return NextResponse.json({ success: true, data: { weekStart: weekAgo, weekEnd: now, totalPaid, paymentCount: payments.length, newPOCount: newPOs.length, unpaidCount: unpaidPos.length, payments: payments.map(p => ({ date: p.paidAt, amount: p.amount, recipient: p.purchaseOrder?.supplier?.name || p.wagePayment?.worker?.name || p.otherExpense?.recipientName || 'Unknown', type: p.poId ? 'PO' : p.wagePaymentId ? 'WAGE' : 'EXPENSE' })), newPOs: newPOs.map(po => ({ poNumber: po.poNumber, supplier: po.supplier?.name, total: po.plannedTotal, date: po.poDate })), unpaid: unpaidPos.map(po => ({ poNumber: po.poNumber, supplier: po.supplier?.name, remaining: po.actualTotal || po.plannedTotal })) } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
