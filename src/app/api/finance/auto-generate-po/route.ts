import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePoNumber } from '@/lib/finance/po-number'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const { projectId, unitId, workItems } = await req.json()
    if (!projectId || !workItems?.length) return NextResponse.json({ success: false, error: 'projectId + workItems required' }, { status: 400 })
    // Get RAB lines for selected workItems
    const rabLines = await db.rABLine.findMany({ where: { projectId, workItem: { in: workItems } } })
    // Group by material → aggregate qty + price
    const materialMap = new Map<string, { materialId: string; materialName: string; totalQty: number; avgPrice: number; unitMeasure: string }>()
    for (const line of rabLines) {
      const material = await db.material.findFirst({ where: { name: { contains: line.materialName, mode: 'insensitive' } } })
      const key = line.materialName
      const existing = materialMap.get(key) || { materialId: material?.id || '', materialName: line.materialName, totalQty: 0, avgPrice: 0, unitMeasure: line.unitMeasure }
      existing.totalQty += line.quantity
      existing.avgPrice = line.unitPrice
      if (material) existing.materialId = material.id
      materialMap.set(key, existing)
    }
    // Group by supplier suggestion (from PO history)
    const supplierSuggestions = new Map<string, string[]>()
    for (const [matName, mat] of materialMap) {
      const poItems = await db.pOItem.findMany({ where: { materialId: mat.materialId }, include: { po: { include: { supplier: true } } }, take: 3, orderBy: { po: { poDate: 'desc' } } })
      const suppliers = poItems.map(it => it.po?.supplier?.name).filter(Boolean) as string[]
      supplierSuggestions.set(matName, [...new Set(suppliers)])
    }
    return NextResponse.json({ success: true, data: { materials: Array.from(materialMap.values()), supplierSuggestions: Array.from(supplierSuggestions.entries()).map(([k, v]) => ({ material: k, suppliers: v })) } })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
