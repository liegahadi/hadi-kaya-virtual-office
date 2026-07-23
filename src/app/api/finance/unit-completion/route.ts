// GET /api/finance/unit-completion?projectId=XXX
// Auto-calculate % completion per unit based on WageType paid count
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
      // Get all wage types for this project (13 pekerjaan standard)
      const wageTypes = await db.wageType.findMany({ where: { projectId: u.projectId }, select: { id: true, name: true, price: true } })
      const totalWorkItems = wageTypes.length
      // Get wage payments for this unit
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id }, select: { wageTypeId: true, amount: true, fullTaskBudget: true, status: true } })
      // Count completed work items (wageType yang sudah ada payment)
      const completedWorkItems = new Set(wages.filter(w => w.status === 'PAID' || w.amount > 0).map(w => w.wageTypeId)).size
      const inProgressItems = new Set(wages.filter(w => w.status === 'PARTIAL_PAID').map(w => w.wageTypeId)).size
      const completionPercent = totalWorkItems > 0 ? Math.round((completedWorkItems / totalWorkItems) * 100) : 0
      // Cost so far
      const totalCost = wages.reduce((s, w) => s + w.amount, 0)
      const totalBudget = wageTypes.reduce((s, w) => s + w.price, 0)
      result.push({
        unitId: u.id, blockNumber: u.blockNumber, project: u.project,
        totalWorkItems, completedWorkItems, inProgressItems,
        completionPercent, totalCost, totalBudget,
        workItems: wageTypes.map(wt => {
          const wage = wages.find(w => w.wageTypeId === wt.id)
          return { name: wt.name, budget: wt.price, paid: wage?.amount || 0, status: wage?.status || 'NOT_STARTED', percent: wage && wt.price > 0 ? Math.min(100, Math.round((wage.amount / wt.price) * 100)) : 0 }
        }),
      })
    }
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
