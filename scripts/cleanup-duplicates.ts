import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const r = await prisma.customer.deleteMany({ where: { name: 'Budi Santoso' } })
  console.log(`Deleted ${r.count} Budi Santoso (test duplicates)`)
  
  // Clear pending
  await prisma.pendingAction.updateMany({ where: { status: 'PENDING' }, data: { status: 'CANCELLED' } })
  console.log('Cleared pending actions')
  
  // Final state
  const c = await prisma.customer.findMany({ select: { name: true, blockLetter: true, houseNumber: true, bankName: true } })
  console.log(`\n=== Final customers: ${c.length} ===`)
  for (const x of c) console.log(`- ${x.name} | Blok ${x.blockLetter}${x.houseNumber} | Bank ${x.bankName}`)
}
main().then(() => process.exit(0))
