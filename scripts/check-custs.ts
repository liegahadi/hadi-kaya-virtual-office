import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const c = await prisma.customer.findMany({ select: { id: true, name: true, blockLetter: true, houseNumber: true, bankName: true } })
  console.log(`Total: ${c.length}`)
  for (const x of c) console.log(`- ${x.name} | Blok ${x.blockLetter}${x.houseNumber} | Bank ${x.bankName}`)
}
main().then(() => process.exit(0))
