import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try { const workers = await db.worker.findMany({ where: { isActive: true }, select: { id: true, name: true, defaultBankName: true, defaultBankAccount: true }, orderBy: { name: 'asc' } }); return NextResponse.json({ success: true, data: workers }) }
  catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try { const { name, defaultBankName, defaultBankAccount } = await req.json(); if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 }); const worker = await db.worker.create({ data: { name, defaultBankName: defaultBankName || null, defaultBankAccount: defaultBankAccount || null } }); return NextResponse.json({ success: true, data: worker }) }
  catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
