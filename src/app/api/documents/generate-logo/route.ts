// POST /api/documents/generate-logo
// Generate company logo via AI (z-ai-web-dev-sdk image generation)
// Free tier, no API key needed (uses z-ai-web-dev-sdk)
//
// Input: { companyName, style?, description? }
// Output: { success, dataUrl, prompt }

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { companyName, style, description } = await req.json()
    if (!companyName) return NextResponse.json({ error: 'companyName required' }, { status: 400 })

    // Build prompt for logo generation
    const styleHint = style || 'modern professional'
    const descHint = description ? `Description: ${description}.` : ''
    const prompt = `Generate a clean, professional company logo for "${companyName}". ${descHint} Style: ${styleHint}. The logo should be simple, high-contrast, suitable for letterhead/kop surat. White or transparent background. Vector-like quality. No text in the image (just the logo symbol/icon).`

    // Use z-ai-web-dev-sdk for image generation (free)
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt,
      size: '1024x1024' as any,
    })

    // z-ai returns base64 encoded image
    const base64 = (response as any)?.data?.[0]?.base64
    if (!base64) throw new Error('No image data returned')

    const dataUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({
      success: true,
      dataUrl,
      prompt,
      message: `Logo untuk "${companyName}" berhasil di-generate`,
    })
  } catch (err: any) {
    console.error('generate-logo error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to generate logo' }, { status: 500 })
  }
}
