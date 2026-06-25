import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
try {
  const tables = await db.$queryRaw`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `
  console.log('Tables in Neon DB:')
  tables.forEach(t => console.log('  ' + t.table_name))
  
  // Check BankPipeline columns
  const bpCols = await db.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'BankPipeline' ORDER BY ordinal_position
  `
  console.log('\nBankPipeline columns:', bpCols.map(c => c.column_name).join(', '))
  
  // Check Customer extra columns
  const cCols = await db.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Customer' ORDER BY ordinal_position
  `
  console.log('Customer columns:', cCols.map(c => c.column_name).join(', '))
} catch (e) { console.error('Error:', e.message.substring(0, 400)) }
finally { await db.$disconnect() }
