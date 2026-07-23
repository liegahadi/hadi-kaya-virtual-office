import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const pos = await db.purchaseOrder.findMany({
      where: { status: { in: ['PARTIAL_PAID', 'UNPAID'] } },
      include: { supplier: true, project: true, payments: { where: { voided: false }, orderBy: { paidAt: 'asc' } } },
      orderBy: { poDate: 'asc' },
    })
    const result = pos.map(po => {
      const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
      const paid = po.payments.reduce((s, p) => s + p.amount, 0)
      const remaining = target - paid
      const installmentCount = po.payments.length
      const avgInstallment = installmentCount > 0 ? paid / installmentCount : 0
      const lastPaymentDate = po.payments.length > 0 ? po.payments[payments.length - 1].paidAt : null
      return { poId: po.id, poNumber: po.poNumber.replace(/-/g, '/'), supplier: po.supplier?.name, project: po.project?.name, target, paid, remaining, installmentCount, avgInstallment, lastPaymentDate, payments: po.payments.map(p => ({ date: p.paidAt, amount: p.amount, method: p.method })) }
    })
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
