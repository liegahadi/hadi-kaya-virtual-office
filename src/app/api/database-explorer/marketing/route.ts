import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/database-explorer/marketing?q=search
// Returns all marketing agents + their assigned customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    const where: any = q
      ? {
          OR: [
            { name: { contains: q } },
            { role: { contains: q } },
          ],
        }
      : { role: { in: ['MARKETING', 'MARKETING_LEADER'] } }

    const agents = await db.agent.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    // Fetch customers per agent separately (since Agent doesn't have direct customers relation)
    const data: any[] = []
    for (const a of agents) {
      let customers: any[] = []
      let customerCount = 0
      try {
        customers = await db.customer.findMany({
          where: { assignedAgentId: a.id },
          select: { id: true, name: true, stage: true, blockLetter: true, houseNumber: true },
          take: 50,
          orderBy: { updatedAt: 'desc' },
        })
        customerCount = customers.length
      } catch (e) {
        // ignore
      }

      data.push({
        id: a.id,
        name: a.name,
        role: a.role,
        isActive: a.isActive,
        _count: { customers: customerCount },
        customers,
      })
    }

    return NextResponse.json({ success: true, data, meta: { total: data.length } })
  } catch (err: any) {
    console.error('[database-explorer/marketing] error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
