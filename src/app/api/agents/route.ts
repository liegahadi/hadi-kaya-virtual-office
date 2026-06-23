import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/agents - List all agents
export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get('role')
    const agents = await db.agent.findMany({
      where: role ? { role } : undefined,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            conversations: true,
            assignedCustomers: true,
            memories: true,
          },
        },
      },
    })
    return NextResponse.json({ success: true, data: agents })
  } catch (error) {
    console.error('GET /api/agents error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/agents - Update agent config (LLM model, persona, active status)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Agent id required' }, { status: 400 })
    }

    // Filter allowed fields only (security: prevent mass-assignment)
    const allowedFields = [
      'llmModel', 'llmProvider', 'temperature', 'maxTokens',
      'isActive', 'isDevilsAdvocate', 'systemPrompt', 'personality',
      'whatsappNumber', 'avatarUrl', 'description', 'gender', 'skills',
    ]
    const safeUpdate: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updateData) safeUpdate[key] = updateData[key]
    }

    const updated = await db.agent.update({
      where: { id },
      data: safeUpdate,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/agents error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
