// API: OCR Sertifikat - Uses z.ai VLM (free, high accuracy) with Tesseract fallback

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })

    const isPdf = image.startsWith('data:application/pdf')
    if (isPdf) {
      return NextResponse.json({ success: false, error: 'PDF belum didukung. Upload sebagai foto (JPG/PNG).' }, { status: 400 })
    }

    // === PRIMARY: z.ai VLM ===
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const prompt = `Anda adalah OCR engine untuk Sertifikat Tanah Indonesia (SHM/SHGB). Baca gambar sertifikat ini dan extract data dalam format JSON.

Return HANYA JSON (tanpa markdown, tanpa penjelasan):
{
  "nomorSertifikat": "nomor sertifikat",
  "nib": "nomor NIB jika ada",
  "luasTanah": "luas tanah dalam m² (angka saja)",
  "namaPemegangHak": "nama pemegang hak",
  "letakTanah": "alamat/letak tanah",
  "penggunaan": "perumahan/tempat usaha/dll",
  "tanggalTerbit": "tanggal terbit sertifikat jika ada"
}

Jika field tidak terbaca, isi dengan string kosong "".`

      const response = await zai.chat.completions.createVision({
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
      })

      const content = response.choices?.[0]?.message?.content || ''
      console.log('VLM Sertifikat response:', content.substring(0, 300))

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
    } catch (vlmErr) {
      console.log('VLM failed, falling back to Tesseract:', vlmErr instanceof Error ? vlmErr.message : 'unknown')
    }

    // === FALLBACK: Tesseract.js ===
    const Tesseract = (await import('tesseract.js')).default
    const base64Data = image.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    const result = await Tesseract.recognize(buffer, 'ind', { logger: () => {} })
    const rawText = result.data.text
    const allText = rawText.toUpperCase()

    const nomorMatch = allText.match(/NOMOR\s*[:\-]?\s*(\d+)/) || allText.match(/NO\s*[:\-]?\s*(\d{4,})/)
    const nibMatch = allText.match(/NIB\s*[:\-]?\s*(\d+)/)
    const luasMatch = allText.match(/LUAS\s*(?:TANAH)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*M2?/) || allText.match(/(\d+(?:[.,]\d+)?)\s*M2?/)
    const namaMatch = allText.match(/(?:PEMEGANG\s*HAK|NAMA\s*[:\-]?)\s*[:\-]?\s*([A-Z\s.]+)/)

    return NextResponse.json({
      success: true,
      data: {
        nomorSertifikat: nomorMatch ? nomorMatch[1] : '',
        nib: nibMatch ? nibMatch[1] : '',
        luasTanah: luasMatch ? luasMatch[1] : '',
        namaPemegangHak: namaMatch ? namaMatch[1].trim() : '',
      },
      rawText: rawText.substring(0, 1000),
      engine: 'tesseract',
    })
  } catch (error) {
    console.error('OCR Sertifikat error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
