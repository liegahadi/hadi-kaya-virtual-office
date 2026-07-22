import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/database-explorer/finance?q=search
// Returns POs, wage payments, other expenses, memos, payments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    const data: any[] = []

    // Fetch Purchase Orders (new schema)
    try {
      const pos = await db.purchaseOrder.findMany({
        where: q ? {
          OR: [
            { poNumber: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ]
        } : {},
        include: { supplier: true, project: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const po of pos) {
        data.push({
          id: po.id,
          type: 'Purchase Order',
          amount: po.actualTotal || po.plannedTotal || 0,
          status: po.status || 'UNKNOWN',
          description: `${po.poNumber} - ${po.supplier?.name || ''} (${po.project?.name || ''})`,
          createdAt: po.createdAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Fetch Wage Payments
    try {
      const wages = await db.wagePayment.findMany({
        where: q ? {
          OR: [
            { workDescription: { contains: q, mode: 'insensitive' } },
            { worker: { name: { contains: q, mode: 'insensitive' } } },
          ]
        } : {},
        include: { worker: true, project: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const w of wages) {
        data.push({
          id: w.id,
          type: 'Wage Payment',
          amount: w.amount || 0,
          status: w.status || 'UNKNOWN',
          description: `${w.worker?.name || ''} - ${w.workDescription || ''} (${w.project?.name || ''})`,
          createdAt: w.createdAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Fetch Other Expenses
    try {
      const expenses = await db.otherExpense.findMany({
        where: q ? {
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { recipientName: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ]
        } : {},
        include: { project: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const e of expenses) {
        data.push({
          id: e.id,
          type: 'Other Expense',
          amount: e.amount || 0,
          status: e.status || 'UNKNOWN',
          description: `${e.category} - ${e.recipientName} (${e.description})`,
          createdAt: e.createdAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Fetch Memos
    try {
      const memos = await db.memo.findMany({
        where: q ? { memoNumber: { contains: q, mode: 'insensitive' } } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const m of memos) {
        data.push({
          id: m.id,
          type: 'Memo',
          amount: 0, // total computed on frontend
          status: m.status || 'UNKNOWN',
          description: m.memoNumber,
          createdAt: m.createdAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Fetch Payments
    try {
      const payments = await db.payment.findMany({
        where: q ? { notes: { contains: q, mode: 'insensitive' } } : {},
        include: { supplier: true, worker: true },
        orderBy: { paidAt: 'desc' },
        take: 50,
      })
      for (const p of payments) {
        data.push({
          id: p.id,
          type: 'Payment',
          amount: p.amount || 0,
          status: p.voided ? 'VOIDED' : (p.method || 'TRANSFER'),
          description: `${p.supplier?.name || p.worker?.name || 'Unknown'} - ${p.notes || ''}`,
          createdAt: p.paidAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Sort by createdAt desc
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ success: true, data, meta: { total: data.length } })
  } catch (err: any) {
    console.error('Database explorer finance error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
