// PATCH /api/finance/payments/[id] — void payment (no hard delete, audit preserved)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputePoStatus, recomputeWageStatus, recomputeExpenseStatus } from '@/lib/finance/status'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Void the payment
    const updated = await db.payment.update({
      where: { id },
      data: { voided: body.voided ?? true },
    })

    // Recompute status of linked entity
    if (updated.poId) await recomputePoStatus(updated.poId)
    if (updated.wagePaymentId) await recomputeWageStatus(updated.wagePaymentId)
    if (updated.expenseId) await recomputeExpenseStatus(updated.expenseId)

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
