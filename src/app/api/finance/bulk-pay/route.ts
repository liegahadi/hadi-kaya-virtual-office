// POST /api/finance/bulk-pay — pay multiple items at once
// Body: { items: [{ type: 'PO'|'WAGE'|'EXPENSE', id: string, amount: number }], method, paidAt, bankName?, bankAccount?, bankHolder? }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputePoStatus, recomputeWageStatus, recomputeExpenseStatus } from '@/lib/finance/status'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, method, paidAt, bankName, bankAccount, bankHolder } = body
    if (!items?.length) return NextResponse.json({ success: false, error: 'items required' }, { status: 400 })
    const paidDate = paidAt ? new Date(paidAt) : new Date()
    const paymentsCreated = []
    for (const item of items) {
      const paymentData: any = { amount: item.amount, method: method || 'TRANSFER', bankName, bankAccount, bankHolder, paidAt: paidDate, notes: 'Bulk payment' }
      if (item.type === 'PO') { paymentData.poId = item.id; const po = await db.purchaseOrder.findUnique({ where: { id: item.id }, select: { supplierId: true } }); paymentData.supplierId = po?.supplierId }
      else if (item.type === 'WAGE') { paymentData.wagePaymentId = item.id; const w = await db.wagePayment.findUnique({ where: { id: item.id }, select: { workerId: true } }); paymentData.workerId = w?.workerId }
      else if (item.type === 'EXPENSE') { paymentData.expenseId = item.id }
      const payment = await db.payment.create({ data: paymentData })
      paymentsCreated.push(payment.id)
      if (item.type === 'PO') await recomputePoStatus(item.id)
      else if (item.type === 'WAGE') await recomputeWageStatus(item.id)
      else if (item.type === 'EXPENSE') await recomputeExpenseStatus(item.id)
    }
    return NextResponse.json({ success: true, data: { paymentsCreated: paymentsCreated.length, ids: paymentsCreated } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
