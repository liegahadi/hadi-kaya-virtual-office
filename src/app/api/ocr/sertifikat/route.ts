// API: OCR Sertifikat - Uses Tesseract.js (100% free, no API key)

import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

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

    const base64Data = image.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    const result = await Tesseract.recognize(buffer, 'ind', {
      logger: () => {},
    })

    const rawText = result.data.text
    const allText = rawText.toUpperCase()

    // Parse sertifikat fields
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
    })
  } catch (error) {
    console.error('OCR Sertifikat error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
