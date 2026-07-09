import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // Delete junk customer "sudah"
  await prisma.customer.deleteMany({ where: { name: 'sudah' } })
  console.log('✅ Deleted junk customer "sudah"')

  // Fix Jenni stage back to PEMBERKASAN
  await prisma.customer.update({ where: { id: 'customer-jenni-e5' }, data: { stage: 'PEMBERKASAN' } })
  console.log('✅ Fixed Jenni stage → PEMBERKASAN')

  // Restore Andas
  const project = await prisma.project.findFirst()
  const andas = await prisma.customer.findUnique({ where: { id: 'customer-andas-e4' } })
  if (!andas && project) {
    await prisma.customer.create({
      data: {
        id: 'customer-andas-e4', projectId: project.id, name: 'Andas Saputra',
        stage: 'SP3K', stageUpdatedAt: new Date(),
        blockLetter: 'E', houseNumber: '4', bankName: 'BSB_SYARIAH',
        isExistingMigration: true,
      }
    })
    console.log('✅ Restored Andas (E4, BSB_SYARIAH, SP3K)')
  } else { console.log('ℹ️ Andas already exists') }

  // Restore Hadi
  const hadi = await prisma.customer.findFirst({ where: { name: { contains: 'Hadi Ekaputra', mode: 'insensitive' } } })
  if (!hadi && project) {
    await prisma.customer.create({
      data: {
        projectId: project.id, name: 'Hadi Ekaputra Liega',
        stage: 'BOOKING', stageUpdatedAt: new Date(),
        blockLetter: 'E', houseNumber: '6', bankName: 'BTN',
        isExistingMigration: true,
      }
    })
    console.log('✅ Restored Hadi (E6, BTN, BOOKING)')
  } else { console.log('ℹ️ Hadi already exists') }

  // Verify
  const all = await prisma.customer.findMany({ select: { name: true, stage: true, blockLetter: true, houseNumber: true, bankName: true } })
  console.log(`\n=== Final customers: ${all.length} ===`)
  for (const c of all) console.log(`- ${c.name} | Blok ${c.blockLetter}${c.houseNumber} | ${c.bankName} | ${c.stage}`)
}
main().then(() => process.exit(0))
