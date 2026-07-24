// GET /api/finance/reports/rab-comparison?projectId=XXX
// Returns RAB vs Actual comparison (JSON, for UI)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeRabComparison } from '@/lib/finance/rab-comparison'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      // Return list of projects for selector
      const projects = await db.project.findMany({
        where: { code: { not: null } },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json({ success: true, data: { projects } })
    }

    const result = await computeRabComparison(projectId)
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    console.error('RAB comparison error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
