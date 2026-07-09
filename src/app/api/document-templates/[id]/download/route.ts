import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/document-templates/[id]/download - Download template file
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.documentTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), template.templateUrl)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const fileName = `${template.bankName}_${template.templateName.replace(/\s+/g, '_')}.pdf`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': template.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download template error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
