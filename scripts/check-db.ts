import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})
async function main() {
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, blockLetter: true, houseNumber: true, bankName: true, stage: true, createdAt: true }
  })
  console.log('=== ALL CUSTOMERS ===')
  for (const c of customers) console.log(`- [${c.id}] ${c.name} | Blok ${c.blockLetter}${c.houseNumber} | Bank ${c.bankName} | Stage ${c.stage} | Created ${c.createdAt.toISOString()}`)
  console.log(`\nTotal: ${customers.length}`)

  console.log('\n=== RECENT CONVERSATIONS (last 3) ===')
  const convs = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 30 } }
  })
  for (const conv of convs) {
    console.log(`\n--- Conversation ${conv.id} (${conv.channel}) customerId=${conv.customerId || 'NULL'} ---`)
    const msgs = [...conv.messages].reverse()
    for (const m of msgs) {
      const t = m.createdAt.toISOString().substring(11, 19)
      console.log(`[${t}] ${m.role}: ${m.content.substring(0, 250)}`)
    }
  }

  console.log('\n=== MEMORY (recent 10) ===')
  const mems = await prisma.memory.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  for (const m of mems) {
    console.log(`[${m.createdAt.toISOString().substring(11,19)}] [${m.category}] ${m.content.substring(0, 200)}`)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
