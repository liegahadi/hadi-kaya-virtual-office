// POST /api/documents/generate-surat
// DINA v2: Generate surat umum (selain SK/Slip/Laporan)
// Flow:
// 1. User specify suratType, instansi, customerId (optional), customInstructions
// 2. DINA asks "Surat untuk apa? Bank/instansi mana?" if not specified
// 3. Generate content via Gemini
// 4. Save to Drive folder: Surat Menyurat/[Instansi]/
// 5. Set permission: anyone with link = VIEWER
// 6. Return share link

import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { db } from '@/lib/db'
import {
  INSTANSI_FOLDER_MAP,
  buildSuratFilename,
  buildSuratPrompt,
  SURAT_TYPES,
} from '@/lib/berkas/surat/surat-helper'
import { computeFileHash, generateUniqueFilename } from '@/lib/berkas/upload-helper'

export const runtime = 'nodejs'
export const maxDuration = 60

// Root folder for Surat Menyurat (will be created if not exists)
const SURAT_ROOT_FOLDER_NAME = 'Surat Menyurat'

/**
 * Get or create the Surat Menyurat root folder + instansi subfolder.
 */
async function ensureSuratFolder(drive: any, instansi: string): Promise<string> {
  // 1. Find or create root "Surat Menyurat" folder under ANJAYO 16
  // For now, we'll create under root drive (will organize later)
  const rootFolderName = 'Hadi Kaya Docs'
  const projectFolderName = 'ANJAYO 16'

  // Find root
  let rootRes = await drive.files.list({
    q: `name='${rootFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })
  let rootId = rootRes.data.files?.[0]?.id
  if (!rootId) {
    const created = await drive.files.create({
      requestBody: { name: rootFolderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    rootId = created.data.id
  }

  // Find project folder
  let projRes = await drive.files.list({
    q: `name='${projectFolderName}' and '${rootId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })
  let projId = projRes.data.files?.[0]?.id
  if (!projId) {
    const created = await drive.files.create({
      requestBody: { name: projectFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] },
      fields: 'id',
    })
    projId = created.data.id
  }

  // Find or create Surat Menyurat folder
  let suratRes = await drive.files.list({
    q: `name='${SURAT_ROOT_FOLDER_NAME}' and '${projId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })
  let suratId = suratRes.data.files?.[0]?.id
  if (!suratId) {
    const created = await drive.files.create({
      requestBody: { name: SURAT_ROOT_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder', parents: [projId] },
      fields: 'id',
    })
    suratId = created.data.id
  }

  // Find or create instansi subfolder
  const instansiLabel = INSTANSI_FOLDER_MAP[instansi] || instansi
  let instansiRes = await drive.files.list({
    q: `name='${instansiLabel}' and '${suratId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })
  let instansiId = instansiRes.data.files?.[0]?.id
  if (!instansiId) {
    const created = await drive.files.create({
      requestBody: { name: instansiLabel, mimeType: 'application/vnd.google-apps.folder', parents: [suratId] },
      fields: 'id',
    })
    instansiId = created.data.id
  }

  return instansiId
}

/**
 * Generate surat content via Gemini.
 */
async function generateSuratContent(params: {
  suratType: string
  instansi: string
  customerName?: string
  customerData?: any
  customInstructions?: string
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const prompt = buildSuratPrompt(params)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Convert text to a simple .docx file buffer using docx library.
 */
async function textToDocx(text: string): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

  const paragraphs = text.split('\n').map(line => {
    if (line.trim() === '') return new Paragraph({ children: [] })
    return new Paragraph({
      children: [new TextRun({ text: line, size: 24, font: 'Times New Roman' })],
      alignment: 'left',
    })
  })

  const doc = new Document({
    sections: [{ children: paragraphs }],
  })

  return await Packer.toBuffer(doc)
}

export async function POST(req: NextRequest) {
  try {
    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({ success: false, error: 'GOOGLE_NOT_CONNECTED' }, { status: 401 })
    }

    const body = await req.json()
    const { suratType, instansi, customerId, customInstructions, customerName } = body

    if (!suratType || !instansi) {
      return NextResponse.json({
        success: false,
        error: 'suratType dan instansi wajib diisi',
        suratTypes: SURAT_TYPES,
      }, { status: 400 })
    }

    if (!SURAT_TYPES.includes(suratType)) {
      return NextResponse.json({
        success: false,
        error: `suratType tidak valid. Pilih: ${SURAT_TYPES.join(', ')}`,
      }, { status: 400 })
    }

    // Get customer data if customerId provided
    let customerData: any = null
    let finalCustomerName = customerName || 'Pemohon'
    if (customerId) {
      customerData = await db.customer.findUnique({ where: { id: customerId } })
      if (customerData) {
        finalCustomerName = customerData.name
      }
    }

    // Generate surat content
    const content = await generateSuratContent({
      suratType,
      instansi,
      customerName: finalCustomerName,
      customerData,
      customInstructions,
    })

    if (!content.trim()) {
      return NextResponse.json({ success: false, error: 'Gagal generate konten surat' }, { status: 500 })
    }

    // Convert to .docx
    const docxBuffer = await textToDocx(content)
    const fileHash = computeFileHash(docxBuffer)

    // Get Drive client + folder
    const drive = await getDriveClientOAuth()
    const folderId = await ensureSuratFolder(drive, instansi)

    // Get next version
    let version = 1
    if (customerId) {
      const docType = `surat-${suratType.toLowerCase().replace(/\s+/g, '-')}`
      const latest = await db.googleDoc.findFirst({
        where: { customerId, docType },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      version = (latest?.version || 0) + 1
    }

    const fileName = buildSuratFilename(finalCustomerName, suratType, instansi, version)

    // Check existing names for anti-overwrite
    let existingNames: string[] = []
    try {
      const existing = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(name)',
        spaces: 'drive',
        pageSize: 100,
      })
      existingNames = (existing.data.files || []).map((f: any) => f.name || '')
    } catch (e) {}

    const uniqueName = generateUniqueFilename(fileName, existingNames)

    // Upload to Drive
    const uploadRes = await drive.files.create({
      requestBody: {
        name: uniqueName,
        parents: [folderId],
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Readable.from(docxBuffer),
      },
      fields: 'id, name, webViewLink',
    })

    // Set permission: anyone with link = VIEWER
    try {
      await drive.permissions.create({
        fileId: uploadRes.data.id!,
        requestBody: { role: 'reader', type: 'anyone' },
      })
    } catch (permErr) {
      console.error('Set permission (non-fatal):', permErr)
    }

    // Save to GoogleDoc table
    const docType = `surat-${suratType.toLowerCase().replace(/\s+/g, '-')}`
    try {
      await db.googleDoc.create({
        data: {
          docId: uploadRes.data.id!,
          customerId: customerId || null,
          fileName: uniqueName,
          folderId,
          docType,
          editUrl: uploadRes.data.webViewLink || '',
          fileHash,
          fileSize: docxBuffer.length,
          version,
          isRaw: true,
        },
      })
    } catch (dbErr) {
      console.error('Save GoogleDoc (non-fatal):', dbErr)
    }

    // Add history log
    if (customerId) {
      try {
        await db.customerHistoryLog.create({
          data: {
            customerId,
            eventType: 'DOC_GENERATED',
            title: `${suratType} - ${instansi} v${version} dibuat`,
            description: `Surat ${suratType} untuk ${INSTANSI_FOLDER_MAP[instansi] || instansi}. File: ${uniqueName}`,
            metadata: JSON.stringify({ fileId: uploadRes.data.id, version, suratType, instansi }),
            source: 'DINA',
          },
        })
      } catch (histErr) {
        console.error('History log (non-fatal):', histErr)
      }
    }

    return NextResponse.json({
      success: true,
      fileId: uploadRes.data.id,
      fileName: uniqueName,
      webViewLink: uploadRes.data.webViewLink,
      content,
      version,
      instansi: INSTANSI_FOLDER_MAP[instansi] || instansi,
      suratType,
    })
  } catch (err: any) {
    console.error('generate-surat error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}

// GET endpoint to list available surat types
export async function GET() {
  return NextResponse.json({
    success: true,
    suratTypes: SURAT_TYPES,
    instansiOptions: Object.keys(INSTANSI_FOLDER_MAP),
  })
}
