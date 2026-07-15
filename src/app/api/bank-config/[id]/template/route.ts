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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankId } = await params
    const body = await req.json()
    const { templatePdf, annotations, version, originalFileName, templateName, stage, mode, replaceTemplateId } = body

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
        // Naming: gunakan nama file asli yang diupload user + version suffix
        // Contoh: user upload "form_kosong_btn.pdf" → "form_kosong_btn v1.pdf"
        const templateVersion = version || 1
        let templateName: string
        if (originalFileName) {
          // Strip extension dari original name, lalu append version
          const baseName = originalFileName.replace(/\.[^.]+$/, '')
          const ext = originalFileName.match(/\.[^.]+$/)?.[0] || '.pdf'
          templateName = `${baseName} v${templateVersion}${ext}`
        } else {
          templateName = `Template ${bank.bankCode} v${templateVersion}.pdf`
        }

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
    // Support multi-template: simpan ke documents.templates array
    const newTemplate = {
      id: mode === 'replace' && replaceTemplateId ? replaceTemplateId : `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: templateName || 'Template',
      stage: stage || 'entry',
      fileId: driveFileId,
      fileName: templateName,
      webViewLink: driveLink,
      version: version || 1,
      uploadedAt: new Date().toISOString(),
      fileHash,
      fileSize: buffer.length,
      annotations: annotations || [],
    }

    // Get existing documents JSON
    let existingDocs: any = {}
    try {
      if (bank.documents) existingDocs = JSON.parse(bank.documents)
    } catch {}

    // Initialize templates array if not exists
    if (!existingDocs.templates) existingDocs.templates = []

    if (mode === 'replace' && replaceTemplateId) {
      // Replace existing template (keep old version in history)
      existingDocs.templates = existingDocs.templates.map((t: any) =>
        t.id === replaceTemplateId ? newTemplate : t
      )
    } else {
      // Add new template
      existingDocs.templates.push(newTemplate)
    }

    // Also keep legacy single-template fields for backward compat
    existingDocs.fileId = driveFileId
    existingDocs.fileHash = fileHash
    existingDocs.fileSize = buffer.length
    existingDocs.annotations = annotations || []
    existingDocs.uploadedAt = new Date().toISOString()
    existingDocs.version = version || 1

    const updatedBank = await db.bankConfig.update({
      where: { id: bankId },
      data: {
        templatePath: driveLink || `local:${fileHash}`,
        documents: JSON.stringify(existingDocs),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        bank: updatedBank,
        template: newTemplate,
        templates: existingDocs.templates,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bank = await db.bankConfig.findUnique({ where: { id } })
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
        templates: documents?.templates || [],
        stages: documents?.stages || null,
      },
    })
  } catch (err: any) {
    console.error('Bank template GET error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}

// ============================================================
// DELETE — Hapus template permanen
// URL: /api/bank-config/[id]/template?templateId=xxx
//
// Yang dihapus:
//   1. File fisik (local disk ATAU Google Drive)
//   2. Entry template di BankConfig.documents.templates array (DB)
//
// Yang TIDAK dihapus:
//   - Bank itu sendiri (bank delete dilarang permanen)
//   - Template lain di bank yang sama
//   - Annotation data yang sudah ter-generate di masa lalu
// ============================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankId } = await params
    const url = new URL(req.url)
    const templateId = url.searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId parameter wajib diisi' },
        { status: 400 }
      )
    }

    // Verify bank exists
    const bank = await db.bankConfig.findUnique({ where: { id: bankId } })
    if (!bank) {
      return NextResponse.json(
        { success: false, error: 'Bank tidak ditemukan' },
        { status: 404 }
      )
    }

    // Parse documents JSON
    let docs: any = {}
    if (bank.documents) {
      try { docs = JSON.parse(bank.documents) } catch {}
    }
    if (!docs.templates || !Array.isArray(docs.templates)) {
      return NextResponse.json(
        { success: false, error: 'Bank ini tidak punya templates' },
        { status: 404 }
      )
    }

    // Find the template to delete
    const tpl = docs.templates.find((t: any) => t.id === templateId)
    if (!tpl) {
      return NextResponse.json(
        { success: false, error: `Template dengan id ${templateId} tidak ditemukan` },
        { status: 404 }
      )
    }

    // Track what we deleted (for response)
    const deletedInfo: any = {
      templateId: tpl.id,
      templateName: tpl.name,
      version: tpl.version,
      storage: tpl.storage || (tpl.templatePath ? 'local' : tpl.fileId ? 'drive' : 'unknown'),
      localFileDeleted: false,
      driveFileDeleted: false,
    }

    // === STEP 1: Hapus file fisik ===
    // Local file
    if (tpl.templatePath) {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const fullPath = path.join(process.cwd(), tpl.templatePath.replace(/^\//, ''))
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
          deletedInfo.localFileDeleted = true
          deletedInfo.localPath = fullPath
        }
      } catch (err: any) {
        console.error('[template DELETE] local file delete failed:', err)
        // Continue — still remove from DB even if file delete fails
      }
    }

    // Google Drive file
    if (tpl.fileId) {
      try {
        const { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } = await import('@/lib/google/auth')
        if (isOAuthConfigured() && (await isGoogleConnected())) {
          const drive: any = await getDriveClientOAuth()
          await drive.files.delete({ fileId: tpl.fileId })
          deletedInfo.driveFileDeleted = true
          deletedInfo.driveFileId = tpl.fileId
        }
      } catch (err: any) {
        console.error('[template DELETE] Drive file delete failed:', err)
        // Continue — still remove from DB
      }
    }

    // === STEP 2: Hapus dari documents.templates array ===
    docs.templates = docs.templates.filter((t: any) => t.id !== templateId)

    // === STEP 3: Simpan kembali ke DB ===
    await db.bankConfig.update({
      where: { id: bankId },
      data: { documents: JSON.stringify(docs) },
    })

    return NextResponse.json({
      success: true,
      data: {
        deleted: deletedInfo,
        remainingTemplates: docs.templates.length,
        bankId,
        bankCode: bank.bankCode,
      },
    })
  } catch (err: any) {
    console.error('[template DELETE] error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete template' },
      { status: 500 }
    )
  }
}
