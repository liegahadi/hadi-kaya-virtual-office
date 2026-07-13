// POST /api/admin/restore
// ============================================================
// Restore database from a backup JSON file.
//
// Request body (JSON):
//   {
//     "backup": { ... backup object from /api/admin/backup ... },
//     "mode": "insert" | "upsert" | "truncate"  (default: "insert")
//   }
//
// OR
//
// Multipart form data:
//   - file: <backup.json>
//   - mode: "insert" | "upsert" | "truncate"  (default: "insert")
//
// Safety:
//   - Refuses to restore if backup format is wrong
//   - "truncate" mode is DANGEROUS — deletes all existing data first
//   - For very large restores, use the CLI script (scripts/restore-db.ts) instead
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Models in restore order (parents first, then children)
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

function deserializeValue(val: any): any {
  if (val === null || val === undefined) return val
  if (Array.isArray(val)) return val.map(deserializeValue)
  if (typeof val === 'object') {
    if (val.__type === 'Date' && val.iso) return new Date(val.iso)
    if (val.__type === 'Buffer' && val.base64) return Buffer.from(val.base64, 'base64')
    if (val.__type === 'BigInt' && val.value) return BigInt(val.value)
    const out: any = {}
    for (const [k, v] of Object.entries(val)) out[k] = deserializeValue(v)
    return out
  }
  return val
}

export async function POST(req: NextRequest) {
  try {
    let backup: any
    let mode: 'insert' | 'upsert' | 'truncate' = 'insert'

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const modeStr = formData.get('mode') as string | null
      if (modeStr && ['insert', 'upsert', 'truncate'].includes(modeStr)) {
        mode = modeStr as any
      }
      if (!file) {
        return NextResponse.json({ success: false, error: 'File "file" is required' }, { status: 400 })
      }
      const text = await file.text()
      try {
        backup = JSON.parse(text)
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Invalid JSON file: ${err?.message}` }, { status: 400 })
      }
    } else {
      // Handle JSON body
      const body = await req.json()
      backup = body.backup
      if (body.mode && ['insert', 'upsert', 'truncate'].includes(body.mode)) {
        mode = body.mode
      }
      if (!backup) {
        return NextResponse.json({ success: false, error: 'Field "backup" is required in JSON body' }, { status: 400 })
      }
    }

    // Validate backup format
    if (!backup._meta || backup._meta.format !== 'hadi-kaya-db-backup') {
      return NextResponse.json({
        success: false,
        error: `Invalid backup format. Expected "hadi-kaya-db-backup", got "${backup._meta?.format || 'unknown'}"`,
      }, { status: 400 })
    }

    console.log(`[admin/restore] Starting restore`, {
      mode,
      backupTimestamp: backup._meta.timestamp,
      totalRecords: backup._meta.totalRecords,
    })

    // Truncate mode: delete all existing data (in reverse FK order)
    if (mode === 'truncate') {
      console.log('[admin/restore] Truncating all existing data...')
      const reversedModels = [...MODELS_IN_ORDER].reverse()
      for (const modelName of reversedModels) {
        try {
          // @ts-ignore
          const model = db[modelName]
          if (!model || typeof model.deleteMany !== 'function') continue
          const result = await model.deleteMany({})
          if (result.count > 0) {
            console.log(`[admin/restore]   🗑️  ${modelName}: ${result.count} deleted`)
          }
        } catch (err: any) {
          console.error(`[admin/restore] Truncate ${modelName} failed:`, err?.message)
        }
      }
    }

    // Restore each table
    const stats: Record<string, { inserted: number; updated: number; skipped: number; failed: number }> = {}
    let totalInserted = 0, totalUpdated = 0, totalSkipped = 0, totalFailed = 0

    for (const modelName of MODELS_IN_ORDER) {
      const records = backup.tables?.[modelName] || []
      stats[modelName] = { inserted: 0, updated: 0, skipped: 0, failed: 0 }

      if (records.length === 0) continue

      // @ts-ignore
      const model = db[modelName]
      if (!model || typeof model.create !== 'function') continue

      for (const record of records) {
        try {
          const deserialized = deserializeValue(record)
          if (mode === 'upsert') {
            const id = deserialized.id
            if (!id) {
              await model.create({ data: deserialized })
              stats[modelName].inserted++
              totalInserted++
            } else {
              try {
                await model.upsert({
                  where: { id },
                  create: deserialized,
                  update: deserialized,
                })
                stats[modelName].updated++
                totalUpdated++
              } catch (upsertErr: any) {
                // Fallback to plain create if upsert fails (e.g., composite unique keys)
                try {
                  await model.create({ data: deserialized })
                  stats[modelName].inserted++
                  totalInserted++
                } catch (createErr: any) {
                  if (createErr?.code === 'P2002' || /unique constraint/i.test(createErr?.message || '')) {
                    stats[modelName].skipped++
                    totalSkipped++
                  } else {
                    throw createErr
                  }
                }
              }
            }
          } else {
            // Plain insert mode — skip if unique constraint violation
            try {
              await model.create({ data: deserialized })
              stats[modelName].inserted++
              totalInserted++
            } catch (createErr: any) {
              if (createErr?.code === 'P2002' || /unique constraint/i.test(createErr?.message || '')) {
                stats[modelName].skipped++
                totalSkipped++
              } else {
                throw createErr
              }
            }
          }
        } catch (err: any) {
          stats[modelName].failed++
          totalFailed++
          if (process.env.DEBUG_RESTORE) {
            console.error(`[admin/restore] ${modelName} record failed:`, err?.message?.substring(0, 200))
          }
        }
      }
    }

    console.log(`[admin/restore] Complete: inserted=${totalInserted}, updated=${totalUpdated}, skipped=${totalSkipped}, failed=${totalFailed}`)

    return NextResponse.json({
      success: true,
      data: {
        mode,
        backupTimestamp: backup._meta.timestamp,
        totals: { inserted: totalInserted, updated: totalUpdated, skipped: totalSkipped, failed: totalFailed },
        stats,
      },
    })
  } catch (err: any) {
    console.error('[admin/restore] Error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Restore failed' }, { status: 500 })
  }
}
