import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { driveFileId, driveUrl, fileName, mimeType } = body
    const fileRef = await db.fileRef.create({ data: { kind: 'TRANSFER_PROOF', refId: id, driveFileId, driveUrl, fileName, mimeType } })
    return NextResponse.json({ success: true, data: fileRef })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
