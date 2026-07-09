import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // Check what's in DB
  const cmds = await prisma.customCommand.findMany()
  console.log(`=== CustomCommands in DB: ${cmds.length} ===`)
  for (const c of cmds) {
    console.log(`- [${c.id}] pattern="${c.triggerPattern}" | response="${c.responseTemplate}" | active=${c.isActive} | matchCount=${c.matchCount}`)
  }
  
  // Test the regex matching manually
  const pattern = cmds[0]?.triggerPattern || ''
  const msg = 'kirim invoice Jenni'
  console.log(`\n=== Test match ===`)
  console.log(`Pattern: "${pattern}"`)
  console.log(`Message: "${msg}"`)
  
  if (pattern.includes('*')) {
    const regexStr = pattern.toLowerCase()
      .split('*')
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('(.*)')
    console.log(`Regex: ^${regexStr}$`)
    const regex = new RegExp(`^${regexStr}$`, 'i')
    const match = msg.toLowerCase().match(regex)
    console.log(`Match:`, match)
    if (match) console.log(`Captured: "${match[1]}"`)
  } else {
    console.log(`Pattern: no wildcard, exact match: ${msg.toLowerCase() === pattern.toLowerCase()}`)
  }
}
main().then(() => process.exit(0))
