// GET /api/finance/search?q=keyword
// Global search across PO + Wage + Expense + Memo
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ success: true, data: [] })
    const results: any[] = []
    // Search PO
    const pos = await db.purchaseOrder.findMany({
      where: { OR: [{ poNumber: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } }, { supplier: { name: { contains: q, mode: 'insensitive' } } }] },
      include: { supplier: true, project: true }, take: 10,
    })
    for (const po of pos) results.push({ type: 'PO', id: po.id, title: po.poNumber.replace(/-/g, '/'), subtitle: `${po.supplier?.name} — ${po.project?.name}`, amount: po.actualTotal || po.plannedTotal, status: po.status, date: po.poDate })
    // Search Wage
    const wages = await db.wagePayment.findMany({
      where: { OR: [{ workDescription: { contains: q, mode: 'insensitive' } }, { worker: { name: { contains: q, mode: 'insensitive' } } }] },
      include: { worker: true, project: true }, take: 10,
    })
    for (const w of wages) results.push({ type: 'Wage', id: w.id, title: w.worker?.name, subtitle: `${w.workDescription || ''} — ${w.project?.name}`, amount: w.amount, status: w.status, date: w.wageDate })
    // Search Expense
    const expenses = await db.otherExpense.findMany({
      where: { OR: [{ description: { contains: q, mode: 'insensitive' } }, { recipientName: { contains: q, mode: 'insensitive' } }, { category: { contains: q, mode: 'insensitive' } }] },
      include: { project: true }, take: 10,
    })
    for (const e of expenses) results.push({ type: 'Expense', id: e.id, title: e.recipientName, subtitle: `${e.category} — ${e.description}`, amount: e.amount, status: e.status, date: e.expenseDate })
    // Search Memo
    const memos = await db.memo.findMany({
      where: { memoNumber: { contains: q, mode: 'insensitive' } }, take: 5,
    })
    for (const m of memos) results.push({ type: 'Memo', id: m.id, title: m.memoNumber, subtitle: m.status, amount: 0, status: m.status, date: m.memoDate })
    return NextResponse.json({ success: true, data: results })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
