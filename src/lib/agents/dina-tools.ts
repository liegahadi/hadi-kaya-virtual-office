// DINA Tools System — Database queries & system actions that DINA can use
// DINA detects intent from user message → queries relevant DB data → includes in context
// This makes DINA a true AI agent, not just a chatbot

import { db } from '@/lib/db'

export interface ToolResult {
  toolName: string
  success: boolean
  data: any
  summary: string // human-readable summary for DINA to use
}

// ============================================================
// INTENT DETECTION — analyze user message, return which tools to run
// ============================================================

export interface IntentResult {
  tools: string[] // tool names to execute
  customerName?: string // extracted customer name if mentioned
  blockNumber?: string // extracted block/unit number
  docType?: string // extracted document type
}

export function detectIntent(message: string): IntentResult {
  const msg = message.toLowerCase()
  const tools: string[] = []

  // Customer count / statistics
  if (msg.includes('berapa') && (msg.includes('konsumen') || msg.includes('debitur') || msg.includes('nasabah'))) {
    tools.push('getCustomerStats')
  }

  // Customer list / names
  if ((msg.includes('siapa') || msg.includes('nama') || msg.includes('list') || msg.includes('daftar')) && (msg.includes('konsumen') || msg.includes('debitur'))) {
    tools.push('getCustomerList')
  }

  // Bank distribution
  if (msg.includes('btn') || msg.includes('mandiri') || msg.includes('bsb') || msg.includes('bank')) {
    if (msg.includes('berapa') || msg.includes('distribusi') || msg.includes('masuk')) {
      tools.push('getBankDistribution')
    }
  }

  // Specific customer details
  if (msg.includes('berkas') || msg.includes('lengkap') || msg.includes('kurang') || msg.includes('belum')) {
    tools.push('getCustomerList') // to find customer by name
  }

  // Stage/pipeline distribution
  if (msg.includes('stage') || msg.includes('pipeline') || msg.includes('proses') || msg.includes('tahap')) {
    tools.push('getStageDistribution')
  }

  // Workplace / lokasi kerja
  if (msg.includes('lokasi') || msg.includes('tempat kerja') || msg.includes('kerja') || msg.includes('maps') || msg.includes('google maps')) {
    tools.push('getCustomerList') // to find customer + workplace info
  }

  // Dashboard stats (general)
  if (msg.includes('dashboard') || msg.includes('ringkasan') || msg.includes('overview') || msg.includes('statistik')) {
    tools.push('getCustomerStats')
    tools.push('getStageDistribution')
    tools.push('getBankDistribution')
  }

  // Always include relevant memories
  tools.push('getRelevantMemories')

  // Extract customer name (simple heuristic)
  let customerName: string | undefined
  const nameMatch = message.match(/konsumen\s+([A-Za-z]+)/i) || message.match(/debitur\s+([A-Za-z]+)/i) || message.match(/dari\s+([A-Za-z]+)/i)
  if (nameMatch) customerName = nameMatch[1]

  // Extract block number
  let blockNumber: string | undefined
  const blockMatch = message.match(/blok\s+([A-Za-z]\d+)/i) || message.match(/\b([A-Za-z]\d+)\b/)
  if (blockMatch && blockMatch[1].length <= 4) blockNumber = blockMatch[1].toUpperCase()

  return { tools: [...new Set(tools)], customerName, blockNumber }
}

// ============================================================
// TOOL: Get Customer Statistics
// ============================================================

async function getCustomerStats(): Promise<ToolResult> {
  const total = await db.customer.count()
  const byStage = await db.customer.groupBy({
    by: ['stage'],
    _count: true,
  })
  const berkasLengkap = await db.customer.count({ where: { berkasLengkap: true } })

  return {
    toolName: 'getCustomerStats',
    success: true,
    data: { total, byStage, berkasLengkap },
    summary: `Total konsumen: ${total}. Berkas lengkap: ${berkasLengkap}. Stage distribution: ${byStage.map(s => `${s.stage}=${s._count}`).join(', ')}.`,
  }
}

// ============================================================
// TOOL: Get Customer List
// ============================================================

async function getCustomerList(customerName?: string, blockNumber?: string): Promise<ToolResult> {
  let where: any = {}

  if (customerName) {
    where.name = { contains: customerName, mode: 'insensitive' }
  }

  if (blockNumber) {
    where.OR = [
      { blockLetter: { startsWith: blockNumber[0] } },
      { units: { some: { blockNumber: { contains: blockNumber } } } },
    ]
  }

  const customers = await db.customer.findMany({
    where,
    include: { units: true, bankPipelines: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  })

  const customerSummary = customers.map(c => {
    const block = c.units?.[0]?.blockNumber || c.blockLetter + (c.houseNumber || '') || '-'
    const bank = c.bankName || c.bankPipelines?.[0]?.bankName || 'Belum dipilih'
    const docsUploaded = c.uploadedDocs ? Object.keys(JSON.parse(c.uploadedDocs)).length : 0
    return `- ${c.name} | Blok ${block} | ${bank} | Stage: ${c.stage} | Dokumen: ${docsUploaded} file`
  }).join('\n')

  return {
    toolName: 'getCustomerList',
    success: true,
    data: customers,
    summary: `Ditemukan ${customers.length} konsumen:\n${customerSummary}`,
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
  const stages = await db.customer.groupBy({
    by: ['stage'],
    _count: true,
    orderBy: { _count: { stage: 'desc' } },
  })

  const stageNames: Record<string, string> = {
    DM: 'DM (Pertama kontak)',
    SURVEY: 'Survey',
    CLOSING: 'Closing',
    BOOKING: 'Booking',
    SLIK: 'SLIK (BI Checking)',
    PEMBERKASAN: 'Pemberkasan',
    SP3K: 'SP3K (Persetujuan Bank)',
    AKAD: 'Akad',
    SERAH_TERIMA: 'Serah Terima',
    LOST: 'Lost (Batal)',
  }

  const summary = stages.map(s => `${stageNames[s.stage] || s.stage}: ${s._count} konsumen`).join(', ')

  return {
    toolName: 'getStageDistribution',
    success: true,
    data: stages,
    summary: `Pipeline: ${summary}`,
  }
}

// ============================================================
// TOOL: Get Customer Document Status
// ============================================================

const REQUIRED_DOCS = [
  { id: 'ktp', label: 'KTP' },
  { id: 'kk', label: 'KK' },
  { id: 'npwp', label: 'NPWP' },
  { id: 'status-nikah', label: 'Akta Nikah/Belum Menikah' },
  { id: 'slip-gaji', label: 'Slip Gaji' },
  { id: 'sk-kerja', label: 'SK Kerja/NIB' },
  { id: 'surat-rumah', label: 'Surat Belum Punya Rumah' },
  { id: 'sertifikat', label: 'Sertifikat Rumah' },
  { id: 'pbb', label: 'PBB' },
]

const SIGNED_DOCS = [
  { id: 'flpp-signed', label: 'Form FLPP (TTD)' },
  { id: 'spr-signed', label: 'SPR (TTD)' },
  { id: 'aplikasi-signed', label: 'Form Aplikasi (TTD)' },
  { id: 'pernyataan-penghasilan-signed', label: 'Surat Pernyataan Penghasilan (TTD)' },
  { id: 'rekening-koran-signed', label: 'Rekening Koran (TTD)' },
  { id: 'sp3k-btn', label: 'SP3K BTN' },
  { id: 'sppk-mandiri', label: 'SPPK Mandiri' },
  { id: 'sp4-bsb', label: 'SP4 BSB' },
]

async function getCustomerDocStatus(customerId?: string, customerName?: string): Promise<ToolResult> {
  let customer: any = null

  if (customerId) {
    customer = await db.customer.findUnique({ where: { id: customerId }, include: { units: true } })
  } else if (customerName) {
    customer = await db.customer.findFirst({
      where: { name: { contains: customerName, mode: 'insensitive' } },
      include: { units: true },
    })
  }

  if (!customer) {
    return { toolName: 'getCustomerDocStatus', success: false, data: null, summary: 'Konsumen tidak ditemukan.' }
  }

  const uploadedDocs = customer.uploadedDocs ? JSON.parse(customer.uploadedDocs) : {}
  const uploadedIds = Object.keys(uploadedDocs)

  const requiredComplete = REQUIRED_DOCS.filter(d => uploadedIds.includes(d.id))
  const requiredMissing = REQUIRED_DOCS.filter(d => !uploadedIds.includes(d.id))
  const signedComplete = SIGNED_DOCS.filter(d => uploadedIds.includes(d.id))
  const signedMissing = SIGNED_DOCS.filter(d => !uploadedIds.includes(d.id))

  const block = customer.units?.[0]?.blockNumber || customer.blockLetter + (customer.houseNumber || '') || '-'

  const summary = `Konsumen: ${customer.name} (Blok ${block})
Dokumen wajib LENGKAP (${requiredComplete.length}/${REQUIRED_DOCS.length}): ${requiredComplete.map(d => d.label).join(', ') || '-'}
Dokumen wajib BELUM ADA (${requiredMissing.length}): ${requiredMissing.map(d => d.label).join(', ') || '-'}
Dokumen TTD LENGKAP (${signedComplete.length}/${SIGNED_DOCS.length}): ${signedComplete.map(d => d.label).join(', ') || '-'}
Dokumen TTD BELUM ADA: ${signedMissing.map(d => d.label).join(', ') || '-'}
Workplace Maps Link: ${customer.workplaceMapsLink || 'Belum ada'}
Workplace Short Link: ${customer.workplaceMapsShortLink || 'Belum ada'}`

  return {
    toolName: 'getCustomerDocStatus',
    success: true,
    data: { customer, requiredComplete, requiredMissing, signedComplete, signedMissing },
    summary,
  }
}

// ============================================================
// TOOL: Get Relevant Memories
// ============================================================

async function getRelevantMemories(message: string): Promise<ToolResult> {
  const memories = await db.memory.findMany({
    where: { OR: [{ agentId: null }, { agentId: { not: null } }] },
    orderBy: { importance: 'desc' },
    take: 10,
  })

  const memorySummary = memories.length > 0
    ? memories.map(m => `- [${m.category}] ${m.content}`).join('\n')
    : 'Belum ada memory tersimpan.'

  return {
    toolName: 'getRelevantMemories',
    success: true,
    data: memories,
    summary: `Memory sistem (${memories.length} items):\n${memorySummary}`,
  }
}

// ============================================================
// MAIN: Execute tools based on intent
// ============================================================

export async function executeTools(intent: IntentResult, customerId?: string): Promise<string> {
  const results: string[] = []

  for (const toolName of intent.tools) {
    try {
      let result: ToolResult

      switch (toolName) {
        case 'getCustomerStats':
          result = await getCustomerStats()
          break
        case 'getCustomerList':
          result = await getCustomerList(intent.customerName, intent.blockNumber)
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
          result = await getRelevantMemories(intent.customerName || '')
          break
        default:
          continue
      }

      if (result.success) {
        results.push(`[${toolName}] ${result.summary}`)
      }
    } catch (err) {
      console.error(`Tool ${toolName} error:`, err)
    }
  }

  return results.join('\n\n')
}

// ============================================================
// Save memory from conversation
// ============================================================

export async function saveMemory(content: string, category: string, customerId?: string, importance: number = 0.5) {
  try {
    await db.memory.create({
      data: {
        content,
        category,
        importance,
        source: 'CONVERSATION',
        customerId: customerId || null,
        agentId: null, // shared central brain
      },
    })
  } catch (err) {
    console.error('Save memory error:', err)
  }
}

// ============================================================
// Extract learning from conversation (simple heuristic)
// ============================================================

export function extractLearning(userMessage: string, aiResponse: string): { content: string; category: string; importance: number } | null {
  const msg = userMessage.toLowerCase()

  // If user asks about a specific customer, save as context
  if (msg.includes('konsumen') || msg.includes('debitur')) {
    return {
      content: `User asked: "${userMessage.substring(0, 200)}". DINA answered with DB data.`,
      category: 'INTERACTION',
      importance: 0.3,
    }
  }

  // If user asks about bank requirements, save as fact
  if (msg.includes('syarat') || msg.includes('requirement')) {
    return {
      content: `User bertanya soal syarat KPR. Jawaban: ${aiResponse.substring(0, 300)}`,
      category: 'FACT',
      importance: 0.7,
    }
  }

  // If user asks about process/stage, save as context
  if (msg.includes('proses') || msg.includes('tahap') || msg.includes('stage')) {
    return {
      content: `User bertanya soal proses KPR: "${userMessage.substring(0, 200)}"`,
      category: 'CONTEXT',
      importance: 0.4,
    }
  }

  return null
}
