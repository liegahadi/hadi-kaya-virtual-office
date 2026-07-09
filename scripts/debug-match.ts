import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  console.log('=== All CustomCommands (raw) ===')
  const all = await prisma.customCommand.findMany()
  console.log(`Total: ${all.length}`)
  for (const c of all) {
    console.log(`- id=${c.id} pattern="${c.triggerPattern}" active=${c.isActive} channel=${c.channel || 'null'}`)
  }
  
  console.log('\n=== Filtered: isActive=true AND (channel=null OR channel=DASHBOARD) ===')
  const filtered = await prisma.customCommand.findMany({
    where: {
      isActive: true,
      OR: [
        { channel: null },
        { channel: 'DASHBOARD' },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`Filtered: ${filtered.length}`)
  
  console.log('\n=== Try match: "kirim invoice Jenni" ===')
  const msg = 'kirim invoice Jenni'
  for (const cmd of filtered) {
    const pattern = cmd.triggerPattern.toLowerCase().trim()
    console.log(`Testing pattern: "${pattern}"`)
    if (pattern.includes('*')) {
      const regexStr = pattern.split('*').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*)')
      const regex = new RegExp(`^${regexStr}$`, 'i')
      const match = msg.toLowerCase().match(regex)
      console.log(`  Regex: ^${regexStr}$ → Match: ${!!match}`)
      if (match) console.log(`  Captured: "${match[1] || ''}"`)
    } else {
      console.log(`  Exact match: ${msg.toLowerCase() === pattern}`)
    }
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
