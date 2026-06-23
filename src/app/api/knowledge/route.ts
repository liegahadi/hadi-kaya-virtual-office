import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/knowledge - List knowledge items
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const agentId = req.nextUrl.searchParams.get('agentId')

    const items = await db.knowledgeItem.findMany({
      where: {
        AND: [
          { isActive: true },
          category ? { category } : {},
          agentId ? { agentId } : { OR: [{ agentId: null }, { agentId }] },
        ],
      },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('GET /api/knowledge error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// POST /api/knowledge - Add new knowledge item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, question, answer, content, tags, agentId } = body

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category required' }, { status: 400 })
    }

    const created = await db.knowledgeItem.create({
      data: {
        category,
        question,
        answer,
        content,
        tags: tags ? JSON.stringify(tags) : null,
        agentId: agentId || null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error('POST /api/knowledge error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
