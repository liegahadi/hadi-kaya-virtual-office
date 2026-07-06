import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})
async function main() {
  const existing = await prisma.customer.findFirst({ where: { name: { contains: 'Hadi Ekaputra', mode: 'insensitive' } } })
  if (existing) { console.log(`Hadi already exists: ${existing.id}`); process.exit(0) }
  const project = await prisma.project.findFirst()
  if (!project) { console.error('No project'); process.exit(1) }
  const hadi = await prisma.customer.create({
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
  console.log(`✅ Restored Hadi: ${hadi.id}`)
  await prisma.auditLog.create({
    data: {
      action: 'RESTORE_CUSTOMER',
      entityType: 'Customer',
      entityId: hadi.id,
      metadata: JSON.stringify({ reason: 'Restore after testing DINA delete confirmation flow', name: 'Hadi Ekaputra Liega', block: 'E6', bank: 'BTN' }),
    } as any
  })
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
