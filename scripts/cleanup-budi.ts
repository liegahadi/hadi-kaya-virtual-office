import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const r = await prisma.customer.deleteMany({ where: { name: { contains: 'budi santoso', mode: 'insensitive' } } })
  console.log(`Deleted budi: ${r.count}`)
}
main().then(() => process.exit(0))
