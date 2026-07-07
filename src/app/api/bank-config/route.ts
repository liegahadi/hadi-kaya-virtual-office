// Bank Config API
// GET  /api/bank-config — list all active banks
// POST /api/bank-config — create new bank
// PUT  /api/bank-config — update bank
// DELETE /api/bank-config?id=X — delete bank (soft delete)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET — list all active banks
export async function GET() {
  try {
    const banks = await db.bankConfig.findMany({
      where: { isActive: true },
      orderBy: { bankName: 'asc' },
    })
    return NextResponse.json({ success: true, data: banks })
  } catch (error) {
    console.error('GET bank-config error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// POST — create new bank
export async function POST(req: NextRequest) {
  try {
    const { bankCode, bankName, description, templatePath, documents, createdBy } = await req.json()
    if (!bankCode || !bankName) {
      return NextResponse.json({ success: false, error: 'bankCode and bankName required' }, { status: 400 })
    }

    // Check if bankCode already exists
    const existing = await db.bankConfig.findUnique({ where: { bankCode: bankCode.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ success: false, error: `Bank dengan kode ${bankCode} sudah ada` }, { status: 400 })
    }

    const bank = await db.bankConfig.create({
      data: {
        bankCode: bankCode.toUpperCase(),
        bankName,
        description: description || null,
        templatePath: templatePath || null,
        documents: documents || null,
        createdBy: createdBy || 'owner',
      },
    })

    return NextResponse.json({ success: true, data: bank })
  } catch (error) {
    console.error('POST bank-config error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// PUT — update bank
export async function PUT(req: NextRequest) {
  try {
    const { id, bankName, description, templatePath, documents } = await req.json()
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const data: any = { updatedAt: new Date() }
    if (bankName !== undefined) data.bankName = bankName
    if (description !== undefined) data.description = description
    if (templatePath !== undefined) data.templatePath = templatePath
    if (documents !== undefined) data.documents = documents

    const bank = await db.bankConfig.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: bank })
  } catch (error) {
    console.error('PUT bank-config error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// DELETE — soft delete bank
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await db.bankConfig.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true, message: 'Bank dihapus (soft delete)' })
  } catch (error) {
    console.error('DELETE bank-config error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}
