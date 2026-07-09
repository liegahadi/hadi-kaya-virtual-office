import { NextRequest, NextResponse } from 'next/server'
import { analyzeSystem } from '@/lib/agents/ratna-analyzer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================================
// POST /api/agents/[id]/analyze
// Trigger system analysis (RATNA's main function)
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const url = new URL(req.url)
    const useLLM = url.searchParams.get('llm') !== 'false' // default true

    // Verify agent exists & is CAO
    // (any agent can trigger, but typically RATNA)
    const result = await analyzeSystem(useLLM)

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        agentId,
        analysisTime: result.timestamp,
        bottlenecksFound: result.bottlenecks.length,
        recommendationsCount: result.recommendations.length,
        llmUsed: useLLM && !!result.llmInsight,
      },
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
