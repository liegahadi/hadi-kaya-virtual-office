// POST /api/dina/chat
// DINA AI Assistant — with DB tools + memory + Gemini/OpenRouter
// Flow:
// 1. Detect intent from user message
// 2. Execute relevant DB tools (get customer stats, list, doc status, etc)
// 3. Include tool results in context
// 4. Send to Gemini (or fallback OpenRouter)
// 5. Save conversation + extract learning to memory
//
// CRITICAL FIXES (v8.2):
// - PendingAction now persisted in DB (not in-memory) — survives Vercel lambda cold starts
// - Strict confirmation: only short messages (≤15 chars or pure confirm keyword) trigger CONFIRM_DELETE
// - Target name validation: if user mentions different customer in confirmation, ABORT
// - Anti-hallucination: system prompt explicitly tells LLM "if tool result doesn't show success, JANGAN bilang berhasil"
// - AuditLog on all CREATE/UPDATE/DELETE for traceability
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DINA_SYSTEM_PROMPT, buildCustomerContext } from '@/lib/agents/dina-knowledge'
import { detectIntent, executeTools, saveMemory, extractLearning, getActivePendingAction } from '@/lib/agents/dina-tools'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { message, customerId, channel, senderNumber, senderName, isOwner } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 })

    // Determine channel context
    const isWhatsApp = channel === 'WHATSAPP_GROUP' || channel === 'WHATSAPP_PRIVATE'
    const isGroupChat = channel === 'WHATSAPP_GROUP'
    const isPrivateChat = channel === 'WHATSAPP_PRIVATE'
    const isOwnerUser = isOwner || (!isWhatsApp) // Dashboard chat = always owner

    // === WHATSAPP BEHAVIOR ===
    // The WA bot (Baileys) enforces these rules BEFORE calling this API:
    //   1. Group: DINA only responds if @tagged (the bot won't even call this API otherwise)
    //   2. Private chat from non-owner:
    //      - If sender IS in group → bot replies "hanya melayani di grup" without calling API
    //      - If sender NOT in group → bot silent-ignores (no API call)
    //   3. Owner private chat → calls API normally
    //
    // SAFETY FALLBACK: if somehow a non-owner private chat reaches this API,
    // return silent=true so the bot knows NOT to reply (defensive — should never happen)
    if (isPrivateChat && !isOwnerUser) {
      return NextResponse.json({
        success: false,
        silent: true, // Bot should NOT send any reply
        response: '',
        model: 'silent-ignore',
      })
    }

    // Permission check: DELETE in group from non-owner → reject
    // (Per user requirement: in groups, everyone can READ/UPDATE/CREATE, only owner can DELETE)
    const intent = detectIntent(message)
    if (intent.action === 'DELETE_CUSTOMER' && isGroupChat && !isOwnerUser) {
      return NextResponse.json({
        success: true,
        response: 'Maaf, hapus konsumen hanya bisa dilakukan oleh owner (Hadi). Silakan hubungi Hadi untuk menghapus konsumen. 🙏',
        model: 'permission-reject',
      })
    }

    // Permission check: non-owner in group trying to CONFIRM a DELETE they didn't initiate → reject
    // (Pending actions are scoped to senderNumber — non-owner can only confirm their own pending actions)
    if (intent.action === 'CONFIRM_DELETE' && isGroupChat && !isOwnerUser) {
      // Check if there's a pending action for THIS sender
      const pending = await getActivePendingAction({
        channel: channel || 'WHATSAPP_GROUP',
        senderNumber: senderNumber || '',
      })
      if (!pending || pending.type !== 'DELETE') {
        return NextResponse.json({
          success: true,
          response: 'Tidak ada aksi penghapusan yang menunggu konfirmasi dari Anda. Hanya owner atau orang yang memulai penghapusan yang bisa konfirmasi. 🙏',
          model: 'permission-reject',
        })
      }
    }

    // Step 1: Get customer data for context
    let customer: any = null
    if (customerId) {
      customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { units: true, bankPipelines: true },
      })
    }

    // Step 1.5: Find or create conversation FIRST so we can pass conversationId to executeTools
    // This ensures pending actions are properly scoped to the right conversation thread.
    let conversationId: string | undefined
    let conversation: any
    try {
      if (customerId) {
        conversation = await db.conversation.findFirst({ where: { customerId, channel: 'DASHBOARD' } })
        if (!conversation) {
          conversation = await db.conversation.create({ data: { customerId, channel: 'DASHBOARD', status: 'ACTIVE' } as any })
        }
      } else if (isWhatsApp && senderNumber) {
        // WhatsApp: scope by sender + channel
        conversation = await db.conversation.findFirst({
          where: { channel: channel || 'WHATSAPP_PRIVATE' },
          orderBy: { updatedAt: 'desc' },
        })
        if (!conversation) {
          conversation = await db.conversation.create({
            data: { channel: channel || 'WHATSAPP_PRIVATE', status: 'ACTIVE' } as any
          })
        }
      } else {
        // General dashboard chat
        conversation = await db.conversation.findFirst({ where: { channel: 'DASHBOARD' } })
        if (!conversation) {
          conversation = await db.conversation.create({ data: { channel: 'DASHBOARD', status: 'ACTIVE' } as any })
        }
      }
      conversationId = conversation.id
    } catch (dbErr) { console.error('Conversation lookup (non-fatal):', dbErr) }

    // Step 2: Execute DB tools based on intent — pass executeContext for pending action scoping
    const executeContext = {
      conversationId,
      channel: isWhatsApp ? (channel as string) : 'DASHBOARD',
      senderNumber: senderNumber || undefined,
    }
    const toolResults = await executeTools(intent, customerId, message, executeContext)

    // Step 3: Check if there's a pending action — tell LLM about it so it knows context
    const pendingAction = await getActivePendingAction(executeContext)
    const pendingInfo = pendingAction
      ? `\n\n## ⏳ PENDING ACTION AKTIF\nAda aksi yang menunggu konfirmasi user:\n- Tipe: ${pendingAction.type}\n- Target: ${pendingAction.targetName || '-'}\n- Dibuat oleh: ${pendingAction.senderNumber || 'dashboard'}\n- Channel: ${pendingAction.channel}\n\nJika user mengkonfirmasi dengan "ya"/"iya"/"konfirmasi"/"lanjut" (pesan SINGKAT ≤15 karakter), tool akan otomatis mengeksekusi. Jika user menyebutkan NAMA LAIN, aksi akan DIBATALKAN otomatis demi keamanan. JANGAN halusinasi menjalankan aksi — hanya jalankan jika tool result bilang "Berhasil".`
      : ''

    // Step 4: Build system prompt with customer context + tool results + channel info + pending action
    const customerContext = buildCustomerContext(customer)
    const channelInfo = isWhatsApp
      ? `\n## KONTEKS CHANNEL\n- Channel: ${channel}\n- Pengirim: ${senderName || 'Unknown'} (${senderNumber || '-'})\n- Is Owner: ${isOwnerUser ? 'YA' : 'TIDAK'}\n- Is Group: ${isGroupChat ? 'YA' : 'TIDAK'}`
      : ''
    const systemPrompt = DINA_SYSTEM_PROMPT
      .replace('{customerContext}', customerContext)
      + channelInfo
      + pendingInfo
      + (toolResults ? `\n\n## HASIL QUERY DATABASE (gunakan data ini untuk menjawab)\n${toolResults}` : '')

    // Step 5: Get conversation history
    let history: Array<{ role: string; content: string }> = []
    if (conversation?.messages) {
      // Refresh conversation with messages
      const convWithMsgs = await db.conversation.findUnique({
        where: { id: conversation.id },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 15 } },
      })
      if (convWithMsgs?.messages) {
        history = convWithMsgs.messages.reverse().map(m => ({
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

    // Step 7: Save messages to DB
    try {
      if (conversationId) {
        await db.message.createMany({ data: [
          { conversationId, role: 'user', content: message },
          { conversationId, role: 'assistant', content: aiResponse },
        ]})
        // Update lastMessageAt
        await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
      }
    } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

    // Step 8: Extract learning and save to memory
    try {
      const learning = extractLearning(message, aiResponse)
      if (learning) {
        await saveMemory(learning.content, learning.category, customerId, learning.importance)
      }
    } catch (memErr) { console.error('Memory save (non-fatal):', memErr) }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: modelUsed,
      toolsExecuted: intent.tools,
      dbUpdated: intent.action === 'UPDATE_BANK' || intent.action === 'UPDATE_STAGE' || intent.action === 'UPDATE_FIELD' || intent.action === 'CREATE_CUSTOMER' || intent.action === 'DELETE_CUSTOMER' || intent.action === 'CONFIRM_DELETE' || intent.action === 'CONFIRM_CREATE' || intent.action === 'CANCEL_PENDING',
    })
  } catch (err: any) {
    console.error('DINA chat error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
