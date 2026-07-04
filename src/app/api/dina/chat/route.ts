// POST /api/dina/chat
// DINA AI Assistant — with DB tools + memory + Gemini/OpenRouter
// Flow:
// 1. Detect intent from user message
// 2. Execute relevant DB tools (get customer stats, list, doc status, etc)
// 3. Include tool results in context
// 4. Send to Gemini (or fallback OpenRouter)
// 5. Save conversation + extract learning to memory
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DINA_SYSTEM_PROMPT, buildCustomerContext } from '@/lib/agents/dina-knowledge'
import { detectIntent, executeTools, saveMemory, extractLearning } from '@/lib/agents/dina-tools'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { message, customerId } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 })

    // Step 1: Get customer data for context
    let customer: any = null
    if (customerId) {
      customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { units: true, bankPipelines: true },
      })
    }

    // Step 2: Detect intent from user message
    const intent = detectIntent(message)

    // Step 3: Execute DB tools based on intent
    const toolResults = await executeTools(intent, customerId, message)

    // Step 4: Build system prompt with customer context + tool results
    const customerContext = buildCustomerContext(customer)
    const systemPrompt = DINA_SYSTEM_PROMPT
      .replace('{customerContext}', customerContext)
      + (toolResults ? `\n\n## HASIL QUERY DATABASE (gunakan data ini untuk menjawab)\n${toolResults}` : '')

    // Step 5: Get conversation history
    let history: Array<{ role: string; content: string }> = []
    if (customerId) {
      const conversation = await db.conversation.findFirst({
        where: { customerId, channel: 'DASHBOARD' },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 15 } },
      })
      if (conversation?.messages) {
        history = conversation.messages.reverse().map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content,
        }))
      }
    }

    // Step 6: Call Gemini API
    const body = {
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: message }] },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 0.9,
      },
    }

    let aiResponse = ''
    let modelUsed = 'gemini-2.0-flash'

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else {
        throw new Error(`Gemini ${response.status}`)
      }
    } catch (geminiErr) {
      // Fallback to OpenRouter Nemotron
      console.log('Gemini failed, falling back to OpenRouter...')
      const openrouterKey = process.env.OPENROUTER_API_KEY
      if (!openrouterKey) throw new Error('No fallback available')

      const chatMessages = [
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })),
        { role: 'user', content: message },
      ]

      const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hadi-kaya-virtual-office.vercel.app',
          'X-Title': 'Hadi Kaya DINA',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-nano-30b-a3b:free',
          messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!orResponse.ok) throw new Error(`OpenRouter ${orResponse.status}`)
      const orData = await orResponse.json()
      aiResponse = orData.choices[0]?.message?.content || ''
      modelUsed = 'nemotron-fallback'
    }

    if (!aiResponse) aiResponse = 'Maaf, saya tidak bisa merespons saat ini.'

    // Step 7: Save conversation + messages to DB (ALWAYS save, even without customerId)
    try {
      let conversationId: string | undefined

      // Find or create conversation
      let conversation: any
      if (customerId) {
        conversation = await db.conversation.findFirst({ where: { customerId, channel: 'DASHBOARD' } })
        if (!conversation) {
          conversation = await db.conversation.create({ data: { customerId, channel: 'DASHBOARD', status: 'ACTIVE' } as any })
        }
      } else {
        // General chat (no customer)
        conversation = await db.conversation.findFirst({ where: { channel: 'DASHBOARD' } })
        if (!conversation) {
          conversation = await db.conversation.create({ data: { channel: 'DASHBOARD', status: 'ACTIVE' } as any })
        }
      }
      const convId: string = conversation.id

      await db.message.createMany({ data: [
        { conversationId: convId, role: 'user', content: message },
        { conversationId: convId, role: 'assistant', content: aiResponse },
      ]})
    } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

    // Step 8: Extract learning and save to memory
    try {
      const learning = extractLearning(message, aiResponse)
      if (learning) {
        await saveMemory(learning.content, learning.category, customerId, learning.importance)
      }
    } catch (memErr) { console.error('Memory save (non-fatal):', memErr) }

    return NextResponse.json({ success: true, response: aiResponse, model: modelUsed, toolsExecuted: intent.tools })
  } catch (err: any) {
    console.error('DINA chat error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
