import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// DELETE /api/agents/[id] - Delete agent
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if agent exists
    const agent = await db.agent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent tidak ditemukan' },
        { status: 404 }
      )
    }

    // Prevent deletion of core agents (RINA, Mitra, Dina, RATNA)
    const coreAgents = ['RINA', 'Mitra', 'Dina', 'RATNA']
    if (coreAgents.includes(agent.name)) {
      return NextResponse.json(
        {
          success: false,
          error: `Agent ${agent.name} adalah core agent, tidak bisa dihapus. Nonaktifkan saja.`,
        },
        { status: 400 }
      )
    }

    // Delete related records first (cascade)
    await db.memory.deleteMany({ where: { agentId: id } })
    await db.knowledgeItem.deleteMany({ where: { agentId: id } })

    // Unassign customers
    await db.customer.updateMany({
      where: { assignedAgentId: id },
      data: { assignedAgentId: null },
    })

    // Delete agent
    await db.agent.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Agent ${agent.name} berhasil dihapus`,
    })
  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
