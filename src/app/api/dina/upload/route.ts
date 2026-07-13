// POST /api/dina/upload
// Receive file upload dari chat DINA (image/PDF)
// Upload ke Google Drive (folder konsumen) + return metadata
// File juga disimpan sebagai base64 di Message.metadata untuk preview di chat

import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { db } from '@/lib/db'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { ensureCustomerFolder } from '@/lib/google/folders'
import { computeFileHash, generateUniqueFilename } from '@/lib/berkas/upload-helper'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]

function detectDocType(fileName: string): string {
  const name = fileName.toLowerCase()
  if (name.includes('ktp')) return 'ktp'
  if (name.includes('kk') || name.includes('kartu keluarga')) return 'kk'
  if (name.includes('npwp')) return 'npwp'
  if (name.includes('akta') || name.includes('nikah')) return 'akta-nikah'
  if (name.includes('slip') || name.includes('gaji')) return 'slip-gaji'
  if (name.includes('sk kerja') || name.includes('surat kerja')) return 'sk-kerja'
  if (name.includes('nib')) return 'nib'
  if (name.includes('rumah') || name.includes('belum')) return 'surat-belum-rumah'
  if (name.includes('sertifikat') || name.includes('shm')) return 'sertifikat'
  if (name.includes('pbb')) return 'pbb'
  if (name.includes('laporan') || name.includes('keuangan')) return 'laporan-keuangan'
  return 'other'
}

function getDocLabel(docType: string): string {
  const labels: Record<string, string> = {
    'ktp': 'KTP',
    'kk': 'KK',
    'npwp': 'NPWP',
    'akta-nikah': 'Akta Nikah',
    'slip-gaji': 'Slip Gaji',
    'sk-kerja': 'SK Kerja',
    'nib': 'NIB',
    'surat-belum-rumah': 'Surat Belum Rumah',
    'sertifikat': 'Sertifikat',
    'pbb': 'PBB',
    'laporan-keuangan': 'Laporan Keuangan',
    'other': 'Dokumen',
  }
  return labels[docType] || 'Dokumen'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dataUrl, fileName, customerId, customerName, customerBlock } = body

    if (!dataUrl || !fileName) {
      return NextResponse.json(
        { success: false, error: 'dataUrl dan fileName wajib diisi' },
        { status: 400 }
      )
    }

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

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Tipe file tidak diizinkan: ${mimeType}. Hanya image dan PDF.` },
        { status: 400 }
      )
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File terlalu besar: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maksimal 5MB.` },
        { status: 400 }
      )
    }

    const fileType = mimeType.startsWith('image/') ? 'IMAGE' : 'PDF'
    const docType = detectDocType(fileName)
    const docLabel = getDocLabel(docType)
    const fileHash = await computeFileHash(buffer)

    let driveFileId: string | null = null
    let driveLink: string | null = null
    let driveFileName: string = fileName
    let driveUploaded = false

    if (customerId && isOAuthConfigured() && await isGoogleConnected()) {
      try {
        const drive: any = await getDriveClientOAuth()

        const customer = await db.customer.findUnique({
          where: { id: customerId },
          select: { name: true, blockLetter: true, houseNumber: true },
        })

        if (customer) {
          const cName = customer.name || customerName || 'Konsumen'
          const cBlock = (customer.blockLetter || '') + (customer.houseNumber || '') || customerBlock || ''

          const state: any = {
            applicant: { fullName: cName },
            property: { blockLetter: customer.blockLetter || '', houseNumber: customer.houseNumber || '' },
          }
          const customerFolderId = await ensureCustomerFolder(state, customerId)

          const ext = mimeType.includes('pdf') ? '.pdf' : mimeType.includes('png') ? '.png' : '.jpg'
          const baseFileName = cBlock
            ? `${docLabel} - ${cName} - ${cBlock}`
            : `${docLabel} - ${cName}`

          let existingNames: string[] = []
          try {
            const existing = await drive.files.list({
              q: `'${customerFolderId}' in parents and trashed=false`,
              fields: 'files(name)',
              spaces: 'drive',
              pageSize: 100,
            })
            existingNames = (existing.data.files || []).map((f: any) => f.name || '')
          } catch {}

          driveFileName = generateUniqueFilename(`${baseFileName}${ext}`, existingNames)

          const uploadRes = await drive.files.create({
            requestBody: { name: driveFileName, parents: [customerFolderId] },
            media: { mimeType, body: Readable.from(buffer) },
            fields: 'id, name, webViewLink',
          })

          driveFileId = uploadRes.data.id
          driveLink = uploadRes.data.webViewLink
          driveUploaded = true

          try {
            await drive.permissions.create({
              fileId: driveFileId,
              requestBody: { role: 'reader', type: 'anyone' },
            })
          } catch (permErr) {
            console.error('Set permission (non-fatal):', permErr)
          }

          await db.googleDoc.create({
            data: {
              docId: driveFileId,
              customerId,
              fileName: driveFileName,
              folderId: customerFolderId,
              docType,
              editUrl: driveLink || '',
              fileHash,
              fileSize: buffer.length,
              version: 1,
              isRaw: true,
            },
          })

          await db.customerHistoryLog.create({
            data: {
              customerId,
              eventType: 'DOC_UPLOADED',
              title: `${docLabel} diupload via chat DINA`,
              description: `File: ${driveFileName}${driveLink ? `\nDrive: ${driveLink}` : ''}`,
              metadata: JSON.stringify({
                fileId: driveFileId,
                fileHash,
                fileSize: buffer.length,
                source: 'DINA_CHAT',
                originalFileName: fileName,
              }),
              source: 'DINA',
            },
          })
        }
      } catch (driveErr) {
        console.error('Drive upload (non-fatal):', driveErr)
      }
    }

    const fileMetadata = {
      type: fileType,
      mimeType,
      fileName,
      fileSize: buffer.length,
      dataUrl,
      uploadedAt: new Date().toISOString(),
      driveUploaded,
      driveFileId,
      driveLink,
      driveFileName,
      docType,
      docLabel,
    }

    return NextResponse.json({
      success: true,
      data: fileMetadata,
      message: driveUploaded
        ? `✅ ${docLabel} berhasil diupload ke Google Drive${customerName ? ` (${customerName})` : ''}`
        : `✅ ${docLabel} tersimpan di chat${customerId ? ' (Drive upload gagal)' : ' (tidak ada konsumen aktif)'}`,
    })
  } catch (err: any) {
    console.error('DINA upload error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload gagal' },
      { status: 500 }
    )
  }
}
