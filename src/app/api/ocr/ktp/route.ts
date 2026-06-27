// API: OCR KTP - Uses Tesseract.js (100% free, no API key, works on Vercel)
// Extracts text from KTP image, then parses fields with regex

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

    // Convert base64 data URL to buffer
    const base64Data = image.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    // Run Tesseract OCR with Indonesian language
    const result = await Tesseract.recognize(buffer, 'ind', {
      logger: () => {},
    })

    const rawText = result.data.text
    console.log('OCR raw text:', rawText.substring(0, 500))

    // Parse KTP fields from raw text
    const ocrData = parseKtpText(rawText)

    return NextResponse.json({ success: true, data: ocrData, rawText: rawText.substring(0, 1000) })
  } catch (error) {
    console.error('OCR KTP error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}

// Parse Indonesian KTP text to structured data
function parseKtpText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  const allText = lines.join(' ').toUpperCase()

  // Helper: find value after a label
  const findAfter = (label: string, stopPattern?: RegExp): string => {
    const regex = new RegExp(label + '\\s*[:\\-]?\\s*(.+?)(?:' + (stopPattern?.source || '$') + ')', 'i')
    const m = allText.match(regex)
    return m ? m[1].trim() : ''
  }

  // NIK: 16 digits
  const nikMatch = allText.match(/(\d{16})/)
  const nik = nikMatch ? nikMatch[1] : ''

  // Nama: after "NAMA" or "Nama" until next field
  let nama = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^NAMA\s*[:\-]?/)) {
      nama = lines[i].replace(/^NAMA\s*[:\-]?\s*/i, '').trim()
      if (!nama && i + 1 < lines.length) nama = lines[i + 1].trim()
      break
    }
  }

  // Tempat/Tgl Lahir: "PANGKALPINANG, 17-04-1990" or similar
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

  // Jenis Kelamin
  const jkMatch = allText.match(/(LAKI[-\s]?LAKI|PEREMPUAN)/i)
  const jenisKelamin = jkMatch ? jkMatch[1].toUpperCase().replace(/\s+/g, ' ') : ''

  // Alamat
  let alamat = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^ALAMAT\s*[:\-]?/)) {
      alamat = lines[i].replace(/^ALAMAT\s*[:\-]?\s*/i, '').trim()
      break
    }
  }

  // RT/RW
  const rtrwMatch = allText.match(/RT\s*[:\/]?\s*RW|RT\/RW/i)
  let rtRw = ''
  if (rtrwMatch) {
    const rtrwVal = allText.match(/(?:RT\s*[:\/]?\s*RW|RT\/RW)\s*[:\-]?\s*(\d{3}\s*\/\s*\d{3})/i)
    rtRw = rtrwVal ? rtrwVal[1].replace(/\s/g, '') : ''
  }

  // Kelurahan/Desa
  let kelurahan = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/KEL(?:URAHAN)?\/?DESA|DESA\/KELURAHAN/i)) {
      kelurahan = lines[i].replace(/^.*(?:KEL|DESA)\s*[:\-]?\s*/i, '').trim()
      break
    }
  }

  // Kecamatan
  let kecamatan = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^KECAMATAN\s*[:\-]?/)) {
      kecamatan = lines[i].replace(/^KECAMATAN\s*[:\-]?\s*/i, '').trim()
      break
    }
  }

  // Agama
  const agamaMatch = allText.match(/AGAMA\s*[:\-]?\s*(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)/i)
  const agama = agamaMatch ? agamaMatch[1].toUpperCase() : ''

  // Status Perkawinan
  const statusMatch = allText.match(/STATUS\s*PERKAWINAN\s*[:\-]?\s*(KAWIN|BELUM\s*KAWIN|JANDA|DUDA|CERAI\s*HIDUP|CERAI\s*MATI)/i)
  const statusPerkawinan = statusMatch ? statusMatch[1].toUpperCase().replace(/\s+/g, ' ') : ''

  // Pekerjaan
  let pekerjaan = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().match(/^PEKERJAAN\s*[:\-]?/)) {
      pekerjaan = lines[i].replace(/^PEKERJAAN\s*[:\-]?\s*/i, '').trim()
      break
    }
  }

  // Kewarganegaraan
  const kwnMatch = allText.match(/KEWARGANEGARAAN\s*[:\-]?\s*(WNI|WNA)/i)
  const kewarganegaraan = kwnMatch ? kwnMatch[1].toUpperCase() : 'WNI'

  return {
    nama,
    nik,
    tempatLahir,
    tanggalLahir,
    jenisKelamin,
    alamat,
    rtRw,
    kelurahan,
    kecamatan,
    agama,
    statusPerkawinan,
    pekerjaan,
    kewarganegaraan,
  }
}
