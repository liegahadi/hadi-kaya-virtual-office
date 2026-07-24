import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const where: any = {}
    if (projectId) where.projectId = projectId
    const wageTypes = await db.wageType.findMany({ where, select: { id: true, name: true, price: true, projectId: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: wageTypes })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
