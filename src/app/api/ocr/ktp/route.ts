// API: OCR KTP - Uses z.ai VLM (free, high accuracy) with Tesseract fallback
// VLM returns structured JSON directly — no regex parsing needed!
//
// Flow:
// 1. Try z.ai VLM (vision model) — sends image + structured prompt
// 2. If VLM fails, fallback to Tesseract.js + regex parsing (legacy)
// 3. Return structured data to client

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Timeout wrapper untuk VLM call
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout]) as Promise<T>
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })

    const isPdf = image.startsWith('data:application/pdf')
    if (isPdf) {
      return NextResponse.json({ success: false, error: 'PDF belum didukung. Upload sebagai foto (JPG/PNG).' }, { status: 400 })
    }

    // === PRIMARY: z.ai VLM (Vision Language Model) ===
    // NOTE: Vercel free tier has 10s function timeout. VLM call can take 5-15s.
    // We use 8s timeout — if VLM doesn't respond in 8s, fall back to Tesseract.
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const prompt = `Anda adalah OCR engine untuk KTP Indonesia. Baca gambar KTP ini dan extract semua data dalam format JSON.

Return HANYA JSON (tanpa markdown, tanpa penjelasan), dengan field berikut:
{
  "nik": "16 digit NIK",
  "nama": "nama lengkap sesuai KTP",
  "tempatLahir": "tempat lahir",
  "tanggalLahir": "DD-MM-YYYY",
  "jenisKelamin": "LAKI-LAKI atau PEREMPUAN",
  "alamat": "alamat sesuai KTP",
  "rtRw": "RT/RW format 000/000",
  "kelurahan": "kelurahan/desa",
  "kecamatan": "kecamatan",
  "agama": "ISLAM/KRISTEN/KATOLIK/HINDU/BUDDHA/KONGHUCU",
  "statusPerkawinan": "BELUM KAWIN/KAWIN/JANDA/DUDA/CERAI HIDUP/CERAI MATI",
  "pekerjaan": "pekerjaan sesuai KTP",
  "kewarganegaraan": "WNI atau WNA"
}

Jika field tidak terbaca, isi dengan string kosong "".`

      // Wrap VLM call with 25s timeout (Vercel Pro allows 60s, free tier 10s)
      const response: any = await withTimeout(
        zai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: image } },
              ],
            },
          ],
          thinking: { type: 'disabled' },
        } as any),
        25000 // 25s timeout — leaves buffer for response parsing
      )

      const content = response.choices?.[0]?.message?.content || ''
      console.log('VLM KTP response:', content.substring(0, 300))

      // Parse JSON from VLM response
      let jsonStr = content.trim()
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) jsonStr = jsonMatch[0]

      const ocrData = JSON.parse(jsonStr)

      return NextResponse.json({
        success: true,
        data: ocrData,
        rawText: content.substring(0, 1000),
        engine: 'vlm',
      })
    } catch (vlmErr: any) {
      console.log('VLM failed:', vlmErr?.message || 'unknown')
      // Continue to Tesseract fallback
    }

    // === FALLBACK: Tesseract.js (legacy) ===
    const Tesseract = (await import('tesseract.js')).default
    const base64Data = image.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    const result = await Tesseract.recognize(buffer, 'ind', { logger: () => {} })
    const rawText = result.data.text
    const ocrData = parseKtpText(rawText)

    return NextResponse.json({
      success: true,
      data: ocrData,
      rawText: rawText.substring(0, 1000),
      engine: 'tesseract',
    })
  } catch (error) {
    console.error('OCR KTP error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}

// Legacy: Parse Indonesian KTP text to structured data (Tesseract fallback)
function parseKtpText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  const allText = lines.join(' ').toUpperCase()

  const nikMatch = allText.match(/(\d{16})/)
  const nik = nikMatch ? nikMatch[1] : ''

  let nama = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^NAMA\s*[:\-]?/)) {
      nama = lines[i].replace(/^NAMA\s*[:\-]?\s*/i, '').trim()
      if (!nama && i + 1 < lines.length) nama = lines[i + 1].trim()
      break
    }
  }

  let tempatLahir = '', tanggalLahir = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/TEMPAT.*LAHIR|TLAHIR|TGL.*LAHIR/)) {
      const val = lines[i].replace(/^.*LAHIR\s*[:\-]?\s*/i, '').trim()
      const parts = val.match(/^([A-Z\s\.]+),?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/)
      if (parts) {
        tempatLahir = parts[1].trim()
        tanggalLahir = parts[2].replace(/\//g, '-')
      }
      break
    }
  }

  const jkMatch = allText.match(/(LAKI[-\s]?LAKI|PEREMPUAN)/i)
  const jenisKelamin = jkMatch ? jkMatch[1].toUpperCase().replace(/\s+/g, ' ') : ''

  let alamat = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^ALAMAT\s*[:\-]?/)) {
      alamat = lines[i].replace(/^ALAMAT\s*[:\-]?\s*/i, '').trim()
      break
    }
  }

  const rtrwVal = allText.match(/(?:RT\s*[:\/]?\s*RW|RT\/RW)\s*[:\-]?\s*(\d{3}\s*\/\s*\d{3})/i)
  const rtRw = rtrwVal ? rtrwVal[1].replace(/\s/g, '') : ''

  let kelurahan = '', kecamatan = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/KEL(?:URAHAN)?\/?DESA|DESA\/KELURAHAN/i)) {
      kelurahan = lines[i].replace(/^.*(?:KEL|DESA)\s*[:\-]?\s*/i, '').trim()
    }
    if (lines[i].toUpperCase().match(/^KECAMATAN\s*[:\-]?/)) {
      kecamatan = lines[i].replace(/^KECAMATAN\s*[:\-]?\s*/i, '').trim()
    }
  }

  const agamaMatch = allText.match(/AGAMA\s*[:\-]?\s*(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)/i)
  const agama = agamaMatch ? agamaMatch[1].toUpperCase() : ''

  const statusMatch = allText.match(/STATUS\s*PERKAWINAN\s*[:\-]?\s*(KAWIN|BELUM\s*KAWIN|JANDA|DUDA|CERAI\s*HIDUP|CERAI\s*MATI)/i)
  const statusPerkawinan = statusMatch ? statusMatch[1].toUpperCase().replace(/\s+/g, ' ') : ''

  let pekerjaan = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^PEKERJAAN\s*[:\-]?/)) {
      pekerjaan = lines[i].replace(/^PEKERJAAN\s*[:\-]?\s*/i, '').trim()
      break
    }
  }

  const kwnMatch = allText.match(/KEWARGANEGARAAN\s*[:\-]?\s*(WNI|WNA)/i)
  const kewarganegaraan = kwnMatch ? kwnMatch[1].toUpperCase() : 'WNI'

  return { nama, nik, tempatLahir, tanggalLahir, jenisKelamin, alamat, rtRw, kelurahan, kecamatan, agama, statusPerkawinan, pekerjaan, kewarganegaraan }
}
