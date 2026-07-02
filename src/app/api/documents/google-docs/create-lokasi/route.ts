// POST /api/documents/google-docs/create-lokasi
// Creates a Google Doc for "Lokasi Tempat Kerja" with:
// - Google Maps link + short link + search keyword
// - Tampak Depan photo (embedded)
// - Tampak Dalam photo (embedded)
// - Opening hours, shift debitur, No HP pemilik
//
// The .docx is generated on-the-fly with actual photos embedded (base64 → Buffer),
// then uploaded to Google Drive and converted to Google Docs format.
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  BorderStyle, PageBreak, HeadingLevel,
} from 'docx'
import { getDriveClientOAuth, isOAuthConfigured, isGoogleConnected, getDriveClient, isGoogleConfigured } from '@/lib/google/auth'
import { ensureCustomerFolder } from '@/lib/google/folders'
import { fetchStaticMap, hasMapsApiKey } from '@/lib/google/static-map'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

// Convert base64 data URL to Buffer
function dataUrlToBuffer(dataUrl: string): Buffer | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null
  const base64 = dataUrl.split(',')[1]
  if (!base64) return null
  return Buffer.from(base64, 'base64')
}

function getImageType(dataUrl: string): 'png' | 'jpg' | 'jpeg' | 'gif' | undefined {
  const match = dataUrl.match(/^data:image\/(\w+)/)
  return match ? (match[1] as any) : undefined
}

export async function POST(req: NextRequest) {
  try {
    // Auth check (same as create route)
    let drive: any
    let usingOAuth = false

    if (isOAuthConfigured()) {
      const connected = await isGoogleConnected()
      if (!connected) {
        return NextResponse.json({
          success: false,
          error: 'GOOGLE_NOT_CONNECTED',
          message: 'Owner belum login Google.',
        }, { status: 401 })
      }
      drive = await getDriveClientOAuth()
      usingOAuth = true
    } else if (isGoogleConfigured()) {
      drive = getDriveClient()
    } else {
      return NextResponse.json({ success: false, error: 'Google not configured' }, { status: 500 })
    }

    const { state, customerId } = await req.json()
    if (!state) {
      return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 })
    }

    const a = state.applicant || {}
    const projectName = state?.property?.projectName || 'Anjayo 16'

    // Build folder structure
    let customerFolderId: string | undefined = undefined
    if (usingOAuth) {
      try {
        customerFolderId = await ensureCustomerFolder(state, customerId)
      } catch (e) {
        console.error('Folder creation error:', e)
      }
    }

    // Build document content
    const children: any[] = []

    // Title
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: 'Lokasi Maps', bold: true, size: 32 })],
    }))

    // Google Maps link
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: 'Link google maps :', bold: true, size: 22 })],
    }))

    const shortLink = a.workplaceMapsShortLink || a.workplaceMapsLink || ''
    if (shortLink) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: shortLink, size: 22, color: '0000FF' })],
      }))
    }

    // Search keyword hint removed per user request

    // === GAMBAR PETA DARI GOOGLE MAPS (Static Maps API) ===
    // Auto-fetch static map image if GOOGLE_MAPS_API_KEY is set
    // Otherwise, check for manual screenshot upload (workplaceMapScreenshot)
    let mapImageBuf: Buffer | null = null
    let mapSource: string = ''

    // Try auto-fetch from Google Static Maps API
    if (hasMapsApiKey() && (a.workplaceMapsLink || a.workplaceMapsShortLink)) {
      try {
        mapImageBuf = await fetchStaticMap(a.workplaceMapsLink || a.workplaceMapsShortLink, { width: 600, height: 400, zoom: 16 })
        if (mapImageBuf) mapSource = 'google-static-maps'
      } catch (e) {
        console.error('Static map fetch error:', e)
      }
    }

    // Fallback: use manual screenshot upload (workplaceMapScreenshot field)
    if (!mapImageBuf && a.workplaceMapScreenshot) {
      const screenshotBuf = dataUrlToBuffer(a.workplaceMapScreenshot)
      if (screenshotBuf) {
        mapImageBuf = screenshotBuf
        mapSource = 'manual-screenshot'
      }
    }

    // Embed map image in document
    if (mapImageBuf) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: 'Denah / Lokasi Google Maps', bold: true, size: 22 })],
      }))
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new ImageRun({
          data: new Uint8Array(mapImageBuf),
          transformation: { width: 500, height: 350 },
        } as any)],
      }))
    } else if (a.workplaceMapsLink || a.workplaceMapsShortLink) {
      // No image available, show note
      children.push(new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: 'Denah / Lokasi Google Maps', bold: true, size: 22 })],
      }))
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({
          text: hasMapsApiKey()
            ? '[Gagal fetch gambar peta. Buka link di atas untuk lihat peta]'
            : '[Set GOOGLE_MAPS_API_KEY untuk auto-generate gambar peta, atau upload screenshot manual]',
          size: 20, italics: true, color: '999999',
        })],
      }))
    }

    // Tampak Depan
    children.push(new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'Tampak Depan Lokasi tempat kerja', bold: true, size: 22 })],
    }))

    const frontPhotoBuf = a.workplaceFrontPhoto ? dataUrlToBuffer(a.workplaceFrontPhoto) : null
    if (frontPhotoBuf) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new ImageRun({
          data: new Uint8Array(frontPhotoBuf),
          transformation: { width: 400, height: 300 },
        } as any)],
      }))
    } else {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: '[Belum ada foto tampak depan]', size: 20, italics: true, color: '999999' })],
      }))
    }

    // Tampak Dalam
    children.push(new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'Tampak Dalam Lokasi tempat kerja', bold: true, size: 22 })],
    }))

    const insidePhotoBuf = a.workplaceInsidePhoto ? dataUrlToBuffer(a.workplaceInsidePhoto) : null
    if (insidePhotoBuf) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new ImageRun({
          data: new Uint8Array(insidePhotoBuf),
          transformation: { width: 400, height: 300 },
        } as any)],
      }))
    } else {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: '[Belum ada foto tampak dalam]', size: 20, italics: true, color: '999999' })],
      }))
    }

    // Opening Hours / Info section
    children.push(new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [new TextRun({ text: 'Opening Hours', bold: true, size: 22 })],
    }))

    if (a.workplaceJamOperasional) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: a.workplaceJamOperasional, size: 22 })],
      }))
    }

    // Shift Debitur (pakai workplaceWaktuHubungi)
    if (a.workplaceWaktuHubungi) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Shift Debitur : ', bold: true, size: 22 }),
          new TextRun({ text: a.workplaceWaktuHubungi, size: 22 }),
        ],
      }))
    }

    // No HP Pemilik (pakai atasanName + atasanNip)
    if (a.atasanName || a.atasanNip) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'No HP Pemilik : ', bold: true, size: 22 }),
          new TextRun({ text: `${a.atasanName || ''} ${a.atasanNip ? `(${a.atasanNip})` : ''}`, size: 22 }),
        ],
      }))
    }

    // Alamat
    if (a.companyAddress) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Alamat : ', bold: true, size: 22 }),
          new TextRun({ text: a.companyAddress, size: 22 }),
        ],
      }))
    }

    // Generate .docx
    const doc = new Document({
      creator: 'Hadi Kaya Virtual Office',
      title: `Lokasi Tempat Kerja - ${a.fullName || 'Konsumen'}`,
      sections: [{
        properties: {
          page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
        },
        children,
      }],
    })

    const docxBuffer = await Packer.toBuffer(doc)

    // Upload to Google Drive and convert to Google Docs
    const fileName = `Lokasi_Kerja_${a.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}`
    const requestBody: any = {
      name: fileName,
      mimeType: 'application/vnd.google-apps.document',
    }
    if (customerFolderId) {
      requestBody.parents = [customerFolderId]
    }

    const uploadRes = await drive.files.create({
      requestBody,
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Readable.from(docxBuffer),
      },
      fields: 'id, name, webViewLink',
    })

    const docId = uploadRes.data.id
    if (!docId) {
      return NextResponse.json({ success: false, error: 'Failed to create Google Doc' }, { status: 500 })
    }

    // Save to DB
    try {
      await db.googleDoc.create({
        data: {
          docId,
          customerId: customerId || null,
          fileName,
          folderId: customerFolderId || null,
          docType: 'lokasi-kerja',
          editUrl: `https://docs.google.com/document/d/${docId}/edit`,
        },
      })
    } catch (e) {
      console.error('DB save error (non-fatal):', e)
    }

    const editUrl = `https://docs.google.com/document/d/${docId}/edit`
    const embedUrl = `https://docs.google.com/document/d/${docId}/edit?rm=minimal&ui=2`
    const downloadUrl = `/api/documents/google-docs/${docId}/download`

    return NextResponse.json({
      success: true,
      docId,
      fileName,
      editUrl,
      embedUrl,
      downloadUrl,
      usingOAuth,
      folderId: customerFolderId,
    })
  } catch (err: any) {
    console.error('create-lokasi error:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to create Lokasi Kerja doc',
    }, { status: 500 })
  }
}
