import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/customers/create?projectId=xxx - List customers by project
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const customers = await db.customer.findMany({
      where: projectId ? { projectId } : {},
      include: {
        units: { select: { blockNumber: true, landSize: true } },
        bankPipelines: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: customers })
  } catch (error) {
    console.error('GET customers error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}

// POST /api/customers/create - Create new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, whatsappNumber, unitBlock, bankName, projectId } = body
    if (!name || !projectId) {
      return NextResponse.json({ success: false, error: 'name and projectId required' }, { status: 400 })
    }
    const customer = await db.customer.create({
      data: {
        projectId,
        name,
        whatsappNumber: whatsappNumber || null,
        stage: 'BOOKING',
        stageUpdatedAt: new Date(),
      },
    })
    // Assign unit if provided
    if (unitBlock) {
      const unit = await db.unit.findFirst({ where: { projectId, blockNumber: unitBlock, status: 'AVAILABLE' } })
      if (unit) {
        await db.unit.update({
          where: { id: unit.id },
          data: { status: 'BOOKED', customerId: customer.id, bookedAt: new Date() },
        })
      }
    }
    // Create bank pipeline if bankName provided
    if (bankName) {
      await db.bankPipeline.create({
        data: { customerId: customer.id, bankName, status: 'NOT_SUBMITTED' },
      })
    }
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('POST customers error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 300) }, { status: 500 })
  }
}
