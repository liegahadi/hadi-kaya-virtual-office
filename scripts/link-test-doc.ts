import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  // Link one orphaned doc to Hadi for testing
  const hadi = await prisma.customer.findFirst({ where: { name: { contains: 'Hadi Ekaputra', mode: 'insensitive' } } })
  if (!hadi) { console.log('Hadi not found'); process.exit(1) }
  
  const orphan = await prisma.googleDoc.findFirst({
    where: { customerId: null, fileName: { contains: 'BUDI SANTOSO' } }
  })
  if (!orphan) { console.log('No orphan doc found'); process.exit(1) }
  
  await prisma.googleDoc.update({
    where: { id: orphan.id },
    data: { customerId: hadi.id, fileName: 'SK_Slip_Gaji_HADI EKAPUTRA LIEGA', docType: 'sk-slip-gaji' }
  })
  console.log(`✅ Linked doc ${orphan.id} to Hadi (${hadi.id})`)
}
main().then(() => process.exit(0))
