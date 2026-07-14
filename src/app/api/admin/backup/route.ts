// GET /api/admin/backup
// ============================================================
// Trigger database backup. Returns the backup as a downloadable JSON file.
//
// Usage:
//   - GET /api/admin/backup — returns JSON backup inline (response)
//   - GET /api/admin/backup?download=1 — returns as file attachment (Content-Disposition)
//   - GET /api/admin/backup?save=1 — saves to /home/z/my-project/download/ AND returns JSON
//
// The backup is the same format as scripts/backup-db.ts output.
// For very large databases (>100MB), use the CLI script instead — HTTP timeout may apply.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as fs from 'fs'
import * as path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 60  // 60s for large backups
export const dynamic = 'force-dynamic'

// List of models to backup (in dependency order, same as scripts/backup-db.ts)
const MODELS_IN_ORDER = [
  'appUser', 'googleToken', 'userSetting',
  'project', 'agent', 'agentTeam', 'agentTeamMember',
  'unit', 'customer', 'customerHistoryLog', 'customerStageHistory',
  'conversation', 'message',
  'memory', 'memoryVersion', 'memoryAudit',
  'skill', 'skillVersion', 'knowledgeItem',
  'approval',
  'supplier', 'pO', 'pOLine', 'supplierPayment', 'fundRequest',
  'rAB', 'rABLine', 'materialStock', 'materialUsage',
  'progressPhoto', 'unitBudgetTracking',
  'document', 'documentTemplate', 'googleDoc', 'surveySchedule',
  'auditLog', 'pendingAction', 'sessionContext',
  'bankConfig', 'bankPipeline', 'notarisSetting', 'companySetting', 'notification',
] as const

function serializeValue(val: any): any {
  if (val === null || val === undefined) return val
  if (val instanceof Date) return { __type: 'Date', iso: val.toISOString() }
  if (val instanceof Buffer) return { __type: 'Buffer', base64: val.toString('base64') }
  if (typeof val === 'bigint') return { __type: 'BigInt', value: val.toString() }
  if (Array.isArray(val)) return val.map(serializeValue)
  if (typeof val === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(val)) out[k] = serializeValue(v)
    return out
  }
  return val
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const shouldDownload = url.searchParams.get('download') === '1'
    const shouldSave = url.searchParams.get('save') === '1'

    console.log('[admin/backup] Starting backup', { shouldDownload, shouldSave })

    const tables: Record<string, any[]> = {}
    let totalRecords = 0
    const tableCounts: Record<string, number> = {}

    for (const modelName of MODELS_IN_ORDER) {
      try {
        // @ts-ignore
        const model = db[modelName]
        if (!model || typeof model.findMany !== 'function') continue
        const records = await model.findMany()
        const serialized = records.map(serializeValue)
        tables[modelName] = serialized
        tableCounts[modelName] = serialized.length
        totalRecords += serialized.length
      } catch (err: any) {
        console.error(`[admin/backup] Error on ${modelName}:`, err?.message)
        tables[modelName] = []
        tableCounts[modelName] = 0
      }
    }

    // Mask password in URL
    const dbUrl = process.env.DATABASE_URL || ''
    const maskedUrl = dbUrl.replace(/(:[^:@]+)@/, ':***@')

    const timestamp = new Date().toISOString()
    const backup = {
      _meta: {
        version: 1,
        format: 'hadi-kaya-db-backup',
        timestamp,
        sourceDbUrl: maskedUrl,
        prismaClientVersion: '6.x',
        totalRecords,
        tableCount: Object.keys(tables).length,
      },
      tableCounts,
      tables,
    }

    // Optionally save to disk
    let savedPath: string | null = null
    if (shouldSave) {
      try {
        const downloadDir = path.resolve(process.cwd(), 'download')
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, { recursive: true })
        }
        const filename = `db-backup-${timestamp.replace(/[:.]/g, '-')}.json`
        savedPath = path.join(downloadDir, filename)
        fs.writeFileSync(savedPath, JSON.stringify(backup, null, 2), 'utf8')
        console.log(`[admin/backup] Saved to ${savedPath}`)
      } catch (saveErr: any) {
        console.error('[admin/backup] Save failed (non-fatal):', saveErr?.message)
      }
    }

    const jsonStr = JSON.stringify(backup, null, 2)
    const fileSizeBytes = Buffer.byteLength(jsonStr, 'utf8')
    const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2)

    console.log(`[admin/backup] Complete: ${totalRecords} records, ${fileSizeMB} MB`)

    if (shouldDownload) {
      // Return as downloadable file
      const filename = `db-backup-${timestamp.replace(/[:.]/g, '-')}.json`
      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileSizeBytes.toString(),
        },
      })
    }

    // Return as JSON (with optional savedPath)
    return NextResponse.json({
      success: true,
      data: {
        meta: backup._meta,
        tableCounts,
        savedPath,
        fileSizeBytes: Number(fileSizeBytes),
        fileSizeMB: Number(fileSizeMB),
      },
      // For small backups, include the full backup inline. For large, use savedPath or download=1
      backup: fileSizeBytes < 5 * 1024 * 1024 ? backup : undefined,
    })
  } catch (err: any) {
    console.error('[admin/backup] Error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Backup failed' }, { status: 500 })
  }
}
