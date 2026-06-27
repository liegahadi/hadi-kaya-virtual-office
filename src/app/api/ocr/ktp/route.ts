// API: OCR KTP - Uses Google Gemini (free tier, excellent OCR)

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

    // Extract mime type and base64 data from data URL
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
    if (!mimeMatch) {
      return NextResponse.json({ success: false, error: 'Invalid image format' }, { status: 400 })
    }
    const mimeType = mimeMatch[1]
    const base64Data = image.split(',')[1]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Ini adalah foto KTP (Kartu Tanda Penduduk) Indonesia. Tolong extract SEMUA data berikut dan return sebagai JSON object dengan format PERSIS seperti ini (jangan tambah teks lain, HANYA JSON):

{
  "nama": "nama lengkap sesuai KTP",
  "nik": "16 digit NIK",
  "tempatLahir": "tempat lahir",
  "tanggalLahir": "DD-MM-YYYY format",
  "jenisKelamin": "LAKI-LAKI atau PEREMPUAN",
  "alamat": "alamat lengkap (jalan)",
  "rtRw": "RT/RW",
  "kelurahan": "kelurahan/desa",
  "kecamatan": "kecamatan",
  "agama": "agama",
  "statusPerkawinan": "KAWIN / BELUM KAWIN / JANDA / DUDA",
  "pekerjaan": "pekerjaan",
  "kewarganegaraan": "WNI / WNA"
}

Jika ada field yang tidak terbaca, isi dengan string kosong "". Pastikan NIK adalah 16 digit angka.` },
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
      console.error('Gemini error:', response.status, errText.substring(0, 300))
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
      return NextResponse.json({ success: false, error: 'Failed to parse OCR result', raw: content.substring(0, 500) }, { status: 500 })
    }
  } catch (error) {
    console.error('OCR KTP error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
