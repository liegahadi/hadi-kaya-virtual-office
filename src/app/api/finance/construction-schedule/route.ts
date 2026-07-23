// GET /api/finance/construction-schedule?projectId=XXX
// Gantt chart data: pekerjaan per unit dengan timeline
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
    const schedule: any[] = []
    for (const u of units) {
      const wageTypes = await db.wageType.findMany({ where: { projectId: u.projectId }, orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } })
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id }, orderBy: { wageDate: 'asc' }, select: { wageTypeId: true, wageDate: true, amount: true, status: true } })
      const tasks = wageTypes.map((wt, i) => {
        const wage = wages.find(w => w.wageTypeId === wt.id)
        return {
          workItem: wt.name, order: i + 1, budget: wt.price,
          startDate: wage?.wageDate || null, paidAmount: wage?.amount || 0,
          status: !wage ? 'NOT_STARTED' : wage.status === 'PAID' ? 'DONE' : wage.status === 'PARTIAL_PAID' ? 'IN_PROGRESS' : 'STARTED',
          percent: wage && wt.price > 0 ? Math.min(100, Math.round((wage.amount / wt.price) * 100)) : 0,
        }
      })
      const completedTasks = tasks.filter(t => t.status === 'DONE').length
      const totalTasks = tasks.length
      const startDate = wages.length > 0 ? wages[0].wageDate : null
      const lastDate = wages.length > 0 ? wages[wages.length - 1].wageDate : null
      schedule.push({ unitId: u.id, blockNumber: u.blockNumber, project: u.project, totalTasks, completedTasks, completionPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0, startDate, lastDate, tasks })
    }
    return NextResponse.json({ success: true, data: schedule })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
