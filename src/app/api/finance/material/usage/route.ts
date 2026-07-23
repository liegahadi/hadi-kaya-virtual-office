// GET /api/finance/material/usage — list material usages
// POST /api/finance/material/usage — create usage (AVCO snapshot, auto-decrement stock)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAvcoPrice, updateAvcoOnUsage } from '@/lib/finance/avco'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const unitId = searchParams.get('unitId')

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (unitId) where.unitId = unitId

    const usages = await db.materialUsage.findMany({
      where,
      include: {
        items: { include: { material: true } },
        project: { select: { name: true, code: true } },
        unit: { select: { blockNumber: true } },
      },
      orderBy: { usedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: usages })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, unitId, items, usedAt, notes, reportedBy } = body

    if (!projectId || !items?.length) {
      return NextResponse.json({ success: false, error: 'projectId, items required' }, { status: 400 })
    }

    const usage = await db.materialUsage.create({
      data: {
        projectId,
        unitId: unitId || null,
        poId: null,
        source: 'WAREHOUSE_DISTRIBUTION',
        reportedBy: reportedBy || null,
        notes: notes || null,
        usedAt: usedAt ? new Date(usedAt) : new Date(),
      },
    })

    // Create items dengan AVCO snapshot + decrement stock
    for (const it of items) {
      const materialId = it.materialId
      const qty = it.qty || 0
      if (qty <= 0) continue

      // Get current AVCO price (frozen saat usage)
      const avcoPrice = await getCurrentAvcoPrice(materialId)

      // Get current stock (for StockAdjustment prevQty)
      const stockBefore = await db.stock.findUnique({ where: { materialId } })
      const prevQty = stockBefore?.quantity || 0

      // Create MaterialUsageItem dengan AVCO snapshot
      const material = await db.material.findUnique({ where: { id: materialId } })
      await db.materialUsageItem.create({
        data: {
          usageId: usage.id,
          materialId,
          qty,
          price: avcoPrice,
          unitMeasure: material?.unitMeasure || 'Pcs',
          workItem: it.workItem || null,
          subtotal: qty * avcoPrice,
        },
      })

      // Decrement stock + insert StockAdjustment
      try {
        const { newQty } = await updateAvcoOnUsage(materialId, qty)
        await db.stockAdjustment.create({
          data: {
            materialId,
            deltaQty: -qty,
            reason: `Usage for ${usage.id}`,
            type: 'USAGE_OUT',
            prevQty,
            newQty,
            unitCost: avcoPrice,
            refId: usage.id,
            date: usage.usedAt,
          },
        })
      } catch (e: any) {
        // Insufficient stock — skip decrement but keep usage record (audit)
        console.warn(`Stock insufficient for ${materialId}: ${e.message}`)
      }
    }

    return NextResponse.json({ success: true, data: usage })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
