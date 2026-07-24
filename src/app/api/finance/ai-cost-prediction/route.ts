import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    // Get all completed units (100% wages paid) for historical data
    const units = await db.unit.findMany({
      where: projectId ? { projectId } : {},
      include: { project: true },
    })
    const predictions: any[] = []
    // Get material price trends from PO items
    const allPoItems = await db.pOItem.findMany({ include: { material: true, po: { select: { poDate: true } } }, orderBy: { po: { poDate: 'desc' } } })
    // Group by material → compute avg price + trend
    const priceTrends = new Map<string, { name: string; avgPrice: number; latestPrice: number; priceCount: number; trend: number }>()
    for (const it of allPoItems) {
      const key = it.materialId
      const existing = priceTrends.get(key) || { name: it.material?.name || '', avgPrice: 0, latestPrice: 0, priceCount: 0, trend: 0 }
      existing.avgPrice = (existing.avgPrice * existing.priceCount + it.price) / (existing.priceCount + 1)
      if (existing.priceCount === 0) existing.latestPrice = it.price
      existing.priceCount++
      priceTrends.set(key, existing)
    }
    // Compute avg cost per completed unit
    let totalCompletedCost = 0; let completedCount = 0
    for (const u of units) {
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id } })
      const usages = await db.materialUsage.findMany({ where: { unitId: u.id }, include: { items: true } })
      const cost = wages.reduce((s, w) => s + w.amount, 0) + usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      if (cost > 0) { totalCompletedCost += cost; completedCount++ }
    }
    const avgCostPerUnit = completedCount > 0 ? totalCompletedCost / completedCount : 0
    // Predict for incomplete units
    for (const u of units) {
      const wages = await db.wagePayment.findMany({ where: { unitId: u.id } })
      const usages = await db.materialUsage.findMany({ where: { unitId: u.id }, include: { items: true } })
      const currentCost = wages.reduce((s, w) => s + w.amount, 0) + usages.reduce((s, u2) => s + u2.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
      const wageTypes = await db.wageType.findMany({ where: { projectId: u.projectId } })
      const completedWages = new Set(wages.map(w => w.wageTypeId)).size
      const completionPercent = wageTypes.length > 0 ? (completedWages / wageTypes.length) * 100 : 0
      // RAB benchmark
      const rabMaterial = await db.rABLine.aggregate({ where: { projectId: u.projectId }, _sum: { totalPrice: true } })
      const rabUpah = wageTypes.reduce((s, w) => s + w.price, 0)
      const rabTotal = (rabMaterial._sum.totalPrice || 0) + rabUpah
      // Prediction: if completion > 0, extrapolate; else use RAB + price trend adjustment
      let predictedCost: number
      let confidence: number
      if (completionPercent > 20) {
        predictedCost = (currentCost / completionPercent) * 100
        confidence = Math.min(95, 50 + completionPercent * 0.45)
      } else {
        // Use RAB + 5% inflation for price trend
        predictedCost = rabTotal * 1.05
        confidence = 60
      }
      predictions.push({ unitId: u.id, blockNumber: u.blockNumber, project: u.project.name, currentCost, completionPercent, rabTotal, predictedCost, variance: predictedCost - rabTotal, confidence })
    }
    return NextResponse.json({ success: true, data: { avgCostPerUnit, priceTrends: Array.from(priceTrends.values()).slice(0, 20), predictions } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
