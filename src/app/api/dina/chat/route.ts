// POST /api/dina/chat
// DINA AI Assistant — powered by Gemini 2.0 Flash with full knowledge base + customer context
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DINA_SYSTEM_PROMPT, buildCustomerContext } from '@/lib/agents/dina-knowledge'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { message, customerId } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 })

    // Get customer data for context injection
    let customer: any = null
    if (customerId) {
      customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { units: true, bankPipelines: true },
      })
    }

    // Build system prompt with customer context
    const customerContext = buildCustomerContext(customer)
    const systemPrompt = DINA_SYSTEM_PROMPT.replace('{customerContext}', customerContext)

    // Get last 15 messages for conversation history (from DB if available, otherwise just current message)
    let history: Array<{ role: string; content: string }> = []
    if (customerId) {
      // Try to find existing conversation
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

    // Build Gemini API request
    const body = {
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: message }] },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
        topP: 0.9,
      },
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error:', response.status, errText)

      // Fallback to OpenRouter (already has API key configured)
      console.log('Falling back to OpenRouter...')
      try {
        const openrouterKey = process.env.OPENROUTER_API_KEY
        if (!openrouterKey) throw new Error('No OpenRouter key')

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
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
              { role: 'system', content: systemPrompt },
              ...chatMessages,
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        })

        if (!orResponse.ok) throw new Error(`OpenRouter ${orResponse.status}`)

        const orData = await orResponse.json()
        const fallbackResponse = orData.choices[0]?.message?.content || 'Maaf, saya tidak bisa merespons saat ini.'

        // Save to DB
        try {
          if (customerId) {
            let conversation = await db.conversation.findFirst({ where: { customerId, channel: 'DASHBOARD' } })
            if (!conversation) {
              conversation = await db.conversation.create({ data: { customerId, channel: 'DASHBOARD', status: 'ACTIVE' } as any })
            }
            await db.message.createMany({ data: [
              { conversationId: conversation.id, role: 'user', content: message },
              { conversationId: conversation.id, role: 'assistant', content: fallbackResponse },
            ]})
          }
        } catch {}

        return NextResponse.json({ success: true, response: fallbackResponse, model: 'llama-3.3-70b-fallback' })
      } catch (fallbackErr) {
        console.error('OpenRouter fallback also failed:', fallbackErr)
        return NextResponse.json({ success: false, error: 'Both Gemini and OpenRouter failed' }, { status: 500 })
      }
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa merespons saat ini.'

    // Save conversation to DB (optional, non-blocking)
    try {
      if (customerId) {
        // Find or create conversation
        let conversation = await db.conversation.findFirst({
          where: { customerId, channel: 'DASHBOARD' },
        })
        if (!conversation) {
          conversation = await db.conversation.create({
            data: { customerId, channel: 'DASHBOARD', status: 'ACTIVE' } as any,
          })
        }
        // Save messages
        await db.message.createMany({
          data: [
            { conversationId: conversation.id, role: 'user', content: message },
            { conversationId: conversation.id, role: 'assistant', content: aiResponse },
          ],
        })
      }
    } catch (dbErr) {
      console.error('DB save (non-fatal):', dbErr)
    }

    return NextResponse.json({ success: true, response: aiResponse })
  } catch (err: any) {
    console.error('DINA chat error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
