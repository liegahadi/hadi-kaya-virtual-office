// GET /api/dina/memory
// Returns all system memory (learnings, facts, interactions) stored by DINA
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const memories = await db.memory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Get customer names for memories that have customerId
    const customerIds = [...new Set(memories.map(m => m.customerId).filter(Boolean))] as string[]
    const customers = customerIds.length > 0
      ? await db.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
      : []
    const customerMap = new Map(customers.map(c => [c.id, c.name]))

    // Group by category
    const grouped: Record<string, any[]> = {}
    for (const m of memories) {
      if (!grouped[m.category]) grouped[m.category] = []
      grouped[m.category].push({
        id: m.id,
        content: m.content,
        importance: m.importance,
        source: m.source,
        customerName: m.customerId ? customerMap.get(m.customerId) : null,
        createdAt: m.createdAt,
      })
    }

    return NextResponse.json({
      success: true,
      total: memories.length,
      categories: Object.keys(grouped),
      memories: grouped,
      allMemories: memories.map(m => ({
        id: m.id,
        category: m.category,
        content: m.content,
        importance: m.importance,
        source: m.source,
        customerName: m.customerId ? customerMap.get(m.customerId) : null,
        createdAt: m.createdAt,
      })),
    })
  } catch (err: any) {
    console.error('Memory API error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
