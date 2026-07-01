// Company Settings API
// GET /api/company-settings - Get global company settings (director info + bank accounts)
// PUT /api/company-settings - Update global company settings
//
// Stored in CompanySetting table with id='default' (single global record)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - returns current company settings (or default values if not set)
export async function GET() {
  try {
    let settings = await db.companySetting.findUnique({ where: { id: 'default' } })

    // Create with default values if not exists
    if (!settings) {
      settings = await db.companySetting.create({
        data: {
          id: 'default',
          companyName: 'PT. MARLINDO BANGUN PERSADA',
          directorName: 'ANDRIAN BONG',
          directorNik: '1971040409720004',
          city: 'Pangkalpinang',
          btnAccount: '00209 0130 000 3316',
          mandiriAccount: '',
          bsbAccount: '',
          btnBranch: 'BTN Cabang Pangkalpinang',
          mandiriBranch: '',
          bsbBranch: '',
        },
      })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('GET company-settings error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// PUT - update company settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    const allowedFields = [
      'companyName', 'directorName', 'directorNik', 'city',
      'btnAccount', 'mandiriAccount', 'bsbAccount',
      'btnBranch', 'mandiriBranch', 'bsbBranch',
    ]

    const data: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field] === '' ? null : String(body[field])
      }
    }

    // Upsert (create if not exists, update if exists)
    const settings = await db.companySetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('PUT company-settings error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}
