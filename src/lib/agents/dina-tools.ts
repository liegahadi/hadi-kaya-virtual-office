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
  action?: 'READ' | 'UPDATE_BANK' | 'UPDATE_STAGE' | 'UPDATE_FIELD' | 'FILL_FORM' | 'GET_DOCS' | 'GET_WORKPLACE'
  newBankValue?: string
  newStageValue?: string
  updateField?: string // field name to update
  updateValue?: string  // value to set
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
  let intent_updateField: string | undefined
  let intent_updateValue: string | undefined

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

  // === GENERIC FIELD UPDATE ===
  // Detect patterns like: "ubah NIK jenni jadi 12345", "ganti alamat andas ke jl xyz", "set penghasilan jenni 5000000"
  if ((msg.includes('ubah') || msg.includes('ganti') || msg.includes('set') || msg.includes('update') || msg.includes('isi'))) {
    const fieldPatterns: Array<{ keywords: string[], field: string }> = [
      { keywords: ['nik', 'ktp', 'no ktp'], field: 'nik' },
      { keywords: ['npwp', 'no npwp'], field: 'npwp' },
      { keywords: ['alamat'], field: 'alamat' },
      { keywords: ['telepon', 'no hp', 'wa', 'whatsapp'], field: 'telepon' },
      { keywords: ['pekerjaan', 'job'], field: 'pekerjaan' },
      { keywords: ['perusahaan', 'nama perusahaan'], field: 'perusahaan' },
      { keywords: ['jabatan', 'posisi'], field: 'jabatan' },
      { keywords: ['penghasilan', 'gaji', 'income'], field: 'penghasilan' },
      { keywords: ['tempat lahir'], field: 'tempat lahir' },
      { keywords: ['tanggal lahir', 'tgl lahir'], field: 'tanggal lahir' },
      { keywords: ['tgl closing', 'tanggal closing'], field: 'tgl closing' },
      { keywords: ['tgl sp3k', 'tanggal sp3k'], field: 'tgl sp3k' },
      { keywords: ['tgl akad', 'tanggal akad'], field: 'tgl akad' },
      { keywords: ['no akad'], field: 'no akad' },
      { keywords: ['atasan', 'nama atasan'], field: 'atasan' },
      { keywords: ['jam operasional'], field: 'jam operasional' },
      { keywords: ['maps link', 'link maps'], field: 'maps link' },
      { keywords: ['short link'], field: 'short link' },
    ]

    for (const fp of fieldPatterns) {
      if (fp.keywords.some(kw => msg.includes(kw))) {
        // Check this is not just asking about the field (e.g., "berapa penghasilan jenni?")
        const isAsking = msg.includes('berapa') || msg.includes('apa') || msg.includes('siapa')
        if (!isAsking) {
          action = 'UPDATE_FIELD'
          intent_updateField = fp.field
          // Try to extract the value after "jadi" or "ke" or "="
          const valueMatch = msg.match(/(?:jadi|ke|=)\s*(.+?)(?:\s*(?:dong|ya|tolong|saya|untuk|dari|$))/)
          if (valueMatch) intent_updateValue = valueMatch[1].trim()
          tools.push('getAllCustomers')
        }
        break
      }
    }
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

  return { tools: [...new Set(tools)], customerName, blockNumber, action, newBankValue, newStageValue, updateField: intent_updateField, updateValue: intent_updateValue }
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
// TOOL: UPDATE Customer Field (generic WRITE — any field)
// ============================================================

async function updateCustomerField(customerId: string, field: string, value: any): Promise<ToolResult> {
  // Map common field names to DB column names
  const fieldMap: Record<string, string> = {
    'bank': 'bankName', 'nama bank': 'bankName',
    'stage': 'stage', 'status': 'stage', 'tahap': 'stage',
    'nik': 'nik', 'ktp': 'nik', 'nomor ktp': 'nik',
    'npwp': 'npwpNumber', 'nomor npwp': 'npwpNumber',
    'nama': 'name', 'nama lengkap': 'name', 'nama konsumen': 'name',
    'alamat': 'ktpAddress', 'alamat ktp': 'ktpAddress',
    'telepon': 'whatsappNumber', 'no hp': 'whatsappNumber', 'wa': 'whatsappNumber', 'whatsapp': 'whatsappNumber',
    'pekerjaan': 'occupation', 'job': 'occupation',
    'perusahaan': 'companyName', 'nama perusahaan': 'companyName',
    'jabatan': 'workPosition', 'posisi': 'workPosition',
    'penghasilan': 'monthlyIncome', 'gaji': 'monthlyIncome', 'income': 'monthlyIncome',
    'tempat lahir': 'birthPlace',
    'tanggal lahir': 'birthDate',
    'blok': 'blockLetter',
    'no rumah': 'houseNumber',
    'luas tanah': 'landSize',
    'luas bangunan': 'houseSize',
    'tgl closing': 'closingDate', 'tanggal closing': 'closingDate',
    'tgl sp3k': 'sp3kDate', 'tanggal sp3k': 'sp3kDate',
    'tgl akad': 'akadDate', 'tanggal akad': 'akadDate',
    'no akad': 'akadNumber',
    'tgl lpa': 'lpaDate', 'tanggal lpa': 'lpaDate',
    'no lpa': 'lpaNumber',
    'no rekening btn': 'btnAccountNumber', 'rekening btn': 'btnAccountNumber',
    'atasan': 'atasanName', 'nama atasan': 'atasanName',
    'no hp atasan': 'atasanNip',
    'jam operasional': 'workplaceJamOperasional',
    'waktu hubungi': 'workplaceWaktuHubungi',
    'maps link': 'workplaceMapsLink',
    'short link': 'workplaceMapsShortLink',
    'berkas lengkap': 'berkasLengkap',
  }

  const dbField = fieldMap[field.toLowerCase()] || field
  const isDateField = ['closingDate', 'sp3kDate', 'akadDate', 'lpaDate', 'birthDate'].includes(dbField)
  const isIntField = ['landSize', 'houseSize', 'monthlyIncome', 'gajiPokok'].includes(dbField)
  const isBoolField = ['berkasLengkap'].includes(dbField)

  let dbValue: any = value
  if (isDateField) {
    // Parse date — accept "2025-06-30", "30 Juni 2025", "30/06/2025"
    const dateStr = String(value).trim()
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dbValue = new Date(dateStr)
    } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [d, m, y] = dateStr.split('/')
      dbValue = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    } else {
      // Try Indonesian date format
      const months: Record<string, string> = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
        'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'okt': '10',
      }
      const match = dateStr.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/)
      if (match) {
        const day = match[1].padStart(2, '0')
        const month = months[match[2].toLowerCase()] || '01'
        dbValue = new Date(`${match[3]}-${month}-${day}`)
      }
    }
  }
  if (isIntField) dbValue = parseInt(String(value).replace(/[^\d]/g, '')) || 0
  if (isBoolField) dbValue = ['true', 'ya', 'lengkap', '1', 'yes'].includes(String(value).toLowerCase())

  // Bank name normalization
  if (dbField === 'bankName') {
    const v = String(value).toLowerCase()
    if (v.includes('btn')) dbValue = 'BTN'
    else if (v.includes('mandiri')) dbValue = 'MANDIRI'
    else if (v.includes('bsb') || v.includes('syariah') || v.includes('sumsel') || v.includes('babel')) dbValue = 'BSB_SYARIAH'
  }

  // Stage normalization
  if (dbField === 'stage') {
    const stageMap: Record<string, string> = {
      'dm': 'DM', 'survey': 'SURVEY', 'closing': 'CLOSING', 'booking': 'BOOKING',
      'slik': 'SLIK', 'pemberkasan': 'PEMBERKASAN', 'sp3k': 'SP3K', 'sppk': 'SP3K',
      'akad': 'AKAD', 'serah terima': 'SERAH_TERIMA', 'serahterima': 'SERAH_TERIMA',
    }
    const v = String(value).toLowerCase()
    for (const [key, val] of Object.entries(stageMap)) {
      if (v.includes(key)) { dbValue = val; break }
    }
  }

  try {
    const customer = await db.customer.update({
      where: { id: customerId },
      data: { [dbField]: dbValue },
    })
    return {
      toolName: 'updateCustomerField',
      success: true,
      data: { field: dbField, value: dbValue, customer },
      summary: `✅ Berhasil update ${dbField} = ${dbValue} untuk konsumen ${customer.name}.`,
    }
  } catch (err: any) {
    return {
      toolName: 'updateCustomerField',
      success: false,
      data: null,
      summary: `❌ GAGAL update ${dbField}: ${err?.message || 'unknown error'}`,
    }
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

  // Handle UPDATE_FIELD (generic field update)
  if (intent.action === 'UPDATE_FIELD' && intent.updateField) {
    let targetCustomer: any = null
    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }
    if (!targetCustomer && intent.customerName) {
      targetCustomer = await db.customer.findFirst({ where: { name: { contains: intent.customerName, mode: 'insensitive' } } })
    }
    if (!targetCustomer && intent.blockNumber) {
      targetCustomer = await db.customer.findFirst({
        where: { OR: [
          { blockLetter: { startsWith: intent.blockNumber[0], mode: 'insensitive' } },
          { units: { some: { blockNumber: { contains: intent.blockNumber, mode: 'insensitive' } } } }
        ] }
      })
    }

    if (targetCustomer && intent.updateValue) {
      const result = await updateCustomerField(targetCustomer.id, intent.updateField, intent.updateValue)
      results.push(`[updateCustomerField] ${result.summary}`)
    } else if (!targetCustomer) {
      results.push(`[updateCustomerField] ❌ Konsumen tidak ditemukan (cari: name="${intent.customerName}", block="${intent.blockNumber}"). JANGAN bilang berhasil.`)
    } else if (!intent.updateValue) {
      results.push(`[updateCustomerField] ⚠️ Field "${intent.updateField}" terdeteksi tapi value tidak ditemukan. Minta user sebutkan value yang baru.`)
    }
  }

  // Handle UPDATE_BANK (still works, uses generic updateCustomerField)
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
        const result = await updateCustomerField(targetCustomer.id, 'bankName', intent.newBankValue)
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
        const result = await updateCustomerField(targetCustomer.id, 'stage', intent.newStageValue)
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
