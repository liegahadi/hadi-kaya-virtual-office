import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  // Delete test customers (bu, joko susilo)
  const deleted1 = await prisma.customer.deleteMany({ where: { name: 'bu' } })
  console.log(`Deleted 'bu': ${deleted1.count}`)
  const deleted2 = await prisma.customer.deleteMany({ where: { name: 'joko susilo' } })
  console.log(`Deleted 'joko susilo': ${deleted2.count}`)
  
  // Restore Jenni if not exists
  const jenni = await prisma.customer.findUnique({ where: { id: 'customer-jenni-e5' } })
  if (!jenni) {
    const project = await prisma.project.findFirst()
    if (project) {
      await prisma.customer.create({
        data: {
          id: 'customer-jenni-e5',
          projectId: project.id,
          name: 'JENNI',
          stage: 'PEMBERKASAN',
          stageUpdatedAt: new Date(),
          bankName: 'BTN',
          blockLetter: 'E', houseNumber: '5',
          notes: '[RESTORED after DINA bug accidentally deleted]',
          isExistingMigration: true,
        }
      })
      console.log('✅ Jenni restored')
    }
  } else {
    console.log(`ℹ️ Jenni already exists: ${jenni.name}`)
  }
  
  // Restore Hadi if not exists
  const hadi = await prisma.customer.findFirst({ where: { name: { contains: 'Hadi Ekaputra', mode: 'insensitive' } } })
  if (!hadi) {
    const project = await prisma.project.findFirst()
    if (project) {
      await prisma.customer.create({
        data: {
          projectId: project.id,
          name: 'Hadi Ekaputra Liega',
          stage: 'BOOKING',
          stageUpdatedAt: new Date(),
          blockLetter: 'E', houseNumber: '6',
          bankName: 'BTN',
          notes: '[RESTORED after testing DINA delete flow]',
          isExistingMigration: true,
        }
      })
      console.log('✅ Hadi restored')
    }
  } else {
    console.log(`ℹ️ Hadi already exists: ${hadi.name}`)
  }
  
  // Final state
  const c = await prisma.customer.findMany({ select: { id: true, name: true, blockLetter: true, houseNumber: true, bankName: true, stage: true } })
  console.log(`\n=== Final customer state ===`)
  console.log(`Total: ${c.length}`)
  for (const x of c) console.log(`- ${x.name} | Blok ${x.blockLetter}${x.houseNumber} | Bank ${x.bankName} | Stage ${x.stage}`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
