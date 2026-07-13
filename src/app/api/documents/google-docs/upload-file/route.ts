// POST /api/documents/google-docs/upload-file
// Uploads a single file (KTP, KK, etc.) to customer's Google Drive folder
// Naming: [Nama Dokumen] - [Nama Debitur] - Blok dan No Rumah
// Example: "KTP - Jenni - E5"
//
// DINA v2 FIX:
// - Anti-overwrite: NEVER delete existing file, auto-rename with suffix instead
// - Anti-duplicate: SHA-256 hash check, skip if same file already exists
// - Permission: anyone with link = VIEWER (not editor)
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { ensureCustomerFolder } from '@/lib/google/folders'
import { db } from '@/lib/db'
import { computeFileHash, checkDuplicateFile, generateUniqueFilename } from '@/lib/berkas/upload-helper'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({ success: false, error: 'GOOGLE_NOT_CONNECTED' }, { status: 401 })
    }

    const { dataUrl, docLabel, state, customerId, overwrite } = await req.json()
    if (!dataUrl || !docLabel || !state) {
      return NextResponse.json({ success: false, error: 'dataUrl, docLabel, state required' }, { status: 400 })
    }

    const drive = await getDriveClientOAuth()

    // Ensure customer folder exists
    const customerFolderId = await ensureCustomerFolder(state, customerId)

    // Build filename: [Nama Dokumen] - [Nama Debitur] - Blok dan No Rumah
    const customerName = state.applicant?.fullName || 'Konsumen'
    const block = state.property?.blockLetter || ''
    const houseNumber = state.property?.houseNumber || ''
    const blockUnit = block || houseNumber ? ` - ${block}${houseNumber}` : ''
    const baseFileName = `${docLabel} - ${customerName}${blockUnit}`

    // Parse data URL
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return NextResponse.json({ success: false, error: 'Invalid data URL' }, { status: 400 })
    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')

    // Determine file extension from mime type
    const ext = mimeType.includes('pdf') ? '.pdf' : mimeType.includes('png') ? '.png' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' : ''

    // === DINA v2: Anti-duplicate check ===
    // Compute hash and check if same file already exists for this customer
    const fileHash = await computeFileHash(buffer)
    if (customerId) {
      const duplicate = await checkDuplicateFile(db, customerId, fileHash)
      if (duplicate) {
        // Skip upload, return existing file info
        return NextResponse.json({
          success: true,
          fileId: duplicate.docId,
          fileName: duplicate.fileName,
          webViewLink: duplicate.editUrl,
          skipped: true,
          reason: 'File dengan konten identik sudah ada (anti-duplicate)',
        })
      }
    }

    // === DINA v2: Anti-overwrite ===
    // NEVER delete existing file. Instead, list existing files and generate unique name.
    let existingNames: string[] = []
    try {
      const existing = await drive.files.list({
        q: `'${customerFolderId}' in parents and trashed=false`,
        fields: 'files(name)',
        spaces: 'drive',
        pageSize: 100,
      })
      existingNames = (existing.data.files || []).map((f: any) => f.name || '')
    } catch (e) {
      // Non-fatal
    }

    // Ignore legacy overwrite flag — always use unique naming now
    const uniqueName = generateUniqueFilename(`${baseFileName}${ext}`, existingNames)

    // Upload file to Drive
    const uploadRes = await drive.files.create({
      requestBody: {
        name: uniqueName,
        parents: [customerFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id, name, webViewLink',
    })

    // === DINA v2: Set permission — anyone with link = VIEWER ===
    try {
      await drive.permissions.create({
        fileId: uploadRes.data.id!,
        requestBody: {
          role: 'reader', // VIEW only, not commenter/editor
          type: 'anyone',
        },
      })
    } catch (permErr) {
      console.error('Set permission (non-fatal):', permErr)
    }

    // === DINA v2: Save to GoogleDoc table with hash + version ===
    try {
      // Determine docType from docLabel
      const docTypeMap: Record<string, string> = {
        'KTP': 'ktp',
        'KK': 'kk',
        'NPWP': 'npwp',
        'Akta Nikah': 'akta-nikah',
        'Slip Gaji': 'slip-gaji',
        'SK Kerja': 'sk-kerja',
        'NIB': 'nib',
        'Laporan Keuangan': 'laporan-keuangan',
        'Surat Belum Punya Rumah': 'surat-belum-rumah',
        'Sertifikat': 'sertifikat',
        'PBB': 'pbb',
      }
      const docType = docTypeMap[docLabel] || docLabel.toLowerCase().replace(/\s+/g, '-')

      // Get next version
      let version = 1
      if (customerId) {
        const latest = await db.googleDoc.findFirst({
          where: { customerId, docType },
          orderBy: { version: 'desc' },
          select: { version: true },
        })
        version = (latest?.version || 0) + 1
      }

      await db.googleDoc.create({
        data: {
          docId: uploadRes.data.id!,
          customerId: customerId || null,
          fileName: uniqueName,
          folderId: customerFolderId,
          docType,
          editUrl: uploadRes.data.webViewLink || '',
          fileHash,
          fileSize: buffer.length,
          version,
          isRaw: !uniqueName.startsWith('SIGNED'),
        },
      })
    } catch (dbErr) {
      console.error('Save GoogleDoc record (non-fatal):', dbErr)
    }

    // === DINA v2: Add history log entry ===
    if (customerId) {
      try {
        await db.customerHistoryLog.create({
          data: {
            customerId,
            eventType: 'DOC_UPLOADED',
            title: `${docLabel} diupload`,
            description: `File: ${uniqueName}`,
            metadata: JSON.stringify({ fileId: uploadRes.data.id, fileHash, fileSize: buffer.length }),
            source: 'MANUAL',
          },
        })
      } catch (histErr) {
        console.error('History log (non-fatal):', histErr)
      }
    }

    return NextResponse.json({
      success: true,
      fileId: uploadRes.data.id,
      fileName: uploadRes.data.name,
      webViewLink: uploadRes.data.webViewLink,
      fileHash,
      version: uniqueName.match(/v(\d+)/)?.[1] ? parseInt(uniqueName.match(/v(\d+)/)![1], 10) : 1,
      skipped: false,
    })
  } catch (err: any) {
    console.error('upload-file error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
