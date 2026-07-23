// GET /api/finance/expenses — list other expenses
// POST /api/finance/expenses — create expense
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const projectId = searchParams.get('projectId')

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (projectId) where.projectId = projectId

    const expenses = await db.otherExpense.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, blockNumber: true } },
        payments: { where: { voided: false }, select: { amount: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 100,
    })

    const expensesWithComputed = expenses.map(e => {
      const totalPaid = e.payments.reduce((s, p) => s + p.amount, 0)
      return { ...e, totalPaid, remaining: Math.max(0, e.amount - totalPaid) }
    })

    return NextResponse.json({ success: true, data: expensesWithComputed })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, recipientName, amount, description, projectId, unitId, paymentCycle, isCash, bankName, bankAccount, bankHolder, expenseDate } = body

    if (!category || !recipientName || !amount || !description) {
      return NextResponse.json({ success: false, error: 'category, recipientName, amount, description required' }, { status: 400 })
    }

    const expense = await db.otherExpense.create({
      data: {
        category,
        recipientName,
        amount,
        description,
        projectId: projectId || null,
        unitId: unitId || null,
        paymentCycle: paymentCycle || null,
        isCash: isCash || false,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankHolder: bankHolder || null,
        status: amount > 0 ? 'UNPAID' : 'DRAFT',
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      },
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
