// POST /api/documents/edit-logo
// Recreate logo from uploaded image — clean version with white background
// Uses z-ai-web-dev-sdk images.generations.edit()
//
// Input: { image (dataUrl), prompt }
// Output: { success, dataUrl }

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json()
    if (!image) return NextResponse.json({ error: 'Image required' }, { status: 400 })

    const editPrompt = prompt || 'Recreate this company logo as a clean, professional version. White background. High contrast. Remove any noise, shadows, or distractions. Keep the original design and colors. Vector-like quality.'

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const response = await zai.images.generations.edit({
      prompt: editPrompt,
      image: image,  // data URL string
      size: '1024x1024' as any,
    } as any)

    const base64 = (response as any)?.data?.[0]?.base64
    if (!base64) throw new Error('No image data returned')

    const dataUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({
      success: true,
      dataUrl,
      message: 'Logo berhasil di-recreate',
    })
  } catch (err: any) {
    console.error('edit-logo error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to edit logo' }, { status: 500 })
  }
}
