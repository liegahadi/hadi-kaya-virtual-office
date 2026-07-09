import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/agents/create
// Create new agent
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `Anda adalah AI Assistant di perusahaan "Menuju Hadi Kaya" - developer properti Anjayo 16 di Jerambah Gantung, Pangkalpinang, Bangka.

TUGAS:
- Bantu owner dengan tugas sesuai role Anda
- Jawab dengan sopan, profesional, dan akurat
- Gunakan knowledge base yang tersedia
- Kalau butuh approval owner, bilang "menunggu ACC"

PRODUK: Anjayo 16 - perumahan tipe 36, variasi luas tanah 84/105/127. Harga Rp 173 juta. DP mulai Rp 5jt all-in.

GAYA KOMUNIKASI:
- Bahasa Indonesia standar
- Sopan dan ramah
- To the point, tidak bertele-tele`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name, role, gender, description, personality,
      llmModel, llmProvider, lightLlmModel, lightLlmProvider,
      temperature, maxTokens, isActive, isDevilsAdvocate,
      whatsappNumber,
    } = body

    if (!name || !role) {
      return NextResponse.json(
        { success: false, error: 'Name and role are required' },
        { status: 400 }
      )
    }

    // Check if name+role already exists
    const existing = await db.agent.findUnique({
      where: { name_role: { name, role } },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Agent ${name} (${role}) sudah ada` },
        { status: 400 }
      )
    }

    const agent = await db.agent.create({
      data: {
        name,
        role,
        gender: gender || null,
        description: description || null,
        personality: personality || null,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        llmModel: llmModel || 'glm-4.6',
        llmProvider: llmProvider || 'zai',
        lightLlmModel: lightLlmModel || 'nvidia/nemotron-3-nano-30b-a3b:free',
        lightLlmProvider: lightLlmProvider || 'openrouter',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 2000,
        isActive: isActive ?? true,
        isDevilsAdvocate: isDevilsAdvocate ?? false,
        whatsappNumber: whatsappNumber || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: agent,
    })
  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
