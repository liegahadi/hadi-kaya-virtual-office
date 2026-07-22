// GET/PATCH/DELETE /api/finance/suppliers/[id]
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          take: 20,
          orderBy: { poDate: 'desc' },
          select: { id: true, poNumber: true, poDate: true, status: true, plannedTotal: true, actualTotal: true },
        },
      },
    })
    if (!supplier) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: supplier })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await db.supplier.update({
      where: { id },
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
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
