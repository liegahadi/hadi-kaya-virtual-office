// POST /api/bank-config/[id]/template/scan-annotations
// Read PDF file (from local path, uploaded data URL, or templateId) and extract all annotations.
//
// IMPORTANT: We use pdfjs-dist (NOT pdf-lib) because pdfjs properly extracts
// the `textContent` array from FreeText annotations created in Adobe Acrobat
// and MS Edge "Add Text" tool. pdf-lib can only read `Contents` / `TU` / `T`,
// which are empty for modern FreeText annotations — that was the bug that
// caused the scanner to return 0 results even when the PDF had 18 annotations.
//
// Supports: FreeText, Text, Widget, Line, Stamp annotations
// Coordinate output: relative (0-1) with top-left origin (Bank Builder convention)

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

// ---------- Keyword → field mapping suggestions ----------
const KEYWORD_SUGGESTIONS: Array<{ keywords: string[]; mapping: string; label: string }> = [
  // Nasabah — nama
  { keywords: ['nama debitur', 'nama konsumen', 'nama pemohon', 'nama lengkap', 'nama nasabah'], mapping: 'customer.name', label: 'Nama Lengkap' },
  { keywords: ['nama pasangan', 'nama suami', 'nama istri', 'nama spouse'], mapping: 'customer.spouseName', label: 'Nama Pasangan' },
  // NIK
  { keywords: ['nik debitur', 'no ktp debitur', 'no.ktp debitur', 'nik konsumen', 'nik pemohon', 'nomor ktp debitur'], mapping: 'customer.nik', label: 'NIK' },
  { keywords: ['nik pasangan', 'ktp pasangan', 'nik suami', 'nik istri'], mapping: 'customer.spouseNik', label: 'NIK Pasangan' },
  // TTL / DOB
  { keywords: ['tempat', 'tgl lahir', 'tempat.tgl', 'tempat tanggal', 'ttl'], mapping: 'customer.pobDob', label: 'Tempat, Tgl Lahir' },
  { keywords: ['tanggal lahir', 'tgl lahir', 'dob', 'birth'], mapping: 'customer.birthDate', label: 'Tanggal Lahir' },
  { keywords: ['tempat lahir'], mapping: 'customer.birthPlace', label: 'Tempat Lahir' },
  // Lainnya nasabah
  { keywords: ['jenis kelamin', 'gender', 'sex', 'laki', 'perempuan'], mapping: 'customer.gender', label: 'Jenis Kelamin' },
  { keywords: ['agama', 'religion'], mapping: 'customer.religion', label: 'Agama' },
  { keywords: ['status perkawinan', 'status kawin', 'menikah', 'marital'], mapping: 'customer.maritalStatus', label: 'Status Pernikahan' },
  { keywords: ['alamat ktp', 'alamat sesuai ktp', 'alamat debitur', 'alamat pemohon'], mapping: 'customer.ktpAddress', label: 'Alamat KTP' },
  // ⚠️ 'rt' / 'rw' alone is too greedy — matches "se**rt**ipikat". Use compound forms only.
  { keywords: ['rt/rw', 'rtrw', 'rt rw', 'rt / rw'], mapping: 'customer.rtRw', label: 'RT/RW' },
  { keywords: ['kelurahan sertipikat', 'kelurahan sertifikat'], mapping: 'property.certificateKelurahan', label: 'Kelurahan Sertipikat' },
  { keywords: ['no sertipikat', 'no. sertipikat', 'nomor sertipikat', 'no sertifikat', 'no. sertifikat', 'nomor sertifikat'], mapping: 'property.certificateNumber', label: 'No Sertipikat' },
  { keywords: ['kelurahan', 'desa'], mapping: 'customer.kelurahan', label: 'Kelurahan' },
  { keywords: ['kecamatan'], mapping: 'customer.kecamatan', label: 'Kecamatan' },
  { keywords: ['kota', 'city'], mapping: 'customer.city', label: 'Kota' },
  { keywords: ['kode pos', 'postal', 'zipcode'], mapping: 'customer.postalCode', label: 'Kode Pos' },
  { keywords: ['no hp', 'no. hp', 'telepon', 'telp', 'hp debitur', 'phone', 'whatsapp', 'wa '], mapping: 'customer.phone', label: 'No HP/Telp' },
  { keywords: ['npwp'], mapping: 'customer.npwpNumber', label: 'NPWP' },
  { keywords: ['rekening', 'no rek', 'no. rek'], mapping: 'customer.btnAccountNumber', label: 'No Rekening' },
  // Pekerjaan
  { keywords: ['pekerjaan debitur', 'pekerjaan pemohon', 'pekerjaan konsumen', 'jabatan', 'job', 'position'], mapping: 'customer.workPosition', label: 'Pekerjaan/Jabatan' },
  { keywords: ['perusahaan debitur', 'tempat kerja', 'nama perusahaan'], mapping: 'customer.companyName', label: 'Nama Perusahaan' },
  { keywords: ['alamat perusahaan', 'alamat kantor'], mapping: 'customer.companyAddress', label: 'Alamat Perusahaan' },
  { keywords: ['telp perusahaan', 'telp kantor'], mapping: 'customer.companyPhone', label: 'Telp Perusahaan' },
  { keywords: ['gaji', 'penghasilan', 'income', 'salary'], mapping: 'customer.monthlyIncome', label: 'Penghasilan/Bulan' },
  // Properti / Unit
  { keywords: ['nama perumahan', 'nama proyek', 'perumahan', 'project name'], mapping: 'property.projectName', label: 'Nama Perumahan' },
  { keywords: ['blok', 'block'], mapping: 'property.blockLetter', label: 'Blok Rumah' },
  { keywords: ['no rumah', 'no. rumah', 'house', 'unit', 'no unit'], mapping: 'property.unitNumber', label: 'No Rumah' },
  { keywords: ['luas tanah', 'land'], mapping: 'property.landSize', label: 'Luas Tanah' },
  { keywords: ['luas bangunan', 'building'], mapping: 'property.buildingSize', label: 'Luas Bangunan' },
  { keywords: ['harga', 'price', 'nilai'], mapping: 'property.price', label: 'Harga Rumah' },
  { keywords: ['sertipikat', 'sertifikat', 'no sertipikat', 'no. sertipikat', 'nomor sertipikat'], mapping: 'property.certificateNumber', label: 'No Sertipikat' },
  { keywords: ['kelurahan sertipikat'], mapping: 'property.certificateKelurahan', label: 'Kelurahan Sertipikat' },
  { keywords: ['alamat perumahan', 'alamat properti', 'alamat rumah'], mapping: 'property.address', label: 'Alamat Properti' },
  // Perusahaan (Developer)
  { keywords: ['nama pt', 'nama developer', 'perusahaan developer', 'pt developer'], mapping: 'company.companyName', label: 'Nama PT (Developer)' },
  { keywords: ['nama direktur', 'direktur'], mapping: 'company.directorName', label: 'Nama Direktur' },
  { keywords: ['nik direktur', 'no ktp direktur', 'ktp direktur'], mapping: 'company.directorNik', label: 'NIK Direktur' },
  { keywords: ['jabatan direktur'], mapping: 'company.directorPosition', label: 'Jabatan Direktur' },
  { keywords: ['alamat kantor', 'alamat pt', 'alamat perusahaan pt'], mapping: 'company.officeAddress', label: 'Alamat Kantor' },
  // Sistem / Tanggal
  { keywords: ['tanggal hari ini', 'tanggal bulan tahun', 'tgl hari ini', 'today', 'date'], mapping: 'system.todayDate', label: 'Tanggal Hari Ini' },
]

function suggestMapping(text: string): { mapping: string; label: string } | null {
  const lower = text.toLowerCase().trim()
  // Strip leading/trailing punctuation
  const cleaned = lower.replace(/^[\s\-\[\]()]+|[\s\-\[\]()]+$/g, '')
  for (const sug of KEYWORD_SUGGESTIONS) {
    if (sug.keywords.some(kw => cleaned.includes(kw))) {
      return { mapping: sug.mapping, label: sug.label }
    }
  }
  return null
}

// Dedupe duplicated text inside a textContent array.
// pdfjs sometimes returns the same string twice for FreeText annotations
// (e.g., ["Nama Direktur", "Nama Direktur"]) — join & collapse.
function dedupeText(items: string[] | undefined | null): string {
  if (!items || items.length === 0) return ''
  const seen: string[] = []
  for (const item of items) {
    const trimmed = String(item || '').trim()
    if (trimmed && !seen.includes(trimmed)) seen.push(trimmed)
  }
  // If the joined string contains itself repeated (e.g. "FooFoo"), collapse
  let joined = seen.join(' ')
  if (joined.length >= 4) {
    const half = Math.floor(joined.length / 2)
    if (joined.slice(0, half) === joined.slice(half)) {
      joined = joined.slice(0, half)
    }
  }
  return joined.trim()
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bankId } = await params
    const body = await req.json()
    const { pdfDataUrl, templatePath, templateId } = body

    let pdfBytes: Uint8Array

    // Source 1: Data URL (uploaded PDF, freshly dropped by user)
    if (pdfDataUrl) {
      const match = pdfDataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 })
      }
      pdfBytes = new Uint8Array(Buffer.from(match[2], 'base64'))
    }
    // Source 2: Local file path (already-saved template)
    else if (templatePath) {
      const fullPath = path.join(process.cwd(), templatePath.replace(/^\//, ''))
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json({ error: `File not found: ${fullPath}` }, { status: 404 })
      }
      pdfBytes = new Uint8Array(fs.readFileSync(fullPath))
    }
    // Source 3: Look up templatePath OR fileId from BankConfig by templateId
    else if (templateId) {
      const bank = await db.bankConfig.findUnique({ where: { id: bankId } })
      let resolvedPath: string | null = null
      let resolvedFileId: string | null = null
      if (bank?.documents) {
        const docs = JSON.parse(bank.documents)
        const tpl = (docs.templates || []).find((t: any) => t.id === templateId)
        if (tpl?.templatePath) resolvedPath = tpl.templatePath
        else if (tpl?.fileId) resolvedFileId = tpl.fileId
      }
      if (resolvedPath) {
        const fullPath = path.join(process.cwd(), resolvedPath.replace(/^\//, ''))
        if (fs.existsSync(fullPath)) {
          pdfBytes = new Uint8Array(fs.readFileSync(fullPath))
        } else {
          return NextResponse.json({ error: `Template file missing on disk: ${fullPath}` }, { status: 404 })
        }
      } else if (resolvedFileId) {
        // Fallback: fetch PDF bytes from Google Drive via Drive API
        try {
          const { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } = await import('@/lib/google/auth')
          if (!isOAuthConfigured() || !(await isGoogleConnected())) {
            return NextResponse.json({ error: 'Template disimpan di Google Drive, tapi Drive tidak terhubung. Hubungkan Drive atau re-upload PDF.' }, { status: 401 })
          }
          const drive: any = await getDriveClientOAuth()
          const fileRes = await drive.files.get(
            { fileId: resolvedFileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          )
          pdfBytes = new Uint8Array(fileRes.data as ArrayBuffer)
        } catch (err: any) {
          console.error('[scan-annotations] Drive fetch failed:', err)
          return NextResponse.json(
            { error: `Gagal ambil PDF dari Drive: ${err?.message || 'unknown'}` },
            { status: 502 }
          )
        }
      } else {
        return NextResponse.json({ error: 'Template tidak punya local path maupun Drive fileId — re-upload PDF ke Bank Builder' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'No PDF source provided (need pdfDataUrl, templatePath, or templateId)' }, { status: 400 })
    }

    // ---------- Load with pdfjs (NOT pdf-lib) ----------
    // Dynamic import so we don't break Next.js bundling for the route
    const pdfjs: any = await import('pdfjs-dist')
    // Resolve worker for server-side Node usage
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

    const loadingTask = pdfjs.getDocument({
      data: pdfBytes,
      // Disable font fetches that cause "standardFontDataUrl" warnings
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: true,
    })
    const pdf = await loadingTask.promise

    const annotations: any[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1 })
      const pageWidth = viewport.width
      const pageHeight = viewport.height

      let pageAnnots: any[] = []
      try {
        pageAnnots = await page.getAnnotations()
      } catch (err) {
        // pdfjs may emit flate stream warnings for some PDFs but still return partial results
        console.warn(`[scan-annotations] page ${pageNum} getAnnotations error:`, (err as Error)?.message)
      }

      for (let i = 0; i < pageAnnots.length; i++) {
        const ann = pageAnnots[i]
        try {
          const subtype = String(ann.subtype || ann.annotationType || '')
          // Only process user-content annotation types
          if (
            !/FreeText/i.test(subtype) &&
            !/^Text$/i.test(subtype) &&
            !/Widget/i.test(subtype) &&
            !/Stamp/i.test(subtype) &&
            !/Line/i.test(subtype) &&
            !/Square/i.test(subtype) &&
            !/Circle/i.test(subtype)
          ) {
            continue
          }

          // rect = [x1, y1, x2, y2] in PDF coords (bottom-left origin)
          const rect = ann.rect
          if (!rect || rect.length < 4) continue
          const [x1, y1, x2, y2] = rect
          const absX = Math.min(x1, x2)
          const absY = Math.min(y1, y2)
          const absW = Math.abs(x2 - x1)
          const absH = Math.abs(y2 - y1)

          // Skip tiny annotations
          if (absW < 5 || absH < 3) continue

          // Extract text — textContent array is the source of truth for FreeText
          let text = ''
          if (Array.isArray(ann.textContent)) {
            text = dedupeText(ann.textContent)
          }
          if (!text && ann.contents) text = String(ann.contents || '').trim()
          if (!text && ann.fieldName) text = String(ann.fieldName || '').trim()
          if (!text && ann.title) text = String(ann.title || '').trim()

          // Try font size from defaultAppearanceData
          let fontSize = 10
          try {
            const da = ann.defaultAppearanceData
            if (da?.fontSize) fontSize = da.fontSize
            else if (typeof da?.fontSize === 'undefined' && ann.rect) {
              // Estimate from rect height (rough heuristic)
              const est = Math.max(6, Math.min(14, Math.round(absH * 0.7)))
              fontSize = est
            }
          } catch {}

          // Convert to relative (top-left origin)
          const relX = absX / pageWidth
          const relY = 1 - (absY + absH) / pageHeight
          const relW = absW / pageWidth
          const relH = absH / pageHeight

          const suggestion = text ? suggestMapping(text) : null

          annotations.push({
            id: `scan-p${pageNum}-i${i}`,
            page: pageNum,
            x: Math.max(0, Math.min(1, relX)),
            y: Math.max(0, Math.min(1, relY)),
            width: Math.max(0.02, Math.min(1, relW)),
            height: Math.max(0.01, Math.min(1, relH)),
            name: text || `Field ${annotations.length + 1}`,
            content: text,
            fontSize,
            suggestedMapping: suggestion?.mapping || null,
            suggestedLabel: suggestion?.label || null,
            subtype,
          })
        } catch (err) {
          continue
        }
      }
    }

    // Best-effort cleanup — pdfjs PDFDocument doesn't have .destroy(),
    // use loadingTask.destroy() instead.
    try { await loadingTask.destroy() } catch {}

    return NextResponse.json({
      success: true,
      data: {
        annotations,
        totalFound: annotations.length,
        totalPages: pdf.numPages,
        autoMapped: annotations.filter(a => a.suggestedMapping).length,
      },
    })
  } catch (err: any) {
    console.error('[scan-annotations] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to scan annotations' },
      { status: 500 }
    )
  }
}
