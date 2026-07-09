import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const conv = await prisma.conversation.findFirst({
    where: { channel: 'DASHBOARD' },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 15 } }
  })
  if (!conv) { console.log('No conversation'); return }
  console.log(`=== Conversation ${conv.id} (last 15 msgs) ===`)
  const msgs = [...conv.messages].reverse()
  for (const m of msgs) {
    const t = m.createdAt.toISOString().substring(11, 19)
    console.log(`[${t}] ${m.role}: ${m.content.substring(0, 250)}`)
  }
  
  console.log('\n=== PendingActions (recent 5) ===')
  const pend = await prisma.pendingAction.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  for (const p of pend) {
    console.log(`- [${p.createdAt.toISOString().substring(11,19)}] ${p.status} ${p.type} target=${p.targetName} ch=${p.channel}`)
  }
}
main().then(() => process.exit(0))
