// Restore Jenni customer (deleted due to DINA bug)
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})

async function main() {
  const project = await prisma.project.findFirst()
  if (!project) { console.error('No project found'); process.exit(1) }

  // Check if Jenni still exists (idempotent restore)
  const existing = await prisma.customer.findUnique({ where: { id: 'customer-jenni-e5' } })
  if (existing) {
    console.log(`✅ Jenni already exists: ${existing.name} (Blok ${existing.blockLetter}${existing.houseNumber}, ${existing.bankName})`)
    process.exit(0)
  }

  // Restore Jenni
  const jenni = await prisma.customer.create({
    data: {
      id: 'customer-jenni-e5',
      projectId: project.id,
      name: 'JENNI',
      stage: 'PEMBERKASAN',
      stageUpdatedAt: new Date(),
      bankName: 'BTN',
      blockLetter: 'E',
      houseNumber: '5',
      notes: 'Sedang proses di Bank BTN. Document AI perlu: pekerjaan, lokasi kerja, no HP, status pernikahan, gaji. [RESTORED after DINA bug accidentally deleted]',
      isExistingMigration: true,
    }
  })
  console.log(`✅ Restored Jenni: ${jenni.id}`)

  // Restore E5 unit link
  const e5 = await prisma.unit.findFirst({ where: { projectId: project.id, blockNumber: 'E5' } })
  if (e5) {
    await prisma.unit.update({ where: { id: e5.id }, data: { customerId: jenni.id, status: 'BOOKED' } })
    console.log(`✅ Re-linked unit E5 to Jenni`)
  } else {
    await prisma.unit.create({
      data: { blockNumber: 'E5', status: 'BOOKED', projectId: project.id, customerId: jenni.id } as any
    })
    console.log(`✅ Created unit E5 + linked to Jenni`)
  }

  // Log to AuditLog
  await prisma.auditLog.create({
    data: {
      action: 'RESTORE_CUSTOMER',
      entityType: 'Customer',
      entityId: jenni.id,
      metadata: JSON.stringify({ reason: 'DINA bug accidentally deleted Jenni — restoring manually', name: 'JENNI', block: 'E5', bank: 'BTN' }),
    } as any
  })
  console.log(`✅ AuditLog entry created`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
