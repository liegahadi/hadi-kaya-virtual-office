import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({ include: { purchaseOrders: { include: { payments: { where: { voided: false } } } } } })
    const result = suppliers.map(s => {
      const pos = s.purchaseOrders
      const totalPO = pos.length
      const totalAmount = pos.reduce((sum, po) => sum + (po.actualTotal || po.plannedTotal), 0)
      const paidAmount = pos.reduce((sum, po) => sum + po.payments.reduce((p, x) => p + x.amount, 0), 0)
      const unpaidAmount = totalAmount - paidAmount
      const avgPOValue = totalPO > 0 ? totalAmount / totalPO : 0
      return { id: s.id, name: s.name, totalPO, totalAmount, paidAmount, unpaidAmount, avgPOValue, bankName: s.bankName, bankAccount: s.bankAccount }
    }).sort((a, b) => b.totalAmount - a.totalAmount)
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
