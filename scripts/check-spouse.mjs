import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
try {
  const cols = await db.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Customer' AND column_name LIKE 'spouse%'`
  console.log('Spouse columns in DB:', cols.map(c => c.column_name))
  
  // Try to update with spouseAddress
  const c = await db.customer.findFirst()
  console.log('Test update on customer:', c.id)
  const updated = await db.customer.update({
    where: { id: c.id },
    data: { spouseAddress: 'TEST ADDRESS' }
  })
  console.log('✓ spouseAddress update SUCCESS:', updated.spouseAddress)
} catch (e) { console.error('Error:', e.message.substring(0, 500)) }
finally { await db.$disconnect() }
