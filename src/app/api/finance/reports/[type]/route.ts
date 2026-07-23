// GET /api/finance/reports/[type]?month=YYYY-MM&year=YYYY&projectId=XXX
// type: monthly | annual | project
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateMonthlyReportPDF } from '@/lib/finance/pdf/report-monthly'

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
  // Simplified — return placeholder
  return NextResponse.json({ success: false, error: 'Annual report not implemented yet. Use monthly for now.' }, { status: 501 })
}

async function generateProjectReport(projectId: string | null) {
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required for project report' }, { status: 400 })
  }
  // Simplified — return placeholder
  return NextResponse.json({ success: false, error: 'Project report not implemented yet. Use monthly for now.' }, { status: 501 })
}
