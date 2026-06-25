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
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Type definitions for field coercion
    const floatFields = ['monthlyIncome', 'spouseIncome']
    const intFields = ['dependents', 'fileSize', 'sortOrder']
    const booleanFields = ['berkasLengkap', 'hasExistingLoan', 'hasExistingHouse', 'isExistingMigration', 'isRequired', 'isActive']
    const dateFields = ['closingDate', 'berkasLengkapDate', 'berkasMasukBankDate', 'sp3kDate', 'akadDate', 'stageUpdatedAt', 'submittedAt', 'sp3kAt', 'akadAt', 'rejectAt', 'bookedAt', 'uploadedAt']

    // All allowed string fields
    const stringFields = [
      'name', 'whatsappNumber', 'phone', 'email', 'occupation', 'maritalStatus',
      'stage', 'notes',
      'nik', 'birthPlace', 'birthDate', 'gender', 'ktpAddress', 'rtRw',
      'kelurahan', 'kecamatan', 'city', 'postalCode', 'religion',
      'companyName', 'companyAddress', 'companyPhone', 'workDuration', 'workPosition',
      'bankName', 'bankAccount', 'npwpNumber', 'btnAccountNumber',
      'spouseName', 'spouseNik', 'spouseBirthPlace', 'spouseBirthDate',
      'spouseOccupation', 'spouseAddress', 'motherMaidenName', 'emergencyContact',
      'dateOfDocument', 'akadNumber', 'lpaNumber', 'personalityPreference', 'sourceLead', 'assignedAgentId',
    ]

    const updateData: any = {}

    // Process string fields - skip empty strings and null
    for (const field of stringFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        updateData[field] = String(body[field])
      }
    }

    // Process float fields - coerce to number
    for (const field of floatFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        const num = parseFloat(body[field])
        if (!isNaN(num)) updateData[field] = num
      }
    }

    // Process int fields - coerce to number
    for (const field of intFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        const num = parseInt(body[field])
        if (!isNaN(num)) updateData[field] = num
      }
    }

    // Process boolean fields - coerce to boolean
    for (const field of booleanFields) {
      if (body[field] !== undefined && body[field] !== null) {
        updateData[field] = body[field] === true || body[field] === 'true' || body[field] === 1 || body[field] === '1'
      }
    }

    // Process date fields - convert to ISO string or Date
    for (const field of dateFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        try {
          updateData[field] = new Date(body[field])
        } catch {
          // skip invalid date
        }
      }
    }

    console.log('PATCH customer updateData keys:', Object.keys(updateData))

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: customer })
  } catch (error: any) {
    console.error('PATCH customer error:', error)

    // Extract the most useful part of Prisma error
    let errorMsg = 'Unknown error'
    if (error?.message) {
      // Prisma validation errors are long - extract key part
      const msg = error.message
      if (msg.includes('Unknown field')) {
        errorMsg = msg.match(/Unknown field `[^`]+`/)?.[0] || msg.substring(0, 200)
      } else if (msg.includes('Invalid value')) {
        errorMsg = msg.match(/Invalid value[^.]*/)?.[0] || msg.substring(0, 200)
      } else if (msg.includes('required')) {
        errorMsg = msg.match(/Argument `[^`]+` is missing[^.]*/)?.[0] || msg.substring(0, 200)
      } else {
        errorMsg = msg.substring(0, 500)
      }
    } else {
      errorMsg = String(error).substring(0, 500)
    }

    return NextResponse.json({ success: false, error: errorMsg, fullError: String(error).substring(0, 1000) }, { status: 500 })
  }
}
