// GET /api/finance/forecast?projectId=XXX&unitId=XXX&workItems=Pondasi,Pemasangan Bata
// Cash Flow Forecast: plan pekerjaan untuk 1+ unit, compute total kas yang dibutuhkan
// berdasarkan RAB material per workItem + RAB upah per workItem
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const unitId = searchParams.get('unitId')
    const workItemsParam = searchParams.get('workItems') // comma-separated workItem names

    // If no projectId, return projects list + available workItems
    if (!projectId) {
      const projects = await db.project.findMany({ where: { code: { not: null } }, select: { id: true, name: true, code: true } })
      return NextResponse.json({ success: true, data: { projects } })
    }

    // Get RAB material lines for this project
    const rabLines = await db.rABLine.findMany({
      where: { projectId },
      orderBy: { workItem: 'asc' },
    })

    // Get WageTypes (RAB upah) for this project
    const wageTypes = await db.wageType.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    })

    // Get available workItems (unique from RABLine + WageType)
    const materialWorkItems = [...new Set(rabLines.map(l => l.workItem))]
    const upahWorkItems = [...new Set(wageTypes.map(w => w.name))]
    const allWorkItems = [...new Set([...materialWorkItems, ...upahWorkItems])].sort()

    // If workItems specified, filter; otherwise return all available
    const selectedWorkItems = workItemsParam ? workItemsParam.split(',').map(w => w.trim()) : null

    // Filter RAB lines by selected workItems
    const filteredRabLines = selectedWorkItems
      ? rabLines.filter(l => selectedWorkItems.includes(l.workItem))
      : rabLines

    // Filter wage types by selected workItems
    const filteredWageTypes = selectedWorkItems
      ? wageTypes.filter(w => selectedWorkItems.some(si => w.name.toLowerCase().includes(si.toLowerCase())))
      : wageTypes

    // Group material by workItem
    const materialByWorkItem = new Map<string, { items: any[]; total: number }>()
    for (const line of filteredRabLines) {
      const existing = materialByWorkItem.get(line.workItem) || { items: [], total: 0 }
      existing.items.push({
        materialName: line.materialName,
        qty: line.quantity,
        unitMeasure: line.unitMeasure,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
      })
      existing.total += line.totalPrice
      materialByWorkItem.set(line.workItem, existing)
    }

    // Build forecast result
    const forecastWorkItems: any[] = []
    let totalMaterial = 0
    let totalUpah = 0

    // Get all workItems that have either material or upah
    const allForecastWorkItems = [...new Set([
      ...Array.from(materialByWorkItem.keys()),
      ...filteredWageTypes.map(w => w.name),
    ])].sort()

    for (const wi of allForecastWorkItems) {
      const mat = materialByWorkItem.get(wi)
      const wage = filteredWageTypes.find(w => w.name === wi || w.name.toLowerCase().includes(wi.toLowerCase()))

      // Get suppliers that sell materials in this workItem
      const materialNames = mat?.items.map(i => i.materialName) || []
      let supplierSuggestions: any[] = []
      if (materialNames.length > 0) {
        const poItems = await db.pOItem.findMany({
          where: { material: { name: { in: materialNames } } },
          include: { po: { include: { supplier: { select: { name: true, bankName: true, bankAccount: true } } } } },
          distinct: ['materialId'],
        })
        supplierSuggestions = materialNames.map(mn => {
          const match = poItems.find(pi => pi.material?.name === mn)
          return { material: mn, supplier: match?.po?.supplier?.name || 'Belum ada supplier', lastPrice: match?.price || 0 }
        })
      }

      const materialTotal = mat?.total || 0
      const upahTotal = wage?.price || 0
      totalMaterial += materialTotal
      totalUpah += upahTotal

      forecastWorkItems.push({
        workItem: wi,
        material: mat?.items || [],
        materialTotal,
        upah: upahTotal,
        upahName: wage?.name || '',
        supplierSuggestions,
        subtotal: materialTotal + upahTotal,
      })
    }

    // Get units for this project (if unitId not specified, show all)
    let units: any[] = []
    if (unitId) {
      const unit = await db.unit.findUnique({ where: { id: unitId }, select: { id: true, blockNumber: true } })
      if (unit) units = [unit]
    } else {
      units = await db.unit.findMany({ where: { projectId }, select: { id: true, blockNumber: true }, orderBy: { blockNumber: 'asc' } })
    }

    const unitCount = units.length
    const grandTotal = (totalMaterial + totalUpah) * unitCount

    return NextResponse.json({
      success: true,
      data: {
        project: { id: projectId },
        units: units.map(u => u.blockNumber),
        unitCount,
        selectedWorkItems: selectedWorkItems || allWorkItems,
        availableWorkItems: allWorkItems,
        workItems: forecastWorkItems,
        summary: {
          totalMaterialPerUnit: totalMaterial,
          totalUpahPerUnit: totalUpah,
          totalPerUnit: totalMaterial + totalUpah,
          unitCount,
          grandTotal,
        },
      },
    })
  } catch (err: any) {
    console.error('Forecast error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
