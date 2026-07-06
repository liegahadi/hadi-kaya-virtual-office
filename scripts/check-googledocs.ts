import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})
async function main() {
  console.log('=== GoogleDoc records (all) ===')
  const docs = await prisma.googleDoc.findMany({ orderBy: { createdAt: 'desc' } })
  for (const d of docs) {
    console.log(`- [${d.id}] customerId=${d.customerId || 'NULL'} | type=${d.docType} | name=${d.fileName} | docId=${d.docId.substring(0,20)}...`)
  }
  console.log(`Total: ${docs.length}`)
  
  console.log('\n=== Units (with required fields) ===')
  const units = await prisma.unit.findMany({ take: 5, select: { id: true, blockNumber: true, landSize: true, buildingSize: true, price: true, dpAmount: true, customerId: true, status: true } })
  for (const u of units) console.log(`- ${u.blockNumber} | landSize=${u.landSize} | buildingSize=${u.buildingSize} | price=${u.price} | dpAmount=${u.dpAmount} | customerId=${u.customerId || 'NULL'} | status=${u.status}`)

  console.log('\n=== AuditLog (last 10) ===')
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  for (const l of logs) console.log(`- [${l.createdAt.toISOString().substring(11,19)}] ${l.action} ${l.entityType} ${l.entityId}`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
