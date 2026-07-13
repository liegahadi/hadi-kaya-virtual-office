// POST /api/bank-config/[id]/template
// DINA v2: Upload template PDF + annotation config for a bank
// This enables Bank Builder: add new bank + upload template + set annotations
//
// Body: { templatePdf (dataUrl), annotations (array of {page, x, y, width, height, label, fieldMapping}) }
// File saved to: Drive/Templates/[BankCode]/

import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { db } from '@/lib/db'
import { computeFileHash } from '@/lib/berkas/upload-helper'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id
    const body = await req.json()
    const { templatePdf, annotations, version } = body

    if (!templatePdf) {
      return NextResponse.json({ success: false, error: 'templatePdf required' }, { status: 400 })
    }

    // Verify bank exists
    const bank = await db.bankConfig.findUnique({ where: { id: bankId } })
    if (!bank) {
      return NextResponse.json({ success: false, error: 'Bank tidak ditemukan' }, { status: 404 })
    }

    // Parse dataUrl
    const match = templatePdf.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ success: false, error: 'Invalid data URL' }, { status: 400 })
    }
    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const fileHash = await computeFileHash(buffer)

    // Upload to Google Drive (if connected)
    let driveFileId: string | null = null
    let driveLink: string | null = null

    if (isOAuthConfigured() && await isGoogleConnected()) {
      try {
        const drive: any = await getDriveClientOAuth()

        // Ensure Templates folder exists
        const rootFolderName = 'Hadi Kaya Docs'
        const projectFolderName = 'ANJAYO 16'
        const templatesFolderName = 'Templates'

        // Find root
        let rootRes = await drive.files.list({
          q: `name='${rootFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id)',
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
        })
        let projId = projRes.data.files?.[0]?.id
        if (!projId) {
          const created = await drive.files.create({
            requestBody: { name: projectFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] },
            fields: 'id',
          })
          projId = created.data.id
        }

        // Find Templates folder
        let templRes = await drive.files.list({
          q: `name='${templatesFolderName}' and '${projId}' in parents and trashed=false`,
          fields: 'files(id)',
        })
        let templId = templRes.data.files?.[0]?.id
        if (!templId) {
          const created = await drive.files.create({
            requestBody: { name: templatesFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [projId] },
            fields: 'id',
          })
          templId = created.data.id
        }

        // Create bank subfolder
        let bankRes = await drive.files.list({
          q: `name='${bank.bankCode}' and '${templId}' in parents and trashed=false`,
          fields: 'files(id)',
        })
        let bankFolderId = bankRes.data.files?.[0]?.id
        if (!bankFolderId) {
          const created = await drive.files.create({
            requestBody: { name: bank.bankCode, mimeType: 'application/vnd.google-apps.folder', parents: [templId] },
            fields: 'id',
          })
          bankFolderId = created.data.id
        }

        // Upload template PDF
        const templateVersion = version || 1
        const templateName = `Template ${bank.bankCode} v${templateVersion}.pdf`

        const uploadRes = await drive.files.create({
          requestBody: {
            name: templateName,
            parents: [bankFolderId],
          },
          media: { mimeType, body: Readable.from(buffer) },
          fields: 'id, name, webViewLink',
        })

        driveFileId = uploadRes.data.id!
        driveLink = uploadRes.data.webViewLink || null

        // Set permission: anyone with link = VIEWER
        try {
          await drive.permissions.create({
            fileId: driveFileId,
            requestBody: { role: 'reader', type: 'anyone' },
          })
        } catch (permErr) {
          console.error('Set permission (non-fatal):', permErr)
        }
      } catch (driveErr) {
        console.error('Drive upload (non-fatal, will save annotation only):', driveErr)
      }
    }

    // Update bank config with template info + annotations
    const documents = annotations || []
    const updatedBank = await db.bankConfig.update({
      where: { id: bankId },
      data: {
        templatePath: driveLink || `local:${fileHash}`,
        documents: JSON.stringify({
          version: version || 1,
          fileId: driveFileId,
          fileHash,
          fileSize: buffer.length,
          annotations: documents,
          uploadedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        bank: updatedBank,
        template: {
          fileId: driveFileId,
          fileName: `Template ${bank.bankCode} v${version || 1}.pdf`,
          webViewLink: driveLink,
          fileHash,
          version: version || 1,
        },
        annotations: documents,
      },
    })
  } catch (err: any) {
    console.error('Bank template upload error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}

// GET — fetch current template info for a bank
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bank = await db.bankConfig.findUnique({ where: { id: params.id } })
    if (!bank) {
      return NextResponse.json({ success: false, error: 'Bank tidak ditemukan' }, { status: 404 })
    }

    let documents: any = null
    if (bank.documents) {
      try { documents = JSON.parse(bank.documents) } catch { documents = null }
    }

    return NextResponse.json({
      success: true,
      data: {
        bank,
        template: documents ? {
          fileId: documents.fileId,
          fileName: documents.fileName,
          webViewLink: bank.templatePath,
          fileHash: documents.fileHash,
          version: documents.version,
          annotations: documents.annotations || [],
        } : null,
      },
    })
  } catch (err: any) {
    console.error('Bank template GET error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
