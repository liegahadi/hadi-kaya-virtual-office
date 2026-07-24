// RAB vs Actual Comparison
// Compare RABLine (planned material) vs MaterialUsageItem (actual)
// Compare WageType.price (planned upah) vs WagePayment.amount (actual)
// Per PRD section 25.12 — variance favorable (actual < planned) / unfavorable (actual > planned)

import { db } from '@/lib/db'

export interface MaterialComparisonRow {
  workItem: string
  materialName: string
  unitMeasure: string
  plannedQty: number
  plannedPrice: number
  plannedTotal: number
  actualQty: number
  actualPrice: number
  actualTotal: number
  variance: number // actual - planned. Positive = unfavorable (over budget)
  variancePercent: number
  status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TARGET'
}

export interface UpahComparisonRow {
  workItem: string // WageType.name
  plannedBudget: number // WageType.price (benchmark per unit)
  actualPaid: number // sum of WagePayment.amount
  unitCount: number // berapa unit sudah dibayar
  totalPlanned: number // plannedBudget × unitCount
  variance: number
  variancePercent: number
  status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TARGET'
}

export interface RabComparisonResult {
  project: { id: string; name: string; code: string | null }
  material: {
    rows: MaterialComparisonRow[]
    summary: { plannedTotal: number; actualTotal: number; variance: number; variancePercent: number }
  }
  upah: {
    rows: UpahComparisonRow[]
    summary: { plannedTotal: number; actualTotal: number; variance: number; variancePercent: number }
  }
  grandTotal: {
    planned: number
    actual: number
    variance: number
    variancePercent: number
  }
}

export async function computeRabComparison(projectId: string): Promise<RabComparisonResult> {
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project) throw new Error('Project not found')

  // === MATERIAL COMPARISON ===
  // Planned: RABLine grouped by workItem + materialName
  const rabLines = await db.rABLine.findMany({
    where: { projectId },
    orderBy: { workItem: 'asc' },
  })

  // Actual: MaterialUsageItem joined with MaterialUsage (filter projectId)
  const usages = await db.materialUsage.findMany({
    where: { projectId },
    include: { items: { include: { material: true } } },
  })

  // Build actual map: {workItem|materialName} → { qty, total }
  // Note: MaterialUsageItem doesn't have workItem directly, but has it as optional field
  const actualMap = new Map<string, { qty: number; total: number; price: number }>()
  for (const u of usages) {
    for (const item of u.items) {
      const workItem = item.workItem || 'Lainnya'
      const key = `${workItem}|${item.material.name}`
      const existing = actualMap.get(key) || { qty: 0, total: 0, price: 0 }
      existing.qty += item.qty
      existing.total += item.subtotal
      existing.price = existing.qty > 0 ? existing.total / existing.qty : 0
      actualMap.set(key, existing)
    }
  }

  // Build comparison rows
  const materialRows: MaterialComparisonRow[] = []
  const plannedMap = new Map<string, { qty: number; total: number; price: number; unitMeasure: string }>()

  for (const line of rabLines) {
    const key = `${line.workItem}|${line.materialName}`
    const existing = plannedMap.get(key) || { qty: 0, total: 0, price: 0, unitMeasure: line.unitMeasure }
    existing.qty += line.quantity
    existing.total += line.totalPrice
    existing.price = existing.qty > 0 ? existing.total / existing.qty : 0
    existing.unitMeasure = line.unitMeasure
    plannedMap.set(key, existing)
  }

  for (const [key, planned] of plannedMap) {
    const [workItem, materialName] = key.split('|')
    const actual = actualMap.get(key) || { qty: 0, total: 0, price: 0 }
    const variance = actual.total - planned.total
    const variancePercent = planned.total > 0 ? (variance / planned.total) * 100 : 0
    const status: MaterialComparisonRow['status'] =
      actual.total === 0 ? 'ON_TARGET' :
      variance < 0 ? 'FAVORABLE' :
      variance > 0 ? 'UNFAVORABLE' : 'ON_TARGET'

    materialRows.push({
      workItem,
      materialName,
      unitMeasure: planned.unitMeasure,
      plannedQty: planned.qty,
      plannedPrice: planned.price,
      plannedTotal: planned.total,
      actualQty: actual.qty,
      actualPrice: actual.price,
      actualTotal: actual.total,
      variance,
      variancePercent,
      status,
    })
  }

  // Add actual items that have no planned RAB (unplanned spending)
  for (const [key, actual] of actualMap) {
    if (!plannedMap.has(key)) {
      const [workItem, materialName] = key.split('|')
      materialRows.push({
        workItem,
        materialName,
        unitMeasure: '—',
        plannedQty: 0,
        plannedPrice: 0,
        plannedTotal: 0,
        actualQty: actual.qty,
        actualPrice: actual.price,
        actualTotal: actual.total,
        variance: actual.total,
        variancePercent: 100,
        status: 'UNFAVORABLE',
      })
    }
  }

  // Sort: unfavorable first, then by variance desc
  materialRows.sort((a, b) => b.variance - a.variance)

  const materialPlannedTotal = materialRows.reduce((s, r) => s + r.plannedTotal, 0)
  const materialActualTotal = materialRows.reduce((s, r) => s + r.actualTotal, 0)
  const materialVariance = materialActualTotal - materialPlannedTotal
  const materialVariancePercent = materialPlannedTotal > 0 ? (materialVariance / materialPlannedTotal) * 100 : 0

  // === UPAH COMPARISON ===
  // Planned: WageType.price (benchmark per unit)
  // Actual: sum of WagePayment.amount per WageType
  const wageTypes = await db.wageType.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  })

  const wagePayments = await db.wagePayment.findMany({
    where: { projectId },
    include: { wageType: true },
  })

  // Group actual by wageTypeId
  const actualWageMap = new Map<string, { totalPaid: number; unitCount: number }>()
  for (const wp of wagePayments) {
    const key = wp.wageTypeId
    const existing = actualWageMap.get(key) || { totalPaid: 0, unitCount: 0 }
    existing.totalPaid += wp.amount
    existing.unitCount += 1
    actualWageMap.set(key, existing)
  }

  const upahRows: UpahComparisonRow[] = []
  for (const wt of wageTypes) {
    const actual = actualWageMap.get(wt.id) || { totalPaid: 0, unitCount: 0 }
    const totalPlanned = wt.price * actual.unitCount
    const variance = actual.totalPaid - totalPlanned
    const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0
    const status: UpahComparisonRow['status'] =
      actual.totalPaid === 0 ? 'ON_TARGET' :
      variance < 0 ? 'FAVORABLE' :
      variance > 0 ? 'UNFAVORABLE' : 'ON_TARGET'

    upahRows.push({
      workItem: wt.name,
      plannedBudget: wt.price,
      actualPaid: actual.totalPaid,
      unitCount: actual.unitCount,
      totalPlanned,
      variance,
      variancePercent,
      status,
    })
  }

  upahRows.sort((a, b) => b.variance - a.variance)

  const upahPlannedTotal = upahRows.reduce((s, r) => s + r.totalPlanned, 0)
  const upahActualTotal = upahRows.reduce((s, r) => s + r.actualPaid, 0)
  const upahVariance = upahActualTotal - upahPlannedTotal
  const upahVariancePercent = upahPlannedTotal > 0 ? (upahVariance / upahPlannedTotal) * 100 : 0

  // === GRAND TOTAL ===
  const grandPlanned = materialPlannedTotal + upahPlannedTotal
  const grandActual = materialActualTotal + upahActualTotal
  const grandVariance = grandActual - grandPlanned
  const grandVariancePercent = grandPlanned > 0 ? (grandVariance / grandPlanned) * 100 : 0

  return {
    project: { id: project.id, name: project.name, code: project.code },
    material: {
      rows: materialRows,
      summary: { plannedTotal: materialPlannedTotal, actualTotal: materialActualTotal, variance: materialVariance, variancePercent: materialVariancePercent },
    },
    upah: {
      rows: upahRows,
      summary: { plannedTotal: upahPlannedTotal, actualTotal: upahActualTotal, variance: upahVariance, variancePercent: upahVariancePercent },
    },
    grandTotal: {
      planned: grandPlanned,
      actual: grandActual,
      variance: grandVariance,
      variancePercent: grandVariancePercent,
    },
  }
}
