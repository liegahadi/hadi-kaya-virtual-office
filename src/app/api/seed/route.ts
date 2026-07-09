import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

// GET /api/seed - Seed all data (agents, units, knowledge, etc.)
export async function GET() {
  const results: string[] = []

  try {
    // 1. Create Owner
    const owner = await db.appUser.upsert({
      where: { email: 'owner@hadi-kaya.id' },
      update: {},
      create: {
        email: 'owner@hadi-kaya.id',
        name: 'Owner Menuju Hadi Kaya',
        passwordHash: '$2a$10$placeholder',
        role: 'OWNER',
        isActive: true,
      },
    })
    results.push('Owner created')

    // 2. Create Project
    const project = await db.project.upsert({
      where: { name: 'Anjayo 16' },
      update: {},
      create: {
        name: 'Anjayo 16', code: 'A16', brandName: 'Anjayo',
        location: 'Jerambah Gantung, Pangkalpinang',
        address: 'Jl. Kelompok Jerambah Gantung, Pangkalpinang',
        totalUnits: 75, sitePlanUrl: '/siteplan-anjayo.png', status: 'ACTIVE',
      },
    })
    results.push('Project created')

    // 3. Create 75 Units
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
    results.push('75 units created (43 SOLD, 2 BOOKED, 30 AVAILABLE)')

    // 4. Create 14 Agents
    const agents = [
      { name: 'RATNA', role: 'CAO', gender: 'FEMALE', personality: 'Strategis, analitis, kritis.' },
      { name: 'RINA', role: 'FINANCE', gender: 'FEMALE', personality: 'Profesional, teliti, tegas.' },
      { name: 'Mitra', role: 'MATERIAL', gender: 'FEMALE', personality: 'Detail, teliti, konsisten.' },
      { name: 'Dina', role: 'DOCUMENT', gender: 'FEMALE', personality: 'Rapi, teliti, sistematik.' },
      { name: 'Ayu', role: 'MARKETING', gender: 'FEMALE', personality: 'Cheerful & friendly.' },
      { name: 'Bima', role: 'MARKETING', gender: 'MALE', personality: 'Informatif & profesional.' },
      { name: 'Citra', role: 'MARKETING', gender: 'FEMALE', personality: 'Persuasif.' },
      { name: 'Dian', role: 'MARKETING', gender: 'FEMALE', personality: 'Sabar & empatik.' },
      { name: 'Eka', role: 'MARKETING', gender: 'MALE', personality: 'Supel & humoris.' },
      { name: 'Fajar', role: 'MARKETING', gender: 'MALE', personality: 'Analitis.' },
      { name: 'Gita', role: 'MARKETING', gender: 'FEMALE', personality: 'Elegan.' },
      { name: 'Hadi', role: 'MARKETING', gender: 'MALE', personality: 'Serius & to the point.' },
      { name: 'Indah', role: 'MARKETING', gender: 'FEMALE', personality: 'Ramah ibu-ibu.' },
      { name: 'Joko', role: 'MARKETING', gender: 'MALE', personality: 'Santai khas Bangka.' },
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
    results.push('14 agents created')

    // 5. Create Customers
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
    results.push('Customers created (Andas E4, JENNI E5)')

    // 6. FAQ Knowledge
    const faqs = [
      { q: 'Berapa harga rumah tipe 36?', a: 'Rp 173 juta untuk pengajuan ke bank.' },
      { q: 'Berapa DP-nya?', a: 'DP mulai Rp 5jt all-in (luas 84). Luas 105 = 15jt, 127 = 20jt.' },
      { q: 'Bisa cicil DP?', a: 'Bisa. Booking fee min Rp 3jt, dilunasi 7 hari.' },
      { q: 'Booking fee refundable?', a: 'Tidak refundable.' },
      { q: 'Lokasi di mana?', a: 'Jl. Jerambah Gantung, Pangkalpinang. Pusat kota.' },
      { q: 'Potensi banjir?', a: 'Tidak ada riwayat banjir.' },
      { q: 'Bank partner?', a: 'BTN, Mandiri, BSB Syariah.' },
      { q: 'Tenor KPR?', a: 'BTN/Mandiri: 10-20 thn. BSB: 10-15 thn.' },
    ]
    for (const faq of faqs) {
      await db.knowledgeItem.create({ data: { category: 'FAQ', question: faq.q, answer: faq.a, isActive: true } })
    }
    results.push(`${faqs.length} FAQ created`)

    return NextResponse.json({ success: true, steps: results, message: 'Database seeded! Dashboard should work now.' })
  } catch (error) {
    return NextResponse.json({ success: false, steps: results, error: error instanceof Error ? error.message : 'Unknown' })
  }
}
