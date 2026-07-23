// GET /api/finance/reports/unit-progress?unitId=XXX
// Construction Progress Report PDF per unit (untuk bank/buyer)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const unitId = searchParams.get('unitId')
    if (!unitId) return NextResponse.json({ success: false, error: 'unitId required' }, { status: 400 })

    const unit = await db.unit.findUnique({ where: { id: unitId }, include: { project: true } })
    if (!unit) return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 })

    const wageTypes = await db.wageType.findMany({ where: { projectId: unit.projectId }, orderBy: { name: 'asc' } })
    const wages = await db.wagePayment.findMany({ where: { unitId }, include: { wageType: true } })

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
    const page = doc.addPage([595, 842])
    let y = 842 - 50
    const margin = 50

    // Kop
    page.drawText('KOP SURAT PERUSAHAAN', { x: margin, y, size: 10, font: fontBold, color: rgb(0.6, 0.6, 0.6) })
    y -= 25; page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 1 }); y -= 25

    // Title
    page.drawText('LAPORAN PROGRESS PEMBANGUNAN', { x: margin + 150, y, size: 14, font: fontBold }); y -= 20
    page.drawText(`Unit: ${unit.blockNumber} — Project: ${unit.project.name}`, { x: margin + 130, y, size: 11, font }); y -= 20

    // Summary
    const totalTasks = wageTypes.length
    const completedTasks = wages.filter(w => w.status === 'PAID').length
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const totalCost = wages.reduce((s, w) => s + w.amount, 0)
    const totalBudget = wageTypes.reduce((s, w) => s + w.price, 0)

    page.drawText('=== RINGKASAN ===', { x: margin, y, size: 12, font: fontBold }); y -= 15
    const summary = [
      ['Total Pekerjaan', String(totalTasks)],
      ['Selesai', `${completedTasks} (${completionPercent}%)`],
      ['Sedang Berjalan', String(wages.filter(w => w.status === 'PARTIAL_PAID').length)],
      ['Belum Mulai', String(totalTasks - wages.length)],
      ['Biaya Terpakai', formatCurrency(totalCost)],
      ['Total Anggaran (RAB)', formatCurrency(totalBudget)],
    ]
    for (const [label, value] of summary) {
      page.drawText(label, { x: margin, y, size: 10, font })
      page.drawText(value, { x: 595 - margin - 150, y, size: 10, font: fontBold })
      y -= 14
    }
    y -= 10

    // Progress bar visual
    page.drawText('Progress:', { x: margin, y, size: 10, font: fontBold }); y -= 5
    const barWidth = 400; const barX = margin
    page.drawRectangle({ x: barX, y: y - 10, width: barWidth, height: 12, borderColor: rgb(0, 0, 0), borderWidth: 1 })
    page.drawRectangle({ x: barX, y: y - 10, width: barWidth * (completionPercent / 100), height: 12, color: rgb(0.2, 0.6, 0.3) })
    page.drawText(`${completionPercent}%`, { x: barX + barWidth + 10, y: y - 8, size: 10, font: fontBold })
    y -= 25

    // Detail per pekerjaan
    page.drawText('=== DETAIL PEKERJAAN ===', { x: margin, y, size: 12, font: fontBold }); y -= 15
    page.drawText('No', { x: margin, y, size: 9, font: fontBold })
    page.drawText('Pekerjaan', { x: margin + 30, y, size: 9, font: fontBold })
    page.drawText('Budget', { x: margin + 250, y, size: 9, font: fontBold })
    page.drawText('Dibayar', { x: margin + 350, y, size: 9, font: fontBold })
    page.drawText('Status', { x: margin + 450, y, size: 9, font: fontBold })
    y -= 14

    wageTypes.forEach((wt, i) => {
      if (y < 80) return
      const wage = wages.find(w => w.wageTypeId === wt.id)
      const status = !wage ? 'Belum Mulai' : wage.status === 'PAID' ? 'Selesai' : 'Proses'
      page.drawText(String(i + 1), { x: margin, y, size: 9, font })
      page.drawText(wt.name.substring(0, 35), { x: margin + 30, y, size: 9, font })
      page.drawText(formatCurrency(wt.price).replace('Rp. ', ''), { x: margin + 250, y, size: 9, font })
      page.drawText(wage ? formatCurrency(wage.amount).replace('Rp. ', '') : '-', { x: margin + 350, y, size: 9, font })
      page.drawText(status, { x: margin + 450, y, size: 9, font: wage?.status === 'PAID' ? fontBold : font })
      y -= 13
    })
    y -= 15

    // Tanda tangan
    y -= 20
    page.drawText('Pangkalpinang, ' + formatLongDate(new Date().toISOString()), { x: margin, y, size: 10, font })
    y -= 50
    page.drawText('( ............................. )', { x: margin, y, size: 10, font: fontBold })

    const pdfBytes = await doc.save()
    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Progress-${unit.blockNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
