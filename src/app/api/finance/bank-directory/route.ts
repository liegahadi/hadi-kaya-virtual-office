import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({ where: { bankAccount: { not: null } }, select: { id: true, name: true, bankName: true, bankAccount: true, bankHolder: true, phone: true, _count: { select: { purchaseOrders: true } } }, orderBy: { name: 'asc' } })
    const workers = await db.worker.findMany({ where: { defaultBankAccount: { not: null } }, select: { id: true, name: true, defaultBankName: true, defaultBankAccount: true, defaultBankHolder: true, phone: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: { suppliers: suppliers.map(s => ({ type: 'Supplier', ...s })), workers: workers.map(w => ({ type: 'Tukang', name: w.name, bankName: w.defaultBankName, bankAccount: w.defaultBankAccount, bankHolder: w.defaultBankHolder, phone: w.phone })) } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
