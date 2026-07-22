// Status Recompute — recompute cached status dari Payment ledger
// PurchaseOrder/WagePayment/OtherExpense status = DRAFT | UNPAID | PARTIAL_PAID | PAID | VOIDED
//
// Logic:
// - VOIDED: explicit void flag (manual, not auto-recompute)
// - PAID: total paid (non-voided payments) >= actualTotal
// - PARTIAL_PAID: total paid > 0 but < actualTotal
// - UNPAID: total paid = 0 (but not DRAFT)
// - DRAFT: initial, no payments yet + plannedTotal = 0

import { db } from '@/lib/db'

export type FinanceStatus = 'DRAFT' | 'UNPAID' | 'PARTIAL_PAID' | 'PAID' | 'VOIDED'

/**
 * Recompute PurchaseOrder status dari Payment ledger
 */
export async function recomputePoStatus(poId: string): Promise<FinanceStatus> {
  const po = await db.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      payments: {
        where: { voided: false },
      },
    },
  })
  if (!po) throw new Error(`PO ${poId} not found`)

  if (po.status === 'VOIDED') return 'VOIDED'

  const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
  const totalPaid = po.payments.reduce((sum, p) => sum + p.amount, 0)

  let newStatus: FinanceStatus
  if (totalPaid >= target && target > 0) {
    newStatus = 'PAID'
  } else if (totalPaid > 0) {
    newStatus = 'PARTIAL_PAID'
  } else if (po.plannedTotal > 0) {
    newStatus = 'UNPAID'
  } else {
    newStatus = 'DRAFT'
  }

  if (newStatus !== po.status) {
    await db.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus },
    })
  }

  return newStatus
}

/**
 * Recompute WagePayment status dari Payment ledger
 */
export async function recomputeWageStatus(wagePaymentId: string): Promise<FinanceStatus> {
  const wage = await db.wagePayment.findUnique({
    where: { id: wagePaymentId },
    include: {
      payments: {
        where: { voided: false },
      },
    },
  })
  if (!wage) throw new Error(`WagePayment ${wagePaymentId} not found`)

  if (wage.status === 'VOIDED') return 'VOIDED'

  const target = wage.amount
  const totalPaid = wage.payments.reduce((sum, p) => sum + p.amount, 0)

  let newStatus: FinanceStatus
  if (totalPaid >= target && target > 0) {
    newStatus = 'PAID'
  } else if (totalPaid > 0) {
    newStatus = 'PARTIAL_PAID'
  } else if (wage.amount > 0) {
    newStatus = 'UNPAID'
  } else {
    newStatus = 'DRAFT'
  }

  if (newStatus !== wage.status) {
    await db.wagePayment.update({
      where: { id: wagePaymentId },
      data: { status: newStatus },
    })
  }

  return newStatus
}

/**
 * Recompute OtherExpense status dari Payment ledger
 */
export async function recomputeExpenseStatus(expenseId: string): Promise<FinanceStatus> {
  const expense = await db.otherExpense.findUnique({
    where: { id: expenseId },
    include: {
      payments: {
        where: { voided: false },
      },
    },
  })
  if (!expense) throw new Error(`OtherExpense ${expenseId} not found`)

  if (expense.status === 'VOIDED') return 'VOIDED'

  const target = expense.amount
  const totalPaid = expense.payments.reduce((sum, p) => sum + p.amount, 0)

  let newStatus: FinanceStatus
  if (totalPaid >= target && target > 0) {
    newStatus = 'PAID'
  } else if (totalPaid > 0) {
    newStatus = 'PARTIAL_PAID'
  } else if (expense.amount > 0) {
    newStatus = 'UNPAID'
  } else {
    newStatus = 'DRAFT'
  }

  if (newStatus !== expense.status) {
    await db.otherExpense.update({
      where: { id: expenseId },
      data: { status: newStatus },
    })
  }

  return newStatus
}

/**
 * Recompute Memo status dari MemoLine status
 */
export async function recomputeMemoStatus(memoId: string): Promise<string> {
  const memo = await db.memo.findUnique({
    where: { id: memoId },
    include: { lines: true },
  })
  if (!memo) throw new Error(`Memo ${memoId} not found`)

  if (memo.status === 'VOIDED') return 'VOIDED'

  const totalLines = memo.lines.length
  const paidLines = memo.lines.filter(l => l.status === 'PAID').length
  const skippedLines = memo.lines.filter(l => l.status === 'SKIPPED').length

  let newStatus: string
  if (paidLines === 0 && totalLines > 0) {
    newStatus = 'PROPOSED'
  } else if (paidLines + skippedLines === totalLines) {
    newStatus = 'COMPLETED'
  } else {
    newStatus = 'PARTIAL_PAID'
  }

  if (newStatus !== memo.status) {
    await db.memo.update({
      where: { id: memoId },
      data: { status: newStatus },
    })
  }

  return newStatus
}
