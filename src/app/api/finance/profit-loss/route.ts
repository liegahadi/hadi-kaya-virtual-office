import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const projects = await db.project.findMany({ where: projectId ? { id: projectId } : {}, include: { units: true } })
    const result = []
    for (const p of projects) {
      // Revenue: sum of unit.price × units sold
      const soldUnits = p.units.filter((u: any) => u.status === 'SOLD')
      const revenue = soldUnits.reduce((s: number, u: any) => s + u.price, 0)
      // Cost: material (usages) + wage + expense
      const usages = await db.materialUsage.findMany({ where: { projectId: p.id }, include: { items: true } })
      const materialCost = usages.reduce((s, u) => s + u.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      const wages = await db.wagePayment.findMany({ where: { projectId: p.id } })
      const wageCost = wages.reduce((s, w) => s + w.amount, 0)
      const expenses = await db.otherExpense.findMany({ where: { projectId: p.id } })
      const opsCost = expenses.reduce((s, e) => s + e.amount, 0)
      const totalCost = materialCost + wageCost + opsCost
      const profit = revenue - totalCost
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0
      result.push({ projectId: p.id, projectName: p.name, projectCode: p.code, totalUnits: p.units.length, soldUnits: soldUnits.length, revenue, materialCost, wageCost, opsCost, totalCost, profit, margin })
    }
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
