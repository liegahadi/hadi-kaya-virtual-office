// POST /api/dina/upload
// Receive file upload dari chat DINA (image/PDF)
// Return dataUrl + metadata untuk disimpan di Message.metadata
//
// File disimpan sebagai base64 data URL di Message.metadata (JSON).
// Limit: 5MB per file (cukup untuk KTP, KK, slip gaji, dll).
// Untuk file besar >5MB, sebaiknya upload via Tab Berkas (Google Drive).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dataUrl, fileName, customerId, conversationId } = body

    if (!dataUrl || !fileName) {
      return NextResponse.json(
        { success: false, error: 'dataUrl dan fileName wajib diisi' },
        { status: 400 }
      )
    }

    // Parse data URL
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Format dataUrl tidak valid' },
        { status: 400 }
      )
    }

    const mimeType = match[1]
    const base64Data = match[2]
    const buffer = Buffer.from(base64Data, 'base64')

    // Validate file type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipe file tidak diizinkan: ${mimeType}. Hanya image (JPEG/PNG/WebP/GIF) dan PDF.`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File terlalu besar: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maksimal 5MB.`,
        },
        { status: 400 }
      )
    }

    // Determine file type category
    const fileType = mimeType.startsWith('image/') ? 'IMAGE' : 'PDF'

    // Build response metadata
    const fileMetadata = {
      type: fileType,
      mimeType,
      fileName,
      fileSize: buffer.length,
      dataUrl, // base64 data URL, simpan utuh di Message.metadata
      uploadedAt: new Date().toISOString(),
    }

    // Optional: Save to GoogleDoc table if customerId provided
    // (untuk tracking file yang pernah diupload via chat)
    let googleDocId: string | null = null
    if (customerId) {
      try {
        const docType = fileType === 'IMAGE' ? 'chat-image' : 'chat-pdf'
        const gd = await db.googleDoc.create({
          data: {
            docId: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            customerId,
            fileName: `[Chat Upload] ${fileName}`,
            docType,
            editUrl: '', // base64 inline, tidak ada URL Drive
            fileHash: null,
            fileSize: buffer.length,
            version: 1,
            isRaw: true,
          },
        })
        googleDocId = gd.id
      } catch (err) {
        console.error('Save GoogleDoc record (non-fatal):', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...fileMetadata,
        googleDocId,
      },
    })
  } catch (err: any) {
    console.error('DINA upload error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload gagal' },
      { status: 500 }
    )
  }
}
