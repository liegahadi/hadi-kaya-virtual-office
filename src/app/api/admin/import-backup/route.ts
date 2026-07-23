// POST /api/admin/import-backup?secret=XXX
// Run import backup JSON ke Aiven DB (Vercel-only approach, no local command line needed)
//
// Owner flow:
// 1. Push ke main → Vercel auto-deploy (postbuild runs prisma db push, applies schema)
// 2. Hit URL: https://hadi-kaya-virtual-office.vercel.app/api/admin/import-backup?secret=XXX
// 3. Tunggu 30-60 detik → response JSON dengan stats
//
// Set env var di Vercel: ADMIN_SECRET = "pilih-secret-anda"
//
// Idempotent: bisa di-run berulang (upsert by name/unique key)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { importFinanceBackup } from '@/lib/finance/import-backup'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes (Pro plan needed; fallback 60s Hobby)

export async function POST(req: NextRequest) {
  try {
    // Auth check via secret
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    const expectedSecret = process.env.ADMIN_SECRET

    if (!expectedSecret) {
      return NextResponse.json({
        success: false,
        error: 'ADMIN_SECRET env var not set. Set it in Vercel: Settings → Environment Variables → ADMIN_SECRET',
      }, { status: 500 })
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({
        success: false,
        error: 'Invalid secret. Pass ?secret=XXX in URL.',
      }, { status: 401 })
    }

    console.log('[import-backup] Starting import...')
    const startTime = Date.now()

    const result = await importFinanceBackup(db)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[import-backup] Done in ${duration}s. Imported: ${result.totalImported}, Errors: ${result.totalErrors}`)

    return NextResponse.json({
      success: result.success,
      data: {
        ...result,
        durationSeconds: parseFloat(duration),
      },
    })
  } catch (err: any) {
    console.error('[import-backup] Fatal error:', err)
    return NextResponse.json({
      success: false,
      error: String(err?.message || err).substring(0, 500),
    }, { status: 500 })
  }
}

// GET endpoint untuk cek status (tanpa run import)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    const expectedSecret = process.env.ADMIN_SECRET

    if (!expectedSecret) {
      return NextResponse.json({
        success: false,
        error: 'ADMIN_SECRET env var not set',
      }, { status: 500 })
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 })
    }

    // Cek counts di DB (sudah ke-import atau belum)
    const [projects, suppliers, materials, pos, wages, expenses, memos, stock] = await Promise.all([
      db.project.count(),
      db.supplier.count(),
      db.material.count(),
      db.purchaseOrder.count(),
      db.wagePayment.count(),
      db.otherExpense.count(),
      db.memo.count(),
      db.stock.count(),
    ])

    const isImported = projects > 0 || suppliers > 0 || materials > 0

    return NextResponse.json({
      success: true,
      data: {
        isImported,
        counts: { projects, suppliers, materials, pos, wages, expenses, memos, stock },
        message: isImported
          ? 'Data sudah ter-import. Hit POST /api/admin/import-backup?secret=XXX untuk re-import (idempotent).'
          : 'Data belum ter-import. Hit POST /api/admin/import-backup?secret=XXX untuk mulai import.',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 })
  }
}
