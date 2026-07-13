import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/database-explorer/finance?q=search
// Returns POs, fund requests, supplier payments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    const data: any[] = []

    // Fetch POs
    try {
      const pos = await db.pO.findMany({
        where: q ? { OR: [{ poNumber: { contains: q } }, { workItem: { contains: q } }, { notes: { contains: q } }] } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const po of pos) {
        data.push({
          id: po.id,
          type: 'Purchase Order',
          amount: po.totalAmount || 0,
          status: po.status || 'UNKNOWN',
          description: po.workItem || po.poNumber || po.notes || '',
          createdAt: po.createdAt,
        })
      }
    } catch (e) {
      // PO table might not exist
    }

    // Fetch Fund Requests
    try {
      const frs = await db.fundRequest.findMany({
        where: q ? { notes: { contains: q } } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const fr of frs) {
        data.push({
          id: fr.id,
          type: 'Fund Request',
          amount: fr.amount || 0,
          status: fr.status || 'UNKNOWN',
          description: fr.notes || '',
          createdAt: fr.createdAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Fetch Supplier Payments
    try {
      const sps = await db.supplierPayment.findMany({
        where: q ? { notes: { contains: q } } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      for (const sp of sps) {
        data.push({
          id: sp.id,
          type: 'Supplier Payment',
          amount: sp.amount || 0,
          status: sp.method || 'TRANSFER',
          description: sp.notes || '',
          createdAt: sp.createdAt,
        })
      }
    } catch (e) {
      // table might not exist
    }

    // Sort by createdAt desc
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ success: true, data, meta: { total: data.length } })
  } catch (err: any) {
    console.error('[database-explorer/finance] error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
