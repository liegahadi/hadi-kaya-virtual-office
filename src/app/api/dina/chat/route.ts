// POST /api/dina/chat
// DINA AI Assistant v3 — Function Calling Architecture
// ============================================================
// Flow:
// 1. Build context: conversation history (15 messages) + customer context + memory + skills
// 2. Call LLM (Gemini 2.0 Flash primary, OpenRouter fallback) with 10 tools (functionDeclarations)
// 3. If LLM returns function call → execute tool → return result to LLM → LLM generates natural response
// 4. If LLM returns text directly → return as response
// 5. NO REGEX for intent detection (regex code in dina-tools.ts kept as legacy fallback, NOT used)
// 6. NO directResponse bypass EXCEPT for:
//    - Permission rejects (DELETE in group from non-owner)
//    - Pending action confirmation (user types "ya"/"batal")
// 7. Handle file uploads: chat UI sends file info → pass to LLM → LLM decides what to do
//
// CRITICAL FIXES (v3):
// - Anti-hallucination: tool result is truth. If tool says "GAGAL", DINA says "GAGAL".
// - PendingAction persisted in DB (PendingAction table) — survives Vercel cold starts
// - File sending: tool returns [sendFile:UPLOADED_DOC] or [sendFile:GOOGLE_DOC] marker
//   → chat route parses marker, fetches file content, attaches to response
// - Multi-provider fallback: Gemini → OpenRouter (auto-rotation on rate limit/timeout)
// - Multi-account key rotation via comma-separated env vars (GEMINI_API_KEYS, OPENROUTER_API_KEYS)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DINA_SYSTEM_PROMPT, buildCustomerContext } from '@/lib/agents/dina-knowledge'
import { DINA_TOOLS_V3, executeDinaTool, checkPendingConfirmation, executeConfirmedAction } from '@/lib/agents/dina-tools-v3'
import { callLLMWithTools, appendToolResult, type LLMMessage } from '@/lib/agents/llm-router'
import { getSessionContext, updateSessionContext, needsTraceback, resolveReference } from '@/lib/agents/session-context'
import { getActivePendingAction } from '@/lib/agents/dina-tools'

export const runtime = 'nodejs'
export const maxDuration = 60  // 60s for function calling round trips (Gemini → tool → Gemini)

// ============================================================
// Helper: fetch GoogleDoc file content from Drive as dataUrl
// ============================================================
async function fetchGoogleDocAsDataUrl(docId: string, fileName: string): Promise<{ dataUrl: string; mimeType: string; fileName: string } | null> {
  try {
    const { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } = await import('@/lib/google/auth')
    if (!isOAuthConfigured() || !(await isGoogleConnected())) return null
    const drive: any = await getDriveClientOAuth()

    // Try to export as PDF (Google Doc format)
    let buffer: Buffer
    let mimeType = 'application/pdf'
    let finalFileName = fileName
    try {
      const exportRes = await drive.files.export({ fileId: docId, mimeType: 'application/pdf' }, { responseType: 'arraybuffer' })
      buffer = Buffer.from(exportRes.data as ArrayBuffer)
      finalFileName = (fileName || 'document') + '.pdf'
    } catch {
      // Not a Google Doc — download directly (regular file in Drive)
      const downloadRes = await drive.files.get({ fileId: docId, alt: 'media' }, { responseType: 'arraybuffer' })
      buffer = Buffer.from(downloadRes.data as ArrayBuffer)
      const meta = await drive.files.get({ fileId: docId, fields: 'name,mimeType' })
      mimeType = meta.data.mimeType || 'application/octet-stream'
      finalFileName = meta.data.name || fileName
    }

    const base64 = buffer.toString('base64')
    return { dataUrl: `data:${mimeType};base64,${base64}`, mimeType, fileName: finalFileName }
  } catch (err: any) {
    console.error('[dina-v3] Failed to fetch GoogleDoc:', err?.message)
    return null
  }
}

// ============================================================
// MAIN POST HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { message, customerId: _customerId, channel, senderNumber, senderName, isOwner, fileInfo } = await req.json()
    let customerId: string | undefined = _customerId
    if (!message) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 })

    // Determine channel context
    const isWhatsApp = channel === 'WHATSAPP_GROUP' || channel === 'WHATSAPP_PRIVATE'
    const isGroupChat = channel === 'WHATSAPP_GROUP'
    const isPrivateChat = channel === 'WHATSAPP_PRIVATE'
    const isOwnerUser = isOwner || (!isWhatsApp)

    const executeContext = {
      channel: (isWhatsApp ? channel : 'DASHBOARD') as string,
      senderNumber: isWhatsApp ? (senderNumber || undefined) : undefined,
    }

    // === WHATSAPP BEHAVIOR (same as v2 — enforced by WA bot upstream) ===
    // SAFETY FALLBACK: silent-ignore non-owner private chat
    if (isPrivateChat && !isOwnerUser) {
      return NextResponse.json({
        success: false, silent: true, response: '', model: 'silent-ignore',
      })
    }

    // === PERMISSION CHECK 1: DELETE in group from non-owner ===
    // Detect "hapus" / "delete" intent before LLM call (only for group non-owner)
    const msgLower = message.toLowerCase().trim()
    const isDeleteIntent = /^(hapus|delete|hps)\b/.test(msgLower) || (msgLower.includes('hapus konsumen') && msgLower.length < 80)
    if (isDeleteIntent && isGroupChat && !isOwnerUser) {
      return NextResponse.json({
        success: true,
        response: 'Maaf, hapus konsumen hanya bisa dilakukan oleh owner (Hadi). Silakan hubungi Hadi untuk menghapus konsumen. 🙏',
        model: 'permission-reject',
      })
    }

    // === PERMISSION CHECK 2: CONFIRM_DELETE in group from non-owner without their pending ===
    const isConfirmKeyword = /^(ya|iya|yes|y|konfirmasi|lanjut|ok|oke|setuju|batal|tidak|jangan|cancel|no)\b/.test(msgLower) && msgLower.length <= 25
    if (isConfirmKeyword && isGroupChat && !isOwnerUser) {
      const pending = await getActivePendingAction(executeContext)
      if (!pending || pending.type !== 'DELETE') {
        return NextResponse.json({
          success: true,
          response: 'Tidak ada aksi penghapusan yang menunggu konfirmasi dari Anda. Hanya owner atau orang yang memulai penghapusan yang bisa konfirmasi. 🙏',
          model: 'permission-reject',
        })
      }
    }

    // === PENDING ACTION CONFIRMATION (bypass LLM for speed + reliability) ===
    // If user types short "ya" / "batal" and there's an active pending action, execute directly.
    // This avoids LLM hallucination on simple confirmations.
    if (isConfirmKeyword) {
      const confirmation = await checkPendingConfirmation(message, executeContext)
      if (confirmation.type === 'confirm' && confirmation.pendingAction) {
        console.log('[dina-v3] Direct confirmation bypass for pending action')
        const result = await executeConfirmedAction(confirmation.pendingAction, executeContext)

        // Save to DB + update session
        let conversationId: string | undefined
        try {
          conversationId = await getOrCreateConversation({ customerId, isWhatsApp, channel, senderNumber })
          if (conversationId) {
            await db.message.createMany({ data: [
              { conversationId, role: 'user', content: message },
              { conversationId, role: 'assistant', content: result },
            ]})
            await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
          }
        } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

        return NextResponse.json({
          success: true,
          response: result,
          model: 'pending-confirm-bypass',
          dbUpdated: true,
        })
      } else if (confirmation.type === 'cancel' && confirmation.pendingAction) {
        console.log('[dina-v3] Direct cancel bypass for pending action')
        const { cancelPendingAction } = await import('@/lib/agents/dina-tools')
        await cancelPendingAction(executeContext)
        const cancelMsg = `✅ Aksi pending (${confirmation.pendingAction.type}${confirmation.pendingAction.targetName ? ' ' + confirmation.pendingAction.targetName : ''}) telah dibatalkan. Tidak ada perubahan yang dilakukan di database.`

        let conversationId: string | undefined
        try {
          conversationId = await getOrCreateConversation({ customerId, isWhatsApp, channel, senderNumber })
          if (conversationId) {
            await db.message.createMany({ data: [
              { conversationId, role: 'user', content: message },
              { conversationId, role: 'assistant', content: cancelMsg },
            ]})
            await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
          }
        } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

        return NextResponse.json({
          success: true,
          response: cancelMsg,
          model: 'pending-cancel-bypass',
          dbUpdated: false,
        })
      }
    }

    // === Step 1: Get customer data for context ===
    let customer: any = null
    if (customerId) {
      customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { units: true, bankPipelines: true },
      })
    }

    // === Step 1.5: Get or create conversation ===
    const conversationId = await getOrCreateConversation({ customerId, isWhatsApp, channel, senderNumber })

    // === Step 2: Session Context + Traceback (resolve "yang tadi", "dia", etc) ===
    let sessionContextData: any = null
    let tracebackInfo: string | null = null
    try {
      if (conversationId && needsTraceback(message)) {
        const sessionCtx = await getSessionContext({
          conversationId,
          channel: isWhatsApp ? (channel as string) : 'DASHBOARD',
          senderNumber: isWhatsApp ? (senderNumber || undefined) : undefined,
        })
        if (sessionCtx && sessionCtx.lastCustomerId) {
          sessionContextData = sessionCtx
          if (!customerId && sessionCtx.lastCustomerId) {
            customerId = sessionCtx.lastCustomerId
            customer = await db.customer.findUnique({
              where: { id: sessionCtx.lastCustomerId },
              include: { units: true, bankPipelines: true },
            }).catch(() => null)
          }
        } else {
          const resolution = await resolveReference({
            conversationId,
            channel: isWhatsApp ? (channel as string) : 'DASHBOARD',
            senderNumber: isWhatsApp ? (senderNumber || undefined) : undefined,
            userMessage: message,
          })
          if (resolution.resolved && resolution.customerId) {
            if (!customerId) {
              customerId = resolution.customerId
              customer = await db.customer.findUnique({
                where: { id: resolution.customerId },
                include: { units: true, bankPipelines: true },
              }).catch(() => null)
            }
            tracebackInfo = `[TRACEBACK via ${resolution.source}, confidence ${(resolution.confidence * 100).toFixed(0)}%] Resolved to: ${resolution.customerName || customerId}`
          }
        }
      }
    } catch (ctxErr) { console.error('Session context (non-fatal):', ctxErr) }

    // === Step 3: Build context (conversation history + memory + skills + customer + channel) ===
    // Get conversation history (last 15 messages)
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    try {
      if (conversationId) {
        const convWithMsgs = await db.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 15 } },
        })
        if (convWithMsgs?.messages) {
          history = convWithMsgs.messages.reverse().map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          }))
        }
      }
    } catch (dbErr) { console.error('History fetch (non-fatal):', dbErr) }

    // Get DINA agent ID for skills query
    const dinaAgent = await db.agent.findFirst({ where: { name: 'Dina' } }).catch(() => null)
    const relevantSkills = await db.skill.findMany({
      where: { isActive: true, OR: [{ agentId: dinaAgent?.id }, { agentId: null }] },
      select: { displayName: true, prompt: true, category: true },
      take: 10,
    }).catch(() => [])

    // Get relevant memories (simple keyword-based retrieval)
    const memories = await db.memory.findMany({
      where: { isActive: true, OR: [{ category: 'UTAMA' }, { category: 'DECISION' }, { category: 'BERKAS' }] },
      orderBy: { importance: 'desc' },
      take: 10,
    }).catch(() => [])

    // Get pending action (if any) for context
    const pendingAction = await getActivePendingAction(executeContext).catch(() => null)

    // === Step 4: Build messages array ===
    const customerContext = buildCustomerContext(customer)
    const channelInfo = isWhatsApp
      ? `\n## KONTEKS CHANNEL\n- Channel: ${channel}\n- Pengirim: ${senderName || 'Unknown'} (${senderNumber || '-'})\n- Is Owner: ${isOwnerUser ? 'YA' : 'TIDAK'}\n- Is Group: ${isGroupChat ? 'YA' : 'TIDAK'}`
      : ''
    const memoryContext = memories.length > 0
      ? `\n\n## 🧠 MEMORY DINA (${memories.length} items)\n${memories.map(m => `- [${m.category}] (importance: ${m.importance}) ${m.content.substring(0, 150)}`).join('\n')}`
      : ''
    const skillContext = relevantSkills.length > 0
      ? `\n\n## ⚡ SKILLS DINA (${relevantSkills.length} skills)\n${relevantSkills.map(s => `- **${s.displayName}**: ${s.prompt.substring(0, 100)}`).join('\n')}`
      : ''
    const pendingInfo = pendingAction
      ? `\n\n## ⏳ PENDING ACTION AKTIF\nAda aksi yang menunggu konfirmasi user:\n- Tipe: ${pendingAction.type}\n- Target: ${pendingAction.targetName || '-'}\n- Dibuat oleh: ${pendingAction.senderNumber || 'dashboard'}\n- Channel: ${pendingAction.channel}\n\nJika user mengkonfirmasi dengan "ya"/"iya"/"konfirmasi"/"lanjut" (pesan SINGKAT ≤25 karakter), sistem akan otomatis mengeksekusi. Jika user menyebutkan NAMA LAIN, aksi akan DIBATALKAN otomatis. JANGAN halusinasi menjalankan aksi — hanya jalankan jika tool result bilang "Berhasil".`
      : ''
    const tracebackContext = tracebackInfo
      ? `\n\n## 🔍 TRACEBACK INFO\n${tracebackInfo}`
      : ''

    // Build fileInfo context if user uploaded a file
    const fileInfoContext = fileInfo
      ? `\n\n## 📎 FILE UPLOAD INFO\nUser mengirim file via chat:\n- FileName: ${fileInfo.fileName || 'unknown'}\n- MimeType: ${fileInfo.mimeType || 'unknown'}\n- Size: ${fileInfo.size || 'unknown'} bytes\n\nFile ini SUDAH tersimpan di backend (bisa diakses di Customer.uploadedDocs untuk konsumen aktif). Jika user menanyakan file ini atau ingin upload ke slot konsumen, gunakan tool upload_berkas.`
      : ''

    const systemPrompt = DINA_SYSTEM_PROMPT
      .replace('{customerContext}', customerContext)
      + channelInfo
      + memoryContext
      + skillContext
      + pendingInfo
      + tracebackContext
      + fileInfoContext

    // Build messages array for LLM
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: fileInfo ? `${message}\n\n[📎 User attached file: ${fileInfo.fileName || 'unknown'}]` : message },
    ]

    // === Step 5: Call LLM with function calling (multi-round if needed) ===
    let aiResponse = ''
    let modelUsed = 'gemini-2.0-flash'
    let filesToSend: Array<{ dataUrl: string; fileName: string; caption: string; mimeType: string }> = []
    let dbUpdated = false
    let toolsExecuted: string[] = []
    const MAX_TOOL_ROUNDS = 5  // safety limit

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        console.log(`[dina-v3] Round ${round + 1}: calling LLM with ${DINA_TOOLS_V3.length} tools`)
        const llmResult = await callLLMWithTools(messages, DINA_TOOLS_V3, {
          temperature: 0.7,
          maxTokens: 2048,
        })
        modelUsed = llmResult.model

        if (llmResult.toolCalls.length === 0) {
          // LLM replied with text — done
          aiResponse = llmResult.text || 'Maaf, saya tidak bisa merespons saat ini.'
          break
        }

        // Execute each tool call and append result to messages
        for (const toolCall of llmResult.toolCalls) {
          console.log(`[dina-v3] Tool call: ${toolCall.name}(${JSON.stringify(toolCall.args).substring(0, 200)})`)
          toolsExecuted.push(toolCall.name)

          // Pass customerId if tool needs it and user has it in context
          const enrichedArgs = { ...toolCall.args }
          if (!enrichedArgs.customerId && customerId && ['upload_berkas', 'generate_sk_kerja', 'generate_slip_gaji', 'generate_laporan_keuangan', 'get_customer_status', 'update_customer_field', 'delete_customer', 'send_file'].includes(toolCall.name)) {
            enrichedArgs.customerId = customerId
          }

          const toolResult = await executeDinaTool(toolCall.name, enrichedArgs, executeContext)

          // Detect file-sending markers in tool result
          if (toolResult.includes('[sendFile:UPLOADED_DOC]')) {
            try {
              const jsonStr = toolResult.split('[sendFile:UPLOADED_DOC]')[1].split('\n')[0].trim()
              const fileMeta = JSON.parse(jsonStr)
              // Get full dataUrl from DB
              const cust = await db.customer.findUnique({ where: { id: fileMeta.customerId }, select: { uploadedDocs: true } })
              if (cust?.uploadedDocs) {
                const allDocs = JSON.parse(cust.uploadedDocs)
                const dataUrl = allDocs[fileMeta.fileType]
                if (dataUrl) {
                  const mimeType = dataUrl.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
                  filesToSend.push({
                    dataUrl,
                    fileName: `${fileMeta.fileType}_${fileMeta.customerName}.${mimeType.split('/')[1] || 'bin'}`,
                    caption: `📄 ${fileMeta.fileType} — ${fileMeta.customerName}`,
                    mimeType,
                  })
                }
              }
            } catch (parseErr) { console.error('[dina-v3] sendFile parse error:', parseErr) }
          } else if (toolResult.includes('[sendFile:GOOGLE_DOC]')) {
            try {
              const jsonStr = toolResult.split('[sendFile:GOOGLE_DOC]')[1].split('\n')[0].trim()
              const fileMeta = JSON.parse(jsonStr)
              const fetched = await fetchGoogleDocAsDataUrl(fileMeta.docId, fileMeta.fileName)
              if (fetched) {
                filesToSend.push({
                  dataUrl: fetched.dataUrl,
                  fileName: fetched.fileName,
                  caption: `📄 ${fileMeta.docType} — ${fileMeta.customerName}`,
                  mimeType: fetched.mimeType,
                })
              }
            } catch (parseErr) { console.error('[dina-v3] GoogleDoc send parse error:', parseErr) }
          }

          // Track if DB was updated
          if (['create_customer', 'update_customer_field', 'delete_customer'].includes(toolCall.name)) {
            dbUpdated = true
          }

          // Append tool result to messages for next LLM round
          appendToolResult(messages, toolCall, toolResult)
        }

        // Loop continues — LLM will get tool results and decide next step
      }

      if (!aiResponse) {
        // Safety: if we hit MAX_TOOL_ROUNDS without text reply, force a final text response
        console.warn('[dina-v3] Hit MAX_TOOL_ROUNDS, forcing final text response')
        const finalResult = await callLLMWithTools(messages, [], {  // no tools → forces text reply
          temperature: 0.5,
          maxTokens: 1024,
        })
        aiResponse = finalResult.text || 'Maaf, saya tidak bisa menyelesaikan permintaan ini. Coba lagi ya.'
      }
    } catch (llmErr: any) {
      console.error('[dina-v3] LLM call failed:', llmErr?.message)
      aiResponse = `Maaf, saya lagi ada gangguan teknis (${llmErr?.message?.substring(0, 80) || 'unknown error'}). Coba lagi ya. 😅`
      modelUsed = 'error-fallback'
    }

    // === Step 6: Save messages to DB ===
    try {
      if (conversationId) {
        await db.message.createMany({ data: [
          { conversationId, role: 'user', content: message },
          { conversationId, role: 'assistant', content: aiResponse },
        ]})
        await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
      }
    } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

    // === Step 7: Update session context (auto-renew 48h TTL) ===
    try {
      const sessionUpdates: any = {
        lastIntent: toolsExecuted[0] || 'CHAT',
        lastTopic: message.substring(0, 200),
      }
      if (customerId) {
        sessionUpdates.lastCustomerId = customerId
        if (customer?.name) sessionUpdates.lastCustomerName = customer.name
      }
      if (conversationId) {
        await updateSessionContext({
          conversationId,
          channel: isWhatsApp ? (channel as string) : 'DASHBOARD',
          senderNumber: isWhatsApp ? (senderNumber || undefined) : undefined,
        }, sessionUpdates)
      }
    } catch (sessErr) { console.error('Session update (non-fatal):', sessErr) }

    // === Step 8: Return response ===
    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: modelUsed,
      toolsExecuted,
      files: filesToSend,  // For WA bot to send via sendFile()
      dbUpdated,
      tracebackInfo,
    })
  } catch (err: any) {
    console.error('DINA chat v3 error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}

// ============================================================
// Helper: get or create conversation
// ============================================================
async function getOrCreateConversation(opts: {
  customerId?: string
  isWhatsApp: boolean
  channel?: string
  senderNumber?: string
}): Promise<string | undefined> {
  try {
    const { customerId, isWhatsApp, channel, senderNumber } = opts
    let conversation: any
    if (customerId) {
      conversation = await db.conversation.findFirst({ where: { customerId, channel: 'DASHBOARD' } })
      if (!conversation) {
        conversation = await db.conversation.create({ data: { customerId, channel: 'DASHBOARD', status: 'ACTIVE' } as any })
      }
    } else if (isWhatsApp && senderNumber) {
      conversation = await db.conversation.findFirst({
        where: { channel: channel || 'WHATSAPP_PRIVATE', senderNumber },
        orderBy: { updatedAt: 'desc' },
      })
      if (!conversation) {
        conversation = await db.conversation.create({
          data: { channel: channel || 'WHATSAPP_PRIVATE', senderNumber, status: 'ACTIVE' } as any
        })
      }
    } else {
      conversation = await db.conversation.findFirst({
        where: { channel: 'DASHBOARD' },
        orderBy: { updatedAt: 'desc' },
      })
      if (!conversation) {
        conversation = await db.conversation.create({ data: { channel: 'DASHBOARD', status: 'ACTIVE' } as any })
      }
    }
    return conversation?.id
  } catch (dbErr) {
    console.error('Conversation lookup (non-fatal):', dbErr)
    return undefined
  }
}
