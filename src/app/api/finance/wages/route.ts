// GET /api/finance/wages — list wage payments
// POST /api/finance/wages — create wage payment (1 record = 1 termin, snapshot fullTaskBudget)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const workerId = searchParams.get('workerId')

    const where: any = {}
    if (status) where.status = status
    if (projectId) where.projectId = projectId
    if (workerId) where.workerId = workerId

    const wages = await db.wagePayment.findMany({
      where,
      include: {
        worker: true,
        wageType: true,
        project: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, blockNumber: true } },
        payments: { where: { voided: false }, select: { amount: true } },
      },
      orderBy: { wageDate: 'desc' },
      take: 100,
    })

    const wagesWithComputed = wages.map(w => {
      const totalPaid = w.payments.reduce((s, p) => s + p.amount, 0)
      return { ...w, totalPaid, remaining: Math.max(0, w.amount - totalPaid) }
    })

    return NextResponse.json({ success: true, data: wagesWithComputed })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workerId, wageTypeId, projectId, unitId, amount, workDescription, wageDate, weekClosing, notes } = body

    if (!workerId || !wageTypeId || !projectId) {
      return NextResponse.json({ success: false, error: 'workerId, wageTypeId, projectId required' }, { status: 400 })
    }

    // Snapshot fullTaskBudget from WageType.price (locked saat create, A7)
    const wageType = await db.wageType.findUnique({ where: { id: wageTypeId } })
    if (!wageType) return NextResponse.json({ success: false, error: 'WageType not found' }, { status: 404 })

    const fullTaskBudget = wageType.price
    const actualAmount = amount || 0

    // A7: if amount > fullTaskBudget, budgetVarianceReason wajib
    let budgetVarianceReason = body.budgetVarianceReason
    if (actualAmount > fullTaskBudget && !budgetVarianceReason) {
      return NextResponse.json({ success: false, error: 'budgetVarianceReason required when amount > fullTaskBudget' }, { status: 400 })
    }

    const wage = await db.wagePayment.create({
      data: {
        workerId,
        wageTypeId,
        projectId,
        unitId: unitId || null,
        fullTaskBudget,
        amount: actualAmount,
        workDescription: workDescription || null,
        status: actualAmount > 0 ? 'UNPAID' : 'DRAFT',
        budgetVarianceReason: budgetVarianceReason || null,
        weekClosing: weekClosing || null,
        wageDate: wageDate ? new Date(wageDate) : new Date(),
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: wage })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
