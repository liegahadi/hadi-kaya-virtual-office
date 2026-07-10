import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/customer-history?customerId=xxx
// Returns all history logs for a customer, newest first
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 })
    }

    const logs = await db.customerHistoryLog.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (err: any) {
    console.error('[customer-history GET] error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

// POST /api/customer-history
// Add a new history log entry (manual or via DINA)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, eventType, title, description, oldValue, newValue, metadata, createdBy, source } = body

    if (!customerId || !eventType || !title || !description) {
      return NextResponse.json({ success: false, error: 'customerId, eventType, title, description required' }, { status: 400 })
    }

    const log = await db.customerHistoryLog.create({
      data: {
        customerId,
        eventType,
        title,
        description,
        oldValue: oldValue || null,
        newValue: newValue || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdBy: createdBy || null,
        source: source || 'MANUAL',
      },
    })

    return NextResponse.json({ success: true, data: log })
  } catch (err: any) {
    console.error('[customer-history POST] error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

// Helper function for other parts of the codebase to add history logs
export async function addHistoryLog(params: {
  customerId: string
  eventType: string
  title: string
  description: string
  oldValue?: string | null
  newValue?: string | null
  metadata?: any
  createdBy?: string | null
  source?: string
}) {
  try {
    await db.customerHistoryLog.create({
      data: {
        customerId: params.customerId,
        eventType: params.eventType,
        title: params.title,
        description: params.description,
        oldValue: params.oldValue || null,
        newValue: params.newValue || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        createdBy: params.createdBy || null,
        source: params.source || 'SYSTEM',
      },
    })
  } catch (err) {
    console.error('[addHistoryLog] non-fatal error:', err)
  }
}
