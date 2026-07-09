import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAgentConfig } from '@/lib/agents/agent-factory'
import { BaseAgent } from '@/lib/agents/base-agent'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================================
// POST /api/wa/incoming - Handle incoming WA message
// Called by WA Bridge mini-service
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { from, text, agentId, messageId, timestamp } = body

    if (!from || !text || !agentId) {
      return NextResponse.json(
        { success: false, error: 'from, text, agentId required' },
        { status: 400 }
      )
    }

    console.log(`[WA Incoming] From: ${from}, Agent: ${agentId}, Text: ${text.substring(0, 50)}...`)

    // Get agent config
    const agentConfig = await getAgentConfig(agentId)
    if (!agentConfig) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Find or create customer by phone number
    const project = await db.project.findFirst()
    if (!project) {
      return NextResponse.json({ success: false, error: 'No project' }, { status: 500 })
    }

    // Find customer by phone
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          { whatsappNumber: from },
          { whatsappNumber: `+${from}` },
          { whatsappNumber: from.replace(/^62/, '0') },
        ],
      },
    })

    if (!customer) {
      // Create new customer
      customer = await db.customer.create({
        data: {
          projectId: project.id,
          name: `WA ${from}`,
          whatsappNumber: `+${from}`,
          sourceLead: 'WHATSAPP',
          stage: 'DM',
          stageUpdatedAt: new Date(),
        },
      })
      console.log(`[WA] New customer created: ${customer.id} (${from})`)
    }

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: { customerId: customer.id, agentId, channel: 'WHATSAPP' },
      orderBy: { lastMessageAt: 'desc' },
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          customerId: customer.id,
          agentId,
          channel: 'WHATSAPP',
          status: 'ACTIVE',
        },
      })
    }

    // Process message with agent
    const agent = new BaseAgent(agentConfig)
    const result = await agent.processMessage(text, {
      conversationId: conversation.id,
      customerId: customer.id,
      channel: 'WHATSAPP',
    })

    console.log(`[WA] Agent replied: ${result.content.substring(0, 80)}...`)

    return NextResponse.json({
      success: true,
      data: {
        response: result.content,
        conversationId: conversation.id,
        customerId: customer.id,
        customerName: customer.name,
        needsApproval: result.needsApproval,
        meta: result.meta,
      },
    })
  } catch (error) {
    console.error('[WA Incoming] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
