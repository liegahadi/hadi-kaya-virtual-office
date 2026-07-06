// Shared agent chat handler — used by DINA, RINA, MITRA, RATNA, RANGGA, Marketing AI
// Each agent route imports this and passes its agentId + system prompt
//
// Flow:
// 1. Get agent config from DB (system prompt, persona, LLM model)
// 2. Detect intent (lightweight — most agents just chat, only DINA has DB tools)
// 3. Call LLM (Gemini/Nemotron fallback)
// 4. Save conversation + memory
// 5. Return response

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface AgentChatConfig {
  agentId: string  // DB agent ID
  agentName: string  // 'DINA' | 'RINA' | etc.
  defaultSystemPrompt: string  // fallback if DB agent.systemPrompt is null
  enableDbTools?: boolean  // only DINA = true (DB CRUD for customer)
}

export async function handleAgentChat(req: NextRequest, config: AgentChatConfig) {
  try {
    const { message, customerId, channel, senderNumber, senderName, isOwner } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 })

    const isWhatsApp = channel === 'WHATSAPP_GROUP' || channel === 'WHATSAPP_PRIVATE'
    const isGroupChat = channel === 'WHATSAPP_GROUP'
    const isPrivateChat = channel === 'WHATSAPP_PRIVATE'
    const isOwnerUser = isOwner || (!isWhatsApp)

    // Silent ignore for non-owner WA DM
    if (isPrivateChat && !isOwnerUser) {
      return NextResponse.json({ success: false, silent: true, response: '', model: 'silent-ignore' })
    }

    // Get agent config from DB
    let agent: any = null
    try {
      agent = await db.agent.findUnique({ where: { id: config.agentId } })
    } catch (e) {
      console.log(`Agent ${config.agentId} not found in DB, using defaults`)
    }

    const systemPrompt = agent?.systemPrompt || config.defaultSystemPrompt
    const llmModel = agent?.llmModel || 'gemini-2.0-flash'

    // Get customer context if customerId provided
    let customer: any = null
    if (customerId) {
      customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { units: true },
      })
    }

    // Get conversation history
    let conversation: any = null
    let conversationId: string | undefined
    let history: Array<{ role: string; content: string }> = []
    try {
      const channelKey = isWhatsApp ? (channel as string) : 'DASHBOARD'
      if (customerId) {
        conversation = await db.conversation.findFirst({
          where: { customerId, agentId: config.agentId, channel: channelKey },
          orderBy: { updatedAt: 'desc' },
        })
      } else {
        conversation = await db.conversation.findFirst({
          where: { agentId: config.agentId, channel: channelKey },
          orderBy: { updatedAt: 'desc' },
        })
      }
      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            customerId: customerId || null,
            agentId: config.agentId,
            channel: channelKey,
            status: 'ACTIVE',
          } as any,
        })
      }
      conversationId = conversation.id

      // Refresh with messages
      const convWithMsgs = await db.conversation.findUnique({
        where: { id: conversation.id },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
      })
      history = convWithMsgs?.messages?.reverse()?.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      })) || []
    } catch (dbErr) {
      console.error('Conversation lookup (non-fatal):', dbErr)
    }

    // Build context for system prompt
    const customerContext = customer
      ? `\n\n## KONTEKS KONSUMEN AKTIF\n- Nama: ${customer.name}\n- Blok: ${(customer.blockLetter || '') + (customer.houseNumber || '') || '-'}\n- Bank: ${customer.bankName || 'belum dipilih'}\n- Stage: ${customer.stage}`
      : ''

    const channelInfo = isWhatsApp
      ? `\n\n## KONTEKS CHANNEL\n- Channel: ${channel}\n- Pengirim: ${senderName || 'Unknown'} (${senderNumber || '-'})\n- Is Owner: ${isOwnerUser ? 'YA' : 'TIDAK'}\n- Is Group: ${isGroupChat ? 'YA' : 'TIDAK'}`
      : ''

    const fullSystemPrompt = systemPrompt + customerContext + channelInfo

    // Call LLM (Gemini primary, OpenRouter fallback)
    let aiResponse = ''
    let modelUsed = llmModel

    try {
      const body = {
        contents: [
          ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
          { role: 'user', parts: [{ text: message }] },
        ],
        systemInstruction: { parts: [{ text: fullSystemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000, topP: 0.9 },
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        modelUsed = 'gemini-2.0-flash'
      } else {
        throw new Error(`Gemini ${response.status}`)
      }
    } catch (geminiErr) {
      console.log(`[${config.agentName}] Gemini failed, falling back to OpenRouter...`)
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
          'X-Title': `Hadi Kaya ${config.agentName}`,
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-nano-30b-a3b:free',
          messages: [{ role: 'system', content: fullSystemPrompt }, ...chatMessages],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!orResponse.ok) throw new Error(`OpenRouter ${orResponse.status}`)
      const orData = await orResponse.json()
      aiResponse = orData.choices[0]?.message?.content || ''
      modelUsed = 'nemotron-fallback'
    }

    if (!aiResponse) aiResponse = `Maaf, ${config.agentName} tidak bisa merespons saat ini.`

    // Save messages
    try {
      if (conversationId) {
        await db.message.createMany({ data: [
          { conversationId, role: 'user', content: message },
          { conversationId, role: 'assistant', content: aiResponse },
        ]})
        await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
      }
    } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: modelUsed,
      agentName: config.agentName,
      agentId: config.agentId,
      files: [],  // empty for non-DINA agents (only DINA sends files)
    })
  } catch (err: any) {
    console.error(`Agent chat error:`, err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
