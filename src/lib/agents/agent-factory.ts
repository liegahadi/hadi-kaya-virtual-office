// ============================================================
// AGENT FACTORY - Instantiate correct agent class by role
// ============================================================

import { db } from '@/lib/db'
import { BaseAgent, type AgentConfig } from './base-agent'

/**
 * Get agent config from database
 */
export async function getAgentConfig(agentId: string): Promise<AgentConfig | null> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  })
  if (!agent) return null

  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    systemPrompt: agent.systemPrompt || '',
    llmModel: agent.llmModel,
    llmProvider: agent.llmProvider,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    isDevilsAdvocate: agent.isDevilsAdvocate,
    whatsappNumber: agent.whatsappNumber,
    lightLlmModel: agent.lightLlmModel,
    lightLlmProvider: agent.lightLlmProvider,
  }
}

/**
 * Get agent by name + role
 */
export async function getAgentByName(
  name: string,
  role: string
): Promise<AgentConfig | null> {
  const agent = await db.agent.findUnique({
    where: { name_role: { name, role } },
  })
  if (!agent) return null

  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    systemPrompt: agent.systemPrompt || '',
    llmModel: agent.llmModel,
    llmProvider: agent.llmProvider,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    isDevilsAdvocate: agent.isDevilsAdvocate,
    whatsappNumber: agent.whatsappNumber,
    lightLlmModel: agent.lightLlmModel,
    lightLlmProvider: agent.lightLlmProvider,
  }
}

/**
 * Instantiate BaseAgent with config
 *
 * Note: For MVP, all agents use the BaseAgent class.
 * Future: subclass per role (FinanceAgent, MaterialAgent, etc.)
 * with role-specific methods (e.g. createPO, updateStock, etc.)
 */
export async function createAgent(agentId: string): Promise<BaseAgent | null> {
  const config = await getAgentConfig(agentId)
  if (!config) return null

  return new BaseAgent(config)
}

/**
 * List all active agents grouped by role
 */
export async function listActiveAgents() {
  const agents = await db.agent.findMany({
    where: { isActive: true },
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

  const grouped: Record<string, typeof agents> = {}
  for (const agent of agents) {
    if (!grouped[agent.role]) grouped[agent.role] = []
    grouped[agent.role].push(agent)
  }

  return grouped
}
