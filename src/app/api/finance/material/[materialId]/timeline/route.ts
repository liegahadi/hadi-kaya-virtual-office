import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest, { params }: { params: Promise<{ materialId: string }> }) {
  try {
    const { materialId } = await params
    const adjustments = await db.stockAdjustment.findMany({
      where: { materialId }, orderBy: { date: 'desc' }, take: 50,
      select: { id: true, deltaQty: true, reason: true, type: true, prevQty: true, newQty: true, unitCost: true, date: true, refId: true },
    })
    return NextResponse.json({ success: true, data: adjustments })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
