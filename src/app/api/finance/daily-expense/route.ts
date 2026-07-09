import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/finance/daily-expense - List daily expenses
// Query: projectId, category, startDate, endDate, limit
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const category = url.searchParams.get('category')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId
    if (category) where.category = category
    if (startDate || endDate) {
      where.paidAt = {}
      if (startDate) (where.paidAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.paidAt as Record<string, unknown>).lte = new Date(endDate)
    }

    const expenses = await db.dailyExpense.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      take: limit,
    })

    // Summary
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
    const byCategory: Record<string, number> = {}
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    }

    return NextResponse.json({
      success: true,
      data: expenses,
      meta: { total: expenses.length, totalAmount, byCategory },
    })
  } catch (error) {
    console.error('GET daily expense error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// POST /api/finance/daily-expense - Create new daily expense
// Body: { projectId?, category, description, amount, paidAt?, paymentMethod?, notes? }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, category, description, amount, paidAt, paymentMethod, notes } = body

    if (!category || !description || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'category, description, amount required' },
        { status: 400 }
      )
    }

    const validCategories = ['LISTRIK', 'BENSIN', 'PARKIR', 'TOL', 'ATK', 'OTHER']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Valid: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    const expense = await db.dailyExpense.create({
      data: {
        projectId: projectId || null,
        category,
        description,
        amount: parseFloat(amount),
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentMethod: paymentMethod || 'TUNAI',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('POST daily expense error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ============================================================
// DELETE /api/finance/daily-expense?id=xxx
// ============================================================

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    await db.dailyExpense.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('DELETE daily expense error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
