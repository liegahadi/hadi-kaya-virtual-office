import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPO, listPOs, type CreatePOInput } from '@/lib/finance/po-generator'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/finance/po - List POs
// Query: projectId, supplierId, status, limit
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const filters = {
      projectId: url.searchParams.get('projectId') || undefined,
      supplierId: url.searchParams.get('supplierId') || undefined,
      status: url.searchParams.get('status') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
    }

    const pos = await listPOs(filters)
    return NextResponse.json({ success: true, data: pos })
  } catch (error) {
    console.error('GET /api/finance/po error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// POST /api/finance/po - Create new PO
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreatePOInput

    // Validate
    if (!body.projectId || !body.supplierId || !body.agentId || !body.lines?.length) {
      return NextResponse.json(
        { success: false, error: 'projectId, supplierId, agentId, lines are required' },
        { status: 400 }
      )
    }

    const result = await createPO(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.po,
      meta: { pricesUpdated: result.pricesUpdated },
    })
  } catch (error) {
    console.error('POST /api/finance/po error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
