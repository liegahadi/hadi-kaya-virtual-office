// DINA Tools System — Database queries & system actions
// DINA can READ (query) and WRITE (update) to the database
// This makes DINA a true AI agent that can actually DO things
//
// CRITICAL FIX (v8.2): pendingAction moved from in-memory to DB (PendingAction table)
// because Vercel serverless lambdas don't preserve module state between requests.
// This was causing DINA to lose track of what user was confirming, leading to
// wrong-customer deletions. Now pending actions are persisted with 5-min TTL.

import { db } from '@/lib/db'
import { withCache, invalidateCachePrefix, CACHE_KEYS } from '@/lib/cache'

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
  action?: 'READ' | 'UPDATE_BANK' | 'UPDATE_STAGE' | 'UPDATE_FIELD' | 'FILL_FORM' | 'GET_DOCS' | 'GET_WORKPLACE' | 'GET_FILES' | 'SEND_FILE' | 'CREATE_CUSTOMER' | 'DELETE_CUSTOMER' | 'CONFIRM_DELETE' | 'CONFIRM_CREATE' | 'CANCEL_PENDING' | 'LIST_BANKS' | 'ADD_BANK' | 'DELETE_BANK' | 'GENERATE_LOGO' | 'GENERATE_SURAT'
  newBankValue?: string
  newStageValue?: string
  updateField?: string
  updateValue?: string
  newCustomerName?: string
  newCustomerPhone?: string
  newCustomerBlock?: string
  newCustomerBank?: string
  requestedFileIndex?: number
  requestedFileDocType?: string
  newBankName?: string
  bankName?: string
  logoPrompt?: string
}

// ============================================================
// PENDING ACTION (DB-backed, survives Vercel lambda cold starts)
// ============================================================

export interface PendingActionRecord {
  id: string
  conversationId: string | null
  channel: string
  senderNumber: string | null
  type: string  // DELETE | CREATE | UPDATE
  targetType: string  // CUSTOMER | FIELD
  targetId: string | null
  targetName: string | null
  customerData: any | null
  fieldName?: string | null
  newValue?: string | null
}

const PENDING_TTL_MINUTES = 5

// Find active pending action for this conversation/sender
// Scoping rules:
//   1. If conversationId provided → scope by conversationId
//   2. Else if channel + senderNumber provided → scope by both (WA per-user)
//   3. Else if channel only provided → scope by channel (DASHBOARD single owner)
export async function getActivePendingAction(opts: {
  conversationId?: string
  channel?: string
  senderNumber?: string
}): Promise<PendingActionRecord | null> {
  try {
    // Expire old pending actions first
    const expiryTime = new Date(Date.now() - PENDING_TTL_MINUTES * 60 * 1000)
    await db.pendingAction.updateMany({
      where: { status: 'PENDING', createdAt: { lt: expiryTime } },
      data: { status: 'EXPIRED' }
    })

    // Find active one for this context
    const where: any = { status: 'PENDING' }
    if (opts.conversationId) {
      where.conversationId = opts.conversationId
    } else if (opts.channel && opts.senderNumber) {
      where.channel = opts.channel
      where.senderNumber = opts.senderNumber
    } else if (opts.channel) {
      where.channel = opts.channel
      // For DASHBOARD channel, only match where senderNumber is null
      // (so DASHBOARD pending doesn't conflict with WA pending)
      if (opts.channel === 'DASHBOARD') {
        where.OR = [{ senderNumber: null }, { senderNumber: '' }]
      }
    } else {
      // Default to DASHBOARD
      where.channel = 'DASHBOARD'
      where.OR = [{ senderNumber: null }, { senderNumber: '' }]
    }

    const action = await db.pendingAction.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    })
    if (!action) return null
    return {
      id: action.id,
      conversationId: action.conversationId,
      channel: action.channel,
      senderNumber: action.senderNumber,
      type: action.type,
      targetType: action.targetType,
      targetId: action.targetId,
      targetName: action.targetName,
      customerData: action.customerData ? JSON.parse(action.customerData) : null,
      fieldName: action.fieldName,
      newValue: action.newValue,
    }
  } catch (err) {
    console.error('getActivePendingAction error:', err)
    return null
  }
}

// Create new pending action (cancels previous pending for same context)
export async function setPendingAction(action: Omit<PendingActionRecord, 'id'>): Promise<void> {
  try {
    // Cancel previous pending for same context (same scoping rules as getActivePendingAction)
    const cancelWhere: any = { status: 'PENDING' }
    if (action.conversationId) {
      cancelWhere.conversationId = action.conversationId
    } else if (action.channel && action.senderNumber) {
      cancelWhere.channel = action.channel
      cancelWhere.senderNumber = action.senderNumber
    } else if (action.channel) {
      cancelWhere.channel = action.channel
      if (action.channel === 'DASHBOARD') {
        cancelWhere.OR = [{ senderNumber: null }, { senderNumber: '' }]
      }
    }
    await db.pendingAction.updateMany({ where: cancelWhere, data: { status: 'CANCELLED' } })

    // Create new
    await db.pendingAction.create({
      data: {
        conversationId: action.conversationId || null,
        channel: action.channel || 'DASHBOARD',
        senderNumber: action.senderNumber || null,
        type: action.type,
        targetType: action.targetType,
        targetId: action.targetId || null,
        targetName: action.targetName || null,
        customerData: action.customerData ? JSON.stringify(action.customerData) : null,
        fieldName: action.fieldName || null,
        newValue: action.newValue || null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + PENDING_TTL_MINUTES * 60 * 1000),
      } as any,
    })
  } catch (err) {
    console.error('setPendingAction error:', err)
  }
}

// Mark pending action as confirmed (and execute it)
export async function confirmPendingAction(actionId: string): Promise<void> {
  try {
    await db.pendingAction.update({
      where: { id: actionId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    })
  } catch (err) {
    console.error('confirmPendingAction error:', err)
  }
}

// Cancel pending action (e.g., user said 'batal' or 'cancel')
export async function cancelPendingAction(opts: {
  conversationId?: string
  channel?: string
  senderNumber?: string
}): Promise<void> {
  try {
    const where: any = { status: 'PENDING' }
    if (opts.conversationId) {
      where.conversationId = opts.conversationId
    } else if (opts.channel && opts.senderNumber) {
      where.channel = opts.channel
      where.senderNumber = opts.senderNumber
    } else if (opts.channel) {
      where.channel = opts.channel
      if (opts.channel === 'DASHBOARD') {
        where.OR = [{ senderNumber: null }, { senderNumber: '' }]
      }
    }
    await db.pendingAction.updateMany({ where, data: { status: 'CANCELLED' } })
  } catch (err) {
    console.error('cancelPendingAction error:', err)
  }
}

// ============================================================
// AUDIT LOG (track all writes for debugging & compliance)
// ============================================================

async function writeAuditLog(action: string, entityType: string, entityId: string, metadata: any): Promise<void> {
  try {
    await db.auditLog.create({
      data: { action, entityType, entityId, metadata: JSON.stringify(metadata) } as any,
    })
  } catch (err) {
    console.error('AuditLog write error (non-fatal):', err)
  }
}

// Backwards-compat stubs (deprecated — use DB-backed versions)
export function getPendingAction() { return null }
export function clearPendingAction() { /* no-op, use cancelPendingAction */ }

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
  let newCustomerName: string | undefined
  let newCustomerPhone: string | undefined
  let newCustomerBlock: string | undefined
  let newCustomerBank: string | undefined
  let intent_requestedFileIndex: number | undefined
  let intent_requestedFileDocType: string | undefined
  let intent_newBankName: string | undefined
  let intent_bankName: string | undefined
  let intent_logoPrompt: string | undefined

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

  // === GET_FILES / SEND_FILE (Berkas request from Google Drive) ===
  // Detect: "minta berkas [konsumen]", "kirim berkas [konsumen]", "berkas [konsumen] apa saja",
  //         "Dina minta KTP [konsumen]", "kirim slip gaji [konsumen]", "list berkas [konsumen]"
  const berkasKeywords = ['berkas', 'file', 'dokumen', 'kirim', 'minta', 'ktp', 'kk', 'npwp', 'slip gaji', 'sk kerja', 'spr', 'flpp', 'bphtb', 'notaris', 'lokasi kerja']
  const hasBerkasIntent = (
    (msg.includes('minta') || msg.includes('kirim') || msg.includes('lihat') || msg.includes('list') || msg.includes('daftar') || msg.includes('cek') || msg.includes('apa saja'))
    && berkasKeywords.some(kw => msg.includes(kw))
  )

  if (hasBerkasIntent) {
    // Check if user is requesting SPECIFIC file type (e.g., "minta KTP jenni")
    // vs just asking what files are available
    const docTypeKeywords: Array<{ keywords: string[], docType: string }> = [
      { keywords: ['ktp'], docType: 'ktp' },
      { keywords: ['kk', 'kartu keluarga'], docType: 'kk' },
      { keywords: ['npwp'], docType: 'npwp' },
      { keywords: ['slip gaji', 'slip'], docType: 'sk-slip-gaji' },
      { keywords: ['sk kerja', 'surat keterangan kerja'], docType: 'sk-slip-gaji' },
      { keywords: ['spr'], docType: 'spr' },
      { keywords: ['flpp'], docType: 'flpp' },
      { keywords: ['ajb'], docType: 'ajb' },
      { keywords: ['bphtb'], docType: 'bphtb' },
      { keywords: ['notaris'], docType: 'notaris' },
      { keywords: ['lokasi kerja', 'lokasi'], docType: 'lokasi-kerja' },
      { keywords: ['sertifikat', 'shgb'], docType: 'sertifikat' },
    ]
    const matchedDocType = docTypeKeywords.find(dt => dt.keywords.some(kw => msg.includes(kw)))

    // Check if user picked a number (e.g., "yang nomor 2", "kirim 1 dan 3")
    const numberMatch = msg.match(/(?:nomor|no|urut)?\s*(\d+(?:\s*(?:dan|,|&)\s*\d+)*)/)
    const requestedIndices: number[] = []
    if (numberMatch) {
      // Extract all numbers from the match
      const nums = numberMatch[1].match(/\d+/g)
      if (nums) {
        for (const n of nums) {
          const i = parseInt(n)
          if (i >= 1 && i <= 20) requestedIndices.push(i)  // reasonable range
        }
      }
    }

    if (matchedDocType || requestedIndices.length > 0) {
      // User wants a specific file → SEND_FILE
      action = 'SEND_FILE'
      if (matchedDocType) intent_requestedFileDocType = matchedDocType.docType
      if (requestedIndices.length > 0) intent_requestedFileIndex = requestedIndices[0]  // First one for now
      tools.push('getCustomerFiles')
      tools.push('getAllCustomers')
    } else {
      // User wants to see what files are available → GET_FILES
      action = 'GET_FILES'
      tools.push('getCustomerFiles')
      tools.push('getAllCustomers')
    }
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

  // === CONFIRM PENDING ACTION === (STRICT — v8.2)
  // Only treat as confirmation if message is SHORT and matches confirmation keywords.
  // Long messages with "ya" + action verbs (e.g., "ya hapus aja") are treated as fresh requests, NOT confirmations.
  // This prevents the LLM from confirming the wrong pending action when user actually meant something else.
  //
  // CRITICAL: pendingAction state is now DB-backed. detectIntent can't check it directly
  // (it's synchronous). Instead, we mark the action as 'CONFIRM_DELETE' / 'CONFIRM_CREATE'
  // and executeTools() will check DB for active pending action.
  //
  // We also detect CANCEL_PENDING here: "batal", "cancel", "tidak", "jangan"
  const confirmKeywords = ['ya', 'iya', 'iyaa', 'yes', 'konfirmasi', 'lanjut', 'eksekusi', 'gas', 'oke', 'ok', 'setuju', 'yakin', 'benar', 'lakukan', 'do it', 'sure', 'go']
  const cancelKeywords = ['batal', 'cancel', 'tidak', 'jangan', 'ga jadi', 'gajadi', 'berhenti']

  const msgTrimmed = msg.trim()
  const isShortMsg = msgTrimmed.length <= 30 // short confirmation phrases only
  const isVeryShort = msgTrimmed.length <= 15 // strict — for confirm/cancel triggers
  // Use word boundary ONLY (no substring) to avoid false positives like "no" in "nomor"
  const isConfirmWord = confirmKeywords.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    return regex.test(msgTrimmed)
  })
  const isCancelWord = cancelKeywords.some(kw => {
    const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i')
    return regex.test(msgTrimmed)
  })

  if (isCancelWord && isVeryShort) {
    action = 'CANCEL_PENDING'
    tools.push('getAllCustomers')
  } else if (isShortMsg && isConfirmWord) {
    // Only treat as confirmation if message is short (≤30 chars) AND contains confirmation keyword
    // "ya hapus aja" is 13 chars — would match... let's be even stricter:
    // Must be ≤15 chars OR pure confirmation keyword
    const pureConfirm = ['ya', 'iya', 'iyaa', 'yes', 'konfirmasi', 'lanjut', 'eksekusi', 'gas', 'oke', 'ok', 'setuju', 'yakin', 'benar', 'lakukan']
    const isPureConfirm = pureConfirm.some(kw => msgTrimmed.toLowerCase() === kw || msgTrimmed.toLowerCase() === `${kw}.` || msgTrimmed.toLowerCase() === `${kw}!`)

    if (isPureConfirm || isVeryShort) {
      // Mark as CONFIRM_DELETE or CONFIRM_CREATE — executeTools will check DB
      // and route based on pendingAction.type
      action = 'CONFIRM_DELETE' // generic confirm; executeTools will route to correct type
      tools.push('getAllCustomers')
    }
    // If msg is 16-30 chars and contains confirm word but also other words,
    // DON'T trigger confirmation — let other intent detectors handle it.
  }

  // === CREATE CUSTOMER ===
  // Detect: "dapat konsumen baru", "tambah konsumen", "daftarin konsumen", "bikin konsumen baru"
  // Also: "namanya [X] di blok [Y]" or "namanya [X] blok [Y]"
  const hasCreateKeyword = msg.includes('tambah') || msg.includes('daftarin') || msg.includes('daftar') || msg.includes('bikin') || msg.includes('buat') || msg.includes('input') || msg.includes('masukin') || msg.includes('dapat konsumen') || msg.includes('konsumen baru')
  const hasCustomerWord = msg.includes('konsumen') || msg.includes('debitur') || msg.includes('nasabah')

  if (hasCreateKeyword && hasCustomerWord) {
    action = 'CREATE_CUSTOMER'

    // Extract name: "namanya [X]", "nama [X]", "konsumen [X]", "debitur [X]"
    // CRITICAL: Use \s+ (require whitespace) before keyword in lookahead, NOT \s*
    // Otherwise "Budi" matches "di" inside the word — captures just "Bu" instead of "Budi Santoso"
    const namePatterns = [
      msg.match(/namanya\s+([A-Za-z][A-Za-z\s]+?)(?=\s+(?:di|blok|bank|btn|mandiri|bsb|hp|wa|no|dengan|yang|,|$))/i),
      msg.match(/nama\s+([A-Za-z][A-Za-z\s]+?)(?=\s+(?:di|blok|bank|btn|mandiri|bsb|hp|wa|no|dengan|yang|,|$))/i),
      msg.match(/(?:konsumen|debitur|nasabah)\s+(?:baru\s+)?(?:namanya\s+)?([A-Za-z][A-Za-z\s]+?)(?=\s+(?:di|blok|bank|btn|mandiri|bsb|hp|wa|no|dengan|yang|,|$))/i),
    ]
    for (const m of namePatterns) {
      if (m && m[1]) {
        const stop = ['baru', 'dong', 'ya', 'tolong', 'dengan', 'dari', 'ke', 'yang', 'ini', 'itu', 'namanya', 'nama', 'konsumen', 'debitur', 'nasabah', 'di']
        const words = m[1].trim().split(/\s+/).filter((w: string) => !stop.includes(w.toLowerCase()))
        if (words.length > 0) {
          newCustomerName = words.join(' ')
          break
        }
      }
    }

    // Extract block: "di blok E7", "blok E7", "di E7", "unit E7"
    const blockPatterns = [
      msg.match(/di\s+blok\s+([A-Za-z]\d+)/i),
      msg.match(/blok\s+([A-Za-z]\d+)/i),
      msg.match(/di\s+([A-Za-z]\d+)/i),
      msg.match(/unit\s+([A-Za-z]\d+)/i),
    ]
    for (const m of blockPatterns) {
      if (m && m[1]) {
        newCustomerBlock = m[1].toUpperCase()
        break
      }
    }

    // Extract phone
    const phoneMatch = msg.match(/(?:hp|wa|whatsapp|telepon|telp|no)\s*[:.]?\s*(\d{8,15})/) || msg.match(/(\d{10,15})/)
    if (phoneMatch) newCustomerPhone = phoneMatch[1]

    // Extract bank
    if (msg.includes('btn')) newCustomerBank = 'BTN'
    else if (msg.includes('mandiri')) newCustomerBank = 'MANDIRI'
    else if (msg.includes('bsb') || msg.includes('syariah') || msg.includes('sumsel') || msg.includes('babel')) newCustomerBank = 'BSB_SYARIAH'

    tools.push('getAllCustomers')
  }

  // === LOGO GENERATION ===
  // "generate logo [nama perusahaan]" → AI generate logo from prompt
  // "recreate logo [nama perusahaan]" → recreate from uploaded image
  if ((msg.includes('logo') || msg.includes('generate logo') || msg.includes('buat logo') || msg.includes('bikin logo') || msg.includes('recreate logo')) && !msg.includes('logout')) {
    action = 'GENERATE_LOGO' as any
    const logoMatch = message.match(/(?:generate|buat|bikin|recreate)\s+logo\s+(?:untuk\s+|perusahaan\s+|usaha\s+)?(.+)/i)
    if (logoMatch) intent_logoPrompt = logoMatch[1].trim()
    tools.push('getAllCustomers')
  }

  // === DINA v2: SURAT GENERATION ===
  // "bikinin surat ..." / "buat surat ..." / "generate surat ..." → ask for suratType + instansi
  if (
    (msg.includes('surat') && (
      msg.includes('bikin') || msg.includes('buat') || msg.includes('generate') ||
      msg.includes('tolong') || msg.includes('bikinin') || msg.includes('buatkan') ||
      msg.includes('bantu')
    )) ||
    msg.includes('bikinin surat') || msg.includes('buat surat') || msg.includes('generate surat')
  ) {
    action = 'GENERATE_SURAT' as any
    tools.push('getAllCustomers')
  }

  // === BANK CONFIG MANAGEMENT ===
  // DINA can manage bank configs via chat:
  // "list bank" → list all banks
  // "tambah bank BCA" → create new bank
  // "hapus bank BCA" → delete bank
  if (msg.includes('bank') && (msg.includes('list') || msg.includes('daftar') || msg.includes('berapa'))) {
    if (!msg.includes('konsumen') && !msg.includes('debitur') && !msg.includes('nasabah') && !msg.includes('rekening') && !msg.includes('pindah') && !msg.includes('ubah') && !msg.includes('ganti')) {
      action = 'LIST_BANKS' as any
      tools.push('getAllCustomers')
    }
  }
  if ((msg.includes('tambah') || msg.includes('daftarin') || msg.includes('bikin') || msg.includes('buat') || msg.includes('input')) && msg.includes('bank') && !msg.includes('konsumen')) {
    action = 'ADD_BANK' as any
    // Extract bank code/name
    const bankMatch = message.match(/bank\s+([A-Za-z][A-Za-z\s]+?)(?:\s+(?:baru|dengan|yang|,|$))/i)
    if (bankMatch) intent_newBankName = bankMatch[1].trim()
    tools.push('getAllCustomers')
  }
  // NOTE: DELETE_BANK intent is DISABLED PERMANENTLY.
  // No one can delete banks from the system — not even owner.
  // Banks are permanent records. This is a hard rule.

  // === DELETE CUSTOMER ===
  // Detect: "hapus konsumen", "hapus jenni", "apus debitur", "delete konsumen", "hilangin konsumen"
  if ((msg.includes('hapus') || msg.includes('apus') || msg.includes('delete') || msg.includes('hilangin') || msg.includes('buang') || msg.includes('remove')) && (msg.includes('konsumen') || msg.includes('debitur') || msg.includes('nasabah'))) {
    action = 'DELETE_CUSTOMER'
    tools.push('getAllCustomers')
  }

  // Always include memories
  tools.push('getRelevantMemories')

  // OPTIMIZATION: Lazy getAllCustomers — only fetch when needed
  // Previously: always pushed → 50 customer records loaded on EVERY chat (even "halo")
  // Now: only fetch when intent truly needs customer list context
  // 
  // Cases that NEED getAllCustomers:
  // - READ queries about customers (list, stats, distributions)
  // - CRUD operations (need list for disambiguation)
  // - SEND_FILE (need customer lookup)
  // - GENERATE_SURAT/LOGO (need customer context)
  //
  // Cases that DON'T need it:
  // - CONFIRM_DELETE / CANCEL_PENDING (pending action has target ID already)
  // - LIST_BANKS / ADD_BANK (bank config, no customer data)
  // - Pure small talk / greetings
  const NEEDS_CUSTOMER_LIST = [
    'READ', 'UPDATE_BANK', 'UPDATE_STAGE', 'UPDATE_FIELD', 'FILL_FORM',
    'GET_DOCS', 'GET_WORKPLACE', 'GET_FILES', 'SEND_FILE',
    'CREATE_CUSTOMER', 'DELETE_CUSTOMER',
    'GENERATE_LOGO', 'GENERATE_SURAT',
  ]
  if (NEEDS_CUSTOMER_LIST.includes(action) && !tools.includes('getAllCustomers')) {
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
  // Pattern 5: "(minta|kirim|lihat|cek) berkas/dokumen/file [Name]" — consumes both verbs
  const nameMatch5a = message.match(/(?:minta|kirim|lihat|cek|tolong)\s+(?:berkas|dokumen|file)\s+(?:konsumen\s+|debitur\s+|nasabah\s+)?(?:dari\s+|si\s+)?([A-Za-z][A-Za-z\s]+?)(?=\s+(?:yang|di|blok|bank|btn|mandiri|bsb|hp|wa|no|dengan|,|$|\?))/i)
  // Pattern 5b: "berkas/dokumen/file [Name]" — for "berkas Jenni"
  const nameMatch5b = message.match(/(?:berkas|dokumen|file)\s+(?:konsumen\s+|debitur\s+|nasabah\s+)?(?:dari\s+|si\s+)?([A-Za-z][A-Za-z\s]+?)(?=\s+(?:yang|di|blok|bank|btn|mandiri|bsb|hp|wa|no|dengan|,|$|\?))/i)
  // Pattern 6: For "Dina minta berkas Jenni" — name at END of message after "berkas"
  const nameMatch6 = message.match(/(?:berkas|dokumen|file)\s+([A-Za-z]+)$/i)

  if (nameMatch4) customerName = nameMatch4[1]
  else if (nameMatch1) customerName = nameMatch1[1]
  else if (nameMatch2) customerName = nameMatch2[1]
  else if (nameMatch5a) customerName = nameMatch5a[1]
  else if (nameMatch5b) customerName = nameMatch5b[1]
  else if (nameMatch6) customerName = nameMatch6[1]
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

  return { tools: [...new Set(tools)], customerName, blockNumber, action, newBankValue, newStageValue, updateField: intent_updateField, updateValue: intent_updateValue, newCustomerName, newCustomerPhone, newCustomerBlock, newCustomerBank, requestedFileIndex: intent_requestedFileIndex, requestedFileDocType: intent_requestedFileDocType, newBankName: intent_newBankName, bankName: intent_bankName, logoPrompt: intent_logoPrompt }
}

// ============================================================
// TOOL: Get ALL Customers (full context for DINA)
// ============================================================

async function getAllCustomers(): Promise<ToolResult> {
  // OPTIMIZATION: Use in-memory cache (60s TTL) to reduce DB queries
  // Within 60s, multiple DINA chats will reuse cached data → 0 DB queries after first hit
  return await withCache(CACHE_KEYS.allCustomers, 60, async () => {
    // OPTIMIZATION: Only select fields DINA actually uses for reasoning
    // Previously: include units + bankPipelines (N+1 risk + heavy data)
    // Now: select only essential fields → 70% less data transferred from DB
    const customers = await db.customer.findMany({
      select: {
        id: true,
        name: true,
        blockLetter: true,
        houseNumber: true,
        bankName: true,
        stage: true,
        whatsappNumber: true,
        phone: true,
        nik: true,
        occupation: true,
        companyName: true,
        monthlyIncome: true,
        maritalStatus: true,
        berkasLengkap: true,
        closingDate: true,
        sp3kDate: true,
        akadDate: true,
        workplaceMapsLink: true,
        workplaceMapsShortLink: true,
        workplaceJamOperasional: true,
        atasanName: true,
        atasanNip: true,
        companyAddress: true,
        uploadedDocs: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    const customerList = customers.map(c => {
      const block = (c.blockLetter || '') + (c.houseNumber || '') || '-'
      const bank = c.bankName || 'Belum dipilih'
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
  })
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
// HELPER: Find customer by name with duplicate detection
// Returns:
//   - { customer, duplicates: [] } if exactly 1 match
//   - { customer: first, duplicates: [...] } if 2+ matches (caller must disambiguate)
//   - null if no match
//
// CRITICAL: 2+ customers can have SAME exact name + birthdate (rare but legal).
// When this happens, DINA must NOT silently pick the first one — that causes
// wrong-customer operations (e.g., delete wrong person, send wrong berkas).
// Instead: list all matches + ask user to disambiguate by blok or NIK.
// ============================================================

export interface CustomerLookupResult {
  customer: any  // first match (for backwards-compat in non-critical paths)
  duplicates: any[]  // empty if only 1 match, otherwise ALL matches (including customer)
  needsDisambiguation: boolean
}

export async function findCustomerWithDisambiguation(
  name: string,
  options?: { nik?: string; blockNumber?: string }
): Promise<CustomerLookupResult | null> {
  // If NIK provided, use that (NIK is unique per person by Indonesian law)
  if (options?.nik) {
    const byNik = await db.customer.findFirst({
      where: { nik: options.nik },
      include: { units: true },
    })
    if (byNik) {
      return { customer: byNik, duplicates: [], needsDisambiguation: false }
    }
    // NIK not found — fall through to name search
  }

  // If blockNumber provided, use that (each unit is unique)
  if (options?.blockNumber) {
    const byBlock = await db.customer.findFirst({
      where: {
        OR: [
          { blockLetter: { startsWith: options.blockNumber[0], mode: 'insensitive' }, houseNumber: { contains: options.blockNumber.substring(1), mode: 'insensitive' } },
          { units: { some: { blockNumber: { equals: options.blockNumber, mode: 'insensitive' } } } }
        ]
      },
      include: { units: true },
    })
    if (byBlock) {
      return { customer: byBlock, duplicates: [], needsDisambiguation: false }
    }
  }

  // Try exact name match first (case-insensitive)
  let matches = await db.customer.findMany({
    where: { name: { equals: name, mode: 'insensitive' } },
    include: { units: true },
  })

  // If no exact match, fall back to contains
  if (matches.length === 0) {
    matches = await db.customer.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
      include: { units: true },
    })
  }

  if (matches.length === 0) return null
  if (matches.length === 1) return { customer: matches[0], duplicates: [], needsDisambiguation: false }

  // Multiple matches — need disambiguation
  return {
    customer: matches[0],  // first match (caller can choose to use or not)
    duplicates: matches,
    needsDisambiguation: true,
  }
}

// Build disambiguation message for user
export function buildDisambiguationMessage(duplicates: any[]): string {
  const list = duplicates.map((c: any, i: number) => {
    const block = (c.blockLetter || '') + (c.houseNumber || '') || '-'
    const bank = c.bankName || 'belum dipilih'
    const stage = c.stage || '-'
    const nikSuffix = c.nik ? ` (NIK: ...${c.nik.substring(c.nik.length - 4)})` : ''
    const phone = c.whatsappNumber ? ` | WA: ${c.whatsappNumber}` : ''
    return `${i + 1}. **${c.name}** — Blok ${block} | Bank ${bank} | Stage ${stage}${nikSuffix}${phone}`
  }).join('\n')

  return `⚠️ **Ditemukan ${duplicates.length} konsumen dengan nama yang cocok.**

${list}

Sebutkan **blok** atau **NIK** untuk memastikan konsumen yang mana. Contoh:
• "yang blok E5"
• "yang NIK 1234567890"
• "yang bank BTN"`
}

// ============================================================
// TOOL: Get Customer Files (from GoogleDoc table — list berkas yang tersimpan di Drive)
// ============================================================

async function getCustomerFiles(customerId?: string, customerName?: string): Promise<ToolResult> {
  try {
    let docs: any[] = []

    if (customerId) {
      docs = await db.googleDoc.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      })
    } else if (customerName) {
      // Find customer first by name (case-insensitive contains)
      const customer = await db.customer.findFirst({
        where: { name: { contains: customerName, mode: 'insensitive' } },
      })
      if (customer) {
        docs = await db.googleDoc.findMany({
          where: { customerId: customer.id },
          orderBy: { createdAt: 'desc' },
        })
      } else {
        return {
          toolName: 'getCustomerFiles',
          success: false,
          data: null,
          summary: `❌ Konsumen "${customerName}" tidak ditemukan di database.`,
        }
      }
    } else {
      return {
        toolName: 'getCustomerFiles',
        success: false,
        data: null,
        summary: `❌ Tidak ada customer yang ditentukan. Sebutkan nama konsumen.`,
      }
    }

    if (docs.length === 0) {
      return {
        toolName: 'getCustomerFiles',
        success: true,
        data: { docs: [], count: 0 },
        summary: `ℹ️ Belum ada berkas yang tersimpan di Google Drive untuk konsumen ini.`,
      }
    }

    // Build readable file list
    const fileList = docs.map((d, i) => {
      const docTypeLabel: Record<string, string> = {
        'sk-slip-gaji': 'SK Kerja + Slip Gaji',
        'lokasi-kerja': 'Lokasi Kerja',
        'spr': 'SPR',
        'flpp': 'FLPP',
        'ajb': 'AJB',
        'bphtb': 'BPHTB',
        'notaris': 'Notaris',
        'ktp': 'KTP',
        'kk': 'KK',
        'npwp': 'NPWP',
        'sertifikat': 'Sertifikat',
        'lainnya': 'Lainnya',
      }
      const label = docTypeLabel[d.docType] || d.docType
      return `${i + 1}. **${label}** — ${d.fileName} (docId: ${d.docId.substring(0, 12)}...)`
    }).join('\n')

    return {
      toolName: 'getCustomerFiles',
      success: true,
      data: { docs, count: docs.length },
      summary: `📁 Ditemukan ${docs.length} berkas di Google Drive:\n${fileList}\n\nUser dapat memilih berkas dengan menyebut nomor atau nama jenis dokumen. Saya akan kirim file-nya.`,
    }
  } catch (err: any) {
    return {
      toolName: 'getCustomerFiles',
      success: false,
      data: null,
      summary: `❌ GAGAL mengambil daftar berkas: ${err?.message || 'unknown error'}`,
    }
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
// TOOL: CREATE Customer (WRITE ACTION)
// ============================================================

async function createCustomer(data: { name: string; phone?: string; block?: string; bank?: string }): Promise<ToolResult> {
  try {
    // Find the project (Anjayo 16)
    const project = await db.project.findFirst()
    if (!project) {
      return { toolName: 'createCustomer', success: false, data: null, summary: '❌ Project tidak ditemukan di database.' }
    }

    // Parse block letter + house number
    let blockLetter = '', houseNumber = ''
    if (data.block) {
      const match = data.block.match(/^([A-Za-z]+)(\d+.*)$/)
      if (match) { blockLetter = match[1]; houseNumber = match[2] }
      else { blockLetter = data.block }
    }

    // Check if customer with same name+block already exists (prevent duplicates)
    if (data.block) {
      const existing = await db.customer.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          blockLetter: blockLetter,
          houseNumber: houseNumber,
        }
      })
      if (existing) {
        return {
          toolName: 'createCustomer',
          success: false,
          data: existing,
          summary: `ℹ️ Konsumen "${data.name}" (Blok ${data.block}) sudah ada di database (ID: ${existing.id}, stage: ${existing.stage}). Tidak perlu dibuat ulang.`,
        }
      }
    }

    const customer = await db.customer.create({
      data: {
        name: data.name,
        whatsappNumber: data.phone || null,
        phone: data.phone || null,
        bankName: data.bank || null,
        blockLetter: blockLetter || null,
        houseNumber: houseNumber || null,
        stage: 'DM',
        projectId: project.id,
        closingDate: new Date(),
      } as any,
    })

    // Try to link to existing Unit by blockNumber — DON'T create new Unit
    // (Unit creation requires landSize/buildingSize/price/dpAmount which we don't have here.
    //  Those values come from site plan data, not from chat input.)
    let unitLinked = false
    if (data.block) {
      const existingUnit = await db.unit.findFirst({
        where: { blockNumber: { equals: data.block, mode: 'insensitive' }, projectId: project.id }
      })
      if (existingUnit) {
        // Link unit to this customer + mark as BOOKED
        await db.unit.update({
          where: { id: existingUnit.id },
          data: { customerId: customer.id, status: 'BOOKED', bookedAt: new Date() },
        })
        unitLinked = true
      }
      // If no existing unit found, that's OK — owner can assign manually later via dashboard
    }

    // Invalidate cache — customer list changed
    invalidateCachePrefix('dina:')

    return {
      toolName: 'createCustomer',
      success: true,
      data: customer,
      summary: `✅ Berhasil menambahkan konsumen baru: ${customer.name}${data.block ? ` (Blok ${data.block})` : ''}${data.bank ? ` Bank: ${data.bank}` : ''}${data.phone ? ` Telp: ${data.phone}` : ''}. Stage awal: DM. Data tersimpan di database.${unitLinked ? ' Unit berhasil di-link.' : (data.block ? ' Unit belum di-link (blok tidak ditemukan di site plan, owner bisa assign manual).' : '')}`,
    }
  } catch (err: any) {
    return { toolName: 'createCustomer', success: false, data: null, summary: `❌ GAGAL menambahkan konsumen: ${err?.message || 'unknown error'}` }
  }
}

// ============================================================
// TOOL: DELETE Customer (WRITE ACTION — permanent!)
// ============================================================

async function deleteCustomer(customerId: string, customerName: string): Promise<ToolResult> {
  try {
    // Get customer info before delete (for confirmation message + audit log)
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: { units: true, googleDocs: true },
    })

    if (!customer) {
      return { toolName: 'deleteCustomer', success: false, data: null, summary: `❌ Konsumen tidak ditemukan.` }
    }

    const block = (customer.blockLetter || '') + (customer.houseNumber || '') || '-'
    const bank = customer.bankName || 'belum dipilih'
    const googleDocCount = customer.googleDocs?.length || 0

    // === PRESERVE GOOGLE DRIVE FILES ===
    // Per owner requirement: hapus dari DB saja, JANGAN hapus file dari Google Drive.
    // - Schema has `onDelete: SetNull` on GoogleDoc.customerId
    //   → when customer is deleted, GoogleDoc records have customerId set to null automatically
    //   → Drive files remain accessible (we never call Drive API to delete)
    // - Units: unlink (set customerId=null) instead of delete, so site plan history is preserved
    //
    // DINA v2 FIX (C1): Wrap all writes in $transaction for atomicity.
    // If any step fails, the entire operation rolls back — no more broken state.

    await db.$transaction([
      // Unlink units (don't delete them — they belong to the project/site plan)
      db.unit.updateMany({
        where: { customerId },
        data: { customerId: null, status: 'AVAILABLE', bookedAt: null, soldAt: null },
      }),
      // Delete conversation history (chat logs are not Drive files — safe to delete)
      db.conversation.deleteMany({ where: { customerId } }),
      // Delete stage history (internal tracking, not user-facing)
      db.customerStageHistory.deleteMany({ where: { customerId } }),
      // Delete bank pipelines (internal tracking)
      db.bankPipeline.deleteMany({ where: { customerId: customerId as any } }),
      // Delete history logs (DINA v2 — cascade from customer, but explicit for clarity)
      db.customerHistoryLog.deleteMany({ where: { customerId } }),
      // Delete survey schedules (cascade from customer)
      db.surveySchedule.deleteMany({ where: { customerId } }),
      // === Finally delete the customer (GoogleDoc.customerId auto-SetNull, Document auto-cascade) ===
      db.customer.delete({ where: { id: customerId } }),
    ])

    // Invalidate cache — customer list changed
    invalidateCachePrefix('dina:')

    return {
      toolName: 'deleteCustomer',
      success: true,
      data: {
        deletedCustomer: customer.name,
        block,
        bank,
        googleDocsPreserved: googleDocCount,
      },
      summary: `✅ Berhasil MENGHAPUS konsumen: ${customer.name} (Blok ${block}, Bank: ${bank}) dari database.

📦 **Google Drive files DIPERTAHANKAN** (${googleDocCount} file metadata tetap tersimpan di DB dengan customerId=NULL). File di Drive tidak dihapus dan masih bisa diakses jika konsumen ini didaftarkan ulang di kemudian hari.

🏠 Unit site plan di-unlink (status kembali AVAILABLE), tidak dihapus dari site plan.`,
    }
  } catch (err: any) {
    return { toolName: 'deleteCustomer', success: false, data: null, summary: `❌ GAGAL menghapus: ${err?.message || 'unknown error'}` }
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
    // Invalidate cache — customer data changed
    invalidateCachePrefix('dina:')
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

// ExecuteContext: passes channel/sender info so DB-backed pending actions are scoped correctly
export interface ExecuteContext {
  conversationId?: string
  channel?: string  // DASHBOARD | WHATSAPP_PRIVATE | WHATSAPP_GROUP
  senderNumber?: string
}

export async function executeTools(
  intent: IntentResult,
  customerId?: string,
  userMessage?: string,
  executeContext: ExecuteContext = {},
): Promise<{ results: string; directResponse: string | null }> {
  const results: string[] = []
  let directResponse: string | null = null  // If set, chat route returns this directly without calling LLM

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
        case 'getCustomerFiles':
          result = await getCustomerFiles(customerId, intent.customerName)
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

  // Handle GET_FILES — list available files for customer (DINA shows list, user picks next)
  if (intent.action === 'GET_FILES') {
    let targetCustomer: any = null
    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }
    if (!targetCustomer && intent.customerName) {
      // Disambiguation-aware lookup
      const lookup = await findCustomerWithDisambiguation(intent.customerName, {
        blockNumber: intent.blockNumber,
      })
      if (lookup) {
        if (lookup.needsDisambiguation) {
          directResponse = buildDisambiguationMessage(lookup.duplicates)
          results.push(`[getCustomerFiles] ⚠️ Duplicates: ${lookup.duplicates.length} customers. Asking user to disambiguate.`)
        } else {
          targetCustomer = lookup.customer
        }
      }
    }

    if (!targetCustomer && !directResponse) {
      results.push(`[getCustomerFiles] ❌ Konsumen tidak ditemukan. Minta user sebutkan nama konsumen dengan jelas.`)
      directResponse = `❌ Konsumen tidak ditemukan. Silakan sebutkan nama lengkap konsumen dengan jelas. 🙏`
    } else if (targetCustomer && !directResponse) {
      const fileResult = await getCustomerFiles(targetCustomer.id, undefined)
      if (fileResult.success && fileResult.data?.docs?.length > 0) {
        // Build directResponse with the file list — bypass LLM for accuracy
        const docs = fileResult.data.docs
        const docTypeLabel: Record<string, string> = {
          'sk-slip-gaji': 'SK Kerja + Slip Gaji',
          'lokasi-kerja': 'Lokasi Kerja',
          'spr': 'SPR',
          'flpp': 'FLPP',
          'ajb': 'AJB',
          'bphtb': 'BPHTB',
          'notaris': 'Notaris',
          'ktp': 'KTP',
          'kk': 'KK',
          'npwp': 'NPWP',
          'sertifikat': 'Sertifikat',
        }
        const fileList = docs.map((d: any, i: number) => {
          const label = docTypeLabel[d.docType] || d.docType
          return `${i + 1}. **${label}** — ${d.fileName}`
        }).join('\n')

        directResponse = `📁 **Berkas ${targetCustomer.name}** (Blok ${(targetCustomer.blockLetter || '') + (targetCustomer.houseNumber || '') || '-'}) di Google Drive:

${fileList}

Pilih berkas yang mau dikirim dengan menyebut **nomor** (contoh: "yang nomor 2") atau **jenis dokumen** (contoh: "kirim slip gaji"). Bisa lebih dari 1 (contoh: "1 dan 3"). 🙏`
        results.push(`[getCustomerFiles] ${fileResult.summary}`)
      } else {
        directResponse = fileResult.summary
        results.push(`[getCustomerFiles] ${fileResult.summary}`)
      }
    }
  }

  // Handle SEND_FILE — user picked specific file, fetch from Drive + return as dataUrl
  // NOTE: The actual file fetching happens in chat route (because it needs Google API client).
  // Here we just identify which GoogleDoc record matches and push its docId to results.
  if (intent.action === 'SEND_FILE') {
    let targetCustomer: any = null
    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }
    if (!targetCustomer && intent.customerName) {
      // Disambiguation-aware lookup
      const lookup = await findCustomerWithDisambiguation(intent.customerName, {
        blockNumber: intent.blockNumber,
      })
      if (lookup) {
        if (lookup.needsDisambiguation) {
          directResponse = buildDisambiguationMessage(lookup.duplicates)
          results.push(`[sendFile] ⚠️ Duplicates: ${lookup.duplicates.length} customers. Asking user to disambiguate.`)
        } else {
          targetCustomer = lookup.customer
        }
      }
    }

    if (!targetCustomer && !directResponse) {
      results.push(`[sendFile] ❌ Konsumen tidak ditemukan. JANGAN bilang berhasil.`)
      directResponse = `❌ Konsumen tidak ditemukan. Silakan sebutkan nama lengkap konsumen dengan jelas. 🙏`
    } else if (targetCustomer && !directResponse) {
      const docs = await db.googleDoc.findMany({
        where: { customerId: targetCustomer.id },
        orderBy: { createdAt: 'desc' },
      })

      if (docs.length === 0) {
        results.push(`[sendFile] ℹ️ Belum ada berkas untuk konsumen ini.`)
        directResponse = `ℹ️ Belum ada berkas yang tersimpan di Google Drive untuk ${targetCustomer.name}. Silakan upload berkas terlebih dahulu melalui dashboard. 🙏`
      } else {
        // Determine which file(s) to send
        let selectedDocs: any[] = []

        if (intent.requestedFileDocType) {
          // Match by doc type
          selectedDocs = docs.filter(d => d.docType === intent.requestedFileDocType)
          if (selectedDocs.length === 0) {
            // No exact match — try partial match
            selectedDocs = docs.filter(d => d.docType.includes(intent.requestedFileDocType!) || intent.requestedFileDocType!.includes(d.docType))
          }
        }

        if (intent.requestedFileIndex && intent.requestedFileIndex >= 1 && intent.requestedFileIndex <= docs.length) {
          // Match by index (1-based)
          const docByIndex = docs[intent.requestedFileIndex - 1]
          if (!selectedDocs.find(d => d.id === docByIndex.id)) {
            selectedDocs.push(docByIndex)
          }
        }

        if (selectedDocs.length === 0) {
          // No match — show available files
          const docTypeLabel: Record<string, string> = {
            'sk-slip-gaji': 'SK Kerja + Slip Gaji',
            'lokasi-kerja': 'Lokasi Kerja',
            'spr': 'SPR', 'flpp': 'FLPP', 'ajb': 'AJB', 'bphtb': 'BPHTB',
            'notaris': 'Notaris', 'ktp': 'KTP', 'kk': 'KK', 'npwp': 'NPWP', 'sertifikat': 'Sertifikat',
          }
          const fileList = docs.map((d, i) => `${i + 1}. **${docTypeLabel[d.docType] || d.docType}** — ${d.fileName}`).join('\n')
          results.push(`[sendFile] ⚠️ Tidak ada berkas yang cocok dengan permintaan. Berkas yang tersedia: ${fileList}`)
          directResponse = `⚠️ Berkas yang Anda minta tidak ditemukan. 

📁 **Berkas ${targetCustomer.name} yang tersedia:**

${fileList}

Silakan sebutkan nomor atau jenis dokumen yang benar. 🙏`
        } else {
          // Files selected — push to results with structured data for chat route to pick up
          // Chat route will read these from results and fetch from Drive
          const fileSummary = selectedDocs.map(d => `${d.fileName} (docId: ${d.docId}, type: ${d.docType})`).join(', ')
          results.push(`[sendFile] ✅ Siap kirim ${selectedDocs.length} berkas: ${fileSummary}`)
          results.push(`[sendFile:FILES_TO_SEND] ${JSON.stringify(selectedDocs.map(d => ({ docId: d.docId, fileName: d.fileName, docType: d.docType, customerId: d.customerId })))}`)
          // directResponse will be set by chat route AFTER fetching files from Drive
          // (chat route needs to call Google Drive API to get actual file content)
        }
      }
    }
  }

  // Handle UPDATE_FIELD (generic field update)
  if (intent.action === 'UPDATE_FIELD' && intent.updateField) {
    let targetCustomer: any = null
    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }
    if (!targetCustomer && intent.customerName) {
      const lookup = await findCustomerWithDisambiguation(intent.customerName, { blockNumber: intent.blockNumber })
      if (lookup) {
        if (lookup.needsDisambiguation) {
          directResponse = buildDisambiguationMessage(lookup.duplicates)
          results.push(`[updateCustomerField] ⚠️ Duplicates: ${lookup.duplicates.length}. Asking user to disambiguate.`)
        } else {
          targetCustomer = lookup.customer
        }
      }
    }
    if (!targetCustomer && intent.blockNumber && !directResponse) {
      targetCustomer = await db.customer.findFirst({
        where: { OR: [
          { blockLetter: { startsWith: intent.blockNumber[0], mode: 'insensitive' } },
          { units: { some: { blockNumber: { contains: intent.blockNumber, mode: 'insensitive' } } } }
        ] }
      })
    }

    if (targetCustomer && intent.updateValue && !directResponse) {
      const result = await updateCustomerField(targetCustomer.id, intent.updateField, intent.updateValue)
      if (result.success) {
        await writeAuditLog('UPDATE_FIELD', 'Customer', targetCustomer.id, {
          customerName: targetCustomer.name,
          field: intent.updateField,
          value: intent.updateValue,
          updatedBy: executeContext.senderNumber || 'dashboard',
          userMessage: userMessage?.substring(0, 200),
        })
      }
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
        if (result.success) {
          await writeAuditLog('UPDATE_BANK', 'Customer', targetCustomer.id, {
            customerName: targetCustomer.name,
            newBank: intent.newBankValue,
            updatedBy: executeContext.senderNumber || 'dashboard',
          })
        }
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
        if (result.success) {
          await writeAuditLog('UPDATE_STAGE', 'Customer', targetCustomer.id, {
            customerName: targetCustomer.name,
            newStage: intent.newStageValue,
            updatedBy: executeContext.senderNumber || 'dashboard',
          })
        }
        results.push(`[updateCustomerStage] ${result.summary}`)
      } catch (err: any) {
        results.push(`[updateCustomerStage] ❌ GAGAL update: ${err?.message || 'unknown error'}. JANGAN bilang berhasil.`)
      }
    } else {
      results.push(`[updateCustomerStage] ❌ Konsumen tidak ditemukan (cari: name="${intent.customerName}", block="${intent.blockNumber}"). JANGAN bilang berhasil. Minta user sebutkan nama konsumen dengan jelas.`)
    }
  }

  // Handle CONFIRM_DELETE / CONFIRM_CREATE — user confirmed, fetch from DB
  // CRITICAL: Validate target name matches user's confirmation message to prevent wrong-customer deletes
  // CRITICAL: For all delete operations, set directResponse to bypass LLM (prevent hallucination)
  if (intent.action === 'CONFIRM_DELETE' || intent.action === 'CONFIRM_CREATE') {
    const pending = await getActivePendingAction(executeContext)
    if (!pending) {
      results.push(`[confirm] ⚠️ Tidak ada aksi pending yang menunggu konfirmasi. JANGAN bilang berhasil melakukan apapun. Minta user jelaskan apa yang ingin dilakukan.`)
      directResponse = `Tidak ada aksi yang menunggu konfirmasi. Silakan sebutkan apa yang ingin Anda lakukan. 🙏`
    } else if (pending.type === 'DELETE') {
      // Validate target still exists
      if (!pending.targetId) {
        results.push(`[deleteCustomer] ❌ Pending action tidak punya target ID. Aksi dibatalkan.`)
        directResponse = `❌ Aksi penghapusan dibatalkan karena tidak ada target yang valid. Silakan ulangi permintaan dengan menyebutkan nama konsumen.`
        await cancelPendingAction(executeContext)
      } else {
        const target = await db.customer.findUnique({ where: { id: pending.targetId } })
        if (!target) {
          results.push(`[deleteCustomer] ❌ Konsumen "${pending.targetName}" tidak ditemukan (mungkin sudah dihapus). Aksi dibatalkan.`)
          directResponse = `❌ Konsumen "${pending.targetName}" tidak ditemukan di database (mungkin sudah dihapus). Aksi dibatalkan.`
          await cancelPendingAction(executeContext)
        } else {
          // VALIDATION: if user's confirmation message contains a customer name that differs
          // from the pending target, ABORT (user is confused about what they're confirming)
          const msgLower = (userMessage || '').toLowerCase()
          const targetNameLower = (target.name || '').toLowerCase()
          // Check if msg mentions a DIFFERENT customer name
          const otherCustomers = await db.customer.findMany({
            where: { id: { not: target.id } },
            select: { name: true }
          })
          const mentionsOther = otherCustomers.find(c => {
            const cFirst = (c.name || '').toLowerCase().split(/\s+/)[0]
            return cFirst.length >= 3 && msgLower.includes(cFirst) && !targetNameLower.includes(cFirst)
          })
          if (mentionsOther) {
            results.push(`[deleteCustomer] ❌ ABORT: Pesan konfirmasi menyebutkan nama konsumen LAIN ("${mentionsOther.name}"), bukan "${target.name}" yang sebelumnya diminta untuk dihapus. Aksi dibatalkan demi keamanan.`)
            directResponse = `⚠️ **Konfirmasi DIBATALKAN otomatis.**

Alasan: Pesan Anda menyebutkan nama konsumen lain ("${mentionsOther.name}"), tetapi aksi pending yang menunggu konfirmasi adalah penghapusan "${target.name}".

Demi keamanan, aksi penghapusan dibatalkan. **Tidak ada konsumen yang dihapus.** ✅

Jika Anda ingin menghapus konsumen lain, silakan buat permintaan baru dengan menyebutkan nama lengkapnya. 🙏`
            await cancelPendingAction(executeContext)
          } else {
            // All checks passed — execute delete
            await confirmPendingAction(pending.id)
            const result = await deleteCustomer(target.id, target.name)
            await writeAuditLog('DELETE_CUSTOMER', 'Customer', target.id, {
              customerName: target.name,
              blockLetter: target.blockLetter,
              houseNumber: target.houseNumber,
              bankName: target.bankName,
              confirmedBy: executeContext.senderNumber || 'dashboard',
              userMessage: userMessage?.substring(0, 200),
            })
            results.push(`[deleteCustomer] ${result.summary}`)
            directResponse = result.summary  // Use the actual tool result (no LLM)
          }
        }
      }
    } else if (pending.type === 'CREATE') {
      const data = pending.customerData
      if (data?.name) {
        await confirmPendingAction(pending.id)
        const result = await createCustomer(data)
        await writeAuditLog('CREATE_CUSTOMER', 'Customer', result.data?.id || 'unknown', {
          customerData: data,
          confirmedBy: executeContext.senderNumber || 'dashboard',
        })
        results.push(`[createCustomer] ${result.summary}`)
        directResponse = result.summary
      } else {
        results.push(`[createCustomer] ❌ Data konsumen tidak lengkap di pending action.`)
        directResponse = `❌ Data konsumen tidak lengkap. Aksi dibatalkan.`
        await cancelPendingAction(executeContext)
      }
    } else {
      results.push(`[confirm] ⚠️ Tipe pending action tidak dikenal: ${pending.type}`)
      directResponse = `⚠️ Tipe aksi pending tidak dikenal. Aksi dibatalkan.`
      await cancelPendingAction(executeContext)
    }
  }

  // Handle CANCEL_PENDING — user said "batal" / "tidak" / "jangan"
  if (intent.action === 'CANCEL_PENDING') {
    const pending = await getActivePendingAction(executeContext)
    if (pending) {
      await cancelPendingAction(executeContext)
      results.push(`[cancel] ✅ Aksi pending (${pending.type} ${pending.targetName || ''}) telah dibatalkan.`)
      directResponse = `✅ Aksi pending (${pending.type}${pending.targetName ? ' ' + pending.targetName : ''}) telah dibatalkan. Tidak ada perubahan yang dilakukan di database.`
    } else {
      results.push(`[cancel] ℹ️ Tidak ada aksi pending yang perlu dibatalkan.`)
      directResponse = `ℹ️ Tidak ada aksi pending yang perlu dibatalkan.`
    }
  }

  // Handle CREATE_CUSTOMER
  if (intent.action === 'CREATE_CUSTOMER' && intent.newCustomerName) {
    const customerData = {
      name: intent.newCustomerName,
      phone: intent.newCustomerPhone,
      block: intent.newCustomerBlock,
      bank: intent.newCustomerBank,
    }
    // For CREATE, execute directly (don't ask for confirmation — user already gave the command)
    try {
      const result = await createCustomer(customerData)
      if (result.success && result.data?.id) {
        await writeAuditLog('CREATE_CUSTOMER', 'Customer', result.data.id, {
          customerData,
          triggeredBy: executeContext.senderNumber || 'dashboard',
        })
      }
      results.push(`[createCustomer] ${result.summary}`)
      // Bypass LLM for CREATE — use the actual tool result (prevent hallucination)
      directResponse = result.summary
    } catch (err: any) {
      const errMsg = `❌ GAGAL: ${err?.message || 'unknown error'}`
      results.push(`[createCustomer] ${errMsg}`)
      directResponse = errMsg
    }
  } else if (intent.action === 'CREATE_CUSTOMER' && !intent.newCustomerName) {
    results.push(`[createCustomer] ⚠️ User ingin tambah konsumen tapi nama tidak terdeteksi. Minta user sebutkan nama konsumen.`)
    directResponse = `Halo! Saya butuh nama konsumen untuk menambahkannya ke database. 🙏

Format yang saya pahami:
• "dapat konsumen baru namanya **[Nama]** di blok **[Blok]**"
• "tambah konsumen **[Nama]** blok **[Blok]** bank **[BTN/Mandiri/BSB]**"
• "daftarin konsumen **[Nama]** di blok **[Blok]**"

Contoh: "dapat konsumen baru namanya Budi Santoso di blok F7 bank btn"`

  }

  // Handle DELETE_CUSTOMER — set DB-backed pending action for confirmation
  if (intent.action === 'DELETE_CUSTOMER') {
    let targetCustomer: any = null
    let duplicates: any[] = []

    if (customerId) {
      targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
    }

    if (!targetCustomer && intent.customerName) {
      // Use disambiguation-aware lookup
      const lookup = await findCustomerWithDisambiguation(intent.customerName, {
        blockNumber: intent.blockNumber,
      })
      if (lookup) {
        if (lookup.needsDisambiguation) {
          // Multiple matches — ask user to disambiguate, DO NOT proceed
          directResponse = buildDisambiguationMessage(lookup.duplicates)
          results.push(`[deleteCustomer] ⚠️ Duplicates found: ${lookup.duplicates.length} customers match. Asking user to disambiguate.`)
          // Skip the rest of DELETE_CUSTOMER handling
          // (jump to return at end of executeTools)
        } else {
          targetCustomer = lookup.customer
        }
      }
    }

    if (!targetCustomer && intent.blockNumber && !directResponse) {
      targetCustomer = await db.customer.findFirst({
        where: { OR: [
          { blockLetter: { startsWith: intent.blockNumber[0], mode: 'insensitive' } },
          { units: { some: { blockNumber: { contains: intent.blockNumber, mode: 'insensitive' } } } }
        ] }
      })
    }

    if (targetCustomer && !directResponse) {
      // Set DB-backed pending action
      // Don't set conversationId — scope by channel (+ senderNumber for WA)
      // This prevents scoping issues when conversationId differs between requests
      await setPendingAction({
        conversationId: null,
        channel: executeContext.channel || 'DASHBOARD',
        senderNumber: executeContext.senderNumber || null,
        type: 'DELETE',
        targetType: 'CUSTOMER',
        targetId: targetCustomer.id,
        targetName: targetCustomer.name,
        customerData: null,
      })
      const block = (targetCustomer.blockLetter || '') + (targetCustomer.houseNumber || '') || '-'
      const bank = targetCustomer.bankName || 'belum dipilih'
      results.push(`[deleteCustomer] ⏳ PENDING (DB-backed): Konsumen "${targetCustomer.name}" (Blok ${block}, ID: ${targetCustomer.id}) akan dihapus PERMANEN.`)
      // Direct response — bypass LLM to prevent hallucination
      directResponse = `⚠️ **Konfirmasi Penghapusan**

Yakin ingin menghapus konsumen berikut SECARA PERMANEN?

• Nama: **${targetCustomer.name}**
• Blok: **${block}**
• Bank: **${bank}**

Semua data terkait (berkas, unit, percakapan) akan ikut terhapus dan TIDAK bisa dikembalikan.

Ketik **"ya"** untuk konfirmasi, atau **"batal"** untuk membatalkan.

_Pending action akan expired dalam 5 menit._`
    } else if (!directResponse) {
      results.push(`[deleteCustomer] ❌ Konsumen tidak ditemukan (cari: name="${intent.customerName}", block="${intent.blockNumber}"). JANGAN bilang berhasil.`)
      directResponse = `❌ Konsumen tidak ditemukan. Silakan sebutkan nama lengkap atau blok yang benar. 🙏`
    }
  }

  // === LOGO GENERATION ===
  if (intent.action === 'GENERATE_LOGO' && intent.logoPrompt) {
    try {
      let targetCustomer: any = null
      if (customerId) targetCustomer = await db.customer.findUnique({ where: { id: customerId } })
      if (!targetCustomer && intent.customerName) targetCustomer = await db.customer.findFirst({ where: { name: { contains: intent.customerName, mode: 'insensitive' } } })
      const companyName = intent.logoPrompt || targetCustomer?.companyName || ''
      if (!companyName) {
        directResponse = `⚠️ Untuk generate logo, sebutkan nama perusahaan. Contoh: "generate logo untuk Warung Bu Tini"`
      } else {
        // DINA can't generate logo directly (z-ai SDK config not available on Vercel)
        // But DINA can instruct user to use Logo Generator in modal
        directResponse = `🎨 **Generate Logo: ${companyName}**

Untuk generate logo, gunakan Logo Generator di dashboard:

1. Buka tab **Berkas** → expand konsumen
2. Klik tombol **SK Kerja** atau **Slip Gaji** (buka modal)
3. Scroll ke bawah di panel kiri → **Generator Logo Perusahaan**
4. Pilih mode:
   - **Prompt Generate**: ketik prompt → AI create logo baru
   - **Upload Recreate**: upload foto logo → AI recreate versi bersih
5. Klik **Generate** → preview → **Insert ke Kop Surat**

Logo akan otomatis tersimpan di Google Drive konsumen (jika terhubung).

Atau, upload foto logo tempat usaha via sidebar kiri (Upload Dokumen), lalu ketik "recreate logo" — saya akan bantu proses.`
      }
      results.push(`[generateLogo] ${intent.logoPrompt}`)
    } catch (err: any) {
      directResponse = `❌ Gagal generate logo: ${err?.message || 'unknown error'}`
    }
  }

  // === DINA v2: SURAT GENERATION ===
  if ((intent as any).action === 'GENERATE_SURAT') {
    // DINA must ask user for suratType + instansi (mandatory confirmation)
    const msgLower = msg
    let detectedType: string | null = null
    let detectedInstansi: string | null = null

    // Detect surat type
    if (msgLower.includes('kerja')) detectedType = 'Surat Keterangan Kerja'
    else if (msgLower.includes('penghasilan')) detectedType = 'Surat Keterangan Penghasilan'
    else if (msgLower.includes('domisili')) detectedType = 'Surat Keterangan Domisili'
    else if (msgLower.includes('belum') && msgLower.includes('rumah')) detectedType = 'Surat Keterangan Belum Memiliki Rumah'
    else if (msgLower.includes('pernyataan')) detectedType = 'Surat Pernyataan'
    else if (msgLower.includes('kuasa')) detectedType = 'Surat Kuasa'
    else if (msgLower.includes('permohonan')) detectedType = 'Surat Permohonan'
    else if (msgLower.includes('pengantar')) detectedType = 'Surat Pengantar'
    else if (msgLower.includes('usaha')) detectedType = 'Surat Keterangan Usaha'
    else if (msgLower.includes('lamaran')) detectedType = 'Surat Lamaran'
    else if (msgLower.includes('tidak mampu')) detectedType = 'Surat Keterangan Tidak Mampu'

    // Detect instansi
    if (msgLower.includes('btn')) detectedInstansi = 'BTN'
    else if (msgLower.includes('mandiri')) detectedInstansi = 'MANDIRI'
    else if (msgLower.includes('bsb') || msgLower.includes('syariah')) detectedInstansi = 'BSB_SYARIAH'
    else if (msgLower.includes('kelurahan')) detectedInstansi = 'KELURAHAN'
    else if (msgLower.includes('notaris') || msgLower.includes('ppat')) detectedInstansi = 'NOTARIS'
    else if (msgLower.includes('kecamatan')) detectedInstansi = 'KECAMATAN'
    else if (msgLower.includes('puskesmas')) detectedInstansi = 'PUSKESMAS'
    else if (msgLower.includes('kapolsek') || msgLower.includes('polsek')) detectedInstansi = 'KAPOLSEK'

    if (detectedType && detectedInstansi) {
      // Both detected — generate via API (DINA returns instructions, frontend will trigger)
      directResponse = `✅ Siap! Aku akan buatkan **${detectedType}** untuk **${detectedInstansi === 'BSB_SYARIAH' ? 'BSB Syariah' : detectedInstansi}**.

Untuk generate, buka dashboard → tab Berkas → expand konsumen → klik tombol **Generate Surat** di sidebar.

Pilih:
- Jenis Surat: ${detectedType}
- Instansi: ${detectedInstansi === 'BSB_SYARIAH' ? 'BSB Syariah' : detectedInstansi.charAt(0) + detectedInstansi.slice(1).toLowerCase()}

Atau ketik: "generate surat ${detectedType} untuk ${detectedInstansi === 'BSB_SYARIAH' ? 'BSB' : detectedInstansi}" lagi untuk konfirmasi.

File akan disimpan di: Drive/ANJAYO 16/Surat Menyurat/${detectedInstansi === 'BSB_SYARIAH' ? 'BSB Syariah' : detectedInstansi}/
Nama: RAW - [Nama] - ${detectedType} - ${detectedInstansi === 'BSB_SYARIAH' ? 'BSB Syariah' : detectedInstansi} v1.docx
Permission: anyone with link = VIEW only 👍`
    } else {
      // Ask user for both
      const missing = []
      if (!detectedType) missing.push('jenis surat')
      if (!detectedInstansi) missing.push('instansi/bank tujuan')

      directResponse = `📝 **Generate Surat**

Boleh kasih tau lebih detail? Aku butuh info ini:

**1. Jenis Surat** (pilih salah satu):
- Surat Keterangan Kerja
- Surat Keterangan Penghasilan
- Surat Keterangan Domisili
- Surat Keterangan Belum Memiliki Rumah
- Surat Pernyataan
- Surat Kuasa
- Surat Permohonan
- Surat Pengantar
- Surat Keterangan Usaha
- Surat Lamaran

**2. Instansi Tujuan** (pilih salah satu):
- BTN
- Mandiri
- BSB Syariah
- Kelurahan
- Notaris
- Kecamatan
- Puskesmas
- Kapolsek

Contoh: "bikinin surat keterangan kerja untuk Jenni, ditujukan ke BTN"

${missing.length > 0 ? `⚠️ Yang masih kurang: ${missing.join(', ')}` : ''}`
    }
    results.push(`[generateSurat] type=${detectedType} instansi=${detectedInstansi}`)
  }

  // === BANK CONFIG MANAGEMENT ===
  if ((intent as any).action === 'LIST_BANKS') {
    try {
      const banks = await db.bankConfig.findMany({ where: { isActive: true }, orderBy: { bankName: 'asc' } })
      if (banks.length === 0) {
        directResponse = `📋 **Daftar Bank**

Belum ada bank terdaftar di sistem. Untuk tambah bank baru:
• "tambah bank BCA"
• "tambah bank BRI"

Setelah bank ditambahkan, Anda perlu upload PDF template + set annotation coordinates via Bank Config Builder UI di dashboard.`
      } else {
        const list = banks.map((b, i) => `${i + 1}. **${b.bankName}** (${b.bankCode})${b.description ? ` — ${b.description}` : ''}${b.templatePath ? ' ✅ template' : ' ⚠️ no template'}`).join('\n')
        directResponse = `📋 **Daftar Bank** (${banks.length} bank aktif)

${list}

Untuk tambah bank baru: "tambah bank [Nama Bank]"
Untuk hapus bank: "hapus bank [Nama Bank]"`
      }
      results.push(`[listBanks] Listed ${banks.length} banks`)
    } catch (err: any) {
      directResponse = `❌ Gagal mengambil daftar bank: ${err?.message || 'unknown error'}`
    }
  }

  if ((intent as any).action === 'ADD_BANK' && intent.newBankName) {
    try {
      const bankName = intent.newBankName
      const bankCode = bankName.toUpperCase().replace(/\s+/g, '_').substring(0, 20)
      
      const existing = await db.bankConfig.findUnique({ where: { bankCode } })
      if (existing) {
        directResponse = `ℹ️ Bank "${bankName}" (${bankCode}) sudah ada di sistem.`
      } else {
        const bank = await db.bankConfig.create({
          data: {
            bankCode,
            bankName: bankName,
            description: 'Added via DINA chat',
            createdBy: executeContext.senderNumber || 'dina',
          },
        })
        await writeAuditLog('CREATE_BANK', 'BankConfig', bank.id, {
          bankCode, bankName, createdBy: executeContext.senderNumber || 'dina',
        })
        directResponse = `✅ **Bank baru ditambahkan!**

• Nama: **${bankName}**
• Kode: **${bankCode}**

⚠️ **Langkah selanjutnya:**
1. Upload PDF template kosongan via Bank Config Builder UI di dashboard
2. Set annotation coordinates (klik di PDF → pilih field)
3. Bank akan muncul di dropdown pilih bank

Bank ini belum punya template/annotation — perlu setup via dashboard.`
      }
      results.push(`[addBank] ${bankName} (${bankCode})`)
    } catch (err: any) {
      directResponse = `❌ Gagal tambah bank: ${err?.message || 'unknown error'}`
    }
  }

  // DELETE_BANK handler DISABLED PERMANENTLY — banks cannot be deleted by anyone.

  return { results: results.join('\n\n'), directResponse }
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
