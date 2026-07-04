// GET /api/dina/history?customerId=xxx
// Returns DINA chat history from DB (persists across page reloads)
// If customerId provided → load that customer's conversation
// If no customerId → load general (non-customer) conversation
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    let conversation: any = null

    if (customerId) {
      conversation = await db.conversation.findFirst({
        where: { customerId, channel: 'DASHBOARD' },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } },
      })
    } else {
      // General chat (no customer) — find conversation with channel DASHBOARD and no customerId
      const allConvos = await db.conversation.findMany({
        where: { channel: 'DASHBOARD' },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } },
      })
      // Filter to find one without customerId
      conversation = allConvos.find(c => !c.customerId) || null
    }

    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return NextResponse.json({
        success: true,
        messages: [],
        welcomeMessage: 'Halo! Saya DINA, Document AI Assistant untuk PT. Marlindo Bangun Persada. Saya bisa bantu soal berkas KPR, proses bank, dokumen yang dibutuhkan, status konsumen, dan update data langsung dari database. Apa yang bisa saya bantu? 😊',
      })
    }

    // Format messages for the UI
    const messages = conversation.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'agent',
      content: m.content,
      ts: m.createdAt.getTime(),
    }))

    return NextResponse.json({ success: true, messages, conversationId: conversation.id })
  } catch (err: any) {
    console.error('DINA history error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
