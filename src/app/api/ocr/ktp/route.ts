// API: OCR KTP - Uses OpenRouter vision model (works on Vercel)

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
    // OpenRouter supports image_url for images. PDF not supported via OpenRouter.
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
            { type: 'text', text: `Ini adalah foto KTP (Kartu Tanda Penduduk) Indonesia. Tolong extract SEMUA data berikut dan return sebagai JSON object dengan format PERSIS seperti ini (jangan tambah teks lain, HANYA JSON):

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
            { type: 'image_url', image_url: { url: image } }
          ]
        }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', response.status, errText.substring(0, 300))
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
      return NextResponse.json({ success: false, error: 'Failed to parse OCR result', raw: content.substring(0, 500) }, { status: 500 })
    }
  } catch (error) {
    console.error('OCR KTP error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
