// ============================================================
// RATNA ANALYZER - Real system analysis & bottleneck detection
// ============================================================
// Strategy:
// 1. Fetch real data from DB (audit logs, approvals, conversations, etc)
// 2. Compute statistics & detect patterns
// 3. Generate recommendations (rule-based + optional LLM enhancement)
// 4. Track analysis history for trend monitoring
// ============================================================

import { db } from '@/lib/db'
import { callLLM, type LLMMessage } from '@/lib/agents/llm-router'

export interface AnalysisResult {
  timestamp: string
  systemStats: {
    activeAgents: number
    totalConversations: number
    totalMessages: number
    pendingApprovals: number
    resolvedApprovals: number
    avgApprovalTimeMs: number
    totalCustomers: number
    totalUnits: number
    unitsSold: number
    conversionRate: number
  }
  bottlenecks: Array<{
    type: 'APPROVAL_DELAY' | 'LOW_ACTIVITY' | 'STOCK_CRITICAL' | 'CUSTOMER_STALLED' | 'AGENT_OVERLOAD'
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: string
    metric: string
    recommendation: string
    affectedAgents?: string[]
  }>
  agentPerformance: Array<{
    agentId: string
    agentName: string
    role: string
    conversationCount: number
    messageCount: number
    approvalCount: number
    lastActivity: string | null
    status: 'ACTIVE' | 'IDLE' | 'INACTIVE'
  }>
  recommendations: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'STRATEGIC'
    title: string
    description: string
    impact: string
    action: string
  }>
  llmInsight?: string
}

export async function analyzeSystem(useLLM = true): Promise<AnalysisResult> {
  // ============================================================
  // 1. FETCH REAL DATA FROM DB
  // ============================================================
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    agents,
    conversations,
    messages,
    pendingApprovals,
    resolvedApprovals,
    customers,
    units,
    auditLogs,
    agentActivity,
  ] = await Promise.all([
    db.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true, updatedAt: true },
    }),
    db.conversation.count(),
    db.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.approval.count({ where: { status: 'PENDING' } }),
    db.approval.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
        respondedAt: { not: null },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, respondedAt: true },
    }),
    db.customer.count(),
    db.unit.count(),
    db.auditLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { action: true, agentId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    // Per-agent activity in last 7 days
    db.agent.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        _count: {
          select: {
            conversations: true,
            assignedCustomers: true,
            approvals: true,
          },
        },
      },
    }),
  ])

  // Units sold
  const unitsSold = await db.unit.count({ where: { status: 'SOLD' } })

  // ============================================================
  // 2. COMPUTE STATISTICS
  // ============================================================
  const conversionRate = customers > 0 ? (unitsSold / customers) * 100 : 0

  // Average approval time
  let avgApprovalTimeMs = 0
  if (resolvedApprovals.length > 0) {
    const totalTime = resolvedApprovals.reduce((sum, a) => {
      if (a.respondedAt) {
        return sum + (a.respondedAt.getTime() - a.createdAt.getTime())
      }
      return sum
    }, 0)
    avgApprovalTimeMs = totalTime / resolvedApprovals.length
  }

  // ============================================================
  // 3. DETECT BOTTLENECKS
  // ============================================================
  const bottlenecks: AnalysisResult['bottlenecks'] = []

  // Bottleneck 1: Approval delay (> 6 hours avg)
  if (avgApprovalTimeMs > 6 * 60 * 60 * 1000) {
    bottlenecks.push({
      type: 'APPROVAL_DELAY',
      severity: avgApprovalTimeMs > 24 * 60 * 60 * 1000 ? 'CRITICAL' : 'HIGH',
      description: `Rata-rata waktu approval ${(avgApprovalTimeMs / 3600000).toFixed(1)} jam (target: < 6 jam)`,
      metric: `${(avgApprovalTimeMs / 3600000).toFixed(1)}h`,
      recommendation: 'Delegate approval < Rp 5jt ke Manager Finance. Setup notification push untuk approval urgent.',
    })
  }

  // Bottleneck 2: Pending approvals backlog
  if (pendingApprovals > 5) {
    bottlenecks.push({
      type: 'APPROVAL_DELAY',
      severity: pendingApprovals > 10 ? 'HIGH' : 'MEDIUM',
      description: `${pendingApprovals} approval menunggu ACC. Backlog terlalu banyak.`,
      metric: `${pendingApprovals} pending`,
      recommendation: 'Segera review pending approvals. Pertimbangkan auto-approval untuk task repetitive.',
    })
  }

  // Bottleneck 3: Low activity (no messages in 24h)
  const messagesLast24h = await db.message.count({ where: { createdAt: { gte: oneDayAgo } } })
  if (messagesLast24h === 0) {
    bottlenecks.push({
      type: 'LOW_ACTIVITY',
      severity: 'MEDIUM',
      description: 'Tidak ada aktivitas chat dalam 24 jam terakhir',
      metric: '0 messages/24h',
      recommendation: 'Cek apakah Marketing AI aktif menangani DM. Pastikan WA bridge running.',
    })
  }

  // Bottleneck 4: Customer stalled (BOOKED stage > 7 days without progress)
  const stalledCustomers = await db.customer.findMany({
    where: {
      stage: { in: ['BOOKING', 'SLIK', 'PEMBERKASAN'] },
      stageUpdatedAt: { lt: sevenDaysAgo },
    },
    select: { name: true, stage: true, stageUpdatedAt: true },
  })
  if (stalledCustomers.length > 0) {
    bottlenecks.push({
      type: 'CUSTOMER_STALLED',
      severity: stalledCustomers.length > 3 ? 'HIGH' : 'MEDIUM',
      description: `${stalledCustomers.length} konsumen stuck di stage berikut > 7 hari: ${stalledCustomers.map(c => `${c.name} (${c.stage})`).join(', ')}`,
      metric: `${stalledCustomers.length} stalled`,
      recommendation: 'Follow up konsumen stuck. Identifikasi blocker (slik, berkas, bank) dan eskalasi.',
      affectedAgents: ['Marketing AI team'],
    })
  }

  // Bottleneck 5: Agent overload (one agent has > 50% of conversations)
  const totalConversations = agentActivity.reduce((sum, a) => sum + a._count.conversations, 0)
  if (totalConversations > 10) {
    const overloaded = agentActivity.find(a => a._count.conversations > totalConversations * 0.5)
    if (overloaded) {
      bottlenecks.push({
        type: 'AGENT_OVERLOAD',
        severity: 'MEDIUM',
        description: `Agent ${overloaded.name} handle ${overloaded._count.conversations} dari ${totalConversations} conversations (${Math.round(overloaded._count.conversations / totalConversations * 100)}%)`,
        metric: `${Math.round(overloaded._count.conversations / totalConversations * 100)}% load`,
        recommendation: `Redistribusi customer ke agent lain. Atau tambah agent baru untuk role ${overloaded.role}.`,
        affectedAgents: [overloaded.name],
      })
    }
  }

  // ============================================================
  // 4. AGENT PERFORMANCE
  // ============================================================
  const agentPerformance: AnalysisResult['agentPerformance'] = agentActivity.map(a => {
    const lastLog = auditLogs.find(log => log.agentId === a.id)
    const hoursSinceActivity = lastLog
      ? (now.getTime() - lastLog.createdAt.getTime()) / 3600000
      : 999

    return {
      agentId: a.id,
      agentName: a.name,
      role: a.role,
      conversationCount: a._count.conversations,
      messageCount: 0, // would need another query, skip for optimization
      approvalCount: a._count.approvals,
      lastActivity: lastLog?.createdAt.toISOString() || null,
      status: hoursSinceActivity < 1 ? 'ACTIVE' : hoursSinceActivity < 24 ? 'IDLE' : 'INACTIVE',
    }
  })

  // ============================================================
  // 5. RECOMMENDATIONS (rule-based)
  // ============================================================
  const recommendations: AnalysisResult['recommendations'] = []

  if (pendingApprovals > 0) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Resolve Pending Approvals',
      description: `${pendingApprovals} approval menunggu. Rata-rata response time: ${(avgApprovalTimeMs / 3600000).toFixed(1)} jam.`,
      impact: 'Speed up PO processing, supplier relationship improvement',
      action: 'Buka Chat tab → klik bell icon → ACC/reject pending approvals',
    })
  }

  if (stalledCustomers.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Follow Up Stalled Customers',
      description: `${stalledCustomers.length} konsumen stuck > 7 hari di stage mereka.`,
      impact: 'Prevent lost sales, improve conversion rate',
      action: `Assign Marketing AI untuk follow up: ${stalledCustomers.map(c => c.name).join(', ')}`,
    })
  }

  if (messagesLast24h < 5 && conversations > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Activate Marketing AI',
      description: 'Aktivitas chat rendah dalam 24 jam terakhir.',
      impact: 'Maintain lead engagement, prevent competitor steal',
      action: 'Pastikan Marketing AI aktif reply DM. Setup WA bridge jika belum.',
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'LOW',
      title: 'System Running Smoothly',
      description: 'Tidak ada bottleneck terdeteksi. Sistem operasional normal.',
      impact: 'Continue current operations',
      action: 'Monitor secara berkala. Review lagi dalam 7 hari.',
    })
  }

  // Strategic recommendation
  if (unitsSold > 40 && conversionRate < 50) {
    recommendations.push({
      priority: 'STRATEGIC',
      title: 'Improve Conversion Rate',
      description: `Conversion rate ${conversionRate.toFixed(1)}% (${unitsSold} sold dari ${customers} customers). Ada room for improvement.`,
      impact: 'Potential revenue increase 20-30% with better nurturing',
      action: 'Review Marketing AI personality matching. Train dengan objection handling baru.',
    })
  }

  // ============================================================
  // 6. LLM INSIGHT (optional, heavy task)
  // ============================================================
  let llmInsight: string | undefined
  if (useLLM && bottlenecks.length > 0) {
    try {
      const llmMessages: LLMMessage[] = [
        {
          role: 'system',
          content: 'Anda adalah RATNA, Chief AI Officer. Berdasarkan data sistem, berikan 1 insight strategis singkat (max 200 kata) untuk Owner. Fokus pada action item yang paling impactful. Bahasa Indonesia, profesional tapi to the point.',
        },
        {
          role: 'user',
          content: `Data sistem 7 hari terakhir:
- Active agents: ${agents.length}
- Total conversations: ${conversations}
- Messages (7 hari): ${messages}
- Pending approvals: ${pendingApprovals}
- Avg approval time: ${(avgApprovalTimeMs / 3600000).toFixed(1)} jam
- Customers: ${customers}, Units sold: ${unitsSold}, Conversion: ${conversionRate.toFixed(1)}%
- Bottlenecks: ${bottlenecks.length} (${bottlenecks.map(b => `${b.type}:${b.severity}`).join(', ')})
- Stalled customers: ${stalledCustomers.length}
- Messages 24h terakhir: ${messagesLast24h}

Bottleneck details:
${bottlenecks.map(b => `- [${b.severity}] ${b.type}: ${b.description}`).join('\n')}

Berikan insight strategis + 1 action priority untuk Owner:`,
        },
      ]

      const response = await callLLM({ taskType: 'heavy' }, llmMessages)
      llmInsight = response.content
    } catch (err) {
      console.error('LLM insight failed:', err)
      // Continue without LLM insight
    }
  }

  return {
    timestamp: now.toISOString(),
    systemStats: {
      activeAgents: agents.length,
      totalConversations: conversations,
      totalMessages: messages,
      pendingApprovals,
      resolvedApprovals: resolvedApprovals.length,
      avgApprovalTimeMs,
      totalCustomers: customers,
      totalUnits: units,
      unitsSold,
      conversionRate,
    },
    bottlenecks,
    agentPerformance,
    recommendations,
    llmInsight,
  }
}
