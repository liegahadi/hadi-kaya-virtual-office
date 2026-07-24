import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const anomalies: any[] = []
    // Check PO amounts — unusually high compared to average
    const pos = await db.purchaseOrder.findMany({ include: { items: { include: { material: true } }, supplier: true } })
    // Group by material → compute avg qty per PO
    const materialStats = new Map<string, { name: string; avgQty: number; count: number }>()
    for (const po of pos) { for (const it of po.items) { const key = it.materialId; const existing = materialStats.get(key) || { name: it.material?.name || '', avgQty: 0, count: 0 }; existing.avgQty = (existing.avgQty * existing.count + it.qty) / (existing.count + 1); existing.count++; materialStats.set(key, existing) } }
    // Check each PO item for anomaly (qty > 2x average)
    for (const po of pos) {
      for (const it of po.items) {
        const stats = materialStats.get(it.materialId)
        if (stats && stats.count > 2 && it.qty > stats.avgQty * 2) {
          anomalies.push({ type: 'HIGH_QTY', severity: 'WARNING', poNumber: po.poNumber.replace(/-/g, '/'), supplier: po.supplier?.name, material: it.material?.name, qty: it.qty, avgQty: stats.avgQty, multiplier: (it.qty / stats.avgQty).toFixed(1) + 'x', message: `${it.material?.name}: ${it.qty} ${it.material?.unitMeasure} (rata-rata: ${stats.avgQty.toFixed(0)} — ${(it.qty / stats.avgQty).toFixed(1)}x normal)` })
        }
      }
    }
    // Check wage payments > budget
    const wages = await db.wagePayment.findMany({ where: { amount: { gt: 0 } }, include: { worker: true, wageType: true } })
    for (const w of wages) {
      if (w.fullTaskBudget > 0 && w.amount > w.fullTaskBudget * 1.5) {
        anomalies.push({ type: 'WAGE_OVER_BUDGET', severity: 'CRITICAL', worker: w.worker?.name, workItem: w.wageType?.name, amount: w.amount, budget: w.fullTaskBudget, multiplier: (w.amount / w.fullTaskBudget).toFixed(1) + 'x', message: `${w.worker?.name} ${w.wageType?.name}: Rp ${w.amount.toLocaleString('id-ID')} (budget: Rp ${w.fullTaskBudget.toLocaleString('id-ID')} — ${(w.amount / w.fullTaskBudget).toFixed(1)}x)` })
      }
    }
    // Check material waste > 15%
    const materials = await db.material.findMany({ include: { poItems: true, usageItems: true, stock: true } })
    for (const m of materials) {
      const bought = m.poItems.reduce((s, it) => s + it.qty, 0)
      const used = m.usageItems.reduce((s, it) => s + it.qty, 0)
      const stock = m.stock?.quantity || 0
      const waste = bought - used - stock
      if (bought > 0 && waste / bought > 0.15) {
        anomalies.push({ type: 'HIGH_WASTE', severity: 'WARNING', material: m.name, bought, used, stock, waste, wastePercent: ((waste / bought) * 100).toFixed(1) + '%', message: `${m.name}: waste ${((waste / bought) * 100).toFixed(1)}% (${waste} ${m.unitMeasure} hilang dari ${bought})` })
      }
    }
    return NextResponse.json({ success: true, data: anomalies, count: anomalies.length })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
