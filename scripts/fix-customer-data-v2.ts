import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  const project = await prisma.project.findFirst()
  if (!project) { console.log('No project'); process.exit(1) }

  // Check current state
  const current = await prisma.customer.findMany()
  console.log(`Current customers: ${current.length}`)
  for (const c of current) console.log(`  - ${c.id} | ${c.name} | ${c.stage}`)

  // Upsert Jenni
  await prisma.customer.upsert({
    where: { id: 'customer-jenni-e5' },
    update: { stage: 'PEMBERKASAN', stageUpdatedAt: new Date(), blockLetter: 'E', houseNumber: '5', bankName: 'BTN' },
    create: {
      id: 'customer-jenni-e5', projectId: project.id, name: 'JENNI',
      stage: 'PEMBERKASAN', stageUpdatedAt: new Date(),
      blockLetter: 'E', houseNumber: '5', bankName: 'BTN',
      isExistingMigration: true,
    },
  })
  console.log('✅ Jenni upserted (E5, BTN, PEMBERKASAN)')

  // Upsert Andas
  await prisma.customer.upsert({
    where: { id: 'customer-andas-e4' },
    update: { stage: 'SP3K', blockLetter: 'E', houseNumber: '4', bankName: 'BSB_SYARIAH' },
    create: {
      id: 'customer-andas-e4', projectId: project.id, name: 'Andas Saputra',
      stage: 'SP3K', stageUpdatedAt: new Date(),
      blockLetter: 'E', houseNumber: '4', bankName: 'BSB_SYARIAH',
      isExistingMigration: true,
    },
  })
  console.log('✅ Andas upserted (E4, BSB_SYARIAH, SP3K)')

  // Restore Hadi
  const hadi = await prisma.customer.findFirst({ where: { name: { contains: 'Hadi Ekaputra', mode: 'insensitive' } } })
  if (!hadi) {
    await prisma.customer.create({
      data: {
        projectId: project.id, name: 'Hadi Ekaputra Liega',
        stage: 'BOOKING', stageUpdatedAt: new Date(),
        blockLetter: 'E', houseNumber: '6', bankName: 'BTN',
        isExistingMigration: true,
      }
    })
    console.log('✅ Hadi created (E6, BTN, BOOKING)')
  } else {
    await prisma.customer.update({ where: { id: hadi.id }, data: { stage: 'BOOKING', blockLetter: 'E', houseNumber: '6', bankName: 'BTN' } })
    console.log('✅ Hadi updated (E6, BTN, BOOKING)')
  }

  // Verify
  const all = await prisma.customer.findMany({ select: { name: true, stage: true, blockLetter: true, houseNumber: true, bankName: true } })
  console.log(`\n=== Final: ${all.length} customers ===`)
  for (const c of all) console.log(`- ${c.name} | Blok ${c.blockLetter}${c.houseNumber} | ${c.bankName} | ${c.stage}`)
}
main().then(() => process.exit(0))
