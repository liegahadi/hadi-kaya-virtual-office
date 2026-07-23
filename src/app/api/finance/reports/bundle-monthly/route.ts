// GET /api/finance/reports/bundle-monthly?month=YYYY-MM — bundle semua money-out bulan itu
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bundleMonthlyPDF } from '@/lib/finance/pdf/bundle'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month')
    const now = new Date()
    const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth()
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)
    const monthName = startOfMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    const payments = await db.payment.findMany({
      where: { paidAt: { gte: startOfMonth, lte: endOfMonth }, voided: false },
      include: {
        purchaseOrder: { include: { supplier: true } },
        wagePayment: { include: { worker: true } },
        otherExpense: true,
      },
      orderBy: { paidAt: 'asc' },
    })

    const paymentData = payments.map(p => ({
      date: p.paidAt.toISOString(),
      amount: p.amount,
      method: p.method,
      recipientName: p.purchaseOrder?.supplier?.name || p.wagePayment?.worker?.name || p.otherExpense?.recipientName || 'Unknown',
      type: p.poId ? 'PO' : p.wagePaymentId ? 'WAGE' : 'EXPENSE',
      description: p.purchaseOrder?.poNumber || p.wagePayment?.workDescription || p.otherExpense?.description || '',
      bankName: p.bankName,
    }))

    const totalAmount = payments.reduce((s, p) => s + p.amount, 0)

    const pdfBuffer = await bundleMonthlyPDF({
      month: monthName,
      payments: paymentData,
      totalAmount,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Arsip-Bulanan-${monthName.replace(/\s/g, '-')}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error('Bundle monthly error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
