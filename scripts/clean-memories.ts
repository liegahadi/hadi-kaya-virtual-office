import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  const all = await prisma.memory.findMany({ select: { id: true, content: true, category: true, memoryType: true, source: true, agentId: true, importance: true }, orderBy: { createdAt: 'asc' } })
  console.log(`Total memories: ${all.length}`)
  
  // Count "User bertanya:" memories
  const userBertanya = all.filter(m => m.content.startsWith('User bertanya:') || m.content.startsWith('User melakukan UPDATE:'))
  console.log(`\n"User bertanya/UPDATE" memories: ${userBertanya.length}`)
  
  // Count duplicates (same content)
  const contentMap: Record<string, number> = {}
  for (const m of all) {
    const key = m.content.substring(0, 50)
    contentMap[key] = (contentMap[key] || 0) + 1
  }
  const duplicates = Object.entries(contentMap).filter(([_, count]) => count > 1)
  console.log(`\nDuplicate content groups: ${duplicates.length}`)
  for (const [content, count] of duplicates) console.log(`  (${count}x) ${content}...`)
  
  // Count by category
  const byCategory: Record<string, number> = {}
  for (const m of all) byCategory[m.category] = (byCategory[m.category] || 0) + 1
  console.log(`\nBy category:`)
  for (const [cat, count] of Object.entries(byCategory)) console.log(`  ${cat}: ${count}`)
  
  // Count by memoryType
  const byType: Record<string, number> = {}
  for (const m of all) byType[m.memoryType] = (byType[m.memoryType] || 0) + 1
  console.log(`\nBy memoryType:`)
  for (const [type, count] of Object.entries(byType)) console.log(`  ${type}: ${count}`)
}
main().then(() => process.exit(0))
