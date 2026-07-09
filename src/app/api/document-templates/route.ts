import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================
// GET /api/document-templates - List templates
// Query: bankName (MANDIRI | BTN | SUMSELBABEL | umum)
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const bankName = url.searchParams.get('bankName')

    const where: Record<string, unknown> = { isActive: true }
    if (bankName) where.bankName = bankName

    const templates = await db.documentTemplate.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { templateName: 'asc' }],
    })

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error('GET templates error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// POST /api/document-templates - Upload new template
// Multipart: file + bankName + templateName + type + category + description + isRequired
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bankName = formData.get('bankName') as string
    const templateName = formData.get('templateName') as string
    const type = formData.get('type') as string || 'FORM'
    const category = formData.get('category') as string || 'OTHER'
    const description = formData.get('description') as string || ''
    const isRequired = formData.get('isRequired') === 'true'

    if (!file || !bankName || !templateName) {
      return NextResponse.json(
        { success: false, error: 'file, bankName, templateName required' },
        { status: 400 }
      )
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads', 'bank-templates', bankName)
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const fileExt = path.extname(file.name) || '.pdf'
    const fileName = `${bankName}_${category}_${Date.now()}${fileExt}`
    const filePath = path.join(uploadDir, fileName)
    const fileUrl = `/uploads/bank-templates/${bankName}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    // Get sort order (max + 1)
    const lastTemplate = await db.documentTemplate.findFirst({
      where: { bankName },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const sortOrder = (lastTemplate?.sortOrder || 0) + 1

    // Save to DB
    const template = await db.documentTemplate.create({
      data: {
        bankName,
        templateName,
        templateUrl: fileUrl,
        fileSize: buffer.length,
        mimeType: file.type || 'application/pdf',
        type,
        category,
        description,
        isRequired,
        sortOrder,
      },
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: `Template "${templateName}" uploaded for ${bankName}`,
    })
  } catch (error) {
    console.error('Upload template error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE /api/document-templates?id=xxx
// ============================================================

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    const template = await db.documentTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // Delete file
    const filePath = path.join(process.cwd(), template.templateUrl)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await db.documentTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
