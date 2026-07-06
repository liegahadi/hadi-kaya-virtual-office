import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const hadi = await prisma.customer.findFirst({ where: { name: { contains: 'Hadi Ekaputra', mode: 'insensitive' } } })
  if (!hadi) { console.log('Hadi not found'); process.exit(1) }
  const doc = await prisma.googleDoc.findFirst({ where: { fileName: { contains: 'HADI EKAPUTRA' } } })
  if (doc) {
    await prisma.googleDoc.update({ where: { id: doc.id }, data: { customerId: hadi.id } })
    console.log(`✅ Re-linked doc ${doc.id} to Hadi (${hadi.id})`)
  }
}
main().then(() => process.exit(0))
