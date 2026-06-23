// ============================================================
// MARKETING AI MIGRATION UTILITY
// Phone number extraction + cross-platform customer linking
// ============================================================

/**
 * Extract Indonesian phone numbers from text
 * Supports formats:
 * - 081234567890
 * - 6281234567890
 * - +6281234567890
 * - 0812-3456-7890
 * - 0812 3456 7890
 * - WA: 081234567890
 *
 * Returns array of normalized numbers (with +62 prefix)
 */
export function extractPhoneNumbers(text: string): string[] {
  // Pattern: optional + or 0, then 8 with optional separators, then 6-12 digits
  // Allow spaces, dashes, dots between digits
  const pattern = /(?:(?:\+62|62|0)\s?)?8[\d\s.-]{6,15}\d/g

  const found = new Set<string>()
  const matches = text.match(pattern) || []

  for (let match of matches) {
    // Clean: remove spaces, dashes, dots
    let cleaned = match.replace(/[\s.-]/g, '')

    // Normalize: convert to +62xxx
    if (cleaned.startsWith('08')) {
      cleaned = '+62' + cleaned.substring(1)
    } else if (cleaned.startsWith('62')) {
      cleaned = '+' + cleaned
    } else if (cleaned.startsWith('8')) {
      // Just 8xxx without prefix
      cleaned = '+62' + cleaned
    }

    // Validate length (10-15 digits after +62)
    const digitsOnly = cleaned.replace(/\D/g, '')
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      found.add(cleaned)
    }
  }

  return Array.from(found)
}

/**
 * Detect if conversation should migrate to WA
 * Trigger: after 2-3 exchanges, AI should suggest WA migration
 */
export interface MigrationContext {
  exchangeCount: number
  hasPhoneNumber: boolean
  hasSuggestedMigration: boolean
  customerName?: string
  channel: 'FB' | 'IG' | 'TIKTOK' | 'WA' | 'DASHBOARD'
}

export function shouldSuggestMigration(ctx: MigrationContext): boolean {
  // Don't suggest if already on WA
  if (ctx.channel === 'WA') return false
  // Don't suggest if already suggested
  if (ctx.hasSuggestedMigration) return false
  // Suggest after 2-3 exchanges
  if (ctx.exchangeCount < 2) return false
  // Suggest if customer already gave phone (need to confirm migration)
  if (ctx.hasPhoneNumber) return true
  // Suggest after 2 exchanges
  return ctx.exchangeCount >= 2
}

/**
 * Migration message templates (varied to avoid robotic feel)
 */
const migrationTemplates = [
  (name?: string) => `Kak ${name || ''}, biar saya bisa kirim foto rumah + siteplan detail, kita lanjut di WA saja ya? Kakak kirim nomor WA-nya, saya langsung WA 📲`.trim(),
  (name?: string) => `BTW kak ${name || ''}, info lengkapnya saya WA aja ya biar cepat. Nomor WA kakak berapa? 📲`.trim(),
  (name?: string) => `Mau saya kirim detail lengkap via WA kak ${name || ''}? Sebutkan nomornya ya, saya langsung follow up sana 💚`.trim(),
  (name?: string) => `Kak ${name || ''}, biar komunikasi lebih lancar (foto, video, dokumen), kita lanjut di WA aja yuk. Nomornya? 📲`.trim(),
  (name?: string) => `Saya ada info promo terbaru juga kak ${name || ''}. Mau saya WA? Sebutkan nomornya ya 🌞`.trim(),
]

export function generateMigrationMessage(customerName?: string, variant?: number): string {
  const idx = variant !== undefined
    ? variant % migrationTemplates.length
    : Math.floor(Math.random() * migrationTemplates.length)
  return migrationTemplates[idx](customerName)
}

/**
 * Post-migration confirmation message (sent on FB/IG after WA sent)
 */
export function generateMigrationConfirmation(customerName?: string): string {
  const templates = [
    `Sudah saya WA ya kak ${customerName || ''}! Cek WA segera 📲`,
    `Done kak ${customerName || ''}, saya udah WA. Cek WA ya 💚`,
    `Terkirim! Cek WA kakak ya kak ${customerName || ''} 📲`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * First WA message template (sent from AI to customer on WA)
 */
export function generateFirstWAMessage(
  customerName: string,
  agentName: string,
  sourceChannel: 'FB' | 'IG' | 'TIKTOK',
  context?: { lastTopic?: string }
): string {
  const channelLabel = sourceChannel === 'FB' ? 'Facebook' : sourceChannel === 'IG' ? 'Instagram' : 'TikTok'

  return `Halo kak ${customerName}! 👋

Saya ${agentName} dari Anjayo 16 (Perumahan Jerambah Gantung, Pangkalpinang). Tadi kita chat di ${channelLabel} ya${context?.lastTopic ? ` tentang ${context.lastTopic}` : ''}.

Berikut info singkat yang kakak butuhkan:
• Tipe 36, luas tanah 84/105/127 m²
• Harga: Rp 173 juta (pengajuan bank)
• DP mulai Rp 5jt all-in (luas 84)
• Lokasi: Jl. Jerambah Gantung, pusat kota
• Tidak ada potensi banjir
• Dekat: Pasar Kerabut, SDN 44, UBB, RS Timah

Ada yang mau kakak tanya lebih detail? Saya siap bantu 🌞`
}

/**
 * Check if message indicates customer refusal to give phone number
 */
export function isRefusingPhoneNumber(message: string): boolean {
  const refusalPatterns = [
    /tidak\s+(?:mau|boleh|bisa)\s+(?:kasih|beri|sebut)\s+nomor/i,
    /nggak\s+(?:mau|boleh)\s+deh/i,
    /maaf.*(?:tidak|nggak)\s+(?:bisa|mau)/i,
    /(?:nanti|besok)\s+(?:aja|dulu)/i,
    /(?:jangan|takut).*(?:spam|penipuan)/i,
    /(?:belom|belum)\s+(?:berani|siap)/i,
  ]
  return refusalPatterns.some(p => p.test(message))
}

/**
 * Check if message is giving phone number
 */
export function isProvidingPhoneNumber(message: string): boolean {
  return extractPhoneNumbers(message).length > 0
}

/**
 * Detect customer mood/sentiment (simple heuristic)
 * For better sentiment, use LLM (heavy task)
 */
export function detectSentiment(message: string): 'positive' | 'neutral' | 'hesitant' | 'negative' {
  const positive = ['tertarik', 'mau', 'boleh', 'boleh dong', 'sip', 'mantap', 'keren', 'bagus', 'suka', 'minat']
  const hesitant = ['ragu', 'mikir', 'pikir', 'belum', 'nanti', 'kapan', 'jam', 'mahal', 'jauh']
  const negative = ['tidak', 'nggak', 'bukan', 'jangan', 'batal', 'cancel', 'tidak mau', 'engga']

  const msg = message.toLowerCase()

  if (negative.some(w => msg.includes(w))) return 'negative'
  if (hesitant.some(w => msg.includes(w))) return 'hesitant'
  if (positive.some(w => msg.includes(w))) return 'positive'
  return 'neutral'
}
