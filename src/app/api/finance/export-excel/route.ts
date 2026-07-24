import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'po'
    // Generate simple HTML table (Excel can open .xls HTML)
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">'
    let filename = ''
    if (type === 'po') {
      const pos = await db.purchaseOrder.findMany({ include: { supplier: true, project: true }, orderBy: { poDate: 'desc' } })
      html += '<tr><th>No PO</th><th>Tanggal</th><th>Supplier</th><th>Project</th><th>Status</th><th>Planned</th><th>Actual</th></tr>'
      for (const po of pos) html += `<tr><td>${po.poNumber.replace(/-/g, '/')}</td><td>${new Date(po.poDate).toLocaleDateString('id-ID')}</td><td>${po.supplier?.name || ''}</td><td>${po.project?.name || ''}</td><td>${po.status}</td><td>${po.plannedTotal}</td><td>${po.actualTotal}</td></tr>`
      filename = 'po-list'
    } else if (type === 'wages') {
      const wages = await db.wagePayment.findMany({ include: { worker: true, wageType: true, project: true, unit: true }, orderBy: { wageDate: 'desc' } })
      html += '<tr><th>Tanggal</th><th>Tukang</th><th>Pekerjaan</th><th>Project</th><th>Unit</th><th>Amount</th><th>Budget</th><th>Status</th></tr>'
      for (const w of wages) html += `<tr><td>${new Date(w.wageDate).toLocaleDateString('id-ID')}</td><td>${w.worker?.name || ''}</td><td>${w.wageType?.name || ''}</td><td>${w.project?.name || ''}</td><td>${w.unit?.blockNumber || 'GDG'}</td><td>${w.amount}</td><td>${w.fullTaskBudget}</td><td>${w.status}</td></tr>`
      filename = 'wage-list'
    } else if (type === 'expenses') {
      const expenses = await db.otherExpense.findMany({ include: { project: true }, orderBy: { expenseDate: 'desc' } })
      html += '<tr><th>Tanggal</th><th>Kategori</th><th>Penerima</th><th>Description</th><th>Project</th><th>Amount</th><th>Status</th></tr>'
      for (const e of expenses) html += `<tr><td>${new Date(e.expenseDate).toLocaleDateString('id-ID')}</td><td>${e.category}</td><td>${e.recipientName}</td><td>${e.description}</td><td>${e.project?.name || ''}</td><td>${e.amount}</td><td>${e.status}</td></tr>`
      filename = 'expense-list'
    }
    html += '</table></body></html>'
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'application/vnd.ms-excel', 'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().slice(0,10)}.xls"` } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
