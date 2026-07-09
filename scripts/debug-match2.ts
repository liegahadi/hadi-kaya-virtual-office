import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // Test the EXACT query from custom-commands.ts
  const channel = undefined  // simulate DASHBOARD non-WA
  
  const commands = await prisma.customCommand.findMany({
    where: {
      isActive: true,
      OR: [
        { channel: null },
        ...(channel ? [{ channel }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`Commands returned: ${commands.length}`)
  for (const c of commands) {
    console.log(`- pattern="${c.triggerPattern}" channel=${c.channel}`)
  }
}
main().then(() => process.exit(0))
