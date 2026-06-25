import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/customers/[id] - Get customer detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        units: true,
        bankPipelines: true,
        conversations: { take: 5, orderBy: { updatedAt: 'desc' } },
      },
    })
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('GET customer error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Build update data - only include fields that exist in schema
    const updateData: any = {}
    const allowedFields = [
      'name', 'whatsappNumber', 'phone', 'email', 'occupation', 'maritalStatus',
      'monthlyIncome', 'stage', 'stageUpdatedAt', 'notes',
      'nik', 'birthPlace', 'birthDate', 'gender', 'ktpAddress', 'rtRw',
      'kelurahan', 'kecamatan', 'city', 'postalCode', 'religion',
      'companyName', 'companyAddress', 'companyPhone', 'workDuration', 'workPosition',
      'bankName', 'bankAccount', 'npwpNumber', 'btnAccountNumber',
      'spouseName', 'spouseNik', 'spouseBirthPlace', 'spouseBirthDate',
      'spouseOccupation', 'spouseAddress', 'spouseIncome', 'motherMaidenName', 'emergencyContact',
      'dependents', 'dateOfDocument',
      'closingDate', 'berkasLengkapDate', 'berkasMasukBankDate',
      'sp3kDate', 'akadDate', 'berkasLengkap',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('PATCH customer error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
