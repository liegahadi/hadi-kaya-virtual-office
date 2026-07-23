// POST /api/finance/memos/[id]/pay
// Pay one recipient's items (partial per-recipient, A11)
// Body: { lineIds: string[], bankOverride?: { bankName, bankAccount, bankHolder } }
// Creates Payment for each line + marks line PAID + recomputes memo status
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputePoStatus, recomputeWageStatus, recomputeExpenseStatus, recomputeMemoStatus } from '@/lib/finance/status'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { lineIds, bankOverride, paidAt, method } = body

    if (!lineIds?.length) {
      return NextResponse.json({ success: false, error: 'lineIds required' }, { status: 400 })
    }

    const memo = await db.memo.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!memo) return NextResponse.json({ success: false, error: 'Memo not found' }, { status: 404 })

    const paidDate = paidAt ? new Date(paidAt) : new Date()
    const paymentsCreated: any[] = []

    for (const lineId of lineIds) {
      const line = memo.lines.find(l => l.id === lineId)
      if (!line) continue
      if (line.status === 'PAID') continue // skip already paid

      // Determine amount dari actual entity
      let amount = 0
      let poId: string | null = null
      let wagePaymentId: string | null = null
      let expenseId: string | null = null
      let supplierId: string | null = null
      let workerId: string | null = null
      let bankName: string | null = bankOverride?.bankName || null
      let bankAccount: string | null = bankOverride?.bankAccount || null
      let bankHolder: string | null = bankOverride?.bankHolder || null

      if (line.kind === 'PO') {
        const po = await db.purchaseOrder.findUnique({ where: { id: line.itemId }, include: { supplier: true, payments: { where: { voided: false } } } })
        if (!po) continue
        const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
        const totalPaid = po.payments.reduce((s, p) => s + p.amount, 0)
        amount = Math.max(0, target - totalPaid)
        poId = po.id
        supplierId = po.supplierId
        if (!bankName) bankName = po.supplier?.bankName || null
        if (!bankAccount) bankAccount = po.supplier?.bankAccount || null
        if (!bankHolder) bankHolder = po.supplier?.bankHolder || null
      } else if (line.kind === 'WAGE') {
        const w = await db.wagePayment.findUnique({ where: { id: line.itemId }, include: { worker: true, payments: { where: { voided: false } } } })
        if (!w) continue
        const totalPaid = w.payments.reduce((s, p) => s + p.amount, 0)
        amount = Math.max(0, w.amount - totalPaid)
        wagePaymentId = w.id
        workerId = w.workerId
        if (!bankName) bankName = w.worker?.defaultBankName || null
        if (!bankAccount) bankAccount = w.worker?.defaultBankAccount || null
        if (!bankHolder) bankHolder = w.worker?.defaultBankHolder || null
      } else if (line.kind === 'EXPENSE') {
        const e = await db.otherExpense.findUnique({ where: { id: line.itemId }, include: { payments: { where: { voided: false } } } })
        if (!e) continue
        const totalPaid = e.payments.reduce((s, p) => s + p.amount, 0)
        amount = Math.max(0, e.amount - totalPaid)
        expenseId = e.id
        if (!bankName) bankName = e.bankName || null
        if (!bankAccount) bankAccount = e.bankAccount || null
        if (!bankHolder) bankHolder = e.bankHolder || null
      }

      if (amount <= 0) continue

      // Create Payment
      const payment = await db.payment.create({
        data: {
          poId, wagePaymentId, expenseId,
          amount,
          method: method || 'TRANSFER',
          bankName, bankAccount, bankHolder,
          paidAt: paidDate,
          notes: `Paid via Memo ${memo.memoNumber}`,
          supplierId, workerId,
        },
      })
      paymentsCreated.push(payment)

      // Mark MemoLine PAID
      await db.memoLine.update({
        where: { id: lineId },
        data: { status: 'PAID', paidAt: paidDate },
      })

      // Recompute status of linked entity
      if (poId) await recomputePoStatus(poId)
      if (wagePaymentId) await recomputeWageStatus(wagePaymentId)
      if (expenseId) await recomputeExpenseStatus(expenseId)
    }

    // Recompute memo status
    const newStatus = await recomputeMemoStatus(id)

    return NextResponse.json({
      success: true,
      data: { paymentsCreated: paymentsCreated.length, newMemoStatus: newStatus },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
