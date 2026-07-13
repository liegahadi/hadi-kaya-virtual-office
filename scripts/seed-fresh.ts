// ============================================================
// SEED FRESH DATA - Skip Owner Account
// Run: DATABASE_URL="postgres://..." npx tsx scripts/seed-fresh.ts
// ============================================================
// Owner account TIDAK dibuat di sini.
// Setelah deploy, daftar owner baru via login page:
//   https://hadi-kaya-virtual-office.vercel.app/login
// ============================================================

import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding fresh data (skip owner account)...\n')

  // ============================================================
  // 1. PROJECT: Anjayo 16
  // ============================================================
  const project = await db.project.upsert({
    where: { name: 'ANJAYO 16' },
    update: {},
    create: {
      name: 'ANJAYO 16',
      brandName: 'ANJAYO',
      code: 'A16',
      location: 'Jl. Kelompok, Jerambah Gantung, Kerabut, Pangkalpinang',
      address: 'Jl. Kelompok, Jerambah Gantung, Kerabut, Pangkalpinang',
      totalUnits: 75,
      status: 'ACTIVE',
    },
  })
  console.log(`✅ Project: ${project.name}`)

  // ============================================================
  // 2. COMPANY SETTING (Global)
  // ============================================================
  const company = await db.companySetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'PT. Marlindo Bangun Persada',
      directorName: 'Andrian Bong',
      directorNik: '',
      directorPhone: '628117176687',
      directorAddress: '',
      officeAddress: 'Pangkalpinang, Bangka Belitung',
      city: 'Pangkalpinang',
      btnAccount: '00209.01.30.0003316',
      mandiriAccount: '',
      bsbAccount: '',
    },
  })
  console.log(`✅ Company: ${company.companyName}`)

  // ============================================================
  // 3. BANK CONFIG (BTN, Mandiri, BSB Syariah)
  // ============================================================
  const btn = await db.bankConfig.upsert({
    where: { bankCode: 'BTN' },
    update: {},
    create: {
      bankCode: 'BTN',
      bankName: 'Bank Tabungan Negara',
      description: 'KPR Subsidi BTN dengan FLPP',
      isActive: true,
      createdBy: 'system-seed',
    },
  })

  const mandiri = await db.bankConfig.upsert({
    where: { bankCode: 'MANDIRI' },
    update: {},
    create: {
      bankCode: 'MANDIRI',
      bankName: 'Bank Mandiri',
      description: 'KPR Subsidi Mandiri',
      isActive: true,
      createdBy: 'system-seed',
    },
  })

  const bsb = await db.bankConfig.upsert({
    where: { bankCode: 'BSB_SYARIAH' },
    update: {},
    create: {
      bankCode: 'BSB_SYARIAH',
      bankName: 'BSB Syariah',
      description: 'KPR Syariah BSB',
      isActive: true,
      createdBy: 'system-seed',
    },
  })
  console.log(`✅ Banks: ${btn.bankCode}, ${mandiri.bankCode}, ${bsb.bankCode}`)

  // ============================================================
  // 4. AI AGENTS (15 agents)
  // ============================================================
  const agentsData = [
    // 4 Staff AI
    {
      name: 'Dina',
      role: 'DOCUMENT',
      description: 'Document Intelligence & Notification Assistant',
      personality: 'Sopan, profesional, teliti',
      gender: 'FEMALE',
      systemPrompt: 'Anda adalah DINA (Document Intelligence & Notification Assistant). Lihat knowledge base lengkap di src/lib/agents/dina-knowledge.ts',
      llmModel: 'gemini-2.0-flash',
      llmProvider: 'google',
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'google',
      temperature: 0.7,
      maxTokens: 2000,
      isActive: true,
    },
    {
      name: 'Rina',
      role: 'FINANCE',
      description: 'Finance AI - mengelola invoice, PO, RAB, supplier payments',
      personality: 'Cermat, detail, tegas soal angka',
      gender: 'FEMALE',
      systemPrompt: 'Anda adalah RINA, asisten keuangan untuk PT. Marlindo Bangun Persada. Bantu owner mengelola invoice, PO, dan budget.',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.5,
      maxTokens: 2000,
      isActive: true,
    },
    {
      name: 'Mitra',
      role: 'MATERIAL',
      description: 'Material AI - mengelola stok material, supplier, PO material',
      personality: 'Praktis, responsif, tahu harga pasar',
      gender: 'MALE',
      systemPrompt: 'Anda adalah MITRA, asisten material untuk PT. Marlindo Bangun Persada. Bantu owner mengelola stok material dan supplier.',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.5,
      maxTokens: 2000,
      isActive: true,
    },
    {
      name: 'Ratna',
      role: 'CAO',
      description: 'Chief Administrative Officer - strategis, audit, simulasi keputusan',
      personality: 'Bijaksana, strategic, devil\'s advocate',
      gender: 'FEMALE',
      systemPrompt: 'Anda adalah RATNA (Chief Administrative Officer) untuk PT. Marlindo Bangun Persada. Bantu owner menganalisa, audit, dan simulasi keputusan strategis.',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.6,
      maxTokens: 2500,
      isActive: true,
      isDevilsAdvocate: true,
    },
    // Marketing Leader
    {
      name: 'Rangga',
      role: 'MARKETING_LEADER',
      description: 'Marketing Leader & Creative Director',
      personality: 'Kreatif, leader, strategis',
      gender: 'MALE',
      systemPrompt: 'Anda adalah RANGGA (Marketing Leader & Creative Director) untuk PT. Marlindo Bangun Persada. Koordinasi 10 marketing AI dan strategi konten.',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.7,
      maxTokens: 2000,
      isActive: true,
    },
    // 10 Marketing AI
    { name: 'Ayu', role: 'MARKETING', personality: 'Cheerful, friendly', gender: 'FEMALE' },
    { name: 'Bima', role: 'MARKETING', personality: 'Informatif, edukatif', gender: 'MALE' },
    { name: 'Citra', role: 'MARKETING', personality: 'Kreatif, visual', gender: 'FEMALE' },
    { name: 'Dian', role: 'MARKETING', personality: 'Sabar, listener', gender: 'FEMALE' },
    { name: 'Eka', role: 'MARKETING', personality: 'Energik, motivator', gender: 'FEMALE' },
    { name: 'Fajar', role: 'MARKETING', personality: 'Profesional, korporat', gender: 'MALE' },
    { name: 'Gita', role: 'MARKETING', personality: 'Empati, hangat', gender: 'FEMALE' },
    { name: 'Hadi', role: 'MARKETING', personality: 'Tekun, detail', gender: 'MALE' },
    { name: 'Indah', role: 'MARKETING', personality: 'Ramah, approachable', gender: 'FEMALE' },
    { name: 'Joko', role: 'MARKETING', personality: 'Lucu, relatable', gender: 'MALE' },
  ]

  let agentCount = 0
  for (const agentData of agentsData) {
    const isMarketing = agentData.role === 'MARKETING'
    const agent = await db.agent.upsert({
      where: { name_role: { name: agentData.name, role: agentData.role } },
      update: {},
      create: {
        name: agentData.name,
        role: agentData.role,
        description: agentData.description || `${agentData.role} AI Agent`,
        personality: agentData.personality,
        gender: agentData.gender,
        systemPrompt: agentData.systemPrompt || `Anda adalah ${agentData.name}, ${agentData.role} AI Agent untuk PT. Marlindo Bangun Persada. Buat konten marketing yang engaging untuk perumahan ANJAYO 16 di Pangkalpinang.`,
        llmModel: agentData.llmModel || 'glm-4.6',
        llmProvider: agentData.llmProvider || 'openrouter',
        lightLlmModel: agentData.lightLlmModel || 'glm-4.6',
        lightLlmProvider: agentData.lightLlmProvider || 'openrouter',
        temperature: agentData.temperature ?? 0.7,
        maxTokens: agentData.maxTokens || 2000,
        isActive: agentData.isActive ?? true,
        isDevilsAdvocate: agentData.isDevilsAdvocate ?? false,
      },
    })
    agentCount++
  }
  console.log(`✅ Agents: ${agentCount} created (Dina, Rina, Mitra, Ratna, Rangga + 10 marketing)`)

  // ============================================================
  // 5. SKILLS (4 seeded skills for DINA)
  // ============================================================
  const skillsData = [
    {
      name: 'prompt-engineer',
      displayName: 'Prompt Engineer',
      description: 'General skill untuk optimize prompt semua agents',
      prompt: 'Skill untuk merancang dan optimasi prompt AI agents. Tahu best practices, chain-of-thought, few-shot, role-playing patterns.',
      category: 'UMUM',
      source: 'MANUAL',
      isActive: true,
    },
    {
      name: 'business-doc-generator',
      displayName: 'Business Doc Generator',
      description: 'Generate dokumen bisnis (SK kerja, slip gaji, laporan keuangan)',
      prompt: 'Skill untuk generate dokumen bisnis Indonesia: SK Kerja, Slip Gaji, Laporan Keuangan. Bisa isi template dengan data konsumen, format sesuai standar bank.',
      category: 'DINA',
      source: 'CAVINHUANG',
      isActive: true,
    },
    {
      name: 'laporan-keuangan-generator',
      displayName: 'Generate Laporan Keuangan',
      description: 'Generate laporan keuangan 6 bulan untuk wirausaha',
      prompt: 'Skill untuk generate laporan keuangan 6 bulan untuk konsumen wirausaha. Format standar bank: omzet, pengeluaran, laba bersih per bulan.',
      category: 'DINA',
      source: 'MANUAL',
      isActive: true,
    },
    {
      name: 'sk-slip-generator',
      displayName: 'Generate SK + Slip',
      description: 'Generate SK Kerja + Slip Gaji untuk karyawan',
      prompt: 'Skill untuk generate SK Kerja + Slip Gaji 3 bulan terakhir untuk konsumen karyawan. Format standar Indonesia, sesuai kebutuhan bank.',
      category: 'DINA',
      source: 'MANUAL',
      isActive: true,
    },
  ]

  // Find Dina agent for skill assignment
  const dinaAgent = await db.agent.findFirst({ where: { name: 'Dina' } })
  
  let skillCount = 0
  for (const skillData of skillsData) {
    // Check if skill already exists by name (manual upsert)
    const existing = await db.skill.findFirst({ where: { name: skillData.name } })
    if (existing) {
      console.log(`   Skill "${skillData.name}" already exists, skip`)
      continue
    }
    const skill = await db.skill.create({
      data: {
        name: skillData.name,
        displayName: skillData.displayName,
        description: skillData.description,
        prompt: skillData.prompt,
        category: skillData.category,
        agentId: skillData.category === 'DINA' ? dinaAgent?.id : null,
        source: skillData.source,
        isActive: skillData.isActive,
        version: 1,
      },
    })
    skillCount++
  }
  console.log(`✅ Skills: ${skillCount} created`)

  // ============================================================
  // 6. MEMORIES (12 curated memories — 5 umum + 7 DINA)
  // ============================================================
  const memoriesData = [
    // 5 Umum (untuk semua agents)
    {
      title: 'Profil Project ANJAYO 16',
      content: 'Project ANJAYO 16 — perumahan subsidi type 36/84 di Pangkalpinang. Harga Rp 173jt, DP 1% (Rp 1.73jt), SBUM Rp 4jt, plafon KPR Rp 167.27jt, tenor 20 tahun, listrik 1300W, air sumur bor, SHGB.',
      resolution: 'Gunakan info ini untuk semua perhitungan KPR dan informasi ke konsumen.',
      category: 'UTAMA',
      memoryType: 'umum',
      importance: 0.9,
    },
    {
      title: 'Bank Yang Ditangani',
      content: '3 bank: BTN (KPR subsidi + FLPP), Mandiri (KPR subsidi), BSB Syariah (KPR syariah). Bank tidak bisa dihapus dari sistem, hanya bisa ditambah via Bank Builder.',
      resolution: 'Selalu tawarkan 3 opsi bank ke konsumen. Kalau konsumen tanya bank lain, arahkan ke 3 bank ini.',
      category: 'UTAMA',
      memoryType: 'umum',
      importance: 0.9,
    },
    {
      title: 'Aturan WhatsApp Bot',
      content: 'DINA hanya respon di grup jika di-tag. DM non-owner = silent/reject. Link grup WhatsApp tidak boleh dibagikan ke siapapun.',
      resolution: 'Jangan pernah share link grup WA. Kalau diminta, tolak dengan sopan.',
      category: 'UTAMA',
      memoryType: 'umum',
      importance: 0.95,
    },
    {
      title: 'Pipeline Stage KPR',
      content: 'Stage: DM → SURVEY → CLOSING → BOOKING → SLIK → PEMBERKASAN → SP3K → AKAD → SERAH_TERIMA. Setiap stage punya dokumen yang dibutuhkan.',
      resolution: 'Bantu konsumen understand stage mereka saat ini dan dokumen yang perlu dilengkapi.',
      category: 'UTAMA',
      memoryType: 'umum',
      importance: 0.85,
    },
    {
      title: 'Permission Matrix',
      content: 'Owner (Hadi): akses penuh. Marketing: hanya READ + update stage. Bank config: dashboard only, WA forbidden. Delete konsumen: perlu konfirmasi 2-step.',
      resolution: 'Selalu cek permission sebelum eksekusi aksi. Tolak dengan sopan kalau tidak punya akses.',
      category: 'UTAMA',
      memoryType: 'umum',
      importance: 0.9,
    },
    // 7 DINA-specific memories
    {
      title: 'DINA — Anti-Halusinasi Rule',
      content: 'DINA tidak boleh halusinasi aksi yang tidak dilakukan. Jika tool result bilang gagal, jangan bilang berhasil. Jika ragu, bilang "saya perlu cek data".',
      resolution: 'Selalu rujuk tool result sebagai sumber kebenaran. Jangan mengarang hasil.',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 1.0,
      agentId: dinaAgent?.id,
    },
    {
      title: 'DINA — Confirmation 2-Step untuk Delete',
      content: 'Delete konsumen WAJIB minta konfirmasi "ya/batal" dengan TTL 5 menit. Konfirmasi hanya valid jika pesan SINGKAT (≤15 char). Kalau user menyebut nama lain, AUTO-ABORT.',
      resolution: 'Selalu tampilkan nama konsumen yang akan dihapus. Jangan terima konfirmasi ambigu.',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 0.95,
      agentId: dinaAgent?.id,
    },
    {
      title: 'DINA — Upload Berkas Anti-Overwrite',
      content: 'Upload berkas tidak boleh overwrite existing file. Auto-rename dengan suffix timestamp. Anti-duplicate via SHA-256 hash check. Set permission: anyone with link = VIEW only.',
      resolution: 'Jangan pernah hapus file di Drive. Preserve history via versioning (v1, v2, v3).',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 0.9,
      agentId: dinaAgent?.id,
    },
    {
      title: 'DINA — Naming Convention RAW',
      content: 'Format nama dokumen: "RAW - [Nama Debitur] - [Jenis Dokumen] - v[N].docx". RAW = versi mentah belum ditandatangani. Setelah signed, user upload ulang dengan prefix "SIGNED -".',
      resolution: 'Selalu gunakan prefix RAW untuk dokumen yang baru di-generate. Versioning tidak overwrite.',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 0.85,
      agentId: dinaAgent?.id,
    },
    {
      title: 'DINA — Generate Surat Umum',
      content: 'DINA bisa generate surat umum (selain SK/Slip/Laporan). Folder Drive: Surat Menyurat/[Instansi]/. Wajib tanya "Surat untuk apa? Bank/instansi mana?" sebelum generate.',
      resolution: 'Jangan asumsi jenis surat tanpa konfirmasi. Selalu tanya instansi tujuan.',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 0.8,
      agentId: dinaAgent?.id,
    },
    {
      title: 'DINA — Session Context 48 jam',
      content: 'DINA ingat konteks 48 jam terakhir per user. Auto-renew tiap pesan. Kalau user bilang "yang tadi" atau "kemarin", DINA cek session context dulu. Kalau expired, traceback via LLM.',
      resolution: 'Untuk referensi "yang tadi", pakai session context. Kalau gagal, tanya user dengan list opsi.',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 0.85,
      agentId: dinaAgent?.id,
    },
    {
      title: 'DINA — Customer History Log',
      content: 'Setiap interaksi dengan konsumen harus di-log ke CustomerHistoryLog. Format: append-only timeline. Title singkat, description detail dengan delta (contoh: "Gaji naik ke 5jt dari 4.5jt").',
      resolution: 'Setiap ada perubahan field/stage/dokumen, tambah entry ke history log.',
      category: 'BERKAS',
      memoryType: 'long_term',
      importance: 0.8,
      agentId: dinaAgent?.id,
    },
  ]

  let memoryCount = 0
  for (const memData of memoriesData) {
    const mem = await db.memory.create({
      data: {
        title: memData.title,
        content: memData.content,
        resolution: memData.resolution,
        category: memData.category,
        memoryType: memData.memoryType,
        importance: memData.importance,
        agentId: memData.agentId || null,
        source: 'SEED',
        isActive: true,
        version: 1,
      },
    })
    
    // Create MemoryVersion snapshot
    await db.memoryVersion.create({
      data: {
        memoryId: mem.id,
        version: 1,
        content: memData.content,
        changedBy: 'system-seed',
        changeNote: 'Initial seed data',
      },
    })
    
    // Create MemoryAudit entry
    await db.memoryAudit.create({
      data: {
        action: 'CREATE',
        entityType: 'MEMORY',
        entityId: mem.id,
        agentId: memData.agentId || null,
        changedBy: 'system-seed',
        details: JSON.stringify({ source: 'seed-fresh', timestamp: new Date().toISOString() }),
      },
    })
    
    memoryCount++
  }
  console.log(`✅ Memories: ${memoryCount} created (5 umum + 7 DINA-specific)`)

  // ============================================================
  // 7. SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(50))
  console.log('🎉 SEED COMPLETE!')
  console.log('='.repeat(50))
  console.log(`✅ Project: ANJAYO 16`)
  console.log(`✅ Company: PT. Marlindo Bangun Persada`)
  console.log(`✅ Banks: 3 (BTN, Mandiri, BSB Syariah)`)
  console.log(`✅ Agents: 15 (Dina, Rina, Mitra, Ratna, Rangga + 10 marketing)`)
  console.log(`✅ Skills: 4 (Prompt Engineer, Business Doc, Laporan Keuangan, SK+Slip)`)
  console.log(`✅ Memories: 12 (5 umum + 7 DINA-specific)`)
  console.log('\n⚠️  OWNER ACCOUNT NOT CREATED.')
  console.log('   Register via login page after deploy:')
  console.log('   https://hadi-kaya-virtual-office.vercel.app/login')
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
