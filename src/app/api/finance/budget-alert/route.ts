import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const units = await db.unit.findMany({ include: { project: true } })
    const alerts: any[] = []
    for (const u of units) {
      const usages = await db.materialUsage.findMany({ where: { unitId: u.id }, include: { items: true } })
      const materialCost = usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id } })
      const wageCost = wages.reduce((s, w) => s + w.amount, 0)
      const totalCost = materialCost + wageCost
      // RAB benchmark per unit: Rp 21M (upah) + Rp 52.8M (material) = Rp 73.8M
      const rabBenchmark = 73800000
      if (totalCost > rabBenchmark * 0.9) {
        alerts.push({ unitId: u.id, blockNumber: u.blockNumber, project: u.project.name, totalCost, rabBenchmark, percentUsed: (totalCost / rabBenchmark) * 100, status: totalCost > rabBenchmark ? 'OVER_BUDGET' : 'WARNING' })
      }
    }
    return NextResponse.json({ success: true, data: alerts, count: alerts.length })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
