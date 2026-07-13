// Verify Aiven DB tables created
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== AIVEN POSTGRESQL VERIFICATION ===\n')

  // Count tables (PostgreSQL way)
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  ` as any[]
  
  console.log(`✅ Total tables created: ${tables.length}`)
  console.log('\nTables:')
  tables.forEach(t => console.log(`  - ${t.table_name}`))

  // Quick row count for key tables
  console.log('\n=== ROW COUNTS ===')
  const counts = [
    { name: 'Customer', model: prisma.customer },
    { name: 'Agent', model: prisma.agent },
    { name: 'Memory', model: prisma.memory },
    { name: 'Skill', model: prisma.skill },
    { name: 'BankConfig', model: prisma.bankConfig },
    { name: 'AppUser', model: prisma.appUser },
    { name: 'Project', model: prisma.project },
  ]

  for (const c of counts) {
    try {
      const count = await c.model.count()
      console.log(`  ${c.name}: ${count} rows`)
    } catch (err: any) {
      console.log(`  ${c.name}: ERROR - ${err.message.substring(0, 80)}`)
    }
  }

  console.log('\n✅ Aiven PostgreSQL ready!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
