import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const units = await db.unit.findMany({ include: { project: true } })
    const result: any[] = []
    for (const u of units) {
      const usages = await db.materialUsage.findMany({ where: { unitId: u.id }, include: { items: true } })
      const materialCost = usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id } })
      const wageCost = wages.reduce((s, w) => s + w.amount, 0)
      result.push({ blockNumber: u.blockNumber, project: u.project.name, materialCost, wageCost, totalCost: materialCost + wageCost })
    }
    result.sort((a, b) => a.blockNumber.localeCompare(b.blockNumber))
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
