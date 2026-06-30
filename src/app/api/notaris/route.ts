import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const notaris = await db.notarisSetting.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: notaris })
  } catch (error) { return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.action === 'delete' && body.id) {
      await db.notarisSetting.delete({ where: { id: body.id } })
      return NextResponse.json({ success: true })
    }
    const { name, address, city } = body
    if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 })
    const notaris = await db.notarisSetting.create({ data: { name, address: address || null, city: city || null } })
    return NextResponse.json({ success: true, data: notaris })
  } catch (error) { return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 }) }
}
