import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    // Get all units with upcoming RAB needs → compute what materials need to be reserved
    const projects = await db.project.findMany({ include: { units: true } })
    const reservations: any[] = []
    for (const p of projects) {
      const rabLines = await db.rABLine.findMany({ where: { projectId: p.id } })
      const matMap = new Map<string, { name: string; qty: number; unit: string }>()
      for (const line of rabLines) {
        const existing = matMap.get(line.materialName) || { name: line.materialName, qty: 0, unit: line.unitMeasure }
        existing.qty += line.quantity
        matMap.set(line.materialName, existing)
      }
      for (const [name, info] of matMap) {
        const material = await db.material.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } })
        if (material) {
          const stock = await db.stock.findUnique({ where: { materialId: material.id } })
          const available = stock?.quantity || 0
          const needed = info.qty * p.units.length
          const shortfall = Math.max(0, needed - available)
          if (shortfall > 0) reservations.push({ materialId: material.id, name, unit: info.unit, available, needed, shortfall, project: p.name, projectCode: p.code, unitCount: p.units.length })
        }
      }
    }
    return NextResponse.json({ success: true, data: reservations })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
