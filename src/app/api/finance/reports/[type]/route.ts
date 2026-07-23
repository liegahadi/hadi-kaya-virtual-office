// GET /api/finance/reports/[type]?month=YYYY-MM&year=YYYY&projectId=XXX
// type: monthly | annual | project
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateMonthlyReportPDF } from '@/lib/finance/pdf/report-monthly'
import { generateAnnualReportPDF } from '@/lib/finance/pdf/report-annual'
import { generateProjectReportPDF } from '@/lib/finance/pdf/report-project'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month') // YYYY-MM
    const yearParam = searchParams.get('year') // YYYY
    const projectId = searchParams.get('projectId')

    if (type === 'monthly') {
      return await generateMonthlyReport(monthParam, projectId)
    } else if (type === 'annual') {
      return await generateAnnualReport(yearParam, projectId)
    } else if (type === 'project') {
      return await generateProjectReport(projectId)
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type. Use: monthly | annual | project' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Report error:', err)
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}

async function generateMonthlyReport(monthParam: string | null, projectId: string | null) {
  // Default: bulan ini
  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth()
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)
  const monthName = startOfMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  // Fetch payments bulan ini
  const payments = await db.payment.findMany({
    where: {
      paidAt: { gte: startOfMonth, lte: endOfMonth },
      voided: false,
      ...(projectId ? { OR: [{ purchaseOrder: { projectId } }, { wagePayment: { projectId } }, { otherExpense: { projectId } }] } : {}),
    },
    include: {
      purchaseOrder: { include: { supplier: true, project: true } },
      wagePayment: { include: { worker: true, project: true, unit: true } },
      otherExpense: { include: { project: true } },
    },
    orderBy: { paidAt: 'desc' },
  })

  // Group by supplier (PO)
  const supplierMap = new Map<string, { supplier: string; poCount: number; total: number; plannedTotal: number }>()
  let totalMaterial = 0
  for (const p of payments) {
    if (p.poId && p.purchaseOrder) {
      const key = p.purchaseOrder.supplier.name
      const existing = supplierMap.get(key) || { supplier: key, poCount: 0, total: 0, plannedTotal: 0 }
      existing.poCount++
      existing.total += p.amount
      existing.plannedTotal += p.purchaseOrder.plannedTotal
      supplierMap.set(key, existing)
      totalMaterial += p.amount
    }
  }

  // Upah per unit
  const upahPerUnit: any[] = []
  let totalUpah = 0
  for (const p of payments) {
    if (p.wagePaymentId && p.wagePayment) {
      upahPerUnit.push({
        unit: p.wagePayment.unit?.blockNumber || 'GDG',
        worker: p.wagePayment.worker.name,
        workItem: p.wagePayment.workDescription || '',
        amount: p.amount,
        budget: p.wagePayment.fullTaskBudget,
        progress: p.wagePayment.fullTaskBudget > 0 ? Math.round((p.amount / p.wagePayment.fullTaskBudget) * 100) : 0,
      })
      totalUpah += p.amount
    }
  }

  // Upah per blok (aggregate dari upahPerUnit)
  const blokMap = new Map<string, { blok: string; total: number; unitCount: Set<string> }>()
  for (const u of upahPerUnit) {
    const blok = u.unit.charAt(0) || 'X'
    const existing = blokMap.get(blok) || { blok, total: 0, unitCount: new Set() }
    existing.total += u.amount
    existing.unitCount.add(u.unit)
    blokMap.set(blok, existing)
  }
  const upahPerBlok = Array.from(blokMap.values()).map(b => ({ blok: b.blok, total: b.total, unitCount: b.unitCount.size }))

  // Biaya lain
  const biayaLain: any[] = []
  let totalOps = 0
  for (const p of payments) {
    if (p.expenseId && p.otherExpense) {
      biayaLain.push({
        category: p.otherExpense.category,
        recipient: p.otherExpense.recipientName,
        amount: p.amount,
        description: p.otherExpense.description,
      })
      totalOps += p.amount
    }
  }

  // Pemakaian material bulan ini (MaterialUsage)
  const usages = await db.materialUsage.findMany({
    where: {
      usedAt: { gte: startOfMonth, lte: endOfMonth },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      items: { include: { material: true } },
      unit: true,
    },
    orderBy: { usedAt: 'desc' },
  })

  const pemakaianPerUnit: any[] = []
  for (const u of usages) {
    for (const item of u.items) {
      pemakaianPerUnit.push({
        unit: u.unit?.blockNumber || 'GDG',
        material: item.material.name,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        source: u.source,
      })
    }
  }

  // Pemakaian per blok
  const pemBlokMap = new Map<string, { blok: string; total: number; unitCount: Set<string> }>()
  for (const p of pemakaianPerUnit) {
    const blok = p.unit.charAt(0) || 'X'
    const existing = pemBlokMap.get(blok) || { blok, total: 0, unitCount: new Set() }
    existing.total += p.subtotal
    existing.unitCount.add(p.unit)
    pemBlokMap.set(blok, existing)
  }
  const pemakaianPerBlok = Array.from(pemBlokMap.values()).map(b => ({ blok: b.blok, total: b.total, unitCount: b.unitCount.size }))

  // Outstanding awal + akhir bulan
  const unpaidPosEnd = await db.purchaseOrder.findMany({
    where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] }, poDate: { lte: endOfMonth } },
    include: { payments: { where: { voided: false, paidAt: { lte: endOfMonth } } } },
  })
  const outstandingAkhir = unpaidPosEnd.reduce((s, po) => {
    const paid = po.payments.reduce((p, x) => p + x.amount, 0)
    const target = po.actualTotal > 0 ? po.actualTotal : po.plannedTotal
    return s + Math.max(0, target - paid)
  }, 0)

  const pembelianPerSupplier = Array.from(supplierMap.values()).map(s => ({
    ...s,
    variance: s.total - s.plannedTotal,
  }))

  const data = {
    month: monthName,
    project: null,
    summary: {
      totalMaterial,
      totalUpah,
      totalOps,
      totalKeluar: totalMaterial + totalUpah + totalOps,
      outstandingAwal: 0, // simplified
      outstandingAkhir,
    },
    pembelianPerSupplier,
    upahPerUnit,
    upahPerBlok,
    pemakaianPerUnit: pemakaianPerUnit.slice(0, 100), // limit
    pemakaianPerBlok,
    biayaLain,
  }

  const pdfBuffer = await generateMonthlyReportPDF(data)
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Laporan-Bulanan-${monthName.replace(/\s/g, '-')}.pdf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

async function generateAnnualReport(yearParam: string | null, projectId: string | null) {
  const now = new Date()
  const year = yearParam ? parseInt(yearParam) : now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59)

  // Fetch all payments in year
  const payments = await db.payment.findMany({
    where: {
      paidAt: { gte: startOfYear, lte: endOfYear },
      voided: false,
    },
    include: {
      purchaseOrder: { include: { supplier: true, project: true } },
      wagePayment: { include: { project: true } },
      otherExpense: { include: { project: true } },
    },
  })

  // Monthly breakdown
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
  const monthlyMap = new Map<number, { material: number; upah: number; ops: number }>()
  for (let m = 0; m < 12; m++) monthlyMap.set(m, { material: 0, upah: 0, ops: 0 })

  let totalMaterial = 0, totalUpah = 0, totalOps = 0
  const projectMap = new Map<string, { project: string; code: string | null; material: number; upah: number; ops: number; poCount: number }>()
  const supplierMap = new Map<string, { supplier: string; poCount: number; total: number }>()
  const categoryMap = new Map<string, number>()

  for (const p of payments) {
    const month = p.paidAt.getMonth()
    const monthly = monthlyMap.get(month)!
    if (p.poId && p.purchaseOrder) {
      monthly.material += p.amount
      totalMaterial += p.amount
      // Project
      const projKey = p.purchaseOrder.project?.id || 'unknown'
      const proj = projectMap.get(projKey) || { project: p.purchaseOrder.project?.name || 'Unknown', code: p.purchaseOrder.project?.code || null, material: 0, upah: 0, ops: 0, poCount: 0 }
      proj.material += p.amount
      proj.poCount++
      projectMap.set(projKey, proj)
      // Supplier
      const supKey = p.purchaseOrder.supplier?.name || 'Unknown'
      const sup = supplierMap.get(supKey) || { supplier: supKey, poCount: 0, total: 0 }
      sup.poCount++
      sup.total += p.amount
      supplierMap.set(supKey, sup)
    } else if (p.wagePaymentId && p.wagePayment) {
      monthly.upah += p.amount
      totalUpah += p.amount
      const projKey = p.wagePayment.project?.id || 'unknown'
      const proj = projectMap.get(projKey) || { project: p.wagePayment.project?.name || 'Unknown', code: p.wagePayment.project?.code || null, material: 0, upah: 0, ops: 0, poCount: 0 }
      proj.upah += p.amount
      projectMap.set(projKey, proj)
    } else if (p.expenseId && p.otherExpense) {
      monthly.ops += p.amount
      totalOps += p.amount
      const cat = p.otherExpense.category || 'OTHER'
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + p.amount)
      if (p.otherExpense.project) {
        const projKey = p.otherExpense.project.id
        const proj = projectMap.get(projKey) || { project: p.otherExpense.project.name, code: p.otherExpense.project.code, material: 0, upah: 0, ops: 0, poCount: 0 }
        proj.ops += p.amount
        projectMap.set(projKey, proj)
      }
    }
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([m, v]) => ({
    month: monthNames[m],
    material: v.material, upah: v.upah, ops: v.ops,
    total: v.material + v.upah + v.ops,
  }))

  const perProject = Array.from(projectMap.values()).map(p => ({ ...p, total: p.material + p.upah + p.ops }))
  const totalSupplier = Array.from(supplierMap.values()).reduce((s, x) => s + x.total, 0)
  const perSupplier = Array.from(supplierMap.values()).map(s => ({ ...s, percentage: totalSupplier > 0 ? (s.total / totalSupplier) * 100 : 0 })).sort((a, b) => b.total - a.total)
  const totalCategory = Array.from(categoryMap.values()).reduce((s, x) => s + x, 0)
  const topCategories = Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount, percentage: totalCategory > 0 ? (amount / totalCategory) * 100 : 0 })).sort((a, b) => b.amount - a.amount)

  // Outstanding akhir tahun
  const unpaidPos = await db.purchaseOrder.findMany({
    where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] }, poDate: { lte: endOfYear } },
    include: { payments: { where: { voided: false, paidAt: { lte: endOfYear } } } },
  })
  const outstandingAkhir = unpaidPos.reduce((s, po) => {
    const paid = po.payments.reduce((p, x) => p + x.amount, 0)
    return s + Math.max(0, (po.actualTotal > 0 ? po.actualTotal : po.plannedTotal) - paid)
  }, 0)

  const data = {
    year,
    summary: { totalMaterial, totalUpah, totalOps, totalKeluar: totalMaterial + totalUpah + totalOps, outstandingAkhirTahun: outstandingAkhir },
    monthlyBreakdown,
    perProject,
    perSupplier,
    topCategories,
  }

  const pdfBuffer = await generateAnnualReportPDF(data)
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Laporan-Tahunan-${year}.pdf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

async function generateProjectReport(projectId: string | null) {
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required for project report' }, { status: 400 })
  }

  const project = await db.project.findUnique({ where: { id: projectId }, include: { units: true } })
  if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })

  // Fetch all payments for this project (via PO, Wage, Expense)
  const payments = await db.payment.findMany({
    where: {
      voided: false,
      OR: [
        { purchaseOrder: { projectId } },
        { wagePayment: { projectId } },
        { otherExpense: { projectId } },
      ],
    },
    include: {
      purchaseOrder: { include: { supplier: true } },
      wagePayment: { include: { worker: true, unit: true } },
      otherExpense: true,
    },
    orderBy: { paidAt: 'asc' },
  })

  // Material usages for this project
  const usages = await db.materialUsage.findMany({
    where: { projectId },
    include: { items: { include: { material: true } }, unit: true },
  })

  // Compute per unit
  const unitMap = new Map<string, { blockNumber: string; material: number; upah: number; ops: number }>()
  for (const u of project.units) {
    unitMap.set(u.id, { blockNumber: u.blockNumber, material: 0, upah: 0, ops: 0 })
  }
  // Material from usages
  for (const u of usages) {
    if (u.unitId) {
      const unit = unitMap.get(u.unitId)
      if (unit) unit.material += u.items.reduce((s, it) => s + it.subtotal, 0)
    }
  }
  // Upah + Ops from payments
  for (const p of payments) {
    if (p.wagePayment?.unitId) {
      const unit = unitMap.get(p.wagePayment.unitId)
      if (unit) unit.upah += p.amount
    } else if (p.otherExpense?.unitId) {
      const unit = unitMap.get(p.otherExpense.unitId)
      if (unit) unit.ops += p.amount
    }
  }

  const perUnit = Array.from(unitMap.values()).map(u => ({ ...u, total: u.material + u.upah + u.ops })).sort((a, b) => b.total - a.total)

  const totalMaterial = usages.reduce((s, u) => s + u.items.reduce((ss, it) => ss + it.subtotal, 0), 0)
  const totalUpah = payments.filter(p => p.wagePaymentId).reduce((s, p) => s + p.amount, 0)
  const totalOps = payments.filter(p => p.expenseId).reduce((s, p) => s + p.amount, 0)
  const totalCost = totalMaterial + totalUpah + totalOps

  // Outstanding
  const unpaidPos = await db.purchaseOrder.findMany({
    where: { projectId, status: { in: ['UNPAID', 'PARTIAL_PAID'] } },
    include: { payments: { where: { voided: false } } },
  })
  const outstanding = unpaidPos.reduce((s, po) => {
    const paid = po.payments.reduce((p, x) => p + x.amount, 0)
    return s + Math.max(0, (po.actualTotal > 0 ? po.actualTotal : po.plannedTotal) - paid)
  }, 0)

  // Timeline (last 20 payments)
  const timeline = payments.slice(-20).reverse().map(p => ({
    date: p.paidAt,
    amount: p.amount,
    method: p.method,
    recipient: p.purchaseOrder?.supplier?.name || p.wagePayment?.worker?.name || p.otherExpense?.recipientName || 'Unknown',
  }))

  const data = {
    project: { name: project.name, code: project.code, type: 'Subsidi' },
    summary: { totalMaterial, totalUpah, totalOps, totalCost, outstanding, unitCount: project.units.length },
    perUnit,
    timeline,
  }

  const pdfBuffer = await generateProjectReportPDF(data)
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Laporan-Proyek-${project.code || project.name}.pdf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
