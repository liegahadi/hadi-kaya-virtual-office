import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const project = await prisma.project.findFirst()
  if (!project) { console.log('No project'); process.exit(1) }
  
  // Create 2 customers with same name "Budi Santoso" but different blok
  const budi1 = await prisma.customer.create({
    data: {
      projectId: project.id,
      name: 'Budi Santoso',
      stage: 'DM',
      blockLetter: 'F', houseNumber: '7',
      bankName: 'BTN',
      nik: '1601010101900001',
    }
  })
  console.log(`✅ Created Budi Santoso #1: ${budi1.id} (Blok F7, BTN)`)
  
  const budi2 = await prisma.customer.create({
    data: {
      projectId: project.id,
      name: 'Budi Santoso',
      stage: 'DM',
      blockLetter: 'F', houseNumber: '8',
      bankName: 'MANDIRI',
      nik: '1601010102900002',
    }
  })
  console.log(`✅ Created Budi Santoso #2: ${budi2.id} (Blok F8, MANDIRI)`)
}
main().then(() => process.exit(0))
