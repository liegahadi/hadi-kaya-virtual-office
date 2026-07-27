// GET /api/finance/forecast?projectId=XXX&unitId=XXX
// Cash Forecast per unit: pilih pekerjaan (13 WageType) → compute material (RABLine) + upah (WageType)
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
    const workItemsParam = searchParams.get('workItems')

    // No projectId → return projects + units list
    if (!projectId) {
      const projects = await db.project.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } })
      return NextResponse.json({ success: true, data: { projects } })
    }

    // Get WageType (13 pekerjaan Upah) — sorted by WORK_ORDER
    const wageTypes = await db.wageType.findMany({ where: { projectId }, select: { id: true, name: true, price: true } })
    const sortedWageTypes = wageTypes.sort((a, b) => {
      const idxA = WORK_ORDER.indexOf(a.name); const idxB = WORK_ORDER.indexOf(b.name)
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
    })

    // Get RABLine (material per tahapan)
    const rabs = await db.rAB.findMany({ where: { projectId }, include: { lines: true } })
    const rabLines = rabs[0]?.lines || []

    // If workItems specified, filter WageType
    const selectedWorkItems = workItemsParam ? workItemsParam.split(',').map(w => w.trim()) : null
    const filteredWageTypes = selectedWorkItems ? sortedWageTypes.filter(wt => selectedWorkItems.includes(wt.name)) : sortedWageTypes

    // Build workItems detail: each WageType + related material (from RAB)
    const workItemsDetail = filteredWageTypes.map(wt => {
      // Find RAB material lines that relate to this pekerjaan (fuzzy match by workItem name)
      const relatedMaterials = rabLines.filter(rl => {
        // Match by workItem name contains or is contained
        return rl.workItem.toLowerCase().includes(wt.name.split(' ')[0].toLowerCase()) ||
               wt.name.toLowerCase().includes(rl.workItem.toLowerCase().split(' ')[0])
      })
      const materialTotal = relatedMaterials.reduce((s, rl) => s + rl.totalPrice, 0)
      return {
        workItem: wt.name, wageBudget: wt.price, materialTotal,
        materials: relatedMaterials.map(rl => ({ name: rl.materialName, qty: rl.quantity, unit: rl.unitMeasure, price: rl.unitPrice, total: rl.totalPrice })),
        grandTotal: wt.price + materialTotal,
      }
    })

    const totalUpah = workItemsDetail.reduce((s, w) => s + w.wageBudget, 0)
    const totalMaterial = workItemsDetail.reduce((s, w) => s + w.materialTotal, 0)
    const grandTotal = totalUpah + totalMaterial

    // Get units if unitId not specified
    let units: any[] = []
    if (!unitId) {
      units = await db.unit.findMany({ where: { projectId }, select: { id: true, blockNumber: true }, orderBy: { blockNumber: 'asc' } })
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId, unitId,
        availableWorkItems: sortedWageTypes.map(wt => wt.name),
        selectedWorkItems: filteredWageTypes.map(wt => wt.name),
        workItems: workItemsDetail,
        totalUpah, totalMaterial, grandTotal,
        units,
      },
    })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
