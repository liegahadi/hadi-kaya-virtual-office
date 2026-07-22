// ============================================================
// INTER-AGENT COMMUNICATION
// ============================================================
// Allows one agent to query another agent's domain knowledge
// without going through LLM (cheaper, faster).
//
// Example: RINA can query Mitra's stock data directly.
//          RATNA can query any agent's stats.
// ============================================================

import { db } from '@/lib/db'

export interface AgentQueryRequest {
  fromAgentId: string
  toAgentRole: string // FINANCE | MATERIAL | DOCUMENT | MARKETING | CAO
  query: string
  // Optional: specific data to fetch
  fetchType?: 'stock' | 'po' | 'customers' | 'documents' | 'stats' | 'all'
}

export interface AgentQueryResponse {
  success: boolean
  data?: unknown
  error?: string
  fromAgent: string
  toAgent: string
  query: string
  timestamp: string
}

/**
 * Query another agent's domain knowledge
 * This bypasses LLM for direct DB queries (fast, free)
 */
export async function queryAgent(req: AgentQueryRequest): Promise<AgentQueryResponse> {
  try {
    const fromAgent = await db.agent.findUnique({
      where: { id: req.fromAgentId },
      select: { id: true, name: true, role: true },
    })

    if (!fromAgent) {
      return {
        success: false,
        error: 'Source agent not found',
        fromAgent: 'unknown',
        toAgent: req.toAgentRole,
        query: req.query,
        timestamp: new Date().toISOString(),
      }
    }

    const toAgent = await db.agent.findFirst({
      where: { role: req.toAgentRole, isActive: true },
      select: { id: true, name: true, role: true },
    })

    if (!toAgent) {
      return {
        success: false,
        error: `No active agent with role ${req.toAgentRole}`,
        fromAgent: fromAgent.name,
        toAgent: req.toAgentRole,
        query: req.query,
        timestamp: new Date().toISOString(),
      }
    }

    // Route to appropriate data fetcher based on target role
    let data: unknown
    const fetchType = req.fetchType || 'all'

    switch (req.toAgentRole) {
      case 'FINANCE':
        data = await fetchFinanceData(fetchType)
        break
      case 'MATERIAL':
        data = await fetchMaterialData(fetchType)
        break
      case 'DOCUMENT':
        data = await fetchDocumentData(fetchType)
        break
      case 'MARKETING':
        data = await fetchMarketingData(fetchType)
        break
      case 'CAO':
        data = await fetchCAOData(fetchType)
        break
      default:
        return {
          success: false,
          error: `Unknown role: ${req.toAgentRole}`,
          fromAgent: fromAgent.name,
          toAgent: req.toAgentRole,
          query: req.query,
          timestamp: new Date().toISOString(),
        }
    }

    // Log this inter-agent query to audit log
    await db.auditLog.create({
      data: {
        agentId: fromAgent.id,
        action: 'INTER_AGENT_QUERY',
        entityType: 'Agent',
        entityId: toAgent.id,
        metadata: JSON.stringify({
          fromAgent: fromAgent.name,
          toAgent: toAgent.name,
          query: req.query,
          fetchType,
        }),
      },
    })

    return {
      success: true,
      data,
      fromAgent: fromAgent.name,
      toAgent: toAgent.name,
      query: req.query,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Inter-agent query error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fromAgent: 'unknown',
      toAgent: req.toAgentRole,
      query: req.query,
      timestamp: new Date().toISOString(),
    }
  }
}

// ============================================================
// DOMAIN-SPECIFIC DATA FETCHERS
// ============================================================

async function fetchFinanceData(fetchType: string) {
  const project = await db.project.findFirst()
  if (!project) return { error: 'No project found' }

  if (fetchType === 'po' || fetchType === 'all') {
    const pos = await db.purchaseOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
    })
    const suppliers = await db.supplier.findMany({
      select: {
        name: true,
        totalDebt: true,
        _count: { select: { purchaseOrders: true } },
      },
    })
    return {
      pos: pos.map(po => ({
        poNumber: po.poNumber,
        supplier: po.supplier.name,
        status: po.status,
        total: po.actualTotal || po.plannedTotal,
        itemCount: po._count.items,
        createdAt: po.createdAt,
      })),
      suppliers: suppliers.map(s => ({
        name: s.name,
        totalDebt: s.totalDebt,
        poCount: s._count.purchaseOrders,
      })),
      summary: {
        totalPOs: pos.length,
        pendingApproval: pos.filter(p => p.status === 'DRAFT').length,
        totalDebt: suppliers.reduce((sum, s) => sum + s.totalDebt, 0),
      },
    }
  }

  return { message: `Finance data type '${fetchType}' not implemented` }
}

async function fetchMaterialData(fetchType: string) {
  const project = await db.project.findFirst()
  if (!project) return { error: 'No project found' }

  if (fetchType === 'stock' || fetchType === 'all') {
    const stocks = await db.stock.findMany({
      include: {
        material: {
          select: {
            name: true,
            unitMeasure: true,
            minStock: true,
          },
        },
      },
    })

    const unitsInProgress = await db.unit.findMany({
      where: { status: 'BOOKED' },
      select: {
        blockNumber: true,
        customer: { select: { name: true } },
        _count: { select: { materialUsages: true, progressPhotos: true } },
      },
    })

    return {
      stocks: stocks.map(s => ({
        material: s.material.name,
        quantity: s.quantity,
        unit: s.material.unitMeasure,
        minimum: s.material.minStock,
        isLow: s.quantity < s.material.minStock,
      })),
      lowStockAlerts: stocks
        .filter(s => s.quantity < s.material.minStock)
        .map(s => ({
          material: s.material.name,
          current: s.quantity,
          minimum: s.material.minStock,
        })),
      unitsInProgress: unitsInProgress.map(u => ({
        unit: u.blockNumber,
        customer: u.customer?.name,
        materialUsages: u._count.materialUsages,
        progressPhotos: u._count.progressPhotos,
      })),
    }
  }

  return { message: `Material data type '${fetchType}' not implemented` }
}

async function fetchDocumentData(fetchType: string) {
  if (fetchType === 'documents' || fetchType === 'all') {
    const customers = await db.customer.findMany({
      where: { isExistingMigration: true },
      select: {
        name: true,
        stage: true,
        _count: { select: { documents: true } },
      },
    })

    return {
      customers: customers.map(c => ({
        name: c.name,
        stage: c.stage,
        documentCount: c._count.documents,
      })),
      summary: {
        totalCustomers: customers.length,
        totalDocuments: customers.reduce((sum, c) => sum + c._count.documents, 0),
      },
    }
  }

  return { message: `Document data type '${fetchType}' not implemented` }
}

async function fetchMarketingData(fetchType: string) {
  const project = await db.project.findFirst()
  if (!project) return { error: 'No project found' }

  if (fetchType === 'customers' || fetchType === 'all') {
    const units = await db.unit.findMany({
      where: { projectId: project.id },
      select: { status: true },
    })

    const customers = await db.customer.findMany({
      select: {
        name: true,
        stage: true,
        sourceLead: true,
        assignedAgent: { select: { name: true } },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    })

    const stageCounts: Record<string, number> = {}
    customers.forEach(c => {
      stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1
    })

    return {
      units: {
        total: units.length,
        available: units.filter(u => u.status === 'AVAILABLE').length,
        booked: units.filter(u => u.status === 'BOOKED').length,
        sold: units.filter(u => u.status === 'SOLD').length,
      },
      customers: customers.map(c => ({
        name: c.name,
        stage: c.stage,
        source: c.sourceLead,
        agent: c.assignedAgent?.name,
      })),
      pipelineSummary: stageCounts,
    }
  }

  return { message: `Marketing data type '${fetchType}' not implemented` }
}

async function fetchCAOData(fetchType: string) {
  if (fetchType === 'stats' || fetchType === 'all') {
    const [agentCount, customerCount, poCount, approvalCount, conversationCount] = await Promise.all([
      db.agent.count({ where: { isActive: true } }),
      db.customer.count(),
      db.purchaseOrder.count(),
      db.approval.count({ where: { status: 'PENDING' } }),
      db.conversation.count(),
    ])

    const auditLogs = await db.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        action: true,
        agentId: true,
        createdAt: true,
      },
    })

    return {
      systemStats: {
        activeAgents: agentCount,
        totalCustomers: customerCount,
        totalPOs: poCount,
        pendingApprovals: approvalCount,
        activeConversations: conversationCount,
      },
      recentActivity: auditLogs.map(log => ({
        action: log.action,
        agentId: log.agentId,
        time: log.createdAt,
      })),
    }
  }

  return { message: `CAO data type '${fetchType}' not implemented` }
}
