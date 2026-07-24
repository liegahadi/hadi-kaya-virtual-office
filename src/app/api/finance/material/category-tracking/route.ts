// GET /api/finance/material/category-tracking?projectId=XXX
// Track material usage per workItem vs RAB, detect over/under budget
// Per item pekerjaan: planned (RAB) vs actual (MaterialUsageItem) dengan breakdown per material
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      const projects = await db.project.findMany({ where: { code: { not: null } }, select: { id: true, name: true, code: true } })
      return NextResponse.json({ success: true, data: { projects } })
    }

    // Get RAB lines grouped by workItem
    const rabLines = await db.rABLine.findMany({ where: { projectId }, orderBy: { workItem: 'asc' } })
    const rabByWorkItem = new Map<string, any[]>()
    for (const line of rabLines) {
      const arr = rabByWorkItem.get(line.workItem) || []
      arr.push({ materialName: line.materialName, plannedQty: line.quantity, unitMeasure: line.unitMeasure, plannedPrice: line.unitPrice, plannedTotal: line.totalPrice })
      rabByWorkItem.set(line.workItem, arr)
    }

    // Get actual usages grouped by workItem
    const usages = await db.materialUsage.findMany({
      where: { projectId },
      include: { items: { include: { material: true } } },
    })
    const actualByWorkItem = new Map<string, Map<string, { qty: number; total: number; price: number }>>()
    for (const u of usages) {
      for (const item of u.items) {
        const wi = item.workItem || 'Lainnya'
        if (!actualByWorkItem.has(wi)) actualByWorkItem.set(wi, new Map())
        const matMap = actualByWorkItem.get(wi)!
        const key = item.material.name
        const existing = matMap.get(key) || { qty: 0, total: 0, price: 0 }
        existing.qty += item.qty
        existing.total += item.subtotal
        existing.price = existing.qty > 0 ? existing.total / existing.qty : 0
        matMap.set(key, existing)
      }
    }

    // Build result: per workItem → per material → planned vs actual
    const allWorkItems = [...new Set([...rabByWorkItem.keys(), ...actualByWorkItem.keys()])].sort()
    const result: any[] = []

    for (const wi of allWorkItems) {
      const plannedItems = rabByWorkItem.get(wi) || []
      const actualMap = actualByWorkItem.get(wi) || new Map()
      const allMaterials = [...new Set([...plannedItems.map(p => p.materialName), ...Array.from(actualMap.keys())])]
      
      const materials: any[] = []
      let wiPlannedTotal = 0, wiActualTotal = 0

      for (const matName of allMaterials) {
        const planned = plannedItems.find(p => p.materialName === matName)
        const actual = actualMap.get(matName) || { qty: 0, total: 0, price: 0 }
        const plannedTotal = planned?.plannedTotal || 0
        const actualTotal = actual.total
        const variance = actualTotal - plannedTotal
        const variancePercent = plannedTotal > 0 ? (variance / plannedTotal) * 100 : actualTotal > 0 ? 100 : 0
        const status = actualTotal === 0 ? 'ON_TARGET' : variance < 0 ? 'FAVORABLE' : variance > 0 ? 'UNFAVORABLE' : 'ON_TARGET'

        materials.push({
          materialName: matName,
          plannedQty: planned?.plannedQty || 0,
          actualQty: actual.qty,
          unitMeasure: planned?.unitMeasure || '—',
          plannedPrice: planned?.plannedPrice || 0,
          actualPrice: actual.price,
          plannedTotal,
          actualTotal,
          variance,
          variancePercent,
          status,
        })
        wiPlannedTotal += plannedTotal
        wiActualTotal += actualTotal
      }

      const wiVariance = wiActualTotal - wiPlannedTotal
      const wiVariancePercent = wiPlannedTotal > 0 ? (wiVariance / wiPlannedTotal) * 100 : 0
      const wiStatus = wiActualTotal === 0 ? 'ON_TARGET' : wiVariance < 0 ? 'FAVORABLE' : wiVariance > 0 ? 'UNFAVORABLE' : 'ON_TARGET'

      result.push({
        workItem: wi,
        materialCount: materials.length,
        materials,
        plannedTotal: wiPlannedTotal,
        actualTotal: wiActualTotal,
        variance: wiVariance,
        variancePercent: wiVariancePercent,
        status: wiStatus,
      })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
