import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  // Find orphaned GoogleDocs (customerId=null) where fileName contains "Jenni" or "JENNI"
  const orphans = await prisma.googleDoc.findMany({
    where: { customerId: null, fileName: { contains: 'JENNI', mode: 'insensitive' } }
  })
  console.log(`Found ${orphans.length} orphaned Jenni docs:`)
  for (const d of orphans) console.log(`- ${d.fileName} (docId: ${d.docId.substring(0, 20)}...)`)
  
  // Re-link them to Jenni
  if (orphans.length > 0) {
    const r = await prisma.googleDoc.updateMany({
      where: { id: { in: orphans.map(d => d.id) } },
      data: { customerId: 'customer-jenni-e5' }
    })
    console.log(`\n✅ Re-linked ${r.count} docs to Jenni (customer-jenni-e5)`)
  }
}
main().then(() => process.exit(0))
