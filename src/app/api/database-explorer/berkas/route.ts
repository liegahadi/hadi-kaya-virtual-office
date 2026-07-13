import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/database-explorer/berkas?q=search
// Returns all customers with document counts + orphan detection
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { blockLetter: { contains: q } },
            { houseNumber: { contains: q } },
            { bankName: { contains: q } },
            { whatsappNumber: { contains: q } },
          ],
        }
      : {}

    const customers = await db.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            documents: true,
            googleDocs: true,
            historyLogs: true,
            conversations: true,
            bankPipelines: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })

    // Detect orphan GoogleDocs (customerId=NULL)
    const orphanCount = await db.googleDoc.count({ where: { customerId: null } })

    const data = customers.map((c) => ({
      id: c.id,
      name: c.name,
      blockLetter: c.blockLetter,
      houseNumber: c.houseNumber,
      bankName: c.bankName,
      stage: c.stage,
      whatsappNumber: c.whatsappNumber,
      createdAt: c.createdAt,
      _count: c._count,
      hasOrphanDocs: false, // per-customer orphan detection would need separate query
    }))

    return NextResponse.json({
      success: true,
      data,
      meta: { total: data.length, orphanDocsGlobal: orphanCount },
    })
  } catch (err: any) {
    console.error('[database-explorer/berkas] error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
