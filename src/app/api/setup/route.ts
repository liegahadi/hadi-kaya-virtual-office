import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

// ============================================================
// GET /api/setup — Create tables + seed data via raw SQL
// Bypass Prisma (which can't connect to Supabase pooler)
// Uses Supabase REST API to create tables directly
// ============================================================

export async function GET() {
  const results: string[] = []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  try {
    // ============================================================
    // Step 1: Create tables via Supabase SQL API
    // ============================================================
    results.push('Step 1: Creating tables via Supabase...')

    // Supabase has a SQL endpoint: POST /rest/v1/rpc
    // But we need the SQL Editor API which requires Management API
    // Alternative: use pg connection directly

    // Try using pg module (installed with Prisma)
    const { Pool } = await import('pg')

    // Try both connection strings
    const connections = [
      process.env.DATABASE_URL,
      process.env.DIRECT_URL,
      `postgresql://postgres:dAdCIQIAMQrk9pPV@db.dwsheplzirlsfqixlioc.supabase.co:5432/postgres`,
      `postgresql://postgres.dwsheplzirlsfqixlioc:dAdCIQIAMQrk9pPV@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    ]

    let pool: any = null
    let connectedUrl = ''

    for (const connUrl of connections) {
      if (!connUrl) continue
      try {
        results.push(`  Trying: ${connUrl.substring(0, 50)}...`)
        const testPool = new Pool({ connectionString: connUrl, connectionTimeoutMillis: 10000 })
        const client = await testPool.connect()
        const res = await client.query('SELECT version()')
        results.push(`  ✅ Connected! PostgreSQL: ${res.rows[0].version.substring(0, 30)}`)
        client.release()
        pool = testPool
        connectedUrl = connUrl
        break
      } catch (err) {
        results.push(`  ❌ Failed: ${err instanceof Error ? err.message.substring(0, 80) : 'unknown'}`)
      }
    }

    if (!pool) {
      return NextResponse.json({
        success: false,
        steps: results,
        error: 'Cannot connect to any Supabase database URL. Please check if pooler is enabled in Supabase dashboard.',
      })
    }

    // ============================================================
    // Step 2: Create all tables
    // ============================================================
    results.push('Step 2: Creating tables...')

    const client = await pool.connect()

    // Create tables one by one (simplified, just what we need for MVP)
    const tables = [
      `CREATE TABLE IF NOT EXISTS "AppUser" (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, "passwordHash" TEXT, role TEXT DEFAULT 'OWNER', phone TEXT, avatar TEXT, "isActive" BOOLEAN DEFAULT true, "lastLoginAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Project" (id TEXT PRIMARY KEY, name TEXT UNIQUE, code TEXT UNIQUE, "brandName" TEXT, location TEXT, address TEXT, "totalUnits" INTEGER DEFAULT 0, "sitePlanUrl" TEXT, "logoUrl" TEXT, status TEXT DEFAULT 'ACTIVE', "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Unit" (id TEXT PRIMARY KEY, "projectId" TEXT REFERENCES "Project"(id), "blockNumber" TEXT, "unitType" TEXT DEFAULT '36', "landSize" FLOAT, "buildingSize" FLOAT, price FLOAT, "dpAmount" FLOAT, status TEXT DEFAULT 'AVAILABLE', "customerId" TEXT, "soldAt" TIMESTAMP, "bookedAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE("projectId", "blockNumber"))`,
      `CREATE TABLE IF NOT EXISTS "Agent" (id TEXT PRIMARY KEY, name TEXT, role TEXT, description TEXT, personality TEXT, "systemPrompt" TEXT, gender TEXT, "avatarUrl" TEXT, "whatsappNumber" TEXT, "llmModel" TEXT DEFAULT 'glm-4.6', "llmProvider" TEXT DEFAULT 'zai', "lightLlmModel" TEXT, "lightLlmProvider" TEXT, temperature FLOAT DEFAULT 0.7, "maxTokens" INTEGER DEFAULT 2000, "isActive" BOOLEAN DEFAULT true, "isDevilsAdvocate" BOOLEAN DEFAULT false, skills TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE(name, role))`,
      `CREATE TABLE IF NOT EXISTS "Customer" (id TEXT PRIMARY KEY, "projectId" TEXT REFERENCES "Project"(id), name TEXT, "whatsappNumber" TEXT, phone TEXT, email TEXT, occupation TEXT, "maritalStatus" TEXT, "monthlyIncome" FLOAT, "hasExistingLoan" BOOLEAN DEFAULT false, "hasExistingHouse" BOOLEAN DEFAULT false, "sourceLead" TEXT, "assignedAgentId" TEXT, "personalityPreference" TEXT, stage TEXT DEFAULT 'DM', "stageUpdatedAt" TIMESTAMP, notes TEXT, "isExistingMigration" BOOLEAN DEFAULT false, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Conversation" (id TEXT PRIMARY KEY, "customerId" TEXT REFERENCES "Customer"(id), "agentId" TEXT REFERENCES "Agent"(id), channel TEXT DEFAULT 'WHATSAPP', status TEXT DEFAULT 'ACTIVE', summary TEXT, "lastMessageAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Message" (id TEXT PRIMARY KEY, "conversationId" TEXT REFERENCES "Conversation"(id), role TEXT, content TEXT, "contentType" TEXT DEFAULT 'TEXT', "mediaUrl" TEXT, metadata TEXT, "isRead" BOOLEAN DEFAULT false, "needsApproval" BOOLEAN DEFAULT false, "approvalStatus" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Memory" (id TEXT PRIMARY KEY, "agentId" TEXT REFERENCES "Agent"(id), "customerId" TEXT, category TEXT, content TEXT, importance FLOAT DEFAULT 0.5, embedding TEXT, source TEXT, "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "KnowledgeItem" (id TEXT PRIMARY KEY, "agentId" TEXT, category TEXT, question TEXT, answer TEXT, content TEXT, tags TEXT, "isActive" BOOLEAN DEFAULT true, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Approval" (id TEXT PRIMARY KEY, "requesterAgentId" TEXT, "approverUserId" TEXT, type TEXT, "referenceId" TEXT, payload TEXT, status TEXT DEFAULT 'PENDING', "signatureUrl" TEXT, notes TEXT, "respondedAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Supplier" (id TEXT PRIMARY KEY, name TEXT, "whatsappNumber" TEXT, phone TEXT, address TEXT, "contactPerson" TEXT, "totalDebt" FLOAT DEFAULT 0, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "PO" (id TEXT PRIMARY KEY, "poNumber" TEXT UNIQUE, "seqNumber" INTEGER, "agentId" TEXT, "supplierId" TEXT REFERENCES "Supplier"(id), "projectId" TEXT, "unitBlocks" TEXT, "workItem" TEXT, status TEXT DEFAULT 'DRAFT', subtotal FLOAT DEFAULT 0, "totalAmount" FLOAT DEFAULT 0, notes TEXT, "approvedAt" TIMESTAMP, "sentAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "POLine" (id TEXT PRIMARY KEY, "poId" TEXT REFERENCES "PO"(id), "materialName" TEXT, quantity FLOAT, "unitMeasure" TEXT, "unitPrice" FLOAT, "totalPrice" FLOAT, "deliveredQuantity" FLOAT DEFAULT 0, "finalUnitPrice" FLOAT, notes TEXT)`,
      `CREATE TABLE IF NOT EXISTS "SupplierPayment" (id TEXT PRIMARY KEY, "supplierId" TEXT REFERENCES "Supplier"(id), "poId" TEXT, amount FLOAT, method TEXT DEFAULT 'TRANSFER', notes TEXT, "approvalId" TEXT, "paidAt" TIMESTAMP DEFAULT NOW(), "createdAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "FundRequest" (id TEXT PRIMARY KEY, "agentId" TEXT, "requesterName" TEXT, type TEXT, "projectId" TEXT, "unitIds" TEXT, description TEXT, amount FLOAT, status TEXT DEFAULT 'PENDING', "paidAt" TIMESTAMP, notes TEXT, "approvedBy" TEXT, "approvedAt" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "DocumentTemplate" (id TEXT PRIMARY KEY, "bankName" TEXT, "templateName" TEXT, "templateUrl" TEXT, "fileSize" INTEGER, "mimeType" TEXT, type TEXT DEFAULT 'FORM', category TEXT, description TEXT, "isRequired" BOOLEAN DEFAULT true, "sortOrder" INTEGER DEFAULT 0, fields TEXT, version INTEGER DEFAULT 1, "isActive" BOOLEAN DEFAULT true, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "CustomerDocumentChecklist" (id TEXT PRIMARY KEY, "customerId" TEXT REFERENCES "Customer"(id), "templateId" TEXT, "bankName" TEXT, "documentName" TEXT, category TEXT, status TEXT DEFAULT 'MISSING', "uploadedFileUrl" TEXT, "uploadedAt" TIMESTAMP, notes TEXT, "isRequired" BOOLEAN DEFAULT true, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "DailyExpense" (id TEXT PRIMARY KEY, "projectId" TEXT, category TEXT, description TEXT, amount FLOAT, "paidAt" TIMESTAMP DEFAULT NOW(), "paymentMethod" TEXT DEFAULT 'TUNAI', "receiptUrl" TEXT, "ocrAmount" FLOAT, "ocrStatus" TEXT DEFAULT 'NONE', notes TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "AuditLog" (id TEXT PRIMARY KEY, "userId" TEXT, "agentId" TEXT, action TEXT, "entityType" TEXT, "entityId" TEXT, metadata TEXT, "ipAddress" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
    ]

    for (const sql of tables) {
      try {
        await client.query(sql)
      } catch (err) {
        // Table might already exist, skip
        if (!String(err).includes('already exists')) {
          results.push(`  ⚠️ Table error: ${String(err).substring(0, 80)}`)
        }
      }
    }
    results.push(`  ✅ ${tables.length} tables created`)
    client.release()
    await pool.end()

    // ============================================================
    // Step 3: Seed data using Prisma (now that tables exist)
    // ============================================================
    results.push('Step 3: Seeding data...')

    // Create Owner
    await db.appUser.upsert({
      where: { email: 'owner@hadi-kaya.id' },
      update: {},
      create: { email: 'owner@hadi-kaya.id', name: 'Owner Menuju Hadi Kaya', passwordHash: '$2a$10$placeholder', role: 'OWNER', isActive: true },
    })
    results.push('  ✅ Owner created')

    // Create Project
    const project = await db.project.upsert({
      where: { name: 'Anjayo 16' },
      update: {},
      create: { name: 'Anjayo 16', code: 'A16', brandName: 'Anjayo', location: 'Jerambah Gantung, Pangkalpinang', totalUnits: 75, status: 'ACTIVE' },
    })
    results.push('  ✅ Project created')

    // Create 75 units
    const blocks = ['A','B','C','D','E','F','G','H']
    const landSizes = [84, 84, 84, 84, 105, 105, 127, 84]
    for (let i = 0; i < 75; i++) {
      const blockNumber = blocks[Math.floor(i/10)] + ((i%10)+1)
      const landSize = landSizes[i % landSizes.length]
      let status = 'AVAILABLE'
      let dpAmount = landSize === 105 ? 15000000 : landSize === 127 ? 20000000 : 5000000
      if (i < 43) status = 'SOLD'
      await db.unit.upsert({
        where: { projectId_blockNumber: { projectId: project.id, blockNumber } },
        update: {},
        create: { projectId: project.id, blockNumber, unitType: '36', landSize, buildingSize: 36, price: 173000000, dpAmount, status },
      })
    }
    results.push('  ✅ 75 units created')

    // Create 14 agents
    const agents = [
      { name: 'RATNA', role: 'CAO', gender: 'FEMALE', personality: 'Strategis, analitis, kritis.' },
      { name: 'RINA', role: 'FINANCE', gender: 'FEMALE', personality: 'Profesional, teliti, tegas.' },
      { name: 'Mitra', role: 'MATERIAL', gender: 'FEMALE', personality: 'Detail, teliti.' },
      { name: 'Dina', role: 'DOCUMENT', gender: 'FEMALE', personality: 'Rapi, sistematik.' },
      { name: 'Ayu', role: 'MARKETING', gender: 'FEMALE', personality: 'Cheerful & friendly.' },
      { name: 'Bima', role: 'MARKETING', gender: 'MALE', personality: 'Informatif.' },
      { name: 'Citra', role: 'MARKETING', gender: 'FEMALE', personality: 'Persuasif.' },
      { name: 'Dian', role: 'MARKETING', gender: 'FEMALE', personality: 'Sabar & empatik.' },
      { name: 'Eka', role: 'MARKETING', gender: 'MALE', personality: 'Supel & humoris.' },
      { name: 'Fajar', role: 'MARKETING', gender: 'MALE', personality: 'Analitis.' },
      { name: 'Gita', role: 'MARKETING', gender: 'FEMALE', personality: 'Elegan.' },
      { name: 'Hadi', role: 'MARKETING', gender: 'MALE', personality: 'Serius.' },
      { name: 'Indah', role: 'MARKETING', gender: 'FEMALE', personality: 'Ramah ibu-ibu.' },
      { name: 'Joko', role: 'MARKETING', gender: 'MALE', personality: 'Santai Bangka.' },
    ]
    for (const a of agents) {
      await db.agent.upsert({
        where: { name_role: { name: a.name, role: a.role } },
        update: {},
        create: {
          name: a.name, role: a.role, gender: a.gender, personality: a.personality,
          llmModel: 'glm-4.6', llmProvider: 'zai',
          lightLlmModel: 'nvidia/nemotron-3-nano-30b-a3b:free', lightLlmProvider: 'openrouter',
          temperature: 0.7, maxTokens: 2000, isActive: true,
          isDevilsAdvocate: a.role === 'CAO' || a.role === 'MARKETING',
          systemPrompt: `Anda adalah ${a.name}, AI ${a.role} di "Menuju Hadi Kaya" - Anjayo 16, Pangkalpinang. ${a.personality}`,
        },
      })
    }
    results.push('  ✅ 14 agents created')

    // Create customers
    const andas = await db.customer.upsert({
      where: { id: 'customer-andas-e4' },
      update: {},
      create: { id: 'customer-andas-e4', projectId: project.id, name: 'Andas Saputra', stage: 'SP3K', notes: 'SP3K BSB Syariah. Unit E4.', isExistingMigration: true },
    })
    const jenni = await db.customer.upsert({
      where: { id: 'customer-jenni-e5' },
      update: {},
      create: { id: 'customer-jenni-e5', projectId: project.id, name: 'JENNI', stage: 'PEMBERKASAN', notes: 'Proses BTN. Unit E5.', isExistingMigration: true },
    })
    const e4 = await db.unit.findFirst({ where: { projectId: project.id, blockNumber: 'E4' } })
    const e5 = await db.unit.findFirst({ where: { projectId: project.id, blockNumber: 'E5' } })
    if (e4) await db.unit.update({ where: { id: e4.id }, data: { status: 'BOOKED', customerId: andas.id, bookedAt: new Date() } })
    if (e5) await db.unit.update({ where: { id: e5.id }, data: { status: 'BOOKED', customerId: jenni.id, bookedAt: new Date() } })
    results.push('  ✅ Customers created (Andas E4, JENNI E5)')

    // FAQ
    const faqs = [
      { q: 'Berapa harga rumah tipe 36?', a: 'Rp 173 juta untuk pengajuan ke bank.' },
      { q: 'Berapa DP-nya?', a: 'DP mulai Rp 5jt all-in (luas 84). 105 = 15jt, 127 = 20jt.' },
      { q: 'Bisa cicil DP?', a: 'Bisa. Booking fee min Rp 3jt, dilunasi 7 hari.' },
      { q: 'Booking fee refundable?', a: 'Tidak refundable.' },
      { q: 'Lokasi?', a: 'Jl. Jerambah Gantung, Pangkalpinang. Pusat kota.' },
      { q: 'Banjir?', a: 'Tidak ada riwayat banjir.' },
      { q: 'Bank partner?', a: 'BTN, Mandiri, BSB Syariah.' },
      { q: 'Tenor KPR?', a: 'BTN/Mandiri: 10-20 thn. BSB: 10-15 thn.' },
    ]
    for (const faq of faqs) {
      await db.knowledgeItem.create({ data: { category: 'FAQ', question: faq.q, answer: faq.a, isActive: true } })
    }
    results.push(`  ✅ ${faqs.length} FAQ created`)

    return NextResponse.json({
      success: true,
      steps: results,
      message: '🎉 Database setup complete! Dashboard should work now.',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      steps: results,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
