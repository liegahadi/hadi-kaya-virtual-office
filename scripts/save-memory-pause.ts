import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // Save Hostinger migration plan to memory
  await prisma.memory.create({
    data: {
      content: `PAUSED TASK: Hostinger VPS migration plan (saved for resume).
Status: Railway deploy WA bot SUCCESS but WhatsApp blocks IP (405 error). Cannot use Railway/cloud provider for WA bot.

PLAN (when resuming):
- Buy Hostinger VPS KVM 2 (Rp 75-100rb/bln, 4 cores, 8GB RAM, IP Indonesia)
- Pay via bank transfer/e-wallet (NO credit card needed)
- Migrate: (1) WA bot Railway→Hostinger PM2, (2) Next.js Vercel→Hostinger PM2+Nginx, (3) DB Neon→Hostinger PostgreSQL, (4) Optional n8n Docker, (5) Optional Mirofish Docker
- Scripts to create: setup-hostinger.sh, migrate-db.sh, deploy-app.sh, deploy-wa-bot.sh, docker-compose.yml, DEPLOY-HOSTINGER.md

Railway creds (saved for reference):
- Project: vigilant-communication (50ff2ea0-d021-42c9-959d-1bbb01ae37f5)
- Service: hadi-kaya-virtual-office (d6a506ca-9a55-4546-9621-521926469916)
- Env: production (8207ea74-9f43-45f2-8aba-08d0757157cb)
- Public URL: https://hadi-kaya-virtual-office-production.up.railway.app (bot running, /health OK, but WA 405)
- Region: sin (Singapore) - tried, still 405

3 SIM cards ready for DINA (6287761323344), RINA, MITRA.

Current focus switch:
1. RETEST TAB BERKAS (verify all forms + previews work)
2. If OK → continue FINANCIAL tab (RINA: budget, invoice, RAB, supplier payments)
3. After Financial done → resume Hostinger migration plan`,
      category: 'UTAMA',
      importance: 0.9,
      source: 'DECISION',
      customerId: null,
      agentId: null,
    } as any,
  })
  console.log('✅ Memory saved: Hostinger migration plan (paused)')
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
