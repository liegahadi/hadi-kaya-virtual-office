import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await db.supplierMaterial.delete({ where: { id } }); return NextResponse.json({ success: true }) }
  catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
