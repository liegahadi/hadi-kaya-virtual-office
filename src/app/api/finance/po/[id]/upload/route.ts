// POST /api/finance/po/[id]/upload — upload files (nota images, bukti transfer) untuk PO
// Saves to: /home/z/my-project/uploads/po/[poId]/[category]/[timestamp]-[filename]
// Returns: array of { path, url, fileName, fileSize }
//
// Categories:
//   - nota            → bukti nota dari toko
//   - bukti-transfer  → bukti transfer pembayaran
//   - bkk             → bukti kas keluar
//   - lainnya         → file lain terkait PO

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: poId } = await params
    const formData = await req.formData()

    const category = (formData.get('category') as string) || 'lainnya'
    const paymentId = (formData.get('paymentId') as string) || null  // if bukti-transfer for specific payment
    const notaId = (formData.get('notaId') as string) || null  // if nota image

    const files = formData.getAll('files') as File[]
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 })
    }

    // Verify PO exists
    const po = await db.purchaseOrder.findUnique({ where: { id: poId } })
    if (!po) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })

    // Build destination directory
    const baseDir = join(process.cwd(), 'uploads', 'po', poId, category)
    if (!existsSync(baseDir)) {
      await mkdir(baseDir, { recursive: true })
    }

    // Save each file
    const savedFiles = []
    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
        continue  // Skip non-image, non-PDF files
      }

      const ext = file.name.split('.').pop() || 'png'
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).slice(2, 8)
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50)
      const fileName = `${timestamp}-${randomSuffix}-${safeFileName}`
      const filePath = join(baseDir, fileName)

      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, buffer)

      const publicPath = `/uploads/po/${poId}/${category}/${fileName}`

      savedFiles.push({
        path: publicPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category,
        paymentId,
        notaId,
      })
    }

    return NextResponse.json({
      success: true,
      files: savedFiles,
      count: savedFiles.length,
    })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { success: false, error: String(err?.message || err).substring(0, 500) },
      { status: 500 }
    )
  }
}

// GET — list uploaded files for a PO (optionally filtered by category/paymentId/notaId)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: poId } = await params
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const baseDir = join(process.cwd(), 'uploads', 'po', poId, category || '')
    if (!existsSync(baseDir)) {
      return NextResponse.json({ success: true, files: [] })
    }

    const { readdirSync, statSync } = await import('fs')
    const files = readdirSync(baseDir).map(fileName => {
      const filePath = join(baseDir, fileName)
      const stat = statSync(filePath)
      return {
        path: `/uploads/po/${poId}/${category || ''}/${fileName}`,
        fileName,
        fileSize: stat.size,
        uploadedAt: stat.mtime,
        category,
      }
    })

    return NextResponse.json({ success: true, files })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message || err).substring(0, 500) },
      { status: 500 }
    )
  }
}
