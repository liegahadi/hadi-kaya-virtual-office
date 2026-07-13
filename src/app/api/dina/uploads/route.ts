// GET /api/dina/uploads?customerId=xxx
// List semua file yang pernah diupload via chat DINA untuk konsumen tertentu
// Return array of { id, fileName, docType, fileSize, createdAt, customerId }

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    const where: any = {
      OR: [
        { docType: 'chat-image' },
        { docType: 'chat-pdf' },
      ],
    }
    if (customerId) {
      where.customerId = customerId
    }

    const uploads = await db.googleDoc.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        docId: true,
        fileName: true,
        docType: true,
        fileSize: true,
        version: true,
        createdAt: true,
        customerId: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: uploads,
    })
  } catch (err: any) {
    console.error('List uploads error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal memuat uploads' },
      { status: 500 }
    )
  }
}
