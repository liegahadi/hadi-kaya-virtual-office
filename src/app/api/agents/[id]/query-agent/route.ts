import { NextRequest, NextResponse } from 'next/server'
import { queryAgent } from '@/lib/agents/inter-agent'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/agents/[id]/query-agent
// Agent-to-agent direct query (bypass LLM, direct DB access)
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const body = await req.json()
    const { toAgentRole, query, fetchType } = body

    if (!toAgentRole || !query) {
      return NextResponse.json(
        { success: false, error: 'toAgentRole and query are required' },
        { status: 400 }
      )
    }

    const result = await queryAgent({
      fromAgentId: agentId,
      toAgentRole,
      query,
      fetchType: fetchType || 'all',
    })

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      meta: {
        fromAgent: result.fromAgent,
        toAgent: result.toAgent,
        query: result.query,
        timestamp: result.timestamp,
      },
    })
  } catch (error) {
    console.error('Inter-agent query error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute query' },
      { status: 500 }
    )
  }
}
