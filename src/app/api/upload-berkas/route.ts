import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const docId = formData.get('docId') as string
    const customerId = formData.get('customerId') as string
    const docName = formData.get('docName') as string

    if (!file || !docId || !customerId) {
      return NextResponse.json({ success: false, error: 'file, docId, customerId required' }, { status: 400 })
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads', 'berkas', customerId)
    await fs.mkdir(uploadDir, { recursive: true })

    const fileExt = path.extname(file.name) || '.jpg'
    const fileName = `${docId}_${Date.now()}${fileExt}`
    const filePath = path.join(uploadDir, fileName)
    const fileUrl = `/uploads/berkas/${customerId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      data: { fileUrl, fileName, fileSize: buffer.length, docId, docName },
    })
  } catch (error) {
    console.error('Upload berkas error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 200) }, { status: 500 })
  }
}
