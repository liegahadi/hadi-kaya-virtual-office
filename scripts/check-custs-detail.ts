import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const c = await prisma.customer.findMany({ select: { id: true, name: true, blockLetter: true, houseNumber: true, bankName: true, stage: true, createdAt: true, projectId: true } })
  console.log(`Total: ${c.length}`)
  for (const x of c) console.log(`- [${x.id}] ${x.name} | Blok ${x.blockLetter}${x.houseNumber} | Bank ${x.bankName} | Stage ${x.stage} | Created ${x.createdAt.toISOString()}`)
  
  console.log('\n=== AuditLog (last 5) ===')
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  for (const l of logs) console.log(`- [${l.createdAt.toISOString().substring(11,19)}] ${l.action} ${l.entityType} ${l.entityId}`)
}
main().then(() => process.exit(0))
