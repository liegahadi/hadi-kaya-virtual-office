// GET /api/finance/payments/[id]/bukti-kas-keluar — generate Bukti Kas Keluar PDF for a Payment
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateBuktiKasKeluarPDF } from '@/lib/finance/pdf/bukti-kas-keluar'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        supplier: true,
        worker: true,
        purchaseOrder: { include: { supplier: true, project: true } },
        wagePayment: { include: { worker: true, project: true } },
        otherExpense: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    // Determine recipient
    let recipientName = ''
    let recipientType = ''
    let description = ''
    if (payment.poId && payment.purchaseOrder) {
      recipientName = payment.purchaseOrder.supplier.name
      recipientType = 'Supplier'
      description = `PO ${payment.purchaseOrder.poNumber.replace(/-/g, '/')} - ${payment.purchaseOrder.project.name}`
    } else if (payment.wagePaymentId && payment.wagePayment) {
      recipientName = payment.wagePayment.worker.name
      recipientType = 'Tukang'
      description = `Upah ${payment.wagePayment.workDescription || ''} - ${payment.wagePayment.project.name}`
    } else if (payment.expenseId && payment.otherExpense) {
      recipientName = payment.otherExpense.recipientName
      recipientType = payment.otherExpense.category
      description = payment.otherExpense.description
    } else {
      recipientName = payment.supplier?.name || payment.worker?.name || 'Unknown'
      recipientType = 'Lainnya'
      description = payment.notes || ''
    }

    const voucherNumber = `BKK-${payment.id.substring(0, 8).toUpperCase()}`
    const pdfBuffer = await generateBuktiKasKeluarPDF({
      voucherNumber,
      voucherDate: payment.paidAt.toISOString(),
      recipientName,
      recipientType,
      description,
      amount: payment.amount,
      bankName: payment.bankName,
      bankAccount: payment.bankAccount,
      bankHolder: payment.bankHolder,
      method: payment.method,
      notes: payment.notes,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${voucherNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error('Bukti Kas Keluar PDF error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
