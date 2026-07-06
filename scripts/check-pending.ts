import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})
async function main() {
  const pending = await prisma.pendingAction.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  console.log(`Active pending actions: ${pending.length}`)
  for (const p of pending) {
    console.log(`- [${p.id}] type=${p.type} target=${p.targetName} (id=${p.targetId}) channel=${p.channel} sender=${p.senderNumber}`)
    console.log(`  createdAt: ${p.createdAt.toISOString()} expiresAt: ${p.expiresAt.toISOString()}`)
  }
  console.log('\n=== ALL PendingAction records (last 10) ===')
  const all = await prisma.pendingAction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  for (const p of all) {
    console.log(`- [${p.id}] ${p.status} type=${p.type} target=${p.targetName} ch=${p.channel} createdAt=${p.createdAt.toISOString().substring(11,19)}`)
  }
  console.log('\n=== AuditLog (last 10) ===')
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  for (const l of logs) {
    console.log(`- [${l.createdAt.toISOString().substring(11,19)}] ${l.action} ${l.entityType} ${l.entityId} meta=${l.metadata?.substring(0,150)}`)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
