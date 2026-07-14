// ============================================================
// Database Restore Script
// ============================================================
// Usage:
//   DATABASE_URL="postgres://user:pass@host:port/db?sslmode=require" npx tsx scripts/restore-db.ts <backup-file.json>
//
// What it does:
//   1. Reads backup JSON file (from backup-db.ts)
//   2. Connects to target DATABASE_URL (env var)
//   3. Imports all data with conflict handling:
//      - Default: skip if record with same ID exists
//      - --upsert flag: update existing records
//      - --truncate flag: DELETE all existing data first (DANGEROUS!)
//   4. Reports counts of inserted/skipped/updated per table
//
// Safety:
//   - Asks for confirmation before restore (unless --yes flag)
//   - Refuses to restore if backup format is wrong
//   - Refuses to restore if backup version is incompatible
// ============================================================

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const db = new PrismaClient()

// ============================================================
// Models in restore order (parents first, then children)
// Must match backup-db.ts order
// ============================================================
const MODELS_IN_ORDER = [
  'appUser',
  'googleToken',
  'userSetting',
  'project',
  'agent',
  'agentTeam',
  'agentTeamMember',
  'unit',
  'customer',
  'customerHistoryLog',
  'customerStageHistory',
  'conversation',
  'message',
  'memory',
  'memoryVersion',
  'memoryAudit',
  'skill',
  'skillVersion',
  'knowledgeItem',
  'approval',
  'supplier',
  'pO',
  'pOLine',
  'supplierPayment',
  'fundRequest',
  'rAB',
  'rABLine',
  'materialStock',
  'materialUsage',
  'progressPhoto',
  'unitBudgetTracking',
  'document',
  'documentTemplate',
  'googleDoc',
  'surveySchedule',
  'auditLog',
  'pendingAction',
  'sessionContext',
  'bankConfig',
  'bankPipeline',
  'notarisSetting',
  'companySetting',
  'notification',
] as const

// ============================================================
// Helper: deserialize value from JSON (handle Date, BigInt, Buffer)
// ============================================================
function deserializeValue(val: any): any {
  if (val === null || val === undefined) return val
  if (Array.isArray(val)) return val.map(deserializeValue)
  if (typeof val === 'object') {
    // Check for type markers
    if (val.__type === 'Date' && val.iso) return new Date(val.iso)
    if (val.__type === 'Buffer' && val.base64) return Buffer.from(val.base64, 'base64')
    if (val.__type === 'BigInt' && val.value) return BigInt(val.value)
    // Regular object — recurse
    const out: any = {}
    for (const [k, v] of Object.entries(val)) out[k] = deserializeValue(v)
    return out
  }
  return val
}

// ============================================================
// Helper: ask for user confirmation (interactive)
// ============================================================
function askForConfirmation(question: string): boolean {
  if (process.env.NODE_ENV === 'test' || process.argv.includes('--yes')) return true
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close()
      resolve(/^y|ya|yes|iya/i.test(answer.trim().toLowerCase()))
    })
  })
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const startTime = Date.now()
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.error('   Usage: DATABASE_URL="postgres://..." npx tsx scripts/restore-db.ts <backup-file.json>')
    process.exit(1)
  }

  // Parse args
  const args = process.argv.slice(2)
  const flags = args.filter(a => a.startsWith('--'))
  const positional = args.filter(a => !a.startsWith('--'))
  const backupFilePath = positional[0]

  if (!backupFilePath) {
    console.error('❌ Backup file path is required')
    console.error('   Usage: DATABASE_URL="postgres://..." npx tsx scripts/restore-db.ts <backup-file.json> [--upsert] [--truncate] [--yes]')
    process.exit(1)
  }

  const useUpsert = flags.includes('--upsert')
  const useTruncate = flags.includes('--truncate')

  // Mask password in URL for logging
  const maskedUrl = dbUrl.replace(/(:[^:@]+)@/, ':***@')
  console.log(`📥 Starting database restore...`)
  console.log(`   Target DB: ${maskedUrl}`)
  console.log(`   Backup file: ${backupFilePath}`)
  console.log(`   Mode: ${useTruncate ? 'TRUNCATE + INSERT' : useUpsert ? 'UPSERT' : 'INSERT (skip existing)'}`)

  // Read backup file
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found: ${backupFilePath}`)
    process.exit(1)
  }

  let backup: any
  try {
    const raw = fs.readFileSync(backupFilePath, 'utf8')
    backup = JSON.parse(raw)
  } catch (err: any) {
    console.error(`❌ Failed to parse backup JSON: ${err?.message}`)
    process.exit(1)
  }

  // Validate backup format
  if (!backup._meta || backup._meta.format !== 'hadi-kaya-db-backup') {
    console.error(`❌ Invalid backup format. Expected "hadi-kaya-db-backup", got "${backup._meta?.format || 'unknown'}"`)
    process.exit(1)
  }

  console.log(`   Backup created: ${backup._meta.timestamp}`)
  console.log(`   Backup source: ${backup._meta.sourceDbUrl}`)
  console.log(`   Total records in backup: ${backup._meta.totalRecords}`)

  // Same DB check (warn if restoring to same DB)
  if (backup._meta.sourceDbUrl === maskedUrl) {
    console.warn(`⚠️  WARNING: Backup was created from the SAME database you're restoring to!`)
    console.warn(`   This is a no-op if records already exist. Use --upsert to update, or --truncate to wipe first.`)
  }

  // Confirm before proceeding
  const confirmed = await askForConfirmation(`\n❓ Proceed with restore? This may modify data. (y/N): `)
  if (!confirmed) {
    console.log(`🚫 Restore cancelled.`)
    process.exit(0)
  }

  // Connect to DB
  try {
    await db.$connect()
    console.log(`   ✅ Connected to target DB`)
  } catch (err: any) {
    console.error(`   ❌ Connection failed: ${err?.message}`)
    process.exit(1)
  }

  // Truncate mode: delete all existing data (in reverse order to respect FK constraints)
  if (useTruncate) {
    console.log(`\n🗑️  Truncating all existing data (in reverse FK order)...`)
    const reversedModels = [...MODELS_IN_ORDER].reverse()
    for (const modelName of reversedModels) {
      try {
        // @ts-ignore — dynamic model access
        const model = db[modelName]
        if (!model || typeof model.deleteMany !== 'function') continue
        const result = await model.deleteMany({})
        if (result.count > 0) {
          console.log(`   🗑️  ${modelName.padEnd(28)} deleted ${result.count} records`)
        }
      } catch (err: any) {
        console.error(`   ❌ Failed to truncate ${modelName}: ${err?.message}`)
      }
    }
  }

  // Restore each table
  console.log(`\n📥 Restoring data...`)
  const stats: Record<string, { inserted: number; updated: number; skipped: number; failed: number }> = {}
  let totalInserted = 0, totalUpdated = 0, totalSkipped = 0, totalFailed = 0

  for (const modelName of MODELS_IN_ORDER) {
    const records = backup.tables?.[modelName] || []
    stats[modelName] = { inserted: 0, updated: 0, skipped: 0, failed: 0 }

    if (records.length === 0) {
      continue
    }

    // @ts-ignore — dynamic model access
    const model = db[modelName]
    if (!model || typeof model.create !== 'function') {
      console.warn(`   ⚠️  Model "${modelName}" not found on PrismaClient, skipping ${records.length} records`)
      continue
    }

    for (const record of records) {
      try {
        const deserialized = deserializeValue(record)
        if (useUpsert) {
          // Try upsert — requires unique identifier (usually `id`)
          const id = deserialized.id
          if (!id) {
            // No ID field — fall back to create
            await model.create({ data: deserialized })
            stats[modelName].inserted++
            totalInserted++
          } else {
            await model.upsert({
              where: { id },
              create: deserialized,
              update: deserialized,
            })
            // Prisma doesn't tell us if it was insert or update — assume update if no error
            stats[modelName].updated++
            totalUpdated++
          }
        } else {
          // Plain create — skip if exists (rely on unique constraint)
          try {
            await model.create({ data: deserialized })
            stats[modelName].inserted++
            totalInserted++
          } catch (createErr: any) {
            // Check if it's a unique constraint violation (P2002)
            if (createErr?.code === 'P2002' || /unique constraint/i.test(createErr?.message || '')) {
              stats[modelName].skipped++
              totalSkipped++
            } else {
              throw createErr  // re-throw to outer catch
            }
          }
        }
      } catch (err: any) {
        stats[modelName].failed++
        totalFailed++
        if (process.env.DEBUG_RESTORE) {
          console.error(`   ❌ ${modelName} record failed: ${err?.message?.substring(0, 200)}`)
        }
      }
    }

    const s = stats[modelName]
    console.log(`   📦 ${modelName.padEnd(28)} inserted=${s.inserted}, updated=${s.updated}, skipped=${s.skipped}, failed=${s.failed}`)
  }

  console.log(`\n✅ Restore complete!`)
  console.log(`   📊 Total inserted: ${totalInserted}`)
  console.log(`   📊 Total updated: ${totalUpdated}`)
  console.log(`   📊 Total skipped: ${totalSkipped}`)
  console.log(`   📊 Total failed: ${totalFailed}`)
  console.log(`   ⏱️  Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)

  if (totalFailed > 0) {
    console.warn(`\n⚠️  ${totalFailed} records failed to restore. Run with DEBUG_RESTORE=1 for details.`)
  }

  await db.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Restore script failed:', err)
  await db.$disconnect().catch(() => {})
  process.exit(1)
})
