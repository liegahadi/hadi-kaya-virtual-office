import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // 1. Delete ALL "User bertanya:" and "User melakukan UPDATE:" memories (low quality)
  const deleted = await prisma.memory.deleteMany({
    where: {
      OR: [
        { content: { startsWith: 'User bertanya:' } },
        { content: { startsWith: 'User melakukan UPDATE:' } },
        { content: { startsWith: 'User bertanya soal FINANCE:' } },
      ]
    }
  })
  console.log(`✅ Deleted ${deleted.count} low-quality memories`)

  // 2. Delete old category memories (FACT, PREFERENCE, INTERACTION, CONTEXT, DECISION) 
  //    that are not useful (keep only UTAMA, BERKAS, FINANCE, MATERIAL, MARKETING)
  const oldCats = await prisma.memory.deleteMany({
    where: {
      category: { in: ['FACT', 'PREFERENCE', 'INTERACTION', 'CONTEXT', 'DECISION'] }
    }
  })
  console.log(`✅ Deleted ${oldCats.count} old-category memories`)

  // 3. Check remaining
  const remaining = await prisma.memory.findMany({ select: { id: true, content: true, category: true, memoryType: true, agentId: true }, orderBy: { createdAt: 'asc' } })
  console.log(`\nRemaining memories: ${remaining.length}`)
  for (const m of remaining) {
    console.log(`- [${m.category}] [${m.memoryType}] ${m.content.substring(0, 80)}`)
  }
}
main().then(() => process.exit(0))
