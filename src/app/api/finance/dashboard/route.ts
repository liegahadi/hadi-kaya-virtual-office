// GET /api/finance/dashboard — OPTIMIZED (single query for cashflow, no N+1)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // === SINGLE QUERY: all non-voided payments for cashflow + KPI ===
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const allPayments = await db.payment.findMany({
      where: { paidAt: { gte: sixMonthsAgo, lte: endOfMonth }, voided: false },
      select: { amount: true, paidAt: true, poId: true, wagePaymentId: true, expenseId: true, supplierId: true, workerId: true },
    })

    // KPI: Total keluar bln ini
    const paymentsThisMonth = allPayments.filter(p => p.paidAt >= startOfMonth && p.paidAt <= endOfMonth)
    const totalKeluarBlnIni = paymentsThisMonth.reduce((s, p) => s + p.amount, 0)

    // Cashflow 6 bulan (group in memory, no DB loop)
    const cashflow: Array<{ month: string; material: number; upah: number; ops: number }> = []
    for (let i = 5; i >= 0; i--) {
      const startM = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endM = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthName = startM.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      const monthPayments = allPayments.filter(p => p.paidAt >= startM && p.paidAt <= endM)
      let material = 0, upah = 0, ops = 0
      for (const p of monthPayments) {
        if (p.poId) material += p.amount
        else if (p.wagePaymentId) upah += p.amount
        else if (p.expenseId) ops += p.amount
      }
      cashflow.push({ month: monthName, material, upah, ops })
    }

    // === OUTSTANDING (3 queries with include, no loop per item) ===
    const [unpaidPos, unpaidWages, unpaidExpenses] = await Promise.all([
      db.purchaseOrder.findMany({
        where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
        include: { payments: { where: { voided: false }, select: { amount: true } }, supplier: { select: { name: true, bankAccount: true } } },
        take: 50,
      }),
      db.wagePayment.findMany({
        where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
        include: { payments: { where: { voided: false }, select: { amount: true } }, worker: { select: { name: true, defaultBankAccount: true } }, unit: { select: { blockNumber: true } } },
        take: 50,
      }),
      db.otherExpense.findMany({
        where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
        include: { payments: { where: { voided: false }, select: { amount: true } }, project: { select: { code: true } } },
        take: 50,
      }),
    ])

    const outstandingMaterial = unpaidPos.reduce((s, po) => {
      const paid = po.payments.reduce((p, x) => p + x.amount, 0)
      const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
      return s + Math.max(0, target - paid)
    }, 0)

    const outstandingUpah = unpaidWages.reduce((s, w) => {
      const paid = w.payments.reduce((p, x) => p + x.amount, 0)
      return s + Math.max(0, w.amount - paid)
    }, 0)

    const outstandingOps = unpaidExpenses.reduce((s, e) => {
      const paid = e.payments.reduce((p, x) => p + x.amount, 0)
      return s + Math.max(0, e.amount - paid)
    }, 0)

    const totalOutstanding = outstandingMaterial + outstandingUpah + outstandingOps

    // Per Penerima
    const perPenerima: Array<{ name: string; type: string; amount: number; bankAccount?: string | null; refId?: string; unit?: string }> = []

    for (const po of unpaidPos) {
      const paid = po.payments.reduce((p, x) => p + x.amount, 0)
      const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
      const remaining = Math.max(0, target - paid)
      if (remaining > 0) perPenerima.push({ name: po.supplier?.name || 'Unknown', type: 'Material', amount: remaining, bankAccount: po.supplier?.bankAccount, refId: po.id })
    }

    for (const w of unpaidWages) {
      const paid = w.payments.reduce((p, x) => p + x.amount, 0)
      const remaining = Math.max(0, w.amount - paid)
      if (remaining > 0) perPenerima.push({ name: w.worker?.name || 'Unknown', type: 'Upah', amount: remaining, bankAccount: w.worker?.defaultBankAccount, refId: w.id, unit: w.unit?.blockNumber })
    }

    for (const e of unpaidExpenses) {
      const paid = e.payments.reduce((p, x) => p + x.amount, 0)
      const remaining = Math.max(0, e.amount - paid)
      if (remaining > 0) perPenerima.push({ name: e.recipientName, type: e.category || 'Ops', amount: remaining, bankAccount: e.bankAccount, refId: e.id, unit: e.project?.code })
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
        kpi: { totalKeluarBlnIni, outstandingMaterial, outstandingUpah, outstandingOps, totalOutstanding },
        cashflow,
        outstanding: { perPenerima: perPenerima.slice(0, 20), perKategori },
      },
    })
  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
