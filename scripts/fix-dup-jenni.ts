import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  // Delete old lowercase Jenni (the one with DM stage)
  const old = await prisma.customer.findFirst({ where: { name: 'Jenni', stage: 'DM' } })
  if (old) {
    // Move any conversations to new Jenni
    await prisma.conversation.updateMany({ where: { customerId: old.id }, data: { customerId: 'customer-jenni-e5' } })
    // Delete old
    await prisma.customer.delete({ where: { id: old.id } })
    console.log(`✅ Deleted old Jenni (${old.id})`)
  }
  
  const all = await prisma.customer.findMany({ select: { name: true, stage: true, blockLetter: true, houseNumber: true, bankName: true } })
  console.log(`Final: ${all.length} customers`)
  for (const c of all) console.log(`- ${c.name} | ${c.blockLetter}${c.houseNumber} | ${c.bankName} | ${c.stage}`)
}
main().then(() => process.exit(0))
