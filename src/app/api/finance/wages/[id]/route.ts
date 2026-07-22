// GET/PATCH/DELETE /api/finance/wages/[id]
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputeWageStatus } from '@/lib/finance/status'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const wage = await db.wagePayment.findUnique({
      where: { id },
      include: { worker: true, wageType: true, project: true, unit: true, payments: { orderBy: { paidAt: 'desc' } } },
    })
    if (!wage) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const totalPaid = wage.payments.filter(p => !p.voided).reduce((s, p) => s + p.amount, 0)
    return NextResponse.json({ success: true, data: { ...wage, totalPaid, remaining: Math.max(0, wage.amount - totalPaid) } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await db.wagePayment.update({
      where: { id },
      data: {
        amount: body.amount,
        workDescription: body.workDescription || null,
        budgetVarianceReason: body.budgetVarianceReason || null,
        weekClosing: body.weekClosing || null,
        notes: body.notes || null,
      },
    })
    await recomputeWageStatus(id)
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.wagePayment.update({ where: { id }, data: { status: 'VOIDED' } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
