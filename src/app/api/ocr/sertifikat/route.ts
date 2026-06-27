// API: OCR Sertifikat - Uses OpenRouter vision model (works on Vercel)

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })

    const isPdf = image.startsWith('data:application/pdf')
    if (isPdf) {
      return NextResponse.json({ success: false, error: 'PDF belum didukung untuk OCR. Upload sebagai foto (JPG/PNG).' }, { status: 400 })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://hadi-kaya-virtual-office.vercel.app',
        'X-Title': 'Hadi Kaya Virtual Office',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-vl-72b-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `Ini adalah foto Sertifikat Hak Milik (SHM) atau sertifikat tanah Indonesia. Tolong extract nomor sertifikat dan return sebagai JSON:

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
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ success: false, error: `OpenRouter API ${response.status}: ${errText.substring(0, 200)}` }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    let jsonStr = content.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonStr = jsonMatch[0]

    try {
      const ocrData = JSON.parse(jsonStr)
      return NextResponse.json({ success: true, data: ocrData })
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to parse', raw: content.substring(0, 500) }, { status: 500 })
    }
  } catch (error) {
    console.error('OCR Sertifikat error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
