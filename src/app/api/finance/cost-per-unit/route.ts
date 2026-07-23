// GET /api/finance/cost-per-unit?projectId=XXX
// Returns biaya per unit (material + upah + ops) ranked termahal-termurah
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
    const result = []
    for (const u of units) {
      const usages = await db.materialUsage.findMany({ where: { unitId: u.id }, include: { items: true } })
      const material = usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id } })
      const upah = wages.reduce((s, w) => s + w.amount, 0)
      const expenses = await db.otherExpense.findMany({ where: { unitId: u.id } })
      const ops = expenses.reduce((s, e) => s + e.amount, 0)
      result.push({ id: u.id, blockNumber: u.blockNumber, project: u.project, material, upah, ops, total: material + upah + ops })
    }
    result.sort((a, b) => b.total - a.total)
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
