// API: OCR Sertifikat - Uses Google Gemini (free tier, excellent OCR)

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })
    if (!GEMINI_API_KEY) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not set. Get free key at https://aistudio.google.com/apikey' }, { status: 500 })

    const isPdf = image.startsWith('data:application/pdf')
    if (isPdf) {
      return NextResponse.json({ success: false, error: 'PDF belum didukung untuk OCR. Upload sebagai foto (JPG/PNG).' }, { status: 400 })
    }

    const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
    if (!mimeMatch) {
      return NextResponse.json({ success: false, error: 'Invalid image format' }, { status: 400 })
    }
    const mimeType = mimeMatch[1]
    const base64Data = image.split(',')[1]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Ini adalah foto Sertifikat Hak Milik (SHM) atau sertifikat tanah Indonesia. Tolong extract nomor sertifikat dan return sebagai JSON:

{
  "nomorSertifikat": "nomor sertifikat",
  "nib": "nomor NIB jika ada",
  "luasTanah": "luas tanah dalam m2 jika terbaca",
  "namaPemegangHak": "nama pemegang hak jika terbaca"
}

Jika ada field yang tidak terbaca, isi dengan string kosong "".` },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ success: false, error: `Gemini API ${response.status}: ${errText.substring(0, 200)}` }, { status: 500 })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
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
