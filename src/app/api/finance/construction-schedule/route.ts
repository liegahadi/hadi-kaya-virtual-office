import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

// 13 pekerjaan urutan LOCKED (per owner PRD 30.20)
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

    // Single query for all units (not N+1)
    const units = await db.unit.findMany({
      where: projectId ? { projectId } : {},
      include: { project: { select: { name: true, code: true } } },
      orderBy: { blockNumber: 'asc' },
    })

    // Batch fetch all wage types for these projects
    const projectIds = [...new Set(units.map(u => u.projectId))]
    const allWageTypes = await db.wageType.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true, name: true, price: true, projectId: true },
    })

    // Batch fetch all wage payments for these units
    const unitIds = units.map(u => u.id)
    const allWages = await db.wagePayment.findMany({
      where: { unitId: { in: unitIds } },
      select: { wageTypeId: true, wageDate: true, amount: true, status: true, unitId: true },
      orderBy: { wageDate: 'asc' },
    })

    // Build schedule in memory (no N+1)
    const schedule: any[] = []
    for (const u of units) {
      const wageTypes = allWageTypes.filter(wt => wt.projectId === u.projectId)
      // Sort by WORK_ORDER
      const sortedWageTypes = wageTypes.sort((a, b) => {
        const idxA = WORK_ORDER.indexOf(a.name)
        const idxB = WORK_ORDER.indexOf(b.name)
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
      })
      const wages = allWages.filter(w => w.unitId === u.id)

      const tasks = sortedWageTypes.map((wt, i) => {
        const wage = wages.find(w => w.wageTypeId === wt.id)
        return {
          workItem: wt.name, order: i + 1, budget: wt.price,
          startDate: wage?.wageDate || null, paidAmount: wage?.amount || 0,
          status: !wage ? 'NOT_STARTED' : wage.status === 'PAID' ? 'DONE' : wage.status === 'PARTIAL_PAID' ? 'IN_PROGRESS' : 'STARTED',
          percent: wage && wt.price > 0 ? Math.min(100, Math.round((wage.amount / wt.price) * 100)) : 0,
        }
      })

      const completedTasks = tasks.filter(t => t.status === 'DONE').length
      const totalTasks = tasks.length
      const startDate = wages.length > 0 ? wages[0].wageDate : null
      const lastDate = wages.length > 0 ? wages[wages.length - 1].wageDate : null
      schedule.push({ unitId: u.id, blockNumber: u.blockNumber, project: u.project, totalTasks, completedTasks, completionPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0, startDate, lastDate, tasks })
    }

    return NextResponse.json({ success: true, data: schedule })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
