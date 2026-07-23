// PATCH /api/projects/[id] — update project (e.g., set code)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updateData: any = {}
    if (body.code !== undefined) updateData.code = body.code.toUpperCase() || null
    if (body.brandName !== undefined) updateData.brandName = body.brandName
    const updated = await db.project.update({ where: { id }, data: updateData, select: { id: true, name: true, code: true } })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
