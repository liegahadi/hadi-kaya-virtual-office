import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/dashboard/stats - Virtual office overview
export async function GET() {
  try {
    const [
      agents,
      marketingAgents,
      projects,
      units,
      customers,
      conversations,
      knowledgeItems,
      pendingApprovals,
      surveySchedules,
    ] = await Promise.all([
      db.agent.findMany({
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
      }),
      db.agent.findMany({
        where: { role: 'MARKETING' },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              conversations: true,
              assignedCustomers: true,
              memories: true,
            },
          },
        },
      }),
      db.project.findMany(),
      db.unit.findMany({ include: { project: true } }),
      db.customer.findMany({
        include: { assignedAgent: true, project: true },
      }),
      db.conversation.findMany({
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        include: { customer: true, agent: true, messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      db.knowledgeItem.groupBy({
        by: ['category'],
        _count: true,
      }),
      db.approval.count({ where: { status: 'PENDING' } }),
      db.surveySchedule.findMany({
        where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
        include: { customer: true, agent: true },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
    ])

    // Unit status counts
    const unitStatus = units.reduce((acc, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Customer stage counts (pipeline)
    const customerStages = customers.reduce((acc, c) => {
      acc[c.stage] = (acc[c.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        agents: {
          all: agents,
          marketing: marketingAgents,
          byRole: agents.reduce((acc, a) => {
            acc[a.role] = (acc[a.role] || 0) + 1
            return acc
          }, {} as Record<string, number>),
        },
        projects,
        units: {
          total: units.length,
          byStatus: unitStatus,
        },
        customers: {
          total: customers.length,
          byStage: customerStages,
        },
        conversations: {
          recent: conversations,
        },
        knowledgeBase: {
          byCategory: knowledgeItems,
        },
        approvals: {
          pending: pendingApprovals,
        },
        surveys: {
          upcoming: surveySchedules,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
