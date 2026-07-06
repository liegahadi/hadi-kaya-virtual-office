import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const convs = await prisma.conversation.findMany({
    where: { channel: 'DASHBOARD' },
    include: { messages: { where: { role: 'user' }, orderBy: { createdAt: 'desc' }, take: 10 } }
  })
  for (const c of convs) {
    console.log(`\n=== Conversation ${c.id} (customerId=${c.customerId || 'NULL'}) ===`)
    for (const m of c.messages) {
      console.log(`[${m.createdAt.toISOString().substring(11,19)}] ${m.content.substring(0, 100)}`)
    }
  }
  
  console.log('\n=== All customers (for matching) ===')
  const custs = await prisma.customer.findMany({ select: { id: true, name: true } })
  for (const c of custs) console.log(`- ${c.id}: ${c.name}`)
}
main().then(() => process.exit(0))
