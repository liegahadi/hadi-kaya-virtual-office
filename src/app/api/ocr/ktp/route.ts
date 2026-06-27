// API: OCR KTP - Direct fetch to ZAI API (bypass SDK config issue on Vercel)

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Load ZAI config from file (works on local) or env (works on Vercel)
function getZaiConfig() {
  // Try file first
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    '/etc/.z-ai-config',
  ]
  for (const p of configPaths) {
    try {
      const config = JSON.parse(fs.readFileSync(p, 'utf-8'))
      if (config.baseUrl && config.apiKey) return config
    } catch {}
  }
  // Fallback to hardcoded (same as .z-ai-config)
  return {
    baseUrl: 'https://internal-api.z.ai/v1',
    apiKey: 'Z.ai',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmU4MGI1YWMtNWM2ZC00ZjEzLWJjZjctMjI0NmFlZTUxNWFjIiwiY2hhdF9pZCI6ImNoYXQtZjA2ODQ2ZmMtNjQ4Zi00ZGQ1LWFkYzYtMTAzM2NlNThlZjBjIiwicGxhdGZvcm0iOiJ6YWkifQ.owCuUI9B-Qsh-n4v2Tnhh2Ivr3I_FuwPOtXkzpSzRyk',
    userId: 'fe80b5ac-5c6d-4f13-bcf7-2246aee515ac',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })

    const config = getZaiConfig()
    const isPdf = image.startsWith('data:application/pdf')
    const mediaContent = isPdf
      ? { type: 'file_url', file_url: { url: image } }
      : { type: 'image_url', image_url: { url: image } }

    // Direct fetch to ZAI API (bypass SDK)
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.token ? { 'X-Chat-Token': config.token } : {}),
      },
      body: JSON.stringify({
        model: 'glm-4.6v',
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
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ success: false, error: `ZAI API ${response.status}: ${errText.substring(0, 200)}` }, { status: 500 })
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
