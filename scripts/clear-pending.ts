import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})
async function main() {
  const r = await prisma.pendingAction.updateMany({ where: { status: 'PENDING' }, data: { status: 'CANCELLED' } })
  console.log(`Cleared ${r.count} pending actions`)
  
  // Also check conversation IDs
  const convs = await prisma.conversation.findMany({ select: { id: true, channel: true, customerId: true, updatedAt: true } })
  console.log('\nConversations:')
  for (const c of convs) console.log(`- ${c.id} | channel=${c.channel} customerId=${c.customerId || 'NULL'} updated=${c.updatedAt.toISOString()}`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
