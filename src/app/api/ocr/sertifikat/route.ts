// API: OCR Sertifikat - Extract nomor sertifikat/SHM from certificate image
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })

    const zai = await ZAI.create()
    const response = await zai.chat.completions.createVision({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Ini adalah foto/dokumen Sertifikat Hak Milik (SHM) atau sertifikat tanah Indonesia. Tolong extract nomor sertifikat dan return sebagai JSON:

{
  "nomorSertifikat": "nomor sertifikat",
  "nib": "nomor NIB jika ada",
  "luasTanah": "luas tanah dalam m2 jika terbaca",
  "namaPemegangHak": "nama pemegang hak jika terbaca"
}

Jika ada field yang tidak terbaca, isi dengan string kosong "".` },
          { type: 'image_url', image_url: { url: image } }
        ]
      }],
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content || ''
    let jsonStr = content.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonStr = jsonMatch[0]

    try {
      const data = JSON.parse(jsonStr)
      return NextResponse.json({ success: true, data })
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to parse', raw: content.substring(0, 500) }, { status: 500 })
    }
  } catch (error) {
    console.error('OCR Sertifikat error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
