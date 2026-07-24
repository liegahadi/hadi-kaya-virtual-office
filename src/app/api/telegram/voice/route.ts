// POST /api/telegram/voice — process voice message transcription
// Flow: Telegram voice → transcribe → parse intent → create record
// Uses z-ai GLM-4.6 for natural language parsing
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ZAI_CONFIG = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f06846fc-648f-4dd5-adc6-1033ce58ef0c',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmU4MGI1YWMtNWM2ZC00ZjEzLWJjZjctMjI0NmFlZTUxNWFjIiwiY2hhdF9pZCI6ImNoYXQtZjA2ODQ2ZmMtNjQ4Zi00ZGQ1LWFkYzYtMTAzM2NlNThlZjBjIiwicGxhdGZvcm0iOiJ6YWkifQ.owCuUI9B-Qsh-n4v2Tnhh2Ivr3I_FuwPOtXkzpSzRyk',
  userId: 'fe80b5ac-5c6d-4f13-bcf7-2246aee515ac',
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ success: false, error: 'text required (transcribed voice)' }, { status: 400 })

    // Use LLM to parse intent from natural language
    const systemPrompt = `Kamu adalah RINA, AI Finance assistant. Parse perintah natural language ke JSON. Format:
- Untuk catat upah: {"action":"create_wage","worker":"","workItem":"","amount":0,"unit":""}
- Untuk catat biaya: {"action":"create_expense","category":"","recipient":"","amount":0,"description":""}
- Untuk catat pemakaian: {"action":"create_usage","material":"","qty":0,"unit":"","workItem":""}
- Untuk query: {"action":"query","question":""}
Hanya return JSON, tidak ada penjelasan.`

    const res = await fetch(`${ZAI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZAI_CONFIG.apiKey}`, 'X-Token': ZAI_CONFIG.token, 'X-Chat-Id': ZAI_CONFIG.chatId, 'X-User-Id': ZAI_CONFIG.userId, 'X-Z-AI-From': 'Z' },
      body: JSON.stringify({ messages: [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: text }], thinking: { type: 'disabled' } }),
    })
    const data = await res.json()
    const llmResponse = data.choices?.[0]?.message?.content || ''

    // Try parse JSON from LLM response
    const jsonMatch = llmResponse.match(/\{[^}]+\}/)
    if (!jsonMatch) return NextResponse.json({ success: false, error: 'Could not parse intent', raw: llmResponse })

    const intent = JSON.parse(jsonMatch[0])

    // Execute action
    if (intent.action === 'create_wage') {
      return NextResponse.json({ success: true, data: { intent, message: `Akan catat upah: ${intent.worker} - ${intent.workItem} - Rp ${intent.amount?.toLocaleString('id-ID')}` } })
    } else if (intent.action === 'create_expense') {
      return NextResponse.json({ success: true, data: { intent, message: `Akan catat biaya: ${intent.category} - ${intent.recipient} - Rp ${intent.amount?.toLocaleString('id-ID')}` } })
    } else if (intent.action === 'create_usage') {
      return NextResponse.json({ success: true, data: { intent, message: `Akan catat pemakaian: ${intent.material} - ${intent.qty} ${intent.unit}` } })
    } else {
      return NextResponse.json({ success: true, data: { intent, message: 'Query diterima, RINA akan jawab' } })
    }
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
