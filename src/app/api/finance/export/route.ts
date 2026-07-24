// GET /api/finance/export?type=po|wages|expenses&format=csv
// Export data to CSV for accounting/audit
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'po'
    let csv = ''
    let filename = ''

    if (type === 'po') {
      const pos = await db.purchaseOrder.findMany({ include: { supplier: true, project: true }, orderBy: { poDate: 'desc' } })
      csv = 'No PO,Tanggal,Supplier,Project,Status,Planned Total,Actual Total\n'
      for (const po of pos) {
        csv += `${po.poNumber.replace(/-/g, '/')},${new Date(po.poDate).toLocaleDateString('id-ID')},${po.supplier?.name || ''},${po.project?.name || ''},${po.status},${po.plannedTotal},${po.actualTotal}\n`
      }
      filename = 'po-list'
    } else if (type === 'wages') {
      const wages = await db.wagePayment.findMany({ include: { worker: true, wageType: true, project: true, unit: true }, orderBy: { wageDate: 'desc' } })
      csv = 'Tanggal,Tukang,Pekerjaan,Project,Unit,Amount,Budget,Status\n'
      for (const w of wages) {
        csv += `${new Date(w.wageDate).toLocaleDateString('id-ID')},${w.worker?.name || ''},${w.wageType?.name || ''},${w.project?.name || ''},${w.unit?.blockNumber || 'GDG'},${w.amount},${w.fullTaskBudget},${w.status}\n`
      }
      filename = 'wage-list'
    } else if (type === 'expenses') {
      const expenses = await db.otherExpense.findMany({ include: { project: true }, orderBy: { expenseDate: 'desc' } })
      csv = 'Tanggal,Kategori,Penerima,Description,Project,Amount,Status\n'
      for (const e of expenses) {
        csv += `${new Date(e.expenseDate).toLocaleDateString('id-ID')},${e.category},${e.recipientName},"${e.description.replace(/"/g, '""')}",${e.project?.name || ''},${e.amount},${e.status}\n`
      }
      filename = 'expense-list'
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
