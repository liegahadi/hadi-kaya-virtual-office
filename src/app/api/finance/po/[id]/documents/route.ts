import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================
// GET /api/finance/po/[id]/documents - List all documents for a PO
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documents = await db.pODocument.findMany({
      where: { poId: id },
      orderBy: { uploadedAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    console.error('Get PO documents error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// POST /api/finance/po/[id]/documents - Upload document (nota, transfer, foto)
// Multipart form-data: file + type + notes (optional)
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // NOTA_MERAH | NOTA_PUTIH | BUKTI_TRANSFER | BUKTI_FOTO | OTHER
    const notes = formData.get('notes') as string | null

    if (!file || !type) {
      return NextResponse.json(
        { success: false, error: 'file and type required' },
        { status: 400 }
      )
    }

    // Verify PO exists
    const po = await db.pO.findUnique({ where: { id }, select: { poNumber: true } })
    if (!po) {
      return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads', 'po-documents', po.poNumber)
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const fileExt = path.extname(file.name) || '.jpg'
    const fileName = `${type}_${Date.now()}${fileExt}`
    const filePath = path.join(uploadDir, fileName)
    const fileUrl = `/uploads/po-documents/${po.poNumber}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    // Save to DB
    const document = await db.pODocument.create({
      data: {
        poId: id,
        type,
        fileName: file.name,
        fileUrl,
        fileSize: buffer.length,
        mimeType: file.type,
        uploadedBy: 'Owner',
        ocrStatus: 'NONE',
      },
    })

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error('Upload PO document error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE /api/finance/po/[id]/documents - Delete a document
// Query: ?docId=xxx
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const docId = url.searchParams.get('docId')

    if (!docId) {
      return NextResponse.json({ success: false, error: 'docId required' }, { status: 400 })
    }

    const doc = await db.pODocument.findFirst({
      where: { id: docId, poId: id },
    })

    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    // Delete file from disk (except PO type which is auto-generated)
    if (doc.type !== 'PO') {
      const filePath = path.join(process.cwd(), doc.fileUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await db.pODocument.delete({ where: { id: docId } })

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    console.error('Delete PO document error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
