import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
try {
  const a = await db.agent.count()
  const p = await db.project.count()
  const c = await db.customer.count()
  const u = await db.unit.count()
  const d = await db.documentTemplate.count()
  console.log({ agents: a, projects: p, customers: c, units: u, templates: d })
} catch (e) { console.error('Err:', e.message.substring(0, 200)) }
finally { await db.$disconnect() }
