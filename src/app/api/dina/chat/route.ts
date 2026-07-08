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
        // General dashboard chat — pick MOST RECENTLY ACTIVE dashboard conversation
        // (there might be multiple from different customer tabs; we want the latest)
        conversation = await db.conversation.findFirst({
          where: { channel: 'DASHBOARD' },
          orderBy: { updatedAt: 'desc' },
        })
        if (!conversation) {
          conversation = await db.conversation.create({ data: { channel: 'DASHBOARD', status: 'ACTIVE' } as any })
        }
      }
      conversationId = conversation.id
    } catch (dbErr) { console.error('Conversation lookup (non-fatal):', dbErr) }

    // Step 2: Execute DB tools based on intent — pass executeContext for pending action scoping
    // For DASHBOARD: scope by channel only (single owner, no need for conversationId scoping)
    // For WHATSAPP: scope by channel + senderNumber (so each user has own pending state)
    const executeContext = isWhatsApp
      ? {
          channel: channel as string,
          senderNumber: senderNumber || undefined,
          // No conversationId — scope by senderNumber instead
        }
      : {
          channel: 'DASHBOARD',
          // No conversationId — scope by channel only (dashboard = single owner)
        }
    const toolExecution = await executeTools(intent, customerId, message, executeContext)
    const toolResults = toolExecution.results

    // === CONTEXT RECOVERY: If SEND_FILE has no customer name, look at recent messages ===
    // User flow: "Dina minta berkas Hadi" → DINA lists files → user: "kirim yang nomor 1"
    // The "kirim yang nomor 1" has no customer name — we need to recover it from context.
    if (intent.action === 'SEND_FILE' && !intent.customerName && !customerId && conversationId) {
      try {
        const recentMsgs = await db.message.findMany({
          where: { conversationId, role: 'user' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
        // Scan recent messages for customer names
        const allCustomers = await db.customer.findMany({ select: { id: true, name: true } })
        for (const msg of recentMsgs) {
          const msgLower = msg.content.toLowerCase()
          // Find first customer whose name (first token, ≥3 chars) appears in this recent message
          const matched = allCustomers.find(c => {
            const firstToken = (c.name || '').toLowerCase().split(/\s+/)[0]
            return firstToken.length >= 3 && msgLower.includes(firstToken)
          })
          if (matched) {
            console.log(`[DINA] Context recovery: found customer "${matched.name}" from recent message`)
            // Re-run executeTools with recovered customerId
            const retryExecution = await executeTools(intent, matched.id, message, executeContext)
            // Replace toolExecution with retry (BOTH results AND directResponse)
            toolExecution.results = retryExecution.results
            toolExecution.directResponse = retryExecution.directResponse
            // CRITICAL: also update toolResults variable so file fetching code sees new results
            // (file fetching uses toolResults, not toolExecution.results)
            break
          }
        }
      } catch (ctxErr) {
        console.error('[DINA] Context recovery error (non-fatal):', ctxErr)
      }
    }

    // === FILE SENDING: If SEND_FILE was triggered, fetch files from Google Drive ===
    // The executeTools pushed `[sendFile:FILES_TO_SEND] [{...}]` to results.
    // We parse that, fetch each file from Drive, and include as base64 dataUrl in response.
    // CRITICAL: re-read toolExecution.results here (it may have been updated by context recovery)
    let filesToSend: Array<{ dataUrl: string; fileName: string; caption: string; mimeType: string }> = []
    if (intent.action === 'SEND_FILE') {
      const currentResults = toolExecution.results  // use latest (post-context-recovery)
      const filesLine = currentResults.split('\n').find(l => l.startsWith('[sendFile:FILES_TO_SEND]'))
      if (filesLine) {
        try {
          const jsonStr = filesLine.replace('[sendFile:FILES_TO_SEND] ', '').trim()
          const selectedDocs = JSON.parse(jsonStr)
          console.log(`[DINA] SEND_FILE: fetching ${selectedDocs.length} file(s) from Drive`)

          // Try to get Drive client (only works if owner has OAuth'd)
          let drive: any = null
          try {
            const { getDriveClientOAuth } = await import('@/lib/google/auth')
            drive = await getDriveClientOAuth()
          } catch (driveErr: any) {
            console.error('[DINA] Drive client error:', driveErr?.message)
          }

          if (!drive) {
            // Drive not connected — fallback: just tell user the file URL
            toolExecution.directResponse = `⚠️ Google Drive belum terhubung. Owner perlu login Google terlebih dahulu di dashboard.

File yang diminta: ${selectedDocs.map((d: any) => d.fileName).join(', ')}`
          } else {
            for (const doc of selectedDocs) {
              try {
                // Determine mimeType based on docType
                let exportMimeType: string | null = null
                let outputMimeType = 'application/pdf'
                let fileExtension = 'pdf'

                // Google Docs (sk-slip-gaji, lokasi-kerja, spr, flpp, etc.) need to be exported
                // Regular files (KTP.jpg, KK.pdf) can be downloaded directly
                const isGoogleDocType = ['sk-slip-gaji', 'lokasi-kerja', 'spr', 'flpp', 'ajb', 'bphtb', 'notaris'].includes(doc.docType)

                let buffer: Buffer
                let finalFileName = doc.fileName

                if (isGoogleDocType) {
                  // Export as PDF
                  const exportRes = await drive.files.export({
                    fileId: doc.docId,
                    mimeType: 'application/pdf',
                  }, { responseType: 'arraybuffer' })
                  buffer = Buffer.from(exportRes.data as ArrayBuffer)
                  finalFileName = (doc.fileName || 'document') + '.pdf'
                } else {
                  // Download directly (for uploaded files like KTP.jpg, KK.pdf)
                  const downloadRes = await drive.files.get({
                    fileId: doc.docId,
                    alt: 'media',
                  }, { responseType: 'arraybuffer' })
                  buffer = Buffer.from(downloadRes.data as ArrayBuffer)

                  // Get file metadata for mimetype
                  const meta = await drive.files.get({ fileId: doc.docId, fields: 'name,mimeType' })
                  outputMimeType = meta.data.mimeType || 'application/octet-stream'
                  finalFileName = meta.data.name || doc.fileName
                }

                // Convert to base64 data URL
                const base64 = buffer.toString('base64')
                const dataUrl = `data:${outputMimeType};base64,${base64}`

                // Build caption
                const docTypeLabel: Record<string, string> = {
                  'sk-slip-gaji': 'SK Kerja + Slip Gaji',
                  'lokasi-kerja': 'Lokasi Kerja',
                  'spr': 'SPR', 'flpp': 'FLPP', 'ajb': 'AJB', 'bphtb': 'BPHTB',
                  'notaris': 'Notaris', 'ktp': 'KTP', 'kk': 'KK', 'npwp': 'NPWP', 'sertifikat': 'Sertifikat',
                }
                const label = docTypeLabel[doc.docType] || doc.docType
                const caption = `📄 ${label} — ${finalFileName}`

                filesToSend.push({ dataUrl, fileName: finalFileName, caption, mimeType: outputMimeType })
              } catch (fileErr: any) {
                console.error(`[DINA] Failed to fetch file ${doc.docId}:`, fileErr?.message)
              }
            }

            if (filesToSend.length > 0) {
              toolExecution.directResponse = `✅ Berhasil mengambil ${filesToSend.length} berkas dari Google Drive. File terlampir. 📄`
            } else if (!toolExecution.directResponse) {
              toolExecution.directResponse = `❌ GAGAL mengambil berkas dari Google Drive. Cek log untuk detail.`
            }
          }
        } catch (parseErr) {
          console.error('[DINA] Failed to parse FILES_TO_SEND:', parseErr)
        }
      }
    }

    // === CRITICAL: If executeTools returned a directResponse, BYPASS the LLM call entirely.
    // This prevents hallucinations on critical operations (DELETE, CONFIRM, CANCEL).
    // The LLM (especially Nemotron fallback) tends to hallucinate "Berhasil menghapus X"
    // even when no delete actually happened. Direct response = tool result = truth.
    if (toolExecution.directResponse) {
      const aiResponseDirect = toolExecution.directResponse
      console.log(`[DINA] directResponse bypass: action=${intent.action}, response="${aiResponseDirect.substring(0, 80)}..."`)

      // Save messages to DB (for history continuity)
      try {
        if (conversationId) {
          await db.message.createMany({ data: [
            { conversationId, role: 'user', content: message },
            { conversationId, role: 'assistant', content: aiResponseDirect },
          ]})
          await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
        }
      } catch (dbErr) { console.error('DB save (non-fatal):', dbErr) }

      // Auto-save memory DISABLED — was creating low-quality "User bertanya:" memories
      // Memory should be manually curated with Title + Description + Resolution
      // Use chat command "nah tambahin nih ke memory kamu" or Tab Memory UI to add

      return NextResponse.json({
        success: true,
        response: aiResponseDirect,
        model: 'direct-bypass',
        toolsExecuted: intent.tools,
        files: filesToSend,  // For WA bot to send via sendFile()
        dbUpdated: intent.action === 'UPDATE_BANK' || intent.action === 'UPDATE_STAGE' || intent.action === 'UPDATE_FIELD' || intent.action === 'CREATE_CUSTOMER' || intent.action === 'DELETE_CUSTOMER' || intent.action === 'CONFIRM_DELETE' || intent.action === 'CONFIRM_CREATE' || intent.action === 'CANCEL_PENDING',
      })
    }

    // Step 3: Auto-query memory + skills for context (inject into system prompt)
    const dinaAgent = await db.agent.findFirst({ where: { name: 'Dina' } }).catch(() => null)
    const [relevantMemories, relevantSkills] = await Promise.all([
      db.memory.findMany({
        where: { isActive: true, OR: [{ agentId: dinaAgent?.id }, { memoryType: 'umum' }] },
        orderBy: { importance: 'desc' },
        take: 15,
        select: { title: true, content: true, resolution: true, category: true, memoryType: true },
      }).catch(() => []),
      db.skill.findMany({
        where: { isActive: true, OR: [{ agentId: dinaAgent?.id }, { agentId: null }] },
        select: { displayName: true, prompt: true, category: true },
      }).catch(() => []),
    ])

    const memoryContext = relevantMemories.length > 0
      ? `\n\n## 🧠 MEMORY DINA (pelajaran dari masa lalu)\n${relevantMemories.map(m => `- **${m.title || m.content.substring(0, 40)}**: ${m.content}${m.resolution ? `\n  Resolusi: ${m.resolution.substring(0, 150)}` : ''}`).join('\n')}`
      : ''
    const skillContext = relevantSkills.length > 0
      ? `\n\n## ⚡ SKILLS DINA (kemampuan yang dimiliki)\n${relevantSkills.map(s => `- **${s.displayName}**: ${s.prompt.substring(0, 100)}...`).join('\n')}`
      : ''

    // Step 3b: Check if there's a pending action — tell LLM about it so it knows context
    const pendingAction = await getActivePendingAction(executeContext)
    const pendingInfo = pendingAction
      ? `\n\n## ⏳ PENDING ACTION AKTIF\nAda aksi yang menunggu konfirmasi user:\n- Tipe: ${pendingAction.type}\n- Target: ${pendingAction.targetName || '-'}\n- Dibuat oleh: ${pendingAction.senderNumber || 'dashboard'}\n- Channel: ${pendingAction.channel}\n\nJika user mengkonfirmasi dengan "ya"/"iya"/"konfirmasi"/"lanjut" (pesan SINGKAT ≤15 karakter), tool akan otomatis mengeksekusi. Jika user menyebutkan NAMA LAIN, aksi akan DIBATALKAN otomatis demi keamanan. JANGAN halusinasi menjalankan aksi — hanya jalankan jika tool result bilang "Berhasil".`
      : ''

    // Step 4: Build system prompt with customer context + tool results + channel info + pending action + memory + skills
    const customerContext = buildCustomerContext(customer)
    const channelInfo = isWhatsApp
      ? `\n## KONTEKS CHANNEL\n- Channel: ${channel}\n- Pengirim: ${senderName || 'Unknown'} (${senderNumber || '-'})\n- Is Owner: ${isOwnerUser ? 'YA' : 'TIDAK'}\n- Is Group: ${isGroupChat ? 'YA' : 'TIDAK'}`
      : ''
    const systemPrompt = DINA_SYSTEM_PROMPT
      .replace('{customerContext}', customerContext)
      + channelInfo
      + memoryContext
      + skillContext
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
    // Auto-save memory DISABLED — use manual curation with Title + Description + Resolution

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: modelUsed,
      toolsExecuted: intent.tools,
      files: filesToSend,  // Empty array if not SEND_FILE (for WA bot consistency)
      dbUpdated: intent.action === 'UPDATE_BANK' || intent.action === 'UPDATE_STAGE' || intent.action === 'UPDATE_FIELD' || intent.action === 'CREATE_CUSTOMER' || intent.action === 'DELETE_CUSTOMER' || intent.action === 'CONFIRM_DELETE' || intent.action === 'CONFIRM_CREATE' || intent.action === 'CANCEL_PENDING',
    })
  } catch (err: any) {
    console.error('DINA chat error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
