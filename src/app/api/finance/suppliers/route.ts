// GET /api/finance/suppliers — list suppliers
// POST /api/finance/suppliers — create supplier
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } },
      ]
    }

    const suppliers = await db.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: suppliers })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supplier = await db.supplier.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        contactPerson: body.contactPerson || null,
        bankName: body.bankName || null,
        bankAccount: body.bankAccount || null,
        bankHolder: body.bankHolder || null,
      },
    })
    return NextResponse.json({ success: true, data: supplier })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
