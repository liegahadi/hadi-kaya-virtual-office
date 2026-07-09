import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// PATCH /api/approvals/[id] - Approve or Reject
// Body: { status: 'APPROVED' | 'REJECTED', notes?: string, signatureUrl?: string }
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, notes, signatureUrl } = body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    const updated = await db.approval.update({
      where: { id },
      data: {
        status,
        notes: notes || null,
        signatureUrl: signatureUrl || null,
        respondedAt: new Date(),
      },
      include: {
        agent: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/approvals/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update approval' },
      { status: 500 }
    )
  }
}

// ============================================================
// GET /api/approvals/[id] - Get single approval detail
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const approval = await db.approval.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: approval })
  } catch (error) {
    console.error('GET /api/approvals/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval' },
      { status: 500 }
    )
  }
}
