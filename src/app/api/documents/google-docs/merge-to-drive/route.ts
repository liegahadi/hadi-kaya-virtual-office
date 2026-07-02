// POST /api/documents/google-docs/merge-to-drive
// Merges all uploaded files into 1 PDF, uploads to Google Drive, returns download URL
// Naming: [Jenis Dokumen] - [Nama Debitur] - Blok dan No Rumah
// Example: "Data Entry BTN - Jenni - E5"
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { PDFDocument } from 'pdf-lib'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected } from '@/lib/google/auth'
import { ensureCustomerFolder } from '@/lib/google/folders'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    if (!isOAuthConfigured() || !(await isGoogleConnected())) {
      return NextResponse.json({ success: false, error: 'GOOGLE_NOT_CONNECTED' }, { status: 401 })
    }

    const { files, mergeLabel, state, customerId } = await req.json()
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files to merge' }, { status: 400 })
    }

    const drive = await getDriveClientOAuth()
    const customerFolderId = await ensureCustomerFolder(state, customerId)

    // Build filename: [Jenis Dokumen] - [Nama Debitur] - Blok dan No Rumah
    const customerName = state.applicant?.fullName || 'Konsumen'
    const block = state.property?.blockLetter || ''
    const houseNumber = state.property?.houseNumber || ''
    const blockUnit = block || houseNumber ? ` - ${block}${houseNumber}` : ''
    const fileName = `${mergeLabel} - ${customerName}${blockUnit}.pdf`

    // Merge all files into 1 PDF
    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
      try {
        const match = file.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (!match) continue
        const mimeType = match[1]
        const buffer = Buffer.from(match[2], 'base64')

        if (mimeType.includes('pdf')) {
          // PDF: add all pages
          const srcPdf = await PDFDocument.load(buffer)
          const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices())
          pages.forEach(p => mergedPdf.addPage(p))
        } else if (mimeType.startsWith('image/')) {
          // Image: embed as full page
          let img
          if (mimeType.includes('png')) {
            img = await mergedPdf.embedPng(buffer)
          } else {
            img = await mergedPdf.embedJpg(buffer)
          }
          const page = mergedPdf.addPage([595, 842]) // A4
          const scale = Math.min(page.getWidth() / img.width, page.getHeight() / img.height)
          const w = img.width * scale
          const h = img.height * scale
          page.drawImage(img, { x: (page.getWidth() - w) / 2, y: (page.getHeight() - h) / 2, width: w, height: h })
        }
      } catch (e) {
        console.error('Failed to add file to merge:', file.docId, e)
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json({ success: false, error: 'No valid files to merge' }, { status: 400 })
    }

    const pdfBytes = await mergedPdf.save()

    // Overwrite: delete existing file with same name
    try {
      const existing = await drive.files.list({
        q: `name='${fileName}' and '${customerFolderId}' in parents and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
        pageSize: 1,
      })
      if (existing.data.files && existing.data.files.length > 0) {
        await drive.files.delete({ fileId: existing.data.files[0].id! })
      }
    } catch {}

    // Upload merged PDF to Drive
    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [customerFolderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(Buffer.from(pdfBytes)),
      },
      fields: 'id, name, webViewLink',
    })

    // Also return the PDF as download
    const downloadUrl = `/api/documents/google-docs/${uploadRes.data.id}/download`

    return NextResponse.json({
      success: true,
      fileId: uploadRes.data.id,
      fileName: uploadRes.data.name,
      webViewLink: uploadRes.data.webViewLink,
      downloadUrl,
      pageCount: mergedPdf.getPageCount(),
    })
  } catch (err: any) {
    console.error('merge-to-drive error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 })
  }
}
