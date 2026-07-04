// DINA Tools System — Database queries & system actions
// DINA can READ (query) and WRITE (update) to the database
// This makes DINA a true AI agent that can actually DO things

import { db } from '@/lib/db'

export interface ToolResult {
  toolName: string
  success: boolean
  data: any
  summary: string
}

export interface IntentResult {
  tools: string[]
  customerName?: string
  blockNumber?: string
  action?: 'READ' | 'UPDATE_BANK' | 'UPDATE_STAGE' | 'FILL_FORM' | 'GET_DOCS' | 'GET_WORKPLACE'
  newBankValue?: string
  newStageValue?: string
}

// ============================================================
// Memory Categories — each agent has its own memory domain
// ============================================================

export const MEMORY_CATEGORIES = {
  UTAMA: 'UTAMA',         // General knowledge, decisions (DINA)
  BERKAS: 'BERKAS',       // Documents, KPR, bank process (DINA)
  FINANCE: 'FINANCE',     // Budget, payments, invoices (RINA)
  MATERIAL: 'MATERIAL',   // Stock, suppliers, PO (MITRA)
  MARKETING: 'MARKETING', // Leads, prospects, campaigns (10 Marketing AI)
} as const

// Map topic keywords to memory category
export function detectMemoryCategory(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('berkas') || msg.includes('dokumen') || msg.includes('kpr') || msg.includes('bank') || msg.includes('ktp') || msg.includes('kk') || msg.includes('npwp') || msg.includes('slip') || msg.includes('sk kerja') || msg.includes('spr') || msg.includes('flpp') || msg.includes('bphtb') || msg.includes('notaris') || msg.includes('konsumen') || msg.includes('debitur')) return MEMORY_CATEGORIES.BERKAS
  if (msg.includes('budget') || msg.includes('anggaran') || msg.includes('pembayaran') || msg.includes('invoice') || msg.includes('rab') || msg.includes('laba') || msg.includes('rugi') || msg.includes('pajak') || msg.includes('dana') || msg.includes('kas')) return MEMORY_CATEGORIES.FINANCE
  if (msg.includes('material') || msg.includes('bahan') || msg.includes('stok') || msg.includes('supplier') || msg.includes('po') || msg.includes('semen') || msg.includes('batu') || msg.includes('pasir')) return MEMORY_CATEGORIES.MATERIAL
  if (msg.includes('marketing') || msg.includes('prospek') || msg.includes('lead') || msg.includes('iklan') || msg.includes('kampanye')) return MEMORY_CATEGORIES.MARKETING
  return MEMORY_CATEGORIES.UTAMA
}

export function detectIntent(message: string): IntentResult {
  const msg = message.toLowerCase()
  const tools: string[] = []
  let action: IntentResult['action'] = 'READ'
  let newBankValue: string | undefined
  let newStageValue: string | undefined

  // === READ INTENTS ===

  // Customer count / statistics
  if (msg.includes('berapa') && (msg.includes('konsumen') || msg.includes('debitur') || msg.includes('nasabah') || msg.includes('orang'))) {
    tools.push('getCustomerStats')
  }

  // Customer list / names — broader matching
  if ((msg.includes('siapa') || msg.includes('nama') || msg.includes('list') || msg.includes('daftar') || msg.includes('sebut') || msg.includes('siapa aja') || msg.includes('mana aja')) && (msg.includes('konsumen') || msg.includes('debitur') || msg.includes('nasabah'))) {
    tools.push('getAllCustomers')
  }

  // Bank distribution
  if ((msg.includes('btn') || msg.includes('mandiri') || msg.includes('bsb')) && (msg.includes('berapa') || msg.includes('distribusi') || msg.includes('masuk') || msg.includes('berapa banyak'))) {
    tools.push('getBankDistribution')
  }

  // Stage/pipeline
  if (msg.includes('stage') || msg.includes('pipeline') || msg.includes('proses') || msg.includes('tahap') || msg.includes('status')) {
    if (msg.includes('berapa') || msg.includes('distribusi') || msg.includes('ada') || msg.includes('gimana')) {
      tools.push('getStageDistribution')
    }
  }

  // Dashboard / overview
  if (msg.includes('dashboard') || msg.includes('ringkasan') || msg.includes('overview') || msg.includes('statistik') || msg.includes('summary') || msg.includes('kabar')) {
    tools.push('getAllCustomers')
    tools.push('getStageDistribution')
    tools.push('getBankDistribution')
  }

  // Document status — broader
  if (msg.includes('berkas') || msg.includes('dokumen') || msg.includes('lengkap') || msg.includes('kurang') || msg.includes('belum') || msg.includes('kurang')) {
    tools.push('getCustomerDocStatus')
  }

  // Workplace / lokasi
  if ((msg.includes('lokasi') || msg.includes('tempat kerja') || msg.includes('kerja') || msg.includes('maps') || msg.includes('google maps') || msg.includes('alamat kerja')) && !msg.includes('update') && !msg.includes('ubah')) {
    action = 'GET_WORKPLACE'
    tools.push('getAllCustomers')
  }

  // === WRITE INTENTS (UPDATE) — broader detection ===

  // Update bank — catch any "ubah/ganti/pindah/update" + bank name
  if ((msg.includes('update') || msg.includes('ubah') || msg.includes('ganti') || msg.includes('pindah') || msg.includes('pindahin') || msg.includes('gantiin') || msg.includes('jadikan') || msg.includes('masukin ke')) && (msg.includes('bank') || msg.includes('btn') || msg.includes('mandiri') || msg.includes('bsb') || msg.includes('syariah'))) {
    action = 'UPDATE_BANK'
    if (msg.includes('btn')) newBankValue = 'BTN'
    if (msg.includes('mandiri')) newBankValue = 'MANDIRI'
    if (msg.includes('bsb') || msg.includes('syariah')) newBankValue = 'BSB_SYARIAH'
    tools.push('getAllCustomers')
  }

  // Update stage — catch "ubah status jadi sp3k", "ganti stage ke akad", etc
  // Also catch: "jadi sp3k", "jadikan sp3k", "pindah ke sp3k", "maju ke akad"
  const stageKeywords = ['dm', 'survey', 'closing', 'booking', 'slik', 'pemberkasan', 'sp3k', 'sppk', 'akad', 'serah terima', 'serahterima']
  const hasStageKeyword = stageKeywords.some(kw => msg.includes(kw))
  const hasUpdateKeyword = msg.includes('update') || msg.includes('ubah') || msg.includes('ganti') || msg.includes('pindah') || msg.includes('majuin') || msg.includes('pindahin') || msg.includes('jadikan') || msg.includes('jadi') || msg.includes('masuk') || msg.includes('naik')

  if (hasStageKeyword && (hasUpdateKeyword || msg.includes('status') || msg.includes('stage') || msg.includes('tahap'))) {
    action = 'UPDATE_STAGE'
    const stageMap: Record<string, string> = {
      'dm': 'DM', 'survey': 'SURVEY', 'closing': 'CLOSING', 'booking': 'BOOKING',
      'slik': 'SLIK', 'pemberkasan': 'PEMBERKASAN', 'sp3k': 'SP3K', 'sppk': 'SP3K',
      'akad': 'AKAD', 'serah terima': 'SERAH_TERIMA', 'serahterima': 'SERAH_TERIMA',
    }
    for (const [key, val] of Object.entries(stageMap)) {
      if (msg.includes(key)) { newStageValue = val; break }
    }
    // If stage keyword found but not in map, try uppercase
    if (!newStageValue) {
      for (const kw of stageKeywords) {
        if (msg.includes(kw)) { newStageValue = kw.toUpperCase().replace(' ', '_'); break }
      }
    }
    tools.push('getAllCustomers')
  }

  // Fill form / isi data
  if ((msg.includes('isi') || msg.includes('fill') || msg.includes('bantu') && msg.includes('data')) && !msg.includes('bank')) {
    action = 'FILL_FORM'
    tools.push('getAllCustomers')
  }

  // Always include memories
  tools.push('getRelevantMemories')

  // Always include ALL customers as context (so DINA knows everyone)
  if (!tools.includes('getAllCustomers')) {
    tools.push('getAllCustomers')
  }

  // Extract customer name — case insensitive, try multiple patterns
  let customerName: string | undefined
  // Pattern 1: "konsumen/debitur/nasabah [Name]" (case insensitive)
  const nameMatch1 = message.match(/(?:konsumen|debitur|nasabah)\s+([A-Za-z]+)/i)
  // Pattern 2: "dari/si [Name]"
  const nameMatch2 = message.match(/(?:dari|si)\s+([A-Za-z]+)/i)
  // Pattern 3: any word 3+ chars (lowercase too — will match against DB case-insensitive)
  const nameMatch3 = message.match(/\b([A-Za-z]{3,})\b/)
  // Pattern 4: "ubah/ganti/update [Name] ..."
  const nameMatch4 = message.match(/(?:ubah|ganti|update|pindah|jadikan)\s+(?:status\s+)?(?:konsumen\s+)?(?:debitur\s+)?([A-Za-z]+)/i)

  if (nameMatch4) customerName = nameMatch4[1]
  else if (nameMatch1) customerName = nameMatch1[1]
  else if (nameMatch2) customerName = nameMatch2[1]
  // Don't use nameMatch3 — too noisy (matches "ubah", "jadi", etc)

  // Filter out common non-name words
  const stopWords = ['ubah', 'ganti', 'update', 'pindah', 'jadikan', 'jadi', 'status', 'stage', 'tahap', 'bank', 'btn', 'mandiri', 'bsb', 'syariah', 'sp3k', 'sppk', 'akad', 'booking', 'closing', 'survey', 'slik', 'pemberkasan', 'serah', 'terima', 'dong', 'ke', 'yang', 'ini', 'itu', 'dari', 'untuk', 'pada', 'dengan', 'agar', 'supaya', 'bisa', 'tolong', 'bantu', 'mohon', 'jenni']
  // Note: 'jenni' is removed from stopwords — we WANT to match it
  const actualStopWords = ['ubah', 'ganti', 'update', 'pindah', 'jadikan', 'jadi', 'status', 'stage', 'tahap', 'bank', 'btn', 'mandiri', 'bsb', 'syariah', 'sp3k', 'sppk', 'akad', 'booking', 'closing', 'survey', 'slik', 'pemberkasan', 'serah', 'terima', 'dong', 'yang', 'ini', 'itu', 'untuk', 'pada', 'dengan', 'agar', 'supaya', 'bisa', 'tolong', 'bantu', 'mohon', 'dengan', 'saya', 'kamu', 'kita']
  if (customerName && actualStopWords.includes(customerName.toLowerCase())) {
    customerName = undefined
  }

  // Extract block number
  let blockNumber: string | undefined
  const blockMatch = message.match(/blok\s+([A-Za-z]\d+)/i) || message.match(/\b([A-Za-z]\d{1,3})\b/)
  if (blockMatch && blockMatch[1].length <= 4) blockNumber = blockMatch[1].toUpperCase()

  return { tools: [...new Set(tools)], customerName, blockNumber, action, newBankValue, newStageValue }
}

// ============================================================
// TOOL: Get ALL Customers (full context for DINA)
// ============================================================

async function getAllCustomers(): Promise<ToolResult> {
  const customers = await db.customer.findMany({
    include: { units: true, bankPipelines: true },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })

  const customerList = customers.map(c => {
    const block = c.units?.[0]?.blockNumber || (c.blockLetter || '') + (c.houseNumber || '') || '-'
    const bank = c.bankName || c.bankPipelines?.[0]?.bankName || 'Belum dipilih'
    let docCount = 0
    let docsList: string[] = []
    try {
      if (c.uploadedDocs) {
        const docs = JSON.parse(c.uploadedDocs)
        docsList = Object.keys(docs)
        docCount = docsList.length
      }
    } catch {}

    return {
      id: c.id,
      name: c.name,
      block,
      bank,
      stage: c.stage,
      phone: c.whatsappNumber || c.phone || '',
      nik: c.nik || '',
      occupation: c.occupation || '',
      companyName: c.companyName || '',
      monthlyIncome: c.monthlyIncome || 0,
      maritalStatus: c.maritalStatus || '',
      docCount,
      docsList,
      berkasLengkap: c.berkasLengkap,
      closingDate: c.closingDate,
      sp3kDate: c.sp3kDate,
      akadDate: c.akadDate,
      workplaceMapsLink: c.workplaceMapsLink || '',
      workplaceMapsShortLink: c.workplaceMapsShortLink || '',
      workplaceJamOperasional: c.workplaceJamOperasional || '',
      atasanName: c.atasanName || '',
      atasanNip: c.atasanNip || '',
      companyAddress: c.companyAddress || '',
    }
  })

  const summary = `DATA SEMUA KONSUMEN (${customers.length} total):\n` +
    customerList.map(c => `- ${c.name} | Blok ${c.block} | Bank: ${c.bank} | Stage: ${c.stage} | Telp: ${c.phone} | Dokumen: ${c.docCount} file (${c.docsList.join(', ')}) | Berkas Lengkap: ${c.berkasLengkap ? 'YA' : 'BELUM'} | Lokasi Kerja: ${c.workplaceMapsLink || 'belum ada'} | Jam Operasional: ${c.workplaceJamOperasional || 'belum ada'}`).join('\n')

  return {
    toolName: 'getAllCustomers',
    success: true,
    data: customerList,
    summary,
  }
}

// ============================================================
// TOOL: Get Customer Statistics
// ============================================================

async function getCustomerStats(): Promise<ToolResult> {
  const total = await db.customer.count()
  const byStage = await db.customer.groupBy({ by: ['stage'], _count: true })
  const berkasLengkap = await db.customer.count({ where: { berkasLengkap: true } })

  return {
    toolName: 'getCustomerStats',
    success: true,
    data: { total, byStage, berkasLengkap },
    summary: `Total konsumen: ${total}. Berkas lengkap: ${berkasLengkap}. Stage: ${byStage.map(s => `${s.stage}=${s._count}`).join(', ')}.`,
  }
}

// ============================================================
// TOOL: Get Bank Distribution
// ============================================================

async function getBankDistribution(): Promise<ToolResult> {
  const btn = await db.customer.count({ where: { bankName: 'BTN' } })
  const mandiri = await db.customer.count({ where: { bankName: 'MANDIRI' } })
  const bsb = await db.customer.count({ where: { bankName: 'BSB_SYARIAH' } })
  const belum = await db.customer.count({ where: { bankName: null } })

  return {
    toolName: 'getBankDistribution',
    success: true,
    data: { btn, mandiri, bsb, belum },
    summary: `Distribusi bank: BTN=${btn}, Mandiri=${mandiri}, BSB Syariah=${bsb}, Belum dipilih=${belum}.`,
  }
}

// ============================================================
// TOOL: Get Stage Distribution
// ============================================================

async function getStageDistribution(): Promise<ToolResult> {
  const stages = await db.customer.groupBy({ by: ['stage'], _count: true, orderBy: { _count: { stage: 'desc' } } })

  const stageNames: Record<string, string> = {
    DM: 'DM (Pertama kontak)', SURVEY: 'Survey', CLOSING: 'Closing', BOOKING: 'Booking',
    SLIK: 'SLIK (BI Checking)', PEMBERKASAN: 'Pemberkasan', SP3K: 'SP3K (Persetujuan Bank)',
    AKAD: 'Akad', SERAH_TERIMA: 'Serah Terima', LOST: 'Lost (Batal)',
  }

  return {
    toolName: 'getStageDistribution',
    success: true,
    data: stages,
    summary: `Pipeline: ${stages.map(s => `${stageNames[s.stage] || s.stage}=${s._count}`).join(', ')}`,
  }
}

// ============================================================
// TOOL: Get Customer Document Status (detailed)
// ============================================================

const REQUIRED_DOCS = [
  { id: 'ktp', label: 'KTP' }, { id: 'kk', label: 'KK' }, { id: 'npwp', label: 'NPWP' },
  { id: 'status-nikah', label: 'Akta Nikah/Belum Menikah' }, { id: 'slip-gaji', label: 'Slip Gaji' },
  { id: 'sk-kerja', label: 'SK Kerja/NIB' }, { id: 'surat-rumah', label: 'Surat Belum Punya Rumah' },
  { id: 'sertifikat', label: 'Sertifikat Rumah' }, { id: 'pbb', label: 'PBB' },
]
const SIGNED_DOCS = [
  { id: 'flpp-signed', label: 'Form FLPP (TTD)' }, { id: 'spr-signed', label: 'SPR (TTD)' },
  { id: 'aplikasi-signed', label: 'Form Aplikasi (TTD)' }, { id: 'pernyataan-penghasilan-signed', label: 'Surat Pernyataan Penghasilan (TTD)' },
  { id: 'rekening-koran-signed', label: 'Rekening Koran (TTD)' }, { id: 'sp3k-btn', label: 'SP3K BTN' },
  { id: 'sppk-mandiri', label: 'SPPK Mandiri' }, { id: 'sp4-bsb', label: 'SP4 BSB' },
]

async function getCustomerDocStatus(customerId?: string, customerName?: string): Promise<ToolResult> {
  let customer: any = null
  if (customerId) {
    customer = await db.customer.findUnique({ where: { id: customerId }, include: { units: true } })
  } else if (customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: customerName, mode: 'insensitive' } }, include: { units: true } })
  } else {
    // Get all customers' doc status
    const allCustomers = await db.customer.findMany({ include: { units: true }, take: 20 })
    const summaries = allCustomers.map(c => {
      const uploadedDocs = c.uploadedDocs ? JSON.parse(c.uploadedDocs) : {}
      const uploadedIds = Object.keys(uploadedDocs)
      const missing = REQUIRED_DOCS.filter(d => !uploadedIds.includes(d.id)).map(d => d.label)
      const block = c.units?.[0]?.blockNumber || (c.blockLetter || '') + (c.houseNumber || '') || '-'
      return `- ${c.name} (Blok ${block}): ${uploadedIds.length} dokumen, BELUM: ${missing.join(', ') || 'semua lengkap'}`
    }).join('\n')
    return { toolName: 'getCustomerDocStatus', success: true, data: allCustomers, summary: `Status berkas semua konsumen:\n${summaries}` }
  }

  if (!customer) return { toolName: 'getCustomerDocStatus', success: false, data: null, summary: 'Konsumen tidak ditemukan.' }

  const uploadedDocs = customer.uploadedDocs ? JSON.parse(customer.uploadedDocs) : {}
  const uploadedIds = Object.keys(uploadedDocs)
  const requiredMissing = REQUIRED_DOCS.filter(d => !uploadedIds.includes(d.id))
  const signedMissing = SIGNED_DOCS.filter(d => !uploadedIds.includes(d.id))
  const block = customer.units?.[0]?.blockNumber || (customer.blockLetter || '') + (customer.houseNumber || '') || '-'

  return {
    toolName: 'getCustomerDocStatus',
    success: true,
    data: { customer, requiredMissing, signedMissing },
    summary: `Konsumen: ${customer.name} (Blok ${block}, Bank: ${customer.bankName || 'belum'}, Stage: ${customer.stage})
Dokumen wajib SUDAH: ${REQUIRED_DOCS.filter(d => uploadedIds.includes(d.id)).map(d => d.label).join(', ') || 'tidak ada'}
Dokumen wajib BELUM: ${requiredMissing.map(d => d.label).join(', ') || 'semua lengkap'}
Dokumen TTD BELUM: ${signedMissing.map(d => d.label).join(', ') || 'semua lengkap'}
Lokasi Kerja: ${customer.workplaceMapsLink || 'belum ada'}
Jam Operasional: ${customer.workplaceJamOperasional || 'belum ada'}
Atasan: ${customer.atasanName || 'belum ada'} (${customer.atasanNip || 'belum ada'})`,
  }
}

// ============================================================
// TOOL: Get Relevant Memories (filtered by category)
// ============================================================

async function getRelevantMemories(message: string): Promise<ToolResult> {
  const category = detectMemoryCategory(message)
  // Query memories for this category + UTAMA (always include general)
  const memories = await db.memory.findMany({
    where: { OR: [{ category }, { category: 'UTAMA' }, { category: 'DECISION' }] },
    orderBy: { importance: 'desc' },
    take: 15,
  })

  return {
    toolName: 'getRelevantMemories',
    success: true,
    data: { category, memories },
    summary: memories.length > 0
      ? `Memory kategori ${category} + UTAMA (${memories.length} items):\n${memories.map(m => `- [${m.category}] (importance: ${m.importance}) ${m.content}`).join('\n')}`
      : `Belum ada memory untuk kategori ${category}.`,
  }
}

// ============================================================
// TOOL: UPDATE Customer Bank (WRITE ACTION)
// ============================================================

async function updateCustomerBank(customerId: string, newBank: string): Promise<ToolResult> {
  const customer = await db.customer.update({
    where: { id: customerId },
    data: { bankName: newBank },
    include: { units: true },
  })

  return {
    toolName: 'updateCustomerBank',
    success: true,
    data: customer,
    summary: `✅ Berhasil update bank ${customer.name} → ${newBank}. Perubahan sudah tersimpan di database.`,
  }
}

// ============================================================
// TOOL: UPDATE Customer Stage (WRITE ACTION)
// ============================================================

async function updateCustomerStage(customerId: string, newStage: string): Promise<ToolResult> {
  const customer = await db.customer.update({
    where: { id: customerId },
    data: { stage: newStage, stageUpdatedAt: new Date() },
    include: { units: true },
  })

  return {
    toolName: 'updateCustomerStage',
    success: true,
    data: customer,
    summary: `✅ Berhasil update stage ${customer.name} → ${newStage}. Perubahan sudah tersimpan di database.`,
  }
}

// ============================================================
// MAIN: Execute tools based on intent
// ============================================================

export async function executeTools(intent: IntentResult, customerId?: string, userMessage?: string): Promise<string> {
  const results: string[] = []

  for (const toolName of intent.tools) {
    try {
      let result: ToolResult

      switch (toolName) {
        case 'getAllCustomers':
          result = await getAllCustomers()
          break
        case 'getCustomerStats':
          result = await getCustomerStats()
          break
        case 'getBankDistribution':
          result = await getBankDistribution()
          break
        case 'getStageDistribution':
          result = await getStageDistribution()
          break
        case 'getCustomerDocStatus':
          result = await getCustomerDocStatus(customerId, intent.customerName)
          break
        case 'getRelevantMemories':
          result = await getRelevantMemories(userMessage || '')
          break
        default:
          continue
      }

      if (result.success) results.push(`[${toolName}] ${result.summary}`)
    } catch (err) {
      console.error(`Tool ${toolName} error:`, err)
    }
  }

  // Handle WRITE actions (after reading data)
  // CRITICAL: These must actually execute against DB and report real results
  if (intent.action === 'UPDATE_BANK' && intent.newBankValue) {
    let targetCustomer: any = null
    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }
    if (!targetCustomer && intent.customerName) {
      // Case-insensitive search
      targetCustomer = await db.customer.findFirst({
        where: { name: { contains: intent.customerName, mode: 'insensitive' } }
      })
    }
    // Try block number if name not found
    if (!targetCustomer && intent.blockNumber) {
      targetCustomer = await db.customer.findFirst({
        where: { OR: [
          { blockLetter: { startsWith: intent.blockNumber[0], mode: 'insensitive' } },
          { units: { some: { blockNumber: { contains: intent.blockNumber, mode: 'insensitive' } } } }
        ] }
      })
    }

    if (targetCustomer) {
      try {
        const result = await updateCustomerBank(targetCustomer.id, intent.newBankValue)
        results.push(`[updateCustomerBank] ${result.summary}`)
      } catch (err: any) {
        results.push(`[updateCustomerBank] ❌ GAGAL update: ${err?.message || 'unknown error'}. JANGAN bilang berhasil.`)
      }
    } else {
      results.push(`[updateCustomerBank] ❌ Konsumen tidak ditemukan (cari: name="${intent.customerName}", block="${intent.blockNumber}"). JANGAN bilang berhasil. Minta user sebutkan nama konsumen dengan jelas.`)
    }
  }

  if (intent.action === 'UPDATE_STAGE' && intent.newStageValue) {
    let targetCustomer: any = null
    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }
    if (!targetCustomer && intent.customerName) {
      targetCustomer = await db.customer.findFirst({
        where: { name: { contains: intent.customerName, mode: 'insensitive' } }
      })
    }
    if (!targetCustomer && intent.blockNumber) {
      targetCustomer = await db.customer.findFirst({
        where: { OR: [
          { blockLetter: { startsWith: intent.blockNumber[0], mode: 'insensitive' } },
          { units: { some: { blockNumber: { contains: intent.blockNumber, mode: 'insensitive' } } } }
        ] }
      })
    }

    if (targetCustomer) {
      try {
        const result = await updateCustomerStage(targetCustomer.id, intent.newStageValue)
        results.push(`[updateCustomerStage] ${result.summary}`)
      } catch (err: any) {
        results.push(`[updateCustomerStage] ❌ GAGAL update: ${err?.message || 'unknown error'}. JANGAN bilang berhasil.`)
      }
    } else {
      results.push(`[updateCustomerStage] ❌ Konsumen tidak ditemukan (cari: name="${intent.customerName}", block="${intent.blockNumber}"). JANGAN bilang berhasil. Minta user sebutkan nama konsumen dengan jelas.`)
    }
  }

  return results.join('\n\n')
}

// ============================================================
// Save memory
// ============================================================

export async function saveMemory(content: string, category: string, customerId?: string, importance: number = 0.5) {
  try {
    await db.memory.create({ data: { content, category, importance, source: 'CONVERSATION', customerId: customerId || null, agentId: null } })
  } catch (err) { console.error('Save memory error:', err) }
}

export function extractLearning(userMessage: string, aiResponse: string): { content: string; category: string; importance: number } | null {
  const msg = userMessage.toLowerCase()
  const category = detectMemoryCategory(userMessage)

  if (msg.includes('update') || msg.includes('ubah') || msg.includes('ganti') || msg.includes('pindah')) {
    return { content: `User melakukan UPDATE: "${userMessage.substring(0, 200)}". DINA executed action.`, category: 'DECISION', importance: 0.8 }
  }
  if (msg.includes('syarat') || msg.includes('requirement') || msg.includes('proses') || msg.includes('tahap')) {
    return { content: `User bertanya: "${userMessage.substring(0, 200)}". Jawaban: ${aiResponse.substring(0, 300)}`, category, importance: 0.7 }
  }
  if (msg.includes('konsumen') || msg.includes('debitur') || msg.includes('berkas') || msg.includes('bank') || msg.includes('kpr')) {
    return { content: `User bertanya: "${userMessage.substring(0, 200)}"`, category, importance: 0.4 }
  }
  if (category !== MEMORY_CATEGORIES.UTAMA) {
    return { content: `User bertanya soal ${category}: "${userMessage.substring(0, 200)}"`, category, importance: 0.4 }
  }

  return null
}
