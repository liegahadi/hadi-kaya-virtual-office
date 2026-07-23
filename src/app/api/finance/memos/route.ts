// GET /api/finance/memos — list memos
// POST /api/finance/memos — create memo (with lines)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const memos = await db.memo.findMany({
      where,
      include: {
        lines: true,
        _count: { select: { lines: true } },
      },
      orderBy: { memoDate: 'desc' },
      take: 50,
    })

    // Compute totalAmount per memo
    const memosWithTotal = await Promise.all(memos.map(async (m) => {
      let total = 0
      for (const line of m.lines) {
        if (line.kind === 'PO') {
          const po = await db.purchaseOrder.findUnique({ where: { id: line.itemId }, select: { actualTotal: true, plannedTotal: true } })
          total += po?.actualTotal || po?.plannedTotal || 0
        } else if (line.kind === 'WAGE') {
          const w = await db.wagePayment.findUnique({ where: { id: line.itemId }, select: { amount: true } })
          total += w?.amount || 0
        } else if (line.kind === 'EXPENSE') {
          const e = await db.otherExpense.findUnique({ where: { id: line.itemId }, select: { amount: true } })
          total += e?.amount || 0
        }
      }
      return { ...m, totalAmount: total }
    }))

    return NextResponse.json({ success: true, data: memosWithTotal })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memoDate, notes, lines } = body

    if (!lines?.length) {
      return NextResponse.json({ success: false, error: 'lines required (at least 1 item)' }, { status: 400 })
    }

    // Generate memoNumber: MBP-{W|D}-{seq}-{MMYY}
    const date = memoDate ? new Date(memoDate) : new Date()
    const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`
    const type = body.type || 'W' // W=Weekly, D=Daily

    // Find max seq for this type+year
    const existingMemos = await db.memo.findMany({
      where: {
        memoNumber: { startsWith: `MBP-${type}-` },
        memoDate: {
          gte: new Date(date.getFullYear(), 0, 1),
          lt: new Date(date.getFullYear() + 1, 0, 1),
        },
      },
      select: { memoNumber: true },
    })
    let maxSeq = 0
    for (const m of existingMemos) {
      const match = m.memoNumber.match(new RegExp(`^MBP-${type}-(\\d+)-${monthYear}$`))
      if (match) {
        const seq = parseInt(match[1], 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }
    const nextSeq = maxSeq + 1
    const memoNumber = `MBP-${type}-${String(nextSeq).padStart(6, '0')}-${monthYear}`

    const memo = await db.memo.create({
      data: {
        memoNumber,
        memoDate: date,
        status: 'PROPOSED',
        notes: notes || null,
        lines: {
          create: lines.map((l: any) => ({
            kind: l.kind,
            itemId: l.itemId,
            proposedAmount: l.proposedAmount || 0,
            status: 'PROPOSED',
            dueDate: l.dueDate ? new Date(l.dueDate) : null,
          })),
        },
      },
      include: { lines: true },
    })

    return NextResponse.json({ success: true, data: memo })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
