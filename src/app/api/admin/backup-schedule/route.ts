import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // Trigger backup: export all finance data to JSON
    const [projects, units, suppliers, materials, categories, wageTypes, purchaseOrders, wagePayments, otherExpenses, memos, stock, usages] = await Promise.all([
      db.project.findMany(), db.unit.findMany(), db.supplier.findMany(), db.material.findMany(),
      db.category.findMany(), db.wageType.findMany(), db.purchaseOrder.findMany({ include: { items: true, payments: true, notas: true } }),
      db.wagePayment.findMany({ include: { payments: true } }), db.otherExpense.findMany({ include: { payments: true } }),
      db.memo.findMany({ include: { lines: true } }), db.stock.findMany(), db.materialUsage.findMany({ include: { items: true } }),
    ])
    const backup = { backupDate: new Date().toISOString(), projects, units, suppliers, materials, categories, wageTypes, purchaseOrders, wagePayments, otherExpenses, memos, stock, usages }
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().slice(0,10)}.json"` },
    })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
