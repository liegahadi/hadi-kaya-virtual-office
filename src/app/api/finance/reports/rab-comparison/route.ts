// GET /api/finance/reports/rab-comparison?projectId=XXX&unitId=XXX
// RAB vs Actual PER UNIT (bukan per project/material)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

const WORK_ORDER = [
  'Pondasi + Cor Sloof + Pasang Bata 3 keping',
  'Pasang Bata + Tebeng Layar. Cor Ring Balok, Cor Kolom, Pas kusen, Roster, Dak',
  'Rangka Atap + Penutup Atap + NOK + List Plank',
  'Plester Keliling + Instalasi Pipa Listrik + Openingan & Finishing + Finishing Dak',
  'Pemasangan Plafon',
  'Subsitank (Gali Lobang+Cor), Pipa Subsitank & Urukan',
  'Pasang Keramik Lantai + Plint + Pas Keramik lantai kamar mandi + dinding',
  'Pasang Pintu kunci & daun pintu (Pintu Depan, Pintu Kamar, dan Pintu)',
  'Instalasi 11 Titik (Termasuk pasang mangkok listrik + Pemasangan saklar)',
  'Pembuatan Meja Dapur dan rabat Belakang, Pembatas Belakang, Carpot',
  'Pengecatan',
  'Serah Terima kunci + Pembersihan awal & akhir 15%',
  'Retensi',
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const unitId = searchParams.get('unitId')

    // No projectId → return projects list
    if (!projectId) {
      const projects = await db.project.findMany({ where: { code: { not: null } }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } })
      return NextResponse.json({ success: true, data: { projects } })
    }

    // Get units for this project
    const units = await db.unit.findMany({ where: { projectId }, select: { id: true, blockNumber: true }, orderBy: { blockNumber: 'asc' } })

    // If no unitId → return list of units + project summary
    if (!unitId) {
      return NextResponse.json({ success: true, data: { projectId, units } })
    }

    // Per unit: compare RAB vs Actual
    const unit = await db.unit.findUnique({ where: { id: unitId }, include: { project: true } })
    if (!unit) return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 })

    // Get WageType (RAB Upah) — 13 pekerjaan
    const wageTypes = await db.wageType.findMany({ where: { projectId }, select: { id: true, name: true, price: true } })
    const sortedWageTypes = wageTypes.sort((a, b) => {
      const idxA = WORK_ORDER.indexOf(a.name); const idxB = WORK_ORDER.indexOf(b.name)
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
    })

    // Get actual wages for this unit
    const wages = await db.wagePayment.findMany({ where: { unitId }, include: { wageType: true } })

    // Get RAB Material lines
    const rabs = await db.rAB.findMany({ where: { projectId }, include: { lines: true } })
    const rabLines = rabs[0]?.lines || []

    // Get actual material usages for this unit
    const usages = await db.materialUsage.findMany({ where: { unitId }, include: { items: { include: { material: true } } } })

    // Build per pekerjaan comparison
    const upahComparison = sortedWageTypes.map(wt => {
      const wage = wages.find(w => w.wageTypeId === wt.id)
      return {
        workItem: wt.name, plannedBudget: wt.price,
        actualPaid: wage?.amount || 0, status: wage?.status || 'NOT_STARTED',
        variance: (wage?.amount || 0) - wt.price,
        variancePercent: wt.price > 0 ? (((wage?.amount || 0) - wt.price) / wt.price) * 100 : 0,
      }
    })

    // Get other expenses for this unit
    const expenses = await db.otherExpense.findMany({ where: { unitId } })

    // Summary
    const totalUpahRAB = sortedWageTypes.reduce((s, w) => s + w.price, 0)
    const totalUpahActual = wages.reduce((s, w) => s + w.amount, 0)
    const totalMaterialRAB = rabLines.reduce((s, l) => s + l.totalPrice, 0)
    const totalMaterialActual = usages.reduce((s, u) => s + u.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
    const totalOpsActual = expenses.reduce((s, e) => s + e.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        project: { id: unit.project.id, name: unit.project.name, code: unit.project.code },
        unit: { id: unit.id, blockNumber: unit.blockNumber },
        upahComparison,
        totalUpahRAB, totalUpahActual, upahVariance: totalUpahActual - totalUpahRAB,
        totalMaterialRAB, totalMaterialActual, materialVariance: totalMaterialActual - totalMaterialRAB,
        totalOpsActual,
        grandTotalRAB: totalUpahRAB + totalMaterialRAB,
        grandTotalActual: totalUpahActual + totalMaterialActual + totalOpsActual,
        grandVariance: (totalUpahActual + totalMaterialActual + totalOpsActual) - (totalUpahRAB + totalMaterialRAB),
      },
    })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
