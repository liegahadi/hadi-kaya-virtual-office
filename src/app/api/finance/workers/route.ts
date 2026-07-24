import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const workers = await db.worker.findMany({ where: { isActive: true }, select: { id: true, name: true, defaultBankName: true, defaultBankAccount: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: workers })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
