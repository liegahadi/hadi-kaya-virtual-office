// GET /api/finance/dashboard
// Returns: KPIs, cashflow 6 months, outstanding hutang per-penerima & per-kategori
// Layout A per PRD section 25.7
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // === KPI TILES ===
    const paymentsThisMonth = await db.payment.findMany({
      where: {
        paidAt: { gte: startOfMonth, lte: endOfMonth },
        voided: false,
      },
      select: { amount: true, poId: true, wagePaymentId: true, expenseId: true },
    })
    const totalKeluarBlnIni = paymentsThisMonth.reduce((s, p) => s + p.amount, 0)

    const unpaidPos = await db.purchaseOrder.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
      include: { payments: { where: { voided: false }, select: { amount: true } }, supplier: true },
    })
    const outstandingMaterial = unpaidPos.reduce((s, po) => {
      const paid = po.payments.reduce((p, x) => p + x.amount, 0)
      const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
      return s + Math.max(0, target - paid)
    }, 0)

    const unpaidWages = await db.wagePayment.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
      include: { payments: { where: { voided: false }, select: { amount: true } }, worker: true },
    })
    const outstandingUpah = unpaidWages.reduce((s, w) => {
      const paid = w.payments.reduce((p, x) => p + x.amount, 0)
      return s + Math.max(0, w.amount - paid)
    }, 0)

    const unpaidExpenses = await db.otherExpense.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
      include: { payments: { where: { voided: false }, select: { amount: true } } },
    })
    const outstandingOps = unpaidExpenses.reduce((s, e) => {
      const paid = e.payments.reduce((p, x) => p + x.amount, 0)
      return s + Math.max(0, e.amount - paid)
    }, 0)

    const totalOutstanding = outstandingMaterial + outstandingUpah + outstandingOps

    // === CASHFLOW 6 BULAN ===
    const cashflow: Array<{ month: string; material: number; upah: number; ops: number }> = []
    for (let i = 5; i >= 0; i--) {
      const startM = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endM = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthName = startM.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

      const monthPayments = await db.payment.findMany({
        where: { paidAt: { gte: startM, lte: endM }, voided: false },
        select: { amount: true, poId: true, wagePaymentId: true, expenseId: true },
      })

      let material = 0, upah = 0, ops = 0
      for (const p of monthPayments) {
        if (p.poId) material += p.amount
        else if (p.wagePaymentId) upah += p.amount
        else if (p.expenseId) ops += p.amount
      }
      cashflow.push({ month: monthName, material, upah, ops })
    }

    // === OUTSTANDING PER PENERIMA ===
    const perPenerima: Array<{ name: string; type: string; amount: number; bankAccount?: string | null; refId?: string }> = []

    for (const po of unpaidPos) {
      const paid = po.payments.reduce((p, x) => p + x.amount, 0)
      const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
      const remaining = Math.max(0, target - paid)
      if (remaining > 0) {
        perPenerima.push({
          name: po.supplier?.name || 'Unknown',
          type: 'Material',
          amount: remaining,
          bankAccount: po.supplier?.bankAccount,
          refId: po.id,
        })
      }
    }

    for (const w of unpaidWages) {
      const paid = w.payments.reduce((p, x) => p + x.amount, 0)
      const remaining = Math.max(0, w.amount - paid)
      if (remaining > 0) {
        perPenerima.push({
          name: w.worker?.name || 'Unknown',
          type: 'Upah',
          amount: remaining,
          bankAccount: w.worker?.defaultBankAccount,
          refId: w.id,
        })
      }
    }

    for (const e of unpaidExpenses) {
      const paid = e.payments.reduce((p, x) => p + x.amount, 0)
      const remaining = Math.max(0, e.amount - paid)
      if (remaining > 0) {
        perPenerima.push({
          name: e.recipientName,
          type: e.category || 'Ops',
          amount: remaining,
          bankAccount: e.bankAccount,
          refId: e.id,
        })
      }
    }

    perPenerima.sort((a, b) => b.amount - a.amount)

    const perKategori = [
      { category: 'Material', amount: outstandingMaterial, count: unpaidPos.length },
      { category: 'Upah', amount: outstandingUpah, count: unpaidWages.length },
      { category: 'Ops', amount: outstandingOps, count: unpaidExpenses.length },
    ]

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalKeluarBlnIni,
          outstandingMaterial,
          outstandingUpah,
          outstandingOps,
          totalOutstanding,
        },
        cashflow,
        outstanding: {
          perPenerima: perPenerima.slice(0, 20),
          perKategori,
        },
      },
    })
  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
