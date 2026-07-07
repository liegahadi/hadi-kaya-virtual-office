import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const banks = await prisma.bankConfig.findMany({ orderBy: { createdAt: 'desc' } })
  console.log(`BankConfig records: ${banks.length}`)
  for (const b of banks) console.log(`- ${b.bankName} (${b.bankCode}) | active=${b.isActive} | by=${b.createdBy}`)
}
main().then(() => process.exit(0))
