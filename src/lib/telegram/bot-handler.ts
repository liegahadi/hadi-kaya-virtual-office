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

    // Handle file upload (future: save to Drive)
    if (update.message?.document || update.message?.photo) {
      await sendTelegramMessage(config.botToken, chatId, '📎 File diterima. Upload ke Google Drive akan datang di iterasi berikutnya.')
      return { success: true }
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

  // Default: free text → suggest menu
  return {
    text: `Halo! Aku ${config.botName.toUpperCase()} bot.\n\nKetik /start untuk lihat menu, atau /help untuk daftar command.\n\nAtau coba:\n${config.botName === 'rina' ? '/outstanding — lihat hutang belum dibayar\n/cashflow — ringkasan kas keluar\n/stock — low stock alert\n/cost A12 — biaya unit A12' : '/konsumen — list konsumen\n/berkas — info generate berkas'}`,
  }
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
