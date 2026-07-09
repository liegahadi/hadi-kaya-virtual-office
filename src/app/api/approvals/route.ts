import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/approvals - List all approvals (default: pending only)
// Query: status=PENDING|APPROVED|REJECTED|ALL
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'PENDING'
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const where = status === 'ALL' ? {} : { status }

    const approvals = await db.approval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: approvals,
      meta: {
        total: approvals.length,
        pending: await db.approval.count({ where: { status: 'PENDING' } }),
      },
    })
  } catch (error) {
    console.error('GET /api/approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/approvals - Create new approval (auto-called by chat endpoint)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, type, payload, referenceId } = body

    if (!agentId || !type || !payload) {
      return NextResponse.json(
        { success: false, error: 'agentId, type, payload required' },
        { status: 400 }
      )
    }

    const approval = await db.approval.create({
      data: {
        requesterAgentId: agentId,
        type,
        referenceId: referenceId || null,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        status: 'PENDING',
      },
      include: {
        agent: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: approval })
  } catch (error) {
    console.error('POST /api/approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create approval' },
      { status: 500 }
    )
  }
}
