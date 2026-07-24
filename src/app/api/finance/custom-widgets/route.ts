import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

// GET: return available widgets + current config
export async function GET() {
  try {
    const availableWidgets = [
      { id: 'kpi_tiles', name: 'KPI Tiles', description: 'Total keluar + outstanding per kategori' },
      { id: 'cashflow_chart', name: 'Cashflow Chart', description: 'Bar chart 6 bulan terakhir' },
      { id: 'outstanding_penerima', name: 'Outstanding per Penerima', description: 'List hutang belum dibayar per penerima' },
      { id: 'outstanding_kategori', name: 'Outstanding per Kategori', description: 'Summary hutang per kategori' },
      { id: 'low_stock_alert', name: 'Low Stock Alert', description: 'Material di bawah minStock' },
      { id: 'budget_alert', name: 'Budget Alert', description: 'Unit yang mendekati/melebihi RAB' },
      { id: 'construction_progress', name: 'Construction Progress', description: 'Unit completion % summary' },
      { id: 'recent_payments', name: 'Recent Payments', description: '10 pembayaran terakhir' },
      { id: 'notification_center', name: 'Notification Center', description: 'Semua alert dalam 1 widget' },
    ]
    return NextResponse.json({ success: true, data: availableWidgets })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
