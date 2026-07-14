// ============================================================
// Database Backup Script
// ============================================================
// Usage:
//   DATABASE_URL="postgres://user:pass@host:port/db?sslmode=require" npx tsx scripts/backup-db.ts
//
// What it does:
//   1. Connects to current DATABASE_URL (env var)
//   2. Exports ALL tables to JSON (preserves foreign key relations via IDs)
//   3. Saves to /home/z/my-project/download/db-backup-{timestamp}.json
//
// Output format:
//   {
//     "_meta": { version, timestamp, sourceDbUrl, prismaClientVersion },
//     "tables": {
//       "User": [{...}, {...}],
//       "Customer": [{...}, {...}],
//       ...
//     }
//   }
//
// Notes:
//   - Binary/blob fields (Buffers) are encoded as base64 strings
//   - Date fields are serialized as ISO strings
//   - Relations are NOT expanded — only foreign key IDs are preserved
//   - Safe to run on production database (read-only)
// ============================================================

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Read Prisma client version (avoid `require()` for ESLint compatibility)
import * as prismaClientPkg from '@prisma/client/package.json'
const PRISMA_VERSION = (prismaClientPkg as any).version || 'unknown'

const db = new PrismaClient()

// ============================================================
// List of models to backup (in dependency order for restore)
// Order matters: parent tables first, then child tables
// ============================================================
const MODELS_IN_ORDER = [
  // Auth & users
  'appUser',
  'googleToken',
  'userSetting',
  // Core
  'project',
  'agent',
  'agentTeam',
  'agentTeamMember',
  'unit',
  'customer',
  'customerHistoryLog',
  'customerStageHistory',
  // Chat
  'conversation',
  'message',
  // Memory & skills
  'memory',
  'memoryVersion',
  'memoryAudit',
  'skill',
  'skillVersion',
  // Knowledge
  'knowledgeItem',
  // Approvals
  'approval',
  // Procurement
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
  // Documents
  'document',
  'documentTemplate',
  'googleDoc',
  'surveySchedule',
  // System
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
// Helper: serialize value for JSON (handle Date, BigInt, Buffer)
// ============================================================
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

// ============================================================
// MAIN
// ============================================================
async function main() {
  const startTime = Date.now()
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.error('   Usage: DATABASE_URL="postgres://..." npx tsx scripts/backup-db.ts')
    process.exit(1)
  }

  // Mask password in URL for logging
  const maskedUrl = dbUrl.replace(/(:[^:@]+)@/, ':***@')
  console.log(`📊 Starting database backup...`)
  console.log(`   Source DB: ${maskedUrl}`)

  // Check connection
  try {
    await db.$connect()
    console.log(`   ✅ Connected`)
  } catch (err: any) {
    console.error(`   ❌ Connection failed: ${err?.message}`)
    process.exit(1)
  }

  const tables: Record<string, any[]> = {}
  let totalRecords = 0
  const tableCounts: Record<string, number> = {}

  for (const modelName of MODELS_IN_ORDER) {
    try {
      // @ts-ignore — dynamic model access
      const model = db[modelName]
      if (!model || typeof model.findMany !== 'function') {
        console.warn(`   ⚠️  Model "${modelName}" not found on PrismaClient, skipping`)
        continue
      }
      const records = await model.findMany()
      const serialized = records.map(serializeValue)
      tables[modelName] = serialized
      tableCounts[modelName] = serialized.length
      totalRecords += serialized.length
      console.log(`   📦 ${modelName.padEnd(28)} ${String(serialized.length).padStart(6)} records`)
    } catch (err: any) {
      console.error(`   ❌ Error backing up ${modelName}: ${err?.message}`)
      tables[modelName] = []
      tableCounts[modelName] = 0
    }
  }

  // Build backup object
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = {
    _meta: {
      version: 1,
      format: 'hadi-kaya-db-backup',
      timestamp: new Date().toISOString(),
      sourceDbUrl: maskedUrl,
      prismaClientVersion: PRISMA_VERSION,
      totalRecords,
      tableCount: Object.keys(tables).length,
    },
    tableCounts,
    tables,
  }

  // Ensure download dir exists
  const downloadDir = path.resolve(__dirname, '..', 'download')
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true })
  }

  // Write to file
  const filename = `db-backup-${timestamp}.json`
  const filepath = path.join(downloadDir, filename)
  const jsonStr = JSON.stringify(backup, null, 2)
  fs.writeFileSync(filepath, jsonStr, 'utf8')

  const fileStats = fs.statSync(filepath)
  const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2)

  console.log('')
  console.log(`✅ Backup complete!`)
  console.log(`   📁 File: ${filepath}`)
  console.log(`   📊 Size: ${fileSizeMB} MB`)
  console.log(`   📦 Total records: ${totalRecords}`)
  console.log(`   ⏱️  Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)

  await db.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Backup script failed:', err)
  await db.$disconnect().catch(() => {})
  process.exit(1)
})
