import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  const customers = await prisma.customer.findMany({ select: { id: true, name: true, stage: true, blockLetter: true, houseNumber: true, bankName: true } })
  console.log(`Total customers in DB: ${customers.length}`)
  for (const c of customers) console.log(`- ${c.name} | Blok ${c.blockLetter}${c.houseNumber} | ${c.bankName} | Stage: ${c.stage}`)
}
main().then(() => process.exit(0))
