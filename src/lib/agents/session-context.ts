// ============================================================
// DINA v2: SESSION CONTEXT + TRACEBACK ENGINE
// 48-hour session memory with auto-renew + LLM-assisted traceback
// ============================================================

import { db } from '@/lib/db'

const SESSION_TTL_HOURS = 48

// ============================================================
// SESSION CONTEXT (Tier 1 — Hot, 48 jam)
// ============================================================

export interface SessionContextData {
  id?: string
  conversationId?: string | null
  channel: string
  senderNumber?: string | null
  lastCustomerId?: string | null
  lastCustomerName?: string | null
  lastDocs?: string | null // JSON array
  lastIntent?: string | null
  lastTopic?: string | null
  lastInteractionAt?: Date
  expiresAt?: Date
}

/**
 * Get active session context for a conversation/channel/sender.
 * Returns null if expired or not found.
 */
export async function getSessionContext(opts: {
  conversationId?: string
  channel?: string
  senderNumber?: string
}): Promise<SessionContextData | null> {
  try {
    const where: any = {}
    if (opts.conversationId) {
      where.conversationId = opts.conversationId
    } else if (opts.channel && opts.senderNumber) {
      where.channel = opts.channel
      where.senderNumber = opts.senderNumber
    } else if (opts.channel) {
      where.channel = opts.channel
    } else {
      return null
    }

    // Expire old sessions
    const now = new Date()
    await db.sessionContext.updateMany({
      where: { expiresAt: { lt: now } },
      data: { /* keep record for audit but mark expired via expiresAt */ },
    }).catch(() => {})

    const session = await db.sessionContext.findFirst({
      where: {
        ...where,
        expiresAt: { gt: now },
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!session) return null
    return session as SessionContextData
  } catch (err) {
    console.error('[getSessionContext] error:', err)
    return null
  }
}

/**
 * Update or create session context. Auto-renew 48h TTL.
 */
export async function updateSessionContext(
  opts: {
    conversationId?: string
    channel: string
    senderNumber?: string
  },
  updates: Partial<SessionContextData>
): Promise<void> {
  try {
    const where: any = {}
    if (opts.conversationId) {
      where.conversationId = opts.conversationId
    } else if (opts.channel && opts.senderNumber) {
      where.channel = opts.channel
      where.senderNumber = opts.senderNumber
    } else if (opts.channel) {
      where.channel = opts.channel
    } else {
      return
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000)

    const existing = await db.sessionContext.findFirst({ where })

    if (existing) {
      // Update + auto-renew
      await db.sessionContext.update({
        where: { id: existing.id },
        data: {
          ...updates,
          lastInteractionAt: now,
          expiresAt,
        },
      })
    } else {
      // Create new
      await db.sessionContext.create({
        data: {
          conversationId: opts.conversationId || null,
          channel: opts.channel,
          senderNumber: opts.senderNumber || null,
          lastInteractionAt: now,
          expiresAt,
          ...updates,
        } as any,
      })
    }
  } catch (err) {
    console.error('[updateSessionContext] error:', err)
  }
}

/**
 * Append a doc to lastDocs array in session context.
 */
export async function appendDocToSession(
  opts: {
    conversationId?: string
    channel: string
    senderNumber?: string
  },
  doc: { docType: string; fileId: string; version: number; fileName: string }
): Promise<void> {
  try {
    const session = await getSessionContext(opts)
    const existingDocs = session?.lastDocs ? JSON.parse(session.lastDocs) : []
    existingDocs.push({ ...doc, createdAt: new Date().toISOString() })

    // Keep only last 10 docs
    const trimmed = existingDocs.slice(-10)

    await updateSessionContext(opts, { lastDocs: JSON.stringify(trimmed) })
  } catch (err) {
    console.error('[appendDocToSession] error:', err)
  }
}

// ============================================================
// TRACEBACK ENGINE (Tier 2 — Warm, LLM-assisted)
// ============================================================

const REFERENTIAL_KEYWORDS = [
  'yang tadi', 'yang kemarin', 'yang lalu', 'yang itu',
  'dokumen itu', 'konsumen tersebut', 'dia', 'dia lagi',
  'lanjutin', 'lanjutkan', 'ubah lagi', 'revisi', 'ganti lagi',
  'sama kayak sebelumnya', 'seperti yang tadi', 'yang barusan',
  'tadi', 'kemarin', 'barusan',
]

/**
 * Detect if message contains referential keywords that need traceback.
 */
export function needsTraceback(message: string): boolean {
  const msg = message.toLowerCase()
  return REFERENTIAL_KEYWORDS.some(kw => msg.includes(kw))
}

/**
 * Traceback: extract context from chat history using LLM.
 * Returns confidence score + extracted entities.
 */
export async function tracebackFromHistory(opts: {
  conversationId: string
  userMessage: string
}): Promise<{
  confidence: number
  customerId?: string
  customerName?: string
  docType?: string
  intent?: string
  topic?: string
  rawExtraction?: string
}> {
  try {
    // Fetch last 50 messages
    const messages = await db.message.findMany({
      where: { conversationId: opts.conversationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { role: true, content: true, createdAt: true },
    })

    if (messages.length === 0) {
      return { confidence: 0 }
    }

    // Reverse to chronological
    messages.reverse()

    // Build history text (truncate each msg to 200 chars)
    const historyText = messages
      .map(m => `${m.role === 'user' ? 'USER' : 'DINA'}: ${m.content.substring(0, 200)}`)
      .join('\n')

    // Call Gemini for context extraction
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { confidence: 0 }
    }

    const prompt = `Anda adalah asisten traceback. Dari history chat berikut, extract konteks untuk pesan terbaru user.

HISTORY:
${historyText}

PESAN USER TERBARU:
${opts.userMessage}

Extract dan return JSON dengan format:
{
  "confidence": 0.0-1.0,
  "customerId": "id jika disebut di history (string atau null)",
  "customerName": "nama konsumen jika disebut (string atau null)",
  "docType": "jenis dokumen jika relevan (string atau null)",
  "intent": "intent yang mungkin (string atau null)",
  "topic": "topik utama yang dibicarakan (string atau null)"
}

Hanya return JSON, tanpa penjelasan.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
        }),
      }
    )

    if (!response.ok) {
      return { confidence: 0 }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from response (might have ```json wrapper)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { confidence: 0, rawExtraction: text }
    }

    const extracted = JSON.parse(jsonMatch[0])
    return {
      confidence: extracted.confidence || 0,
      customerId: extracted.customerId || undefined,
      customerName: extracted.customerName || undefined,
      docType: extracted.docType || undefined,
      intent: extracted.intent || undefined,
      topic: extracted.topic || undefined,
      rawExtraction: text,
    }
  } catch (err) {
    console.error('[tracebackFromHistory] error:', err)
    return { confidence: 0 }
  }
}

/**
 * Full traceback pipeline: try session first, then history, then return for clarification.
 */
export async function resolveReference(opts: {
  conversationId?: string
  channel: string
  senderNumber?: string
  userMessage: string
}): Promise<{
  resolved: boolean
  source: 'session' | 'traceback' | 'clarify'
  customerId?: string
  customerName?: string
  docType?: string
  intent?: string
  topic?: string
  confidence: number
  tracebackRaw?: string
}> {
  // Tier 1: Check session context (48h)
  const session = await getSessionContext({
    conversationId: opts.conversationId,
    channel: opts.channel,
    senderNumber: opts.senderNumber,
  })

  if (session && session.lastCustomerId) {
    return {
      resolved: true,
      source: 'session',
      customerId: session.lastCustomerId,
      customerName: session.lastCustomerName || undefined,
      docType: session.lastDocs ? JSON.parse(session.lastDocs).slice(-1)[0]?.docType : undefined,
      intent: session.lastIntent || undefined,
      topic: session.lastTopic || undefined,
      confidence: 0.95,
    }
  }

  // Tier 2: Traceback via LLM
  if (opts.conversationId) {
    const traceback = await tracebackFromHistory({
      conversationId: opts.conversationId,
      userMessage: opts.userMessage,
    })

    if (traceback.confidence >= 0.8) {
      return {
        resolved: true,
        source: 'traceback',
        customerId: traceback.customerId,
        customerName: traceback.customerName,
        docType: traceback.docType,
        intent: traceback.intent,
        topic: traceback.topic,
        confidence: traceback.confidence,
        tracebackRaw: traceback.rawExtraction,
      }
    }

    return {
      resolved: false,
      source: 'clarify',
      confidence: traceback.confidence,
      tracebackRaw: traceback.rawExtraction,
    }
  }

  return { resolved: false, source: 'clarify', confidence: 0 }
}
