// GET /api/finance/payments — list payments
// POST /api/finance/payments — create payment (partial per-recipient, A11)
//   After create: recompute status of linked PO/Wage/Expense
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recomputePoStatus, recomputeWageStatus, recomputeExpenseStatus } from '@/lib/finance/status'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const poId = searchParams.get('poId')
    const wagePaymentId = searchParams.get('wagePaymentId')
    const expenseId = searchParams.get('expenseId')
    const supplierId = searchParams.get('supplierId')
    const workerId = searchParams.get('workerId')

    const where: any = {}
    if (poId) where.poId = poId
    if (wagePaymentId) where.wagePaymentId = wagePaymentId
    if (expenseId) where.expenseId = expenseId
    if (supplierId) where.supplierId = supplierId
    if (workerId) where.workerId = workerId

    const payments = await db.payment.findMany({
      where,
      include: {
        supplier: { select: { name: true, bankAccount: true } },
        worker: { select: { name: true, defaultBankAccount: true } },
        purchaseOrder: { select: { poNumber: true } },
        wagePayment: { select: { workDescription: true } },
        otherExpense: { select: { description: true, category: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: payments })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { poId, wagePaymentId, expenseId, amount, method, bankName, bankAccount, bankHolder, paidAt, notes, supplierId, workerId } = body

    // Validate: exactly one of poId/wagePaymentId/expenseId must be set
    const refs = [poId, wagePaymentId, expenseId].filter(Boolean)
    if (refs.length === 0) {
      return NextResponse.json({ success: false, error: 'Must specify poId, wagePaymentId, or expenseId' }, { status: 400 })
    }
    if (refs.length > 1) {
      return NextResponse.json({ success: false, error: 'Only one of poId/wagePaymentId/expenseId allowed per payment' }, { status: 400 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'amount must be > 0' }, { status: 400 })
    }

    // Auto-populate supplierId/workerId dari linked entity (kalau tidak di-override)
    let finalSupplierId = supplierId || null
    let finalWorkerId = workerId || null
    let finalBankName = bankName || null
    let finalBankAccount = bankAccount || null
    let finalBankHolder = bankHolder || null

    if (poId && !finalSupplierId) {
      const po = await db.purchaseOrder.findUnique({ where: { id: poId }, include: { supplier: true } })
      if (po?.supplier) {
        finalSupplierId = po.supplier.id
        if (!finalBankName) finalBankName = po.supplier.bankName
        if (!finalBankAccount) finalBankAccount = po.supplier.bankAccount
        if (!finalBankHolder) finalBankHolder = po.supplier.bankHolder
      }
    } else if (wagePaymentId && !finalWorkerId) {
      const wage = await db.wagePayment.findUnique({ where: { id: wagePaymentId }, include: { worker: true } })
      if (wage?.worker) {
        finalWorkerId = wage.worker.id
        if (!finalBankName) finalBankName = wage.worker.defaultBankName
        if (!finalBankAccount) finalBankAccount = wage.worker.defaultBankAccount
        if (!finalBankHolder) finalBankHolder = wage.worker.defaultBankHolder
      }
    }

    const payment = await db.payment.create({
      data: {
        poId: poId || null,
        wagePaymentId: wagePaymentId || null,
        expenseId: expenseId || null,
        amount,
        method: method || 'TRANSFER',
        bankName: finalBankName,
        bankAccount: finalBankAccount,
        bankHolder: finalBankHolder,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes: notes || null,
        supplierId: finalSupplierId,
        workerId: finalWorkerId,
      },
    })

    // Recompute status of linked entity
    if (poId) await recomputePoStatus(poId)
    if (wagePaymentId) await recomputeWageStatus(wagePaymentId)
    if (expenseId) await recomputeExpenseStatus(expenseId)

    return NextResponse.json({ success: true, data: payment })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
