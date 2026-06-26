// API: OCR KTP - Extract data from KTP image using ZAI Vision Model
// Returns: { nama, nik, tempatLahir, tanggalLahir, alamat, rtRw, kelurahan, kecamatan, agama, statusPerkawinan, pekerjaan, jenisKelamin }

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
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content || ''
    // Extract JSON from response (sometimes model wraps in ```json)
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
