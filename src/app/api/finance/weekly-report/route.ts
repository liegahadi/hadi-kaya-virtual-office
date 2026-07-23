import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateWeeklyReportPdf, type WeeklyReportData } from '@/lib/finance/pdf-generator'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================================
// GET /api/finance/weekly-report
// Query: projectId, week (1-53), year, OR startDate + endDate
// Generate weekly report from real data
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const week = url.searchParams.get('week')
    const year = url.searchParams.get('year')
    const startDateParam = url.searchParams.get('startDate')
    const endDateParam = url.searchParams.get('endDate')

    // Calculate date range
    let startDate: Date
    let endDate: Date
    let weekNumber: number
    let reportYear: number

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
      weekNumber = getWeekNumber(startDate)
      reportYear = startDate.getFullYear()
    } else if (week && year) {
      weekNumber = parseInt(week)
      reportYear = parseInt(year)
      // Calculate Monday of the week
      const jan1 = new Date(reportYear, 0, 1)
      const dayOfWeek = jan1.getDay() || 7
      const dayOffset = (weekNumber - 1) * 7 - (dayOfWeek - 1)
      startDate = new Date(reportYear, 0, 1 + dayOffset)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6) // Saturday
    } else {
      // Default: current week
      const now = new Date()
      const dayOfWeek = now.getDay() || 7
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek + 1) // Monday
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6) // Saturday
      weekNumber = getWeekNumber(startDate)
      reportYear = startDate.getFullYear()
    }

    // ============================================================
    // FETCH ALL DATA FOR THE WEEK
    // ============================================================

    // 1. POs paid this week (Material)
    const posThisWeek = await db.pO.findMany({
      where: {
        AND: [
          projectId ? { projectId } : {},
          { status: { in: ['PAID', 'PARTIAL_PAID'] } },
          {
            payments: {
              some: { paidAt: { gte: startDate, lte: endDate } },
            },
          },
        ],
      },
      include: {
        supplier: { select: { name: true } },
        lines: true,
        payments: {
          where: { paidAt: { gte: startDate, lte: endDate } },
        },
      },
    })

    // Group by supplier
    const materialsBySupplier: Record<string, Array<{ poNumber: string; notes: string; amount: number }>> = {}
    let totalMaterial = 0
    for (const po of posThisWeek) {
      const supplierName = po.supplier.name
      if (!materialsBySupplier[supplierName]) materialsBySupplier[supplierName] = []
      const paidAmount = po.payments.reduce((s, p) => s + p.amount, 0)
      materialsBySupplier[supplierName].push({
        poNumber: po.poNumber,
        notes: po.notes || po.workItem || `${po.lines.length} items`,
        amount: paidAmount,
      })
      totalMaterial += paidAmount
    }

    // 2. Upah tukang (FundRequest type TUKANG_WAGE)
    const upahRequests = await db.fundRequest.findMany({
      where: {
        AND: [
          projectId ? { projectId } : {},
          { type: 'TUKANG_WAGE' },
          { status: 'PAID' },
          { paidAt: { gte: startDate, lte: endDate } },
        ],
      },
    })

    // Group by tukang name (requesterName)
    const upahByTukang: Record<string, Array<{ unit: string; workItems: string; amount: number }>> = {}
    let totalUpah = 0
    for (const req of upahRequests) {
      const tukangName = req.requesterName || 'Unknown'
      if (!upahByTukang[tukangName]) upahByTukang[tukangName] = []
      upahByTukang[tukangName].push({
        unit: req.unitIds || '-',
        workItems: req.description,
        amount: req.amount,
      })
      totalUpah += req.amount
    }

    // 3. Add cost (FundRequest type NOT TUKANG_WAGE, NOT MATERIAL)
    const addCostRequests = await db.fundRequest.findMany({
      where: {
        AND: [
          projectId ? { projectId } : {},
          { type: { not: 'TUKANG_WAGE' } },
          { status: 'PAID' },
          { paidAt: { gte: startDate, lte: endDate } },
        ],
      },
    })

    const addCosts = addCostRequests.map(r => ({
      category: r.type,
      description: r.description,
      amount: r.amount,
    }))
    const totalAddCost = addCosts.reduce((s, a) => s + a.amount, 0)

    // 4. Daily expenses (listrik, bensin, dll)
    const dailyExpenses = await db.dailyExpense.findMany({
      where: {
        AND: [
          projectId ? { projectId } : {},
          { paidAt: { gte: startDate, lte: endDate } },
        ],
      },
      orderBy: { paidAt: 'asc' },
    })

    const daily = dailyExpenses.map(e => ({
      date: e.paidAt,
      category: e.category,
      description: e.description,
      amount: e.amount,
    }))
    const totalDaily = dailyExpenses.reduce((s, e) => s + e.amount, 0)

    // ============================================================
    // COMPILE REPORT DATA
    // ============================================================
    const project = projectId ? await db.project.findUnique({ where: { id: projectId } }) : null
    const grandTotal = totalMaterial + totalUpah + totalAddCost + totalDaily

    const reportData: WeeklyReportData = {
      projectName: project?.name || 'All Projects',
      weekNumber,
      year: reportYear,
      startDate,
      endDate,
      materials: Object.entries(materialsBySupplier).map(([supplier, pos]) => ({
        supplier,
        pos,
        total: pos.reduce((s, p) => s + p.amount, 0),
      })),
      totalMaterial,
      upah: Object.entries(upahByTukang).map(([tukangName, units]) => ({
        tukangName,
        units,
        total: units.reduce((s, u) => s + u.amount, 0),
      })),
      totalUpah,
      addCost: addCosts,
      totalAddCost,
      daily,
      totalDaily,
      grandTotal,
    }

    // Save/update report in DB
    const existing = await db.weeklyReport.findUnique({
      where: projectId
        ? { projectId_year_weekNumber: { projectId, year: reportYear, weekNumber } }
        : undefined,
    }).catch(() => null)

    if (projectId) {
      if (existing) {
        await db.weeklyReport.update({
          where: { id: existing.id },
          data: {
            totalMaterial, totalUpah, totalAddCost, totalDaily, grandTotal,
            generatedAt: new Date(),
          },
        })
      } else {
        await db.weeklyReport.create({
          data: {
            projectId, weekNumber, year: reportYear, startDate, endDate,
            totalMaterial, totalUpah, totalAddCost, totalDaily, grandTotal,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        period: `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`,
        weekNumber,
        year: reportYear,
      },
    })
  } catch (error) {
    console.error('GET weekly report error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/finance/weekly-report - Generate PDF
// Body: { projectId?, week, year, OR startDate, endDate }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, week, year, startDate: sd, endDate: ed } = body

    // Fetch report data (reuse GET logic by calling internally)
    let startDate: Date
    let endDate: Date
    let weekNumber: number
    let reportYear: number

    if (sd && ed) {
      startDate = new Date(sd)
      endDate = new Date(ed)
      weekNumber = getWeekNumber(startDate)
      reportYear = startDate.getFullYear()
    } else if (week && year) {
      weekNumber = week
      reportYear = year
      const jan1 = new Date(reportYear, 0, 1)
      const dayOfWeek = jan1.getDay() || 7
      const dayOffset = (weekNumber - 1) * 7 - (dayOfWeek - 1)
      startDate = new Date(reportYear, 0, 1 + dayOffset)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
    } else {
      const now = new Date()
      const dayOfWeek = now.getDay() || 7
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek + 1)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      weekNumber = getWeekNumber(startDate)
      reportYear = startDate.getFullYear()
    }

    // Fetch data (same as GET)
    const [posThisWeek, upahRequests, addCostRequests, dailyExpenses] = await Promise.all([
      db.pO.findMany({
        where: {
          AND: [
            projectId ? { projectId } : {},
            { status: { in: ['PAID', 'PARTIAL_PAID'] } },
            { payments: { some: { paidAt: { gte: startDate, lte: endDate } } } },
          ],
        },
        include: {
          supplier: { select: { name: true } },
          payments: { where: { paidAt: { gte: startDate, lte: endDate } } },
        },
      }),
      db.fundRequest.findMany({
        where: {
          AND: [
            projectId ? { projectId } : {},
            { type: 'TUKANG_WAGE' },
            { status: 'PAID' },
            { paidAt: { gte: startDate, lte: endDate } },
          ],
        },
      }),
      db.fundRequest.findMany({
        where: {
          AND: [
            projectId ? { projectId } : {},
            { type: { not: 'TUKANG_WAGE' } },
            { status: 'PAID' },
            { paidAt: { gte: startDate, lte: endDate } },
          ],
        },
      }),
      db.dailyExpense.findMany({
        where: {
          AND: [
            projectId ? { projectId } : {},
            { paidAt: { gte: startDate, lte: endDate } },
          ],
        },
        orderBy: { paidAt: 'asc' },
      }),
    ])

    // Compile data
    const materialsBySupplier: Record<string, Array<{ poNumber: string; notes: string; amount: number }>> = {}
    let totalMaterial = 0
    for (const po of posThisWeek) {
      const sn = po.supplier.name
      if (!materialsBySupplier[sn]) materialsBySupplier[sn] = []
      const paid = po.payments.reduce((s, p) => s + p.amount, 0)
      materialsBySupplier[sn].push({ poNumber: po.poNumber, notes: po.notes || po.workItem || '', amount: paid })
      totalMaterial += paid
    }

    const upahByTukang: Record<string, Array<{ unit: string; workItems: string; amount: number }>> = {}
    let totalUpah = 0
    for (const r of upahRequests) {
      const tn = r.requesterName || 'Unknown'
      if (!upahByTukang[tn]) upahByTukang[tn] = []
      upahByTukang[tn].push({ unit: r.unitIds || '-', workItems: r.description, amount: r.amount })
      totalUpah += r.amount
    }

    const addCosts = addCostRequests.map(r => ({ category: r.type, description: r.description, amount: r.amount }))
    const totalAddCost = addCosts.reduce((s, a) => s + a.amount, 0)

    const daily = dailyExpenses.map(e => ({
      date: e.paidAt, category: e.category, description: e.description, amount: e.amount,
    }))
    const totalDaily = dailyExpenses.reduce((s, e) => s + e.amount, 0)

    const grandTotal = totalMaterial + totalUpah + totalAddCost + totalDaily
    const project = projectId ? await db.project.findUnique({ where: { id: projectId } }) : null

    const reportData: WeeklyReportData = {
      projectName: project?.name || 'All Projects',
      weekNumber, year: reportYear, startDate, endDate,
      materials: Object.entries(materialsBySupplier).map(([supplier, pos]) => ({
        supplier, pos, total: pos.reduce((s, p) => s + p.amount, 0),
      })),
      totalMaterial,
      upah: Object.entries(upahByTukang).map(([tukangName, units]) => ({
        tukangName, units, total: units.reduce((s, u) => s + u.amount, 0),
      })),
      totalUpah,
      addCost: addCosts,
      totalAddCost,
      daily,
      totalDaily,
      grandTotal,
    }

    // Generate PDF
    const outputDir = path.join(process.cwd(), 'public', 'po-pdfs')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const fileName = `WeeklyReport_${reportYear}_W${weekNumber}.pdf`
    const outputPath = path.join(outputDir, fileName)

    await generateWeeklyReportPdf(reportData, outputPath)

    return NextResponse.json({
      success: true,
      data: {
        pdfUrl: `/po-pdfs/${fileName}`,
        fileName,
        summary: {
          totalMaterial, totalUpah, totalAddCost, totalDaily, grandTotal,
          weekNumber, year: reportYear,
          period: `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`,
        },
      },
    })
  } catch (error) {
    console.error('POST weekly report error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// Helper: get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
