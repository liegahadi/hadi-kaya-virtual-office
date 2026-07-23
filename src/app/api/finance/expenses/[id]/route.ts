// GET/PATCH/DELETE /api/finance/expenses/[id]
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputeExpenseStatus } from '@/lib/finance/status'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expense = await db.otherExpense.findUnique({
      where: { id },
      include: { project: true, unit: true, payments: { orderBy: { paidAt: 'desc' } } },
    })
    if (!expense) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const totalPaid = expense.payments.filter(p => !p.voided).reduce((s, p) => s + p.amount, 0)
    return NextResponse.json({ success: true, data: { ...expense, totalPaid, remaining: Math.max(0, expense.amount - totalPaid) } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await db.otherExpense.update({
      where: { id },
      data: {
        category: body.category,
        recipientName: body.recipientName,
        amount: body.amount,
        description: body.description,
        paymentCycle: body.paymentCycle || null,
        isCash: body.isCash,
        bankName: body.bankName || null,
        bankAccount: body.bankAccount || null,
        bankHolder: body.bankHolder || null,
        notes: body.notes || null,
      },
    })
    await recomputeExpenseStatus(id)
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.otherExpense.update({ where: { id }, data: { status: 'VOIDED' } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
