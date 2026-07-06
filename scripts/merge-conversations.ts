import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  // Find all DASHBOARD conversations
  const convs = await prisma.conversation.findMany({
    where: { channel: 'DASHBOARD' },
    include: { _count: { select: { messages: true } } }
  })
  console.log(`Found ${convs.length} DASHBOARD conversations:`)
  for (const c of convs) console.log(`- ${c.id} | customerId=${c.customerId || 'NULL'} | msgs=${c._count.messages} | updated=${c.updatedAt.toISOString()}`)
  
  // Keep the one with most messages, move all messages from others to it
  const target = convs.sort((a, b) => b._count.messages - a._count.messages)[0]
  console.log(`\nTarget (keep): ${target.id}`)
  
  for (const c of convs) {
    if (c.id === target.id) continue
    // Move messages to target
    const moved = await prisma.message.updateMany({
      where: { conversationId: c.id },
      data: { conversationId: target.id }
    })
    console.log(`Moved ${moved.count} messages from ${c.id} → ${target.id}`)
    // Delete empty conversation
    await prisma.conversation.delete({ where: { id: c.id } })
    console.log(`Deleted conversation ${c.id}`)
  }
  
  // Verify
  const remaining = await prisma.conversation.findMany({ where: { channel: 'DASHBOARD' } })
  console.log(`\nRemaining DASHBOARD conversations: ${remaining.length}`)
  for (const c of remaining) console.log(`- ${c.id} | customerId=${c.customerId || 'NULL'}`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
