// ============================================================
// BASE AGENT - Foundation for all AI agents in the system
// ============================================================
// Optimizations applied:
// 1. Task-based LLM routing (light/heavy/premium) — uses light model for FAQ/status
// 2. Conversation history: last 10 messages (was 20)
// 3. Memories: top 10 (was 30)
// 4. Knowledge retrieval: limited to 5 most relevant (was 10)
// 5. Lazy loading: only fetch data when conversationId provided
// 6. Parallel fetch: history + memories + knowledge in parallel
// 7. Compressed system prompt context (memory + knowledge merged)
// ============================================================

import { db } from '@/lib/db'
import { callLLM, classifyTask, type LLMConfig, type LLMMessage, type TaskComplexity } from './llm-router'

export interface AgentConfig {
  id: string
  name: string
  role: string
  systemPrompt: string
  llmModel: string
  llmProvider: string
  temperature: number
  maxTokens: number
  isDevilsAdvocate: boolean
  whatsappNumber?: string | null
  // Optional light LLM override (defaults to OpenRouter free)
  lightLlmModel?: string | null
  lightLlmProvider?: string | null
}

export interface ChatContext {
  customerId?: string
  conversationId?: string
  channel?: string
  metadata?: Record<string, unknown>
}

export interface AgentResponse {
  content: string
  needsApproval: boolean
  approvalPayload?: Record<string, unknown>
  memoryUpdates?: Array<{
    category: string
    content: string
    importance?: number
  }>
  usedKnowledge?: string[]
  meta?: {
    taskType: TaskComplexity
    model: string
    provider: string
    latencyMs: number
    tokensUsed: number
    cost: number
  }
}

export abstract class BaseAgent {
  protected config: AgentConfig
  protected apiKey?: string

  constructor(config: AgentConfig, apiKey?: string) {
    this.config = config
    this.apiKey = apiKey
  }

  /**
   * Main entry point: process incoming message
   * Optimized: parallel fetch + task-based routing
   */
  async processMessage(
    incomingMessage: string,
    context: ChatContext
  ): Promise<AgentResponse> {
    const startTime = Date.now()

    // Classify task FIRST to decide which model to use
    const taskType = classifyTask(incomingMessage)

    // Parallel fetch: history + memories + knowledge (when applicable)
    const [history, memories, knowledge] = await Promise.all([
      this.getConversationHistory(context.conversationId),
      this.getRelevantMemories(context.customerId),
      this.getRelevantKnowledge(incomingMessage),
    ])

    // Build messages (compressed context)
    const messages = this.buildMessages(incomingMessage, history, memories, knowledge, context)

    // Call LLM with task-based routing
    const llmResponse = await this.callLLM(messages, taskType)

    // Save message to conversation (parallel with memory extraction)
    const savePromises: Promise<unknown>[] = []
    if (context.conversationId) {
      savePromises.push(
        this.saveMessage(context.conversationId, 'CUSTOMER', incomingMessage),
        this.saveMessage(context.conversationId, 'AGENT', llmResponse.content),
      )
    }

    // Extract + save memory updates (only for heavy tasks, skip for light to save tokens)
    let memoryUpdates: Array<{ category: string; content: string; importance?: number }> = []
    if (taskType !== 'light') {
      memoryUpdates = this.extractMemoryUpdates(incomingMessage, llmResponse.content, context)
      if (memoryUpdates.length > 0 && context.conversationId) {
        savePromises.push(this.saveMemories(memoryUpdates, context.customerId))
      }
    }

    await Promise.all(savePromises)

    // Check if action needs approval
    const needsApproval = this.checkNeedsApproval(llmResponse.content)
    const approvalPayload = needsApproval
      ? this.extractApprovalPayload(llmResponse.content)
      : undefined

    return {
      content: llmResponse.content,
      needsApproval,
      approvalPayload,
      memoryUpdates,
      usedKnowledge: knowledge.map(k => k.id),
      meta: {
        taskType,
        model: llmResponse.model,
        provider: llmResponse.provider,
        latencyMs: Date.now() - startTime,
        tokensUsed: llmResponse.usage?.totalTokens || 0,
        cost: llmResponse.usage?.cost || 0,
      },
    }
  }

  /**
   * Call LLM with task-based routing
   * - Light task: use lightLlmModel (OpenRouter free) — FAST & FREE
   *   Use COMPRESSED system prompt (just identity) to keep tokens low
   * - Heavy task: use llmModel (ZAI GLM-4.6) — quality, full prompt
   * - Premium task: explicit config (Claude/GPT)
   */
  protected async callLLM(messages: LLMMessage[], taskType: TaskComplexity) {
    let config: LLMConfig

    if (taskType === 'light' && this.config.lightLlmModel) {
      // Light task → use cheap/fast model + COMPRESSED system prompt
      // Replace full system prompt with short identity to save tokens
      const lightMessages = messages.map(m => {
        if (m.role === 'system' && m.content === this.config.systemPrompt) {
          return {
            ...m,
            content: `Anda adalah ${this.config.name}, ${this.config.role === 'CAO' ? 'Chief AI Officer' : this.config.role === 'FINANCE' ? 'Finance AI' : this.config.role === 'MATERIAL' ? 'Material AI' : this.config.role === 'DOCUMENT' ? 'Document AI' : this.config.role === 'MARKETING' ? 'Marketing AI' : 'AI Assistant'} di perusahaan "Menuju Hadi Kaya" - developer properti Anjayo 16 di Pangkalpinang, Bangka. Jawab singkat, sopan, dan akurat.`,
          }
        }
        return m
      })

      config = {
        provider: (this.config.lightLlmProvider || 'openrouter') as LLMConfig['provider'],
        model: this.config.lightLlmModel,
        apiKey: this.apiKey || process.env.OPENROUTER_API_KEY || '',
        temperature: 0.5,
        maxTokens: Math.min(this.config.maxTokens, 500),
        systemPrompt: this.config.systemPrompt, // kept for reference, but messages already compressed
        taskType: 'light',
      }

      return callLLM(config, lightMessages)
    }

    // Heavy/premium task → use main model (ZAI GLM-4.6) with full prompt
    config = {
      provider: this.config.llmProvider as LLMConfig['provider'],
      model: this.config.llmModel,
      apiKey: this.apiKey,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      systemPrompt: this.config.systemPrompt,
      taskType,
    }

    return callLLM(config, messages)
  }

  /**
   * Get conversation history (last 10 messages — was 20)
   */
  protected async getConversationHistory(conversationId?: string) {
    if (!conversationId) return []
    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10, // reduced from 20
      select: {
        role: true,
        content: true,
      },
    })
    return messages.reverse()
  }

  /**
   * Get memories relevant to this agent + customer
   * Optimized: top 10 (was 30), select only needed fields
   */
  protected async getRelevantMemories(customerId?: string) {
    const where: Record<string, unknown> = {
      OR: [
        { agentId: this.config.id },
        { agentId: null },
      ],
    }
    if (customerId) {
      where.OR.push({ AND: [{ agentId: this.config.id }, { customerId }] })
    }

    return db.memory.findMany({
      where,
      orderBy: { importance: 'desc' },
      take: 10, // reduced from 30
      select: {
        category: true,
        content: true,
        importance: true,
      },
    })
  }

  /**
   * Get knowledge items relevant to the message
   * Optimized: limit to top 5 (was 10), use text search in DB when possible
   */
  protected async getRelevantKnowledge(message: string) {
    const allItems = await db.knowledgeItem.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { agentId: this.config.id },
              { agentId: null },
            ],
          },
        ],
      },
      select: {
        id: true,
        category: true,
        question: true,
        answer: true,
        content: true,
      },
    })

    const messageLower = message.toLowerCase()
    const messageWords = messageLower.split(/\s+/).filter(w => w.length > 3)

    // Score-based ranking (better than just matchCount >= 1)
    return allItems
      .map(item => {
        const haystack = `${item.question || ''} ${item.answer || ''} ${item.content || ''}`.toLowerCase()
        let score = 0
        for (const word of messageWords) {
          if (haystack.includes(word)) score++
        }
        return { item, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // reduced from 10
      .map(({ item }) => item)
  }

  /**
   * Build messages array for LLM (compressed context)
   * Optimized: merge memory + knowledge into one system message (saves tokens)
   */
  protected buildMessages(
    incomingMessage: string,
    history: Array<{ role: string; content: string }>,
    memories: Array<{ category: string; content: string }>,
    knowledge: Array<{ category: string; question: string | null; answer: string | null; content: string | null }>,
    _context: ChatContext
  ): LLMMessage[] {
    const messages: LLMMessage[] = []

    // System prompt
    messages.push({
      role: 'system',
      content: this.config.systemPrompt,
    })

    // Compressed context: merge memory + knowledge into one system message
    const contextParts: string[] = []
    if (memories.length > 0) {
      const memoryText = memories
        .map(m => `- ${m.content}`)
        .join('\n')
      contextParts.push(`Memori:\n${memoryText}`)
    }
    if (knowledge.length > 0) {
      const knowledgeText = knowledge
        .map(k => {
          if (k.category === 'FAQ' || k.category === 'OBJECTION') {
            return `Q: ${k.question}\nA: ${k.answer}`
          }
          return k.content
        })
        .join('\n---\n')
      contextParts.push(`Knowledge:\n${knowledgeText}`)
    }

    if (contextParts.length > 0) {
      messages.push({
        role: 'system',
        content: contextParts.join('\n\n'),
      })
    }

    // Devil's advocate mode
    if (this.config.isDevilsAdvocate) {
      messages.push({
        role: 'system',
        content: 'Mode devil\'s advocate AKTIF. Jika perintah owner aneh/kontradiktif, push back dengan argumen logis. Jangan "yes sir" tanpa pertimbangan.',
      })
    }

    // History (compressed: only role + content)
    for (const msg of history) {
      messages.push({
        role: msg.role === 'AGENT' ? 'assistant' : 'user',
        content: msg.content,
      })
    }

    // Current message
    messages.push({
      role: 'user',
      content: incomingMessage,
    })

    return messages
  }

  /**
   * Save message (optimized: only essential fields)
   */
  protected async saveMessage(
    conversationId: string,
    role: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'OWNER',
    content: string
  ) {
    await Promise.all([
      db.message.create({
        data: {
          conversationId,
          role,
          content,
          contentType: 'TEXT',
        },
      }),
      db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ])
  }

  /**
   * Save memories (bulk insert)
   */
  protected async saveMemories(
    memories: Array<{ category: string; content: string; importance?: number }>,
    customerId?: string
  ) {
    if (memories.length === 0) return

    await db.memory.createMany({
      data: memories.map(m => ({
        agentId: this.config.id,
        customerId: customerId || null,
        category: m.category,
        content: m.content,
        importance: m.importance ?? 0.5,
        source: 'CONVERSATION',
      })),
    })
  }

  /**
   * Extract memory updates (only for heavy tasks to save tokens)
   * TODO: use LLM to extract structured memory
   */
  protected extractMemoryUpdates(
    _incoming: string,
    _response: string,
    _context: ChatContext
  ): Array<{ category: string; content: string; importance?: number }> {
    // Default: no auto-extraction. Subclasses can override.
    return []
  }

  /**
   * Check if response indicates action that needs owner approval
   */
  protected checkNeedsApproval(response: string): boolean {
    const approvalTriggers = [
      /akan saya (?:buat|kirim|proses|eksekusi|order|pesan).*(?:PO|purchase order)/i,
      /pengajuan dana/i,
      /pembayaran/i,
      /menunggu (?:ACC|approval|konfirmasi)/i,
      /butuh tanda tangan/i,
      /mohon (?:ACC|approval|konfirmasi)/i,
    ]
    return approvalTriggers.some(pattern => pattern.test(response))
  }

  /**
   * Extract structured payload for approval
   */
  protected extractApprovalPayload(_response: string): Record<string, unknown> {
    return { agentId: this.config.id, agentName: this.config.name }
  }

  /**
   * Get agent's config
   */
  getConfig(): AgentConfig {
    return this.config
  }
}
