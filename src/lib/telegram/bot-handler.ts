// Telegram Bot Handler — shared logic untuk RINA + DINA (dan future bots)
// Per PRD section 26 — Telegram bot plan
//
// Architecture:
// - Webhook di /api/telegram/[bot]/webhook (Vercel route, no VPS needed)
// - Bot handler parses commands + free text
// - LLM fallback via GLM-4.6 (z-ai-web-dev-sdk, hard rule 10)
// - Command + inline keyboard (menu buttons)
// - File upload handler → save to Google Drive (future)

import { db } from '@/lib/db'

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number; first_name: string; username?: string }
    chat: { id: number; type: 'private' | 'group' | 'supergroup' }
    text?: string
    document?: { file_id: string; file_name: string; mime_type: string }
    photo?: Array<{ file_id: string; width: number; height: number }>
  }
  callback_query?: {
    id: string
    from: { id: number; first_name: string }
    message: { message_id: number; chat: { id: number } }
    data: string // callback data, e.g., "menu:outstanding"
  }
}

export interface BotConfig {
  botToken: string
  botName: 'rina' | 'dina' | string
  ownerChatId: number | null // whitelist owner
}

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')

export async function handleTelegramUpdate(update: TelegramUpdate, config: BotConfig): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    // Auth: only owner can use bot (per PRD 26.9)
    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id
    const fromId = update.message?.from?.id || update.callback_query?.from?.id

    if (!chatId || !fromId) {
      return { success: false, error: 'No chat/from id' }
    }

    if (config.ownerChatId && fromId !== config.ownerChatId) {
      await sendTelegramMessage(config.botToken, chatId, '⛔ Akses ditolak. Bot ini khusus untuk owner.')
      return { success: true, response: 'Unauthorized' }
    }

    // Handle callback query (inline keyboard button)
    if (update.callback_query) {
      const data = update.callback_query.data
      const response = await handleCallback(data, config)
      await answerCallbackQuery(config.botToken, update.callback_query.id)
      await sendTelegramMessage(config.botToken, chatId, response.text, response.keyboard)
      return { success: true, response: response.text }
    }

    // Handle message
    if (update.message?.text) {
      const text = update.message.text.trim()
      const response = await handleCommand(text, config)
      await sendTelegramMessage(config.botToken, chatId, response.text, response.keyboard)
      return { success: true, response: response.text }
    }

    // Handle file upload (Task 6: save to Drive)
    if (update.message?.document || update.message?.photo) {
      const fileId = update.message.document?.file_id || update.message.photo?.[update.message.photo.length - 1]?.file_id || ''
      const fileName = update.message.document?.file_name || `photo-${Date.now()}.jpg`
      const mimeType = update.message.document?.mime_type || 'image/jpeg'
      if (!fileId) return { success: false, error: 'No file_id' }
      const result = await handleFileUpload(config, fileId, fileName, mimeType)
      await sendTelegramMessage(config.botToken, chatId, result.text)
      return { success: true, response: result.text }
    }

    return { success: true, response: 'No action' }
  } catch (err: any) {
    console.error('[telegram] handleUpdate error:', err)
    return { success: false, error: String(err?.message || err).substring(0, 200) }
  }
}

interface CommandResponse {
  text: string
  keyboard?: TelegramInlineKeyboard
}

async function handleCommand(text: string, config: BotConfig): Promise<CommandResponse> {
  const lower = text.toLowerCase()

  // /start
  if (lower === '/start' || lower === 'start') {
    return getMainMenu(config.botName)
  }

  // /help
  if (lower === '/help') {
    return {
      text: getHelpText(config.botName),
    }
  }

  // RINA commands
  if (config.botName === 'rina') {
    if (lower === '/outstanding' || lower.includes('outstanding') || lower.includes('hutang')) {
      return await getOutstanding()
    }
    if (lower === '/cashflow' || lower.includes('cashflow')) {
      return await getCashflow()
    }
    if (lower === '/stock' || lower.includes('stok') || lower.includes('low stock')) {
      return await getLowStock()
    }
    if (lower === '/memo' || lower.includes('memo')) {
      return {
        text: '📝 Untuk buat Memo, buka dashboard Finance → "Buat Memo Pengajuan". Telegram bot belum support form input kompleks.',
      }
    }
    if (lower.startsWith('/cost ')) {
      const unit = text.substring(6).trim()
      return await getUnitCost(unit)
    }
    if (lower.startsWith('/project ')) {
      const code = text.substring(9).trim()
      return await getProjectCost(code)
    }
  }

  // DINA commands
  if (config.botName === 'dina') {
    if (lower === '/berkas' || lower.includes('berkas')) {
      return {
        text: '📁 Untuk generate berkas (SK Kerja, Slip Gaji, Laporan Keuangan), buka dashboard → tab Berkas. Telegram bot belum support template picker.',
      }
    }
    if (lower === '/konsumen' || lower.includes('konsumen')) {
      return await getCustomersList()
    }
  }

  // Default: free text → LLM fallback (GLM-4.6 via z-ai direct fetch)
  return await handleFreeText(text, config.botName)
}

async function handleCallback(data: string, config: BotConfig): Promise<CommandResponse> {
  // data format: "menu:outstanding" etc
  const [type, ...rest] = data.split(':')
  const param = rest.join(':')

  if (type === 'menu') {
    if (param === 'main') return getMainMenu(config.botName)
    if (param === 'outstanding') return await getOutstanding()
    if (param === 'cashflow') return await getCashflow()
    if (param === 'stock') return await getLowStock()
    if (param === 'customers') return await getCustomersList()
  }

  return { text: 'Aksi tidak dikenal.' }
}

function getMainMenu(botName: string): CommandResponse {
  if (botName === 'rina') {
    return {
      text: '📊 *RINA — Finance Dashboard*\n\nPilih menu:',
      keyboard: {
        inline_keyboard: [
          [
            { text: '💰 Outstanding Hutang', callback_data: 'menu:outstanding' },
            { text: '📈 Cashflow', callback_data: 'menu:cashflow' },
          ],
          [
            { text: '📦 Low Stock Alert', callback_data: 'menu:stock' },
            { text: '❓ Help', callback_data: 'menu:help' },
          ],
        ],
      },
    }
  }
  // DINA
  return {
    text: '📁 *DINA — Document Assistant*\n\nPilih menu:',
    keyboard: {
      inline_keyboard: [
        [
          { text: '👥 List Konsumen', callback_data: 'menu:customers' },
          { text: '📄 Info Berkas', callback_data: 'menu:help' },
        ],
      ],
    },
  }
}

function getHelpText(botName: string): string {
  if (botName === 'rina') {
    return `*RINA — Finance AI Bot*

*Commands:*
/start — menu utama
/outstanding — hutang belum dibayar
/cashflow — cashflow 6 bulan terakhir
/stock — low stock alert
/cost A12 — biaya unit A12
/project A16 — biaya project Anjayo 16
/memo — info buat memo
/help — bantuan

*Free text:*
Ketik apa aja, RINA jawab sebisanya.`
  }
  return `*DINA — Document AI Bot*

*Commands:*
/start — menu utama
/konsumen — list konsumen
/berkas — info generate berkas
/help — bantuan

*Free text:*
Ketik apa aja, DINA jawab sebisanya.`
}

async function getOutstanding(): Promise<CommandResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://hadi-kaya-virtual-office.vercel.app'}/api/finance/dashboard`)
  const d = await res.json()
  if (!d.success) return { text: '❌ Gagal load dashboard' }

  const { kpi, outstanding } = d.data
  let text = `*OUTSTANDING HUTANG*\n\n`
  text += `Material: ${fmt(kpi.outstandingMaterial)}\n`
  text += `Upah: ${fmt(kpi.outstandingUpah)}\n`
  text += `Ops: ${fmt(kpi.outstandingOps)}\n`
  text += `*TOTAL: ${fmt(kpi.totalOutstanding)}*\n\n`
  text += `*Top 10 Penerima:*\n`
  outstanding.perPenerima.slice(0, 10).forEach((p: any, i: number) => {
    text += `${i + 1}. ${p.name} (${p.type}) — ${fmt(p.amount)}\n`
  })
  return { text }
}

async function getCashflow(): Promise<CommandResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://hadi-kaya-virtual-office.vercel.app'}/api/finance/dashboard`)
  const d = await res.json()
  if (!d.success) return { text: '❌ Gagal load dashboard' }

  const { cashflow, kpi } = d.data
  let text = `*CASHFLOW 6 BULAN*\n\n`
  text += `Bulan | Material | Upah | Ops | Total\n`
  text += `------|----------|------|-----|------\n`
  for (const c of cashflow) {
    const total = c.material + c.upah + c.ops
    text += `${c.month} | ${fmt(c.material)} | ${fmt(c.upah)} | ${fmt(c.ops)} | ${fmt(total)}\n`
  }
  text += `\n*Total Keluar Bln Ini: ${fmt(kpi.totalKeluarBlnIni)}*`
  return { text }
}

async function getLowStock(): Promise<CommandResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://hadi-kaya-virtual-office.vercel.app'}/api/finance/material?lowStock=true`)
  const d = await res.json()
  if (!d.success) return { text: '❌ Gagal load material' }

  if (d.data.length === 0) {
    return { text: '✅ Tidak ada material low stock. Semua aman!' }
  }

  let text = `*⚠️ LOW STOCK ALERT*\n\n`
  text += `${d.data.length} material perlu restock:\n\n`
  d.data.slice(0, 15).forEach((m: any, i: number) => {
    text += `${i + 1}. ${m.name}\n   Stok: ${m.stock?.quantity || 0} ${m.unitMeasure} (min: ${m.minStock})\n`
  })
  if (d.data.length > 15) {
    text += `\n...dan ${d.data.length - 15} lainnya. Lihat detail di dashboard.`
  }
  return { text }
}

async function getUnitCost(unitBlock: string): Promise<CommandResponse> {
  // Find unit by blockNumber
  const unit = await db.unit.findFirst({ where: { blockNumber: { contains: unitBlock, mode: 'insensitive' } } })
  if (!unit) return { text: `❌ Unit "${unitBlock}" tidak ditemukan` }

  // Get all material usages for this unit
  const usages = await db.materialUsage.findMany({
    where: { unitId: unit.id },
    include: { items: { include: { material: true } } },
  })
  const materialCost = usages.reduce((s, u) => s + u.items.reduce((ss, it) => ss + it.subtotal, 0), 0)

  // Get all wage payments for this unit
  const wages = await db.wagePayment.findMany({ where: { unitId: unit.id } })
  const wageCost = wages.reduce((s, w) => s + w.amount, 0)

  // Get expenses for this unit
  const expenses = await db.otherExpense.findMany({ where: { unitId: unit.id } })
  const opsCost = expenses.reduce((s, e) => s + e.amount, 0)

  const total = materialCost + wageCost + opsCost
  let text = `*BIAYA UNIT ${unit.blockNumber}*\n\n`
  text += `Material: ${fmt(materialCost)}\n`
  text += `Upah: ${fmt(wageCost)}\n`
  text += `Ops: ${fmt(opsCost)}\n`
  text += `*TOTAL: ${fmt(total)}*`
  return { text }
}

async function getProjectCost(code: string): Promise<CommandResponse> {
  const project = await db.project.findFirst({ where: { code: { equals: code, mode: 'insensitive' } } })
  if (!project) return { text: `❌ Project dengan code "${code}" tidak ditemukan` }

  const usages = await db.materialUsage.findMany({
    where: { projectId: project.id },
    include: { items: true },
  })
  const materialCost = usages.reduce((s, u) => s + u.items.reduce((ss, it) => ss + it.subtotal, 0), 0)

  const wages = await db.wagePayment.findMany({ where: { projectId: project.id } })
  const wageCost = wages.reduce((s, w) => s + w.amount, 0)

  const expenses = await db.otherExpense.findMany({ where: { projectId: project.id } })
  const opsCost = expenses.reduce((s, e) => s + e.amount, 0)

  const total = materialCost + wageCost + opsCost
  let text = `*BIAYA PROJECT ${project.name} (${project.code})*\n\n`
  text += `Material: ${fmt(materialCost)}\n`
  text += `Upah: ${fmt(wageCost)}\n`
  text += `Ops: ${fmt(opsCost)}\n`
  text += `*TOTAL: ${fmt(total)}*`
  return { text }
}

async function getCustomersList(): Promise<CommandResponse> {
  const customers = await db.customer.findMany({ take: 20, orderBy: { createdAt: 'desc' } })
  if (customers.length === 0) return { text: '📭 Belum ada konsumen terdaftar' }

  let text = `*LIST KONSUMEN (20 terbaru)*\n\n`
  customers.forEach((c, i) => {
    text += `${i + 1}. ${c.name}\n   Bank: ${c.bankName || '-'} | Stage: ${c.stage || '-'}\n`
  })
  return { text }
}

// === LLM Free Text Fallback (Task 5) ===
// GLM-4.6 via z-ai-web-dev-sdk direct fetch (hard rule 10)
const ZAI_CONFIG = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f06846fc-648f-4dd5-adc6-1033ce58ef0c',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmU4MGI1YWMtNWM2ZC00ZjEzLWJjZjctMjI0NmFlZTUxNWFjIiwiY2hhdF9pZCI6ImNoYXQtZjA2ODQ2ZmMtNjQ4Zi00ZGQ1LWFkYzYtMTAzM2NlNThlZjBjIiwicGxhdGZvcm0iOiJ6YWkifQ.owCuUI9B-Qsh-n4v2Tnhh2Ivr3I_FuwPOtXkzpSzRyk',
  userId: 'fe80b5ac-5c6d-4f13-bcf7-2246aee515ac',
}

async function callZaiChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `${ZAI_CONFIG.baseUrl}/chat/completions`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_CONFIG.apiKey}`,
    'X-Z-AI-From': 'Z',
    'X-Chat-Id': ZAI_CONFIG.chatId,
    'X-User-Id': ZAI_CONFIG.userId,
    'X-Token': ZAI_CONFIG.token,
  }
  const body = {
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`ZAI API error ${res.status}: ${errText.substring(0, 200)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function handleFreeText(text: string, botName: string): Promise<CommandResponse> {
  try {
    // Build context: finance summary
    let context = ''
    if (botName === 'rina') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://hadi-kaya-virtual-office.vercel.app'}/api/finance/dashboard`)
      const d = await res.json()
      if (d.success) {
        const { kpi, outstanding } = d.data
        context = `FINANCE CONTEXT:\n`
        context += `- Total Keluar Bln Ini: ${fmt(kpi.totalKeluarBlnIni)}\n`
        context += `- Outstanding Material: ${fmt(kpi.outstandingMaterial)}\n`
        context += `- Outstanding Upah: ${fmt(kpi.outstandingUpah)}\n`
        context += `- Outstanding Ops: ${fmt(kpi.outstandingOps)}\n`
        context += `- Total Outstanding: ${fmt(kpi.totalOutstanding)}\n`
        context += `- Top 5 Penerima: ${outstanding.perPenerima.slice(0, 5).map((p: any) => `${p.name} (${fmt(p.amount)})`).join(', ')}\n`
      }
    }

    const systemPrompt = botName === 'rina'
      ? `Kamu adalah RINA, asisten AI Finance untuk PT. Marlindo Bangun Persada (developer properti Pangkalpinang). Jawab pertanyaan owner tentang keuangan dengan singkat, jelas, pakai Bahasa Indonesia santai. Gunakan context data finance yang tersedia. Jika data tidak cukup, sarankan owner buka dashboard.\n\n${context}`
      : `Kamu adalah DINA, asisten AI Document untuk PT. Marlindo Bangun Persada. Jawab pertanyaan owner tentang berkas KPR, generate dokumen, dan status konsumen. Jawab singkat, jelas, Bahasa Indonesia santai.`

    const response = await callZaiChat(systemPrompt, text)
    return { text: response.substring(0, 4000) } // Telegram message limit
  } catch (err: any) {
    console.error('[telegram] LLM fallback error:', err)
    return {
      text: `Maaf, aku ga bisa proses pertanyaan itu sekarang. Coba /start untuk lihat menu, atau /help untuk daftar command.\n\nError: ${err?.message?.substring(0, 100) || 'unknown'}`,
    }
  }
}

// === File Upload Handler (Task 6) ===
async function handleFileUpload(config: BotConfig, fileId: string, fileName: string, mimeType: string): Promise<CommandResponse> {
  try {
    // Download file dari Telegram
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`)
    const fileInfo = await fileInfoRes.json()
    if (!fileInfo.ok) throw new Error('Failed to get file info from Telegram')

    const filePath = fileInfo.result.file_path
    const downloadUrl = `https://api.telegram.org/file/bot${config.botToken}/${filePath}`

    // Download file content
    const fileRes = await fetch(downloadUrl)
    if (!fileRes.ok) throw new Error('Failed to download file')
    const fileBuffer = Buffer.from(await fileRes.arrayBuffer())
    const fileSizeKB = Math.round(fileBuffer.length / 1024)

    // Try upload ke Google Drive (reuse existing OAuth)
    let driveUrl: string | null = null
    try {
      const { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } = await import('@/lib/google/auth')
      if (isOAuthConfigured()) {
        const connected = await isGoogleConnected()
        if (connected) {
          const drive = await getDriveClientOAuth()
          const today = new Date().toISOString().slice(0, 10)
          const folderName = `Telegram-${config.botName}-${today}`
          // Search or create folder
          const folderSearch = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
          })
          let folderId = folderSearch.data.files?.[0]?.id
          if (!folderId) {
            const folderCreate = await drive.files.create({
              requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
              fields: 'id',
            })
            folderId = folderCreate.data.id || undefined
          }
          // Upload file
          const { Readable } = await import('stream')
          const uploadRes = await drive.files.create({
            requestBody: { name: fileName, parents: folderId ? [folderId] : undefined },
            media: { mimeType, body: Readable.from(fileBuffer) },
            fields: 'id, webViewLink',
          })
          driveUrl = uploadRes.data.webViewLink || null

          // Set permission anyone with link can view
          if (uploadRes.data.id) {
            await drive.permissions.create({
              fileId: uploadRes.data.id,
              requestBody: { role: 'reader', type: 'anyone' },
            })
          }

          // Save FileRef to DB
          await db.fileRef.create({
            data: {
              kind: config.botName === 'rina' ? 'WAGE_EVIDENCE' : 'EXPENSE_PROOF',
              refId: 'telegram-upload',
              driveFileId: uploadRes.data.id || '',
              driveUrl: driveUrl || undefined,
              fileName,
              mimeType,
            },
          })
        }
      }
    } catch (driveErr: any) {
      console.error('[telegram] Drive upload error:', driveErr?.message)
    }

    if (driveUrl) {
      return {
        text: `✅ File tersimpan!\n\n📄 ${fileName}\n📦 ${fileSizeKB} KB\n🔗 ${driveUrl}`,
      }
    } else {
      return {
        text: `📎 File diterima: ${fileName} (${fileSizeKB} KB)\n\n⚠️ Upload ke Google Drive gagal (owner belum login Google atau error). Buka dashboard → connect Google Drive dulu.`,
      }
    }
  } catch (err: any) {
    console.error('[telegram] File upload error:', err)
    return { text: `❌ Gagal upload file: ${err?.message?.substring(0, 100) || 'unknown'}` }
  }
}

// === Telegram API helpers ===

interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string, keyboard?: TelegramInlineKeyboard): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  }
  if (keyboard) {
    body.reply_markup = keyboard
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('[telegram] sendMessage error:', err)
  }
}

async function answerCallbackQuery(botToken: string, callbackQueryId: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    })
  } catch (err) {
    console.error('[telegram] answerCallbackQuery error:', err)
  }
}

export async function setTelegramWebhook(botToken: string, webhookUrl: string): Promise<any> {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })
  return await res.json()
}
