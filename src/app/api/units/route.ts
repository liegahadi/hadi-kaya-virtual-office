import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/units - List all units with filters
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')
    const projectId = req.nextUrl.searchParams.get('projectId')

    const units = await db.unit.findMany({
      where: {
        AND: [
          status ? { status } : {},
          projectId ? { projectId } : {},
        ],
      },
      include: {
        project: true,
        customer: true,
        _count: {
          select: { materialUsages: true, progressPhotos: true },
        },
      },
      orderBy: [{ blockNumber: 'asc' }],
    })

    return NextResponse.json({ success: true, data: units })
  } catch (error) {
    console.error('GET /api/units error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/units - Update unit status (e.g. mark as SOLD/BOOKED)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, customerId } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Unit id required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (customerId !== undefined) updateData.customerId = customerId
    if (status === 'SOLD') updateData.soldAt = new Date()
    if (status === 'BOOKED') updateData.bookedAt = new Date()
    if (status === 'AVAILABLE') {
      updateData.soldAt = null
      updateData.bookedAt = null
      updateData.customerId = null
    }

    const updated = await db.unit.update({
      where: { id },
      data: updateData,
      include: { project: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/units error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
