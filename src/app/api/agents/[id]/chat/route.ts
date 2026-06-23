import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAgentConfig } from '@/lib/agents/agent-factory'
import { BaseAgent } from '@/lib/agents/base-agent'
import { trackCost, getDailyCostStats } from '@/lib/agents/llm-router'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================
// POST /api/agents/[id]/chat
// Send a message to an agent and get a response
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const body = await req.json()
    const { message, conversationId, customerId, channel = 'DASHBOARD' } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get agent config
    const agentConfig = await getAgentConfig(agentId)
    if (!agentConfig) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get or create conversation
    let convId = conversationId
    if (!convId && customerId) {
      // Find existing conversation for this customer+agent
      const existing = await db.conversation.findFirst({
        where: { customerId, agentId },
        orderBy: { lastMessageAt: 'desc' },
      })
      if (existing) convId = existing.id
    }
    if (!convId && customerId) {
      // Create new conversation
      const conv = await db.conversation.create({
        data: {
          customerId,
          agentId,
          channel,
          status: 'ACTIVE',
        },
      })
      convId = conv.id
    }

    // Instantiate agent
    const agent = new BaseAgent(agentConfig)

    // Process message
    const result = await agent.processMessage(message, {
      conversationId: convId,
      customerId,
      channel,
    })

    // Track cost
    // Note: actual LLM call happens inside processMessage; we'd need to refactor
    // to track real cost. For now, this is a placeholder.
    const costStats = getDailyCostStats()

    return NextResponse.json({
      success: true,
      data: {
        agentName: agentConfig.name,
        agentRole: agentConfig.role,
        response: result.content,
        conversationId: convId,
        needsApproval: result.needsApproval,
        approvalPayload: result.approvalPayload,
        memoryUpdates: result.memoryUpdates?.length || 0,
        usedKnowledge: result.usedKnowledge?.length || 0,
        // Meta info for UI display
        meta: result.meta,
      },
      meta: {
        cost: costStats,
      },
    })
  } catch (error) {
    console.error('POST /api/agents/[id]/chat error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================
// GET /api/agents/[id]/chat?conversationId=xxx
// Get conversation history
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const url = new URL(req.url)
    const conversationId = url.searchParams.get('conversationId')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    if (!conversationId) {
      // List recent conversations for this agent
      const conversations = await db.conversation.findMany({
        where: { agentId },
        orderBy: { lastMessageAt: 'desc' },
        take: 20,
        include: {
          customer: true,
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: conversations,
      })
    }

    // Get specific conversation with messages
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: limit,
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    console.error('GET /api/agents/[id]/chat error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
