// ============================================================
// MULTI-LLM ROUTER - Task-Based Routing untuk Cost Optimization
// ============================================================
// Strategy:
// - HEAVY task (analisa, konten, keputusan): ZAI SDK GLM-4.6 (FREE, built-in)
// - LIGHT task (FAQ, status, chat receh): OpenRouter free models (FREE)
// - PREMIUM fallback (Claude/GPT): OpenRouter paid (kalau perlu)
//
// Cost: Rp 0/hari dengan strategi ini.
// ============================================================

export type LLMProvider = 'zai' | 'openrouter' | 'groq' | 'google' | 'anthropic' | 'openai'
export type TaskComplexity = 'light' | 'heavy' | 'premium'

export interface LLMConfig {
  provider: LLMProvider
  model: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  taskType?: TaskComplexity
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    cost?: number  // in USD
  }
  model: string
  provider: LLMProvider
  taskType: TaskComplexity
  latencyMs: number
}

// ============================================================
// TASK CLASSIFICATION — heuristic to decide light vs heavy
// ============================================================

const LIGHT_TASK_KEYWORDS = [
  // FAQ-style queries
  'berapa', 'harga', 'dp', 'cicilan', 'lokasi', 'alamat', 'banjir', 'garansi',
  'sertifikat', 'kpr', 'tenor', 'syarat', 'berapa lama', 'kapan', 'jam',
  // Status queries
  'status', 'cek', 'lihat', 'tampil', 'list', 'daftar', 'ada', 'kosong',
  // Greetings
  'halo', 'hai', 'selamat pagi', 'selamat siang', 'selamat malam', 'terima kasih',
  // Simple ack
  'oke', 'ok', 'baik', 'sip', 'iya', 'ya', 'betul', 'benar',
]

const HEAVY_TASK_KEYWORDS = [
  // Analysis
  'analisa', 'analisis', 'rekomendasi', 'saran', 'strategi', 'riset', 'banding',
  // Content creation
  'buat', 'tuliskan', 'generate', 'posting', 'caption', 'artikel', 'konten', 'copywriting',
  // Decision making
  'putuskan', 'evaluasi', 'pertimbangkan', 'pilih', 'tentukan',
  // Complex finance
  'po', 'purchase order', 'hitung', 'anggaran', 'rab', 'laba', 'rugi', 'pajak', 'bphtb',
  // Document generation
  'dokumen', 'berkas', 'template', 'form', 'isi data',
  // Objection handling & persuasion
  'objection', 'tolak', 'keberatan', 'ragu', 'meyakinkan', 'negosiasi', 'diskon',
]

export function classifyTask(message: string): TaskComplexity {
  const msgLower = message.toLowerCase()

  // Check heavy keywords first (more specific)
  let heavyScore = 0
  for (const kw of HEAVY_TASK_KEYWORDS) {
    if (msgLower.includes(kw)) heavyScore++
  }

  // Check light keywords
  let lightScore = 0
  for (const kw of LIGHT_TASK_KEYWORDS) {
    if (msgLower.includes(kw)) lightScore++
  }

  // Long messages likely need more thought
  if (message.length > 200) heavyScore += 2
  if (message.length > 500) heavyScore += 2

  // Very short messages likely just FAQ
  if (message.length < 30) lightScore += 2

  // Default: if no clear signal, use heavy (safer)
  if (heavyScore === 0 && lightScore === 0) return 'heavy'

  return heavyScore > lightScore ? 'heavy' : 'light'
}

// ============================================================
// MAIN LLM CALL — routes based on task type
// ============================================================

export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const start = Date.now()
  const taskType = config.taskType || classifyTask(messages[messages.length - 1]?.content || '')

  // Route to appropriate provider based on task type
  // Allow override via config.provider, otherwise use defaults
  let provider: LLMProvider
  let model: string

  if (config.provider && config.model) {
    // Explicit config from agent
    provider = config.provider
    model = config.model
  } else if (taskType === 'light') {
    // Light task → OpenRouter free model
    provider = 'openrouter'
    model = process.env.DEFAULT_LIGHT_LLM_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free'
  } else if (taskType === 'premium') {
    // Premium task → OpenRouter paid (Claude/GPT)
    provider = 'openrouter'
    model = config.model || 'anthropic/claude-sonnet-4'
  } else {
    // Heavy task → ZAI SDK (free, built-in)
    provider = 'zai'
    model = process.env.DEFAULT_HEAVY_LLM_MODEL || 'glm-4.6'
  }

  const finalConfig: LLMConfig = {
    ...config,
    provider,
    model,
    taskType,
  }

  try {
    let response: LLMResponse
    switch (provider) {
      case 'zai':
        response = await callZAI(finalConfig, messages)
        break
      case 'openrouter':
        response = await callOpenRouter(finalConfig, messages)
        break
      case 'groq':
        response = await callGroq(finalConfig, messages)
        break
      case 'google':
        response = await callGemini(finalConfig, messages)
        break
      default:
        // Fallback to ZAI
        console.warn(`Provider ${provider} not yet implemented, falling back to ZAI`)
        response = await callZAI({ ...finalConfig, provider: 'zai', model: 'glm-4.6' }, messages)
    }

    return {
      ...response,
      taskType,
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    // Fallback: try ZAI if OpenRouter fails
    if (provider !== 'zai') {
      console.warn(`⚠️ ${provider} failed, falling back to ZAI:`, error instanceof Error ? error.message : 'unknown')
      const fallbackResponse = await callZAI(
        { ...finalConfig, provider: 'zai', model: 'glm-4.6' },
        messages
      )
      return {
        ...fallbackResponse,
        taskType,
        latencyMs: Date.now() - start,
      }
    }
    throw error
  }
}

// ============================================================
// ZAI SDK (built-in, free, GLM-4.6)
// ============================================================

async function callZAI(config: LLMConfig, messages: LLMMessage[]): Promise<LLMResponse> {
  const ZAI = await import('z-ai-web-dev-sdk').then(m => m.default || m).catch(() => null)

  if (!ZAI) {
    throw new Error('z-ai-web-dev-sdk not available')
  }

  const zai = await ZAI.create()

  const systemMessage = messages.find(m => m.role === 'system')
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const response = await zai.chat.completions.create({
    messages: chatMessages,
    system: systemMessage?.content,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 2000,
  })

  return {
    content: response.choices[0]?.message?.content || '',
    model: 'glm-4.6',
    provider: 'zai',
    taskType: config.taskType || 'heavy',
    latencyMs: 0, // will be filled by caller
    usage: response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      cost: 0, // ZAI is free
    } : undefined,
  }
}

// ============================================================
// OpenRouter (multi-provider, free + paid models)
// ============================================================

async function callOpenRouter(config: LLMConfig, messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured. Set it in .env or via dashboard settings.')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hadi Kaya Virtual Office',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0]?.message?.content || '',
    model: config.model,
    provider: 'openrouter',
    taskType: config.taskType || 'light',
    latencyMs: 0,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      cost: data.usage.cost || 0,
    } : undefined,
  }
}

// ============================================================
// Groq (free, ultra-fast LPU inference)
// ============================================================

async function callGroq(config: LLMConfig, messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = config.apiKey || process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'llama-3.1-8b-instant',
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0]?.message?.content || '',
    model: config.model || 'llama-3.1-8b-instant',
    provider: 'groq',
    taskType: config.taskType || 'light',
    latencyMs: 0,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      cost: 0, // Groq free tier
    } : undefined,
  }
}

// ============================================================
// Google Gemini (free tier via Google AI Studio)
// ============================================================

async function callGemini(config: LLMConfig, messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const model = config.model || 'gemini-2.0-flash'
  const systemMessage = messages.find(m => m.role === 'system')
  const chatMessages = messages.filter(m => m.role !== 'system')

  // Gemini API format
  const body: any = {
    contents: chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens ?? 2000,
    },
  }

  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage.content }] }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return {
    content,
    model,
    provider: 'google',
    taskType: config.taskType || 'heavy',
    latencyMs: 0,
    usage: data.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount,
      completionTokens: data.usageMetadata.candidatesTokenCount,
      totalTokens: data.usageMetadata.totalTokenCount,
      cost: 0, // Gemini free tier
    } : undefined,
  }
}

// ============================================================
// AVAILABLE MODELS — for dashboard dropdown
// ============================================================

export const AVAILABLE_MODELS = [
  // === FREE models ===
  // ZAI SDK (built-in, unlimited)
  {
    id: 'glm-4.6',
    label: 'GLM-4.6 (ZAI - free, built-in)',
    provider: 'zai' as LLMProvider,
    cost: 'Rp 0',
    bestFor: 'heavy' as TaskComplexity,
  },
  // Google Gemini (free tier, smart + fast)
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash (Google - free, RECOMMENDED)',
    provider: 'google' as LLMProvider,
    cost: 'Rp 0',
    bestFor: 'heavy' as TaskComplexity,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash (Google - free)',
    provider: 'google' as LLMProvider,
    cost: 'Rp 0',
    bestFor: 'heavy' as TaskComplexity,
  },
  // OpenRouter free (rate-limited)
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    label: 'Nemotron Nano 30B (OpenRouter free)',
    provider: 'openrouter' as LLMProvider,
    cost: 'Rp 0 (rate-limited)',
    bestFor: 'light' as TaskComplexity,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B (OpenRouter free)',
    provider: 'openrouter' as LLMProvider,
    cost: 'Rp 0 (rate-limited)',
    bestFor: 'light' as TaskComplexity,
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    label: 'Qwen3 Next 80B (OpenRouter free)',
    provider: 'openrouter' as LLMProvider,
    cost: 'Rp 0 (rate-limited)',
    bestFor: 'light' as TaskComplexity,
  },
  // === PAID models (cheap, ~Rp 2/req) ===
  {
    id: 'z-ai/glm-4.6',
    label: 'GLM-4.6 via OpenRouter (~Rp 2/req)',
    provider: 'openrouter' as LLMProvider,
    cost: '~Rp 2/req',
    bestFor: 'heavy' as TaskComplexity,
  },
  // === PREMIUM models ===
  {
    id: 'anthropic/claude-sonnet-4',
    label: 'Claude Sonnet 4 (premium)',
    provider: 'openrouter' as LLMProvider,
    cost: '~Rp 50/req',
    bestFor: 'premium' as TaskComplexity,
  },
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o (premium)',
    provider: 'openrouter' as LLMProvider,
    cost: '~Rp 40/req',
    bestFor: 'premium' as TaskComplexity,
  },
] as const

// ============================================================
// COST TRACKER — track daily spend
// ============================================================

const dailyCostTracker = {
  date: new Date().toDateString(),
  totalCostIdr: 0,
  requestCount: 0,
  byProvider: {} as Record<string, number>,
  byTaskType: { light: 0, heavy: 0, premium: 0 },
}

export function trackCost(response: LLMResponse): void {
  // Reset daily
  const today = new Date().toDateString()
  if (dailyCostTracker.date !== today) {
    dailyCostTracker.date = today
    dailyCostTracker.totalCostIdr = 0
    dailyCostTracker.requestCount = 0
    dailyCostTracker.byProvider = {}
    dailyCostTracker.byTaskType = { light: 0, heavy: 0, premium: 0 }
  }

  // Convert USD to IDR (approximate rate)
  const costUsd = response.usage?.cost || 0
  const costIdr = costUsd * 16000 // ~Rp 16k per USD

  dailyCostTracker.totalCostIdr += costIdr
  dailyCostTracker.requestCount++
  dailyCostTracker.byProvider[response.provider] = (dailyCostTracker.byProvider[response.provider] || 0) + costIdr
  if (response.taskType) {
    dailyCostTracker.byTaskType[response.taskType]++
  }

  // Check daily limit
  const limit = parseFloat(process.env.LLM_DAILY_COST_LIMIT_IDR || '50000')
  if (dailyCostTracker.totalCostIdr > limit) {
    console.warn(`⚠️ Daily LLM cost limit reached: Rp ${dailyCostTracker.totalCostIdr.toFixed(0)} (limit: Rp ${limit})`)
    // Could throw error or fallback to free models
  }
}

export function getDailyCostStats() {
  return { ...dailyCostTracker }
}
