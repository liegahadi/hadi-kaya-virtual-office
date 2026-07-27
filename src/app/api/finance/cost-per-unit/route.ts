import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const units = await db.unit.findMany({
      where: projectId ? { projectId } : {},
      include: { project: { select: { name: true, code: true } } },
      orderBy: { blockNumber: 'asc' },
    })
    // Batch fetch
    const unitIds = units.map(u => u.id)
    const [allUsages, allWages, allExpenses] = await Promise.all([
      db.materialUsage.findMany({ where: { unitId: { in: unitIds } }, include: { items: true } }),
      db.wagePayment.findMany({ where: { unitId: { in: unitIds } }, select: { unitId: true, amount: true } }),
      db.otherExpense.findMany({ where: { unitId: { in: unitIds } }, select: { unitId: true, amount: true } }),
    ])
    const result = units.map(u => {
      const usages = allUsages.filter(uu => uu.unitId === u.id)
      const material = usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      const wages = allWages.filter(w => w.unitId === u.id)
      const upah = wages.reduce((s, w) => s + w.amount, 0)
      const expenses = allExpenses.filter(e => e.unitId === u.id)
      const ops = expenses.reduce((s, e) => s + e.amount, 0)
      return { id: u.id, blockNumber: u.blockNumber, project: u.project, material, upah, ops, total: material + upah + ops }
    })
    result.sort((a, b) => b.total - a.total)
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
