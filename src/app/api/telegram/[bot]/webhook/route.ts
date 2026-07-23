// POST /api/telegram/[bot]/webhook
// Vercel webhook receiver untuk Telegram bot updates
// Per PRD section 26.5 — webhook di Vercel, no VPS needed
import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramUpdate, setTelegramWebhook, type BotConfig } from '@/lib/telegram/bot-handler'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Bot token mapping — read from env vars
function getBotConfig(bot: string): BotConfig | null {
  const botMap: Record<string, { token: string; name: string }> = {
    rina: { token: process.env.TELEGRAM_RINA_TOKEN || '', name: 'rina' },
    dina: { token: process.env.TELEGRAM_DINA_TOKEN || '', name: 'dina' },
  }

  const config = botMap[bot.toLowerCase()]
  if (!config || !config.token) return null

  return {
    botToken: config.token,
    botName: config.name,
    ownerChatId: process.env.TELEGRAM_OWNER_CHAT_ID ? parseInt(process.env.TELEGRAM_OWNER_CHAT_ID) : null,
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ bot: string }> }) {
  try {
    const { bot } = await params
    const config = getBotConfig(bot)

    if (!config) {
      return NextResponse.json({ success: false, error: `Bot "${bot}" not configured. Set TELEGRAM_${bot.toUpperCase()}_TOKEN env var.` }, { status: 404 })
    }

    const update = await req.json()
    const result = await handleTelegramUpdate(update, config)

    return NextResponse.json({ success: result.success, response: result.response, error: result.error })
  } catch (err: any) {
    console.error('[telegram webhook] error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 200) }, { status: 500 })
  }
}

// GET endpoint untuk setup webhook (call once after deploy)
// Usage: /api/telegram/rina/webhook?action=setup
export async function GET(req: NextRequest, { params }: { params: Promise<{ bot: string }> }) {
  try {
    const { bot } = await params
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    const config = getBotConfig(bot)
    if (!config) {
      return NextResponse.json({ success: false, error: `Bot "${bot}" not configured` }, { status: 404 })
    }

    if (action === 'setup') {
      // Set webhook URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host')}`
      const webhookUrl = `${baseUrl}/api/telegram/${bot}/webhook`
      const result = await setTelegramWebhook(config.botToken, webhookUrl)
      return NextResponse.json({ success: true, data: { webhookUrl, result } })
    }

    if (action === 'info') {
      // Get bot info
      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`)
      const info = await res.json()
      return NextResponse.json({ success: true, data: info })
    }

    return NextResponse.json({
      success: true,
      message: `Telegram bot "${bot}" webhook endpoint. Use ?action=setup to set webhook, ?action=info to get bot info.`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 200) }, { status: 500 })
  }
}
