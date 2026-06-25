import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
try {
  // Get column info for Customer table
  const result = await db.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'Customer'
    ORDER BY ordinal_position
  `
  console.log('Customer table columns:')
  result.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, ${r.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`))
  
  // Get sample customer
  const c = await db.customer.findFirst({ include: { units: true, bankPipelines: true } })
  console.log('\nSample customer:', JSON.stringify(c, null, 2).substring(0, 1500))
} catch (e) { console.error('Error:', e.message.substring(0, 300)) }
finally { await db.$disconnect() }
