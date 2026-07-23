// CLI wrapper untuk import backup JSON (Vercel-only approach preferred)
//
// Vercel approach (RECOMMENDED — no local command line needed):
//   1. Push ke main → Vercel auto-deploy (postbuild runs prisma db push)
//   2. Hit URL: https://hadi-kaya-virtual-office.vercel.app/api/admin/import-backup?secret=XXX
//
// Local CLI approach (fallback, kalau Vercel import timeout/error):
//   Windows PowerShell:
//     $env:DATABASE_URL = "postgres://avnadmin:PASSWORD@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb"
//     npx tsx scripts/import-finance-backup.ts
//
//   Atau set di .env file:
//     DATABASE_URL="postgres://avnadmin:PASSWORD@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb"
//   lalu:
//     npx tsx scripts/import-finance-backup.ts

import { PrismaClient } from '@prisma/client'
import { importFinanceBackup } from '../src/lib/finance/import-backup'

const db = new PrismaClient({
  log: ['error', 'warn'],
})

async function main() {
  console.log('=== IMPORT FINANCE & MATERIAL BACKUP (CLI) ===\n')
  console.log('💡 Tip: Kalau pusing dengan command line, pakai Vercel approach:')
  console.log('   Hit URL: https://hadi-kaya-virtual-office.vercel.app/api/admin/import-backup?secret=XXX\n')

  const result = await importFinanceBackup(db)

  if (!result.success) {
    console.error('❌ Import failed:', result.error)
    process.exit(1)
  }

  console.log('\n=== IMPORT SUMMARY ===')
  console.log('Section          | Imported | Skipped | Errors')
  console.log('-----------------+----------+---------+-------')
  for (const [name, s] of Object.entries(result.stats)) {
    console.log(`${name.padEnd(17)}| ${String(s.imported).padStart(8)} | ${String(s.skipped).padStart(7)} | ${String(s.errors).padStart(6)}`)
  }
  console.log(`\nTotal imported: ${result.totalImported}`)
  console.log(`Total errors: ${result.totalErrors}`)
  console.log(`Distinct workers: ${result.distinctWorkers.join(', ')}`)
  console.log('\n✅ Import completed!')
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
