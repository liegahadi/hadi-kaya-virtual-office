// API: OCR KTP - Extract data from KTP image OR PDF using ZAI Vision Model

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

    // Detect if it's an image or PDF
    const isPdf = image.startsWith('data:application/pdf')
    const mediaContent = isPdf
      ? { type: 'file_url' as const, file_url: { url: image } }
      : { type: 'image_url' as const, image_url: { url: image } }

    const response = await zai.chat.completions.createVision({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Ini adalah ${isPdf ? 'dokumen PDF' : 'foto'} KTP (Kartu Tanda Penduduk) Indonesia. Tolong extract SEMUA data berikut dan return sebagai JSON object dengan format PERSIS seperti ini (jangan tambah teks lain, HANYA JSON):

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
          mediaContent
        ]
      }],
      thinking: { type: 'disabled' }
    }) as any

    const content = response.choices[0]?.message?.content || ''
    let jsonStr = content.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonStr = jsonMatch[0]

    try {
      const data = JSON.parse(jsonStr)
      return NextResponse.json({ success: true, data })
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to parse OCR result', raw: content.substring(0, 500) }, { status: 500 })
    }
  } catch (error) {
    console.error('OCR KTP error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
