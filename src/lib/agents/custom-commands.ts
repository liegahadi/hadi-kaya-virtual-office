// DINA Custom Command Learning System
// User dapat "mengajari" DINA command baru yang belum ada di built-in intents.
//
// Flow:
// 1. User: "ajar: kirim invoice * | Invoice {user_input} sudah dikirim"
//    → DINA save ke CustomCommand table
// 2. User: "kirim invoice Jenni"
//    → DINA match CustomCommand (pattern: "kirim invoice *")
//    → Replace {user_input} = "Jenni"
//    → Response: "Invoice Jenni sudah dikirim"
// 3. User: "lupa command kirim invoice" → DINA delete custom command
// 4. User: "list command" → DINA list all custom commands

import { db } from '@/lib/db'

// ============================================================
// MATCH: Check if message matches any custom command
// Returns response string if match, null if no match
// ============================================================

export async function matchCustomCommand(message: string, channel?: string): Promise<string | null> {
  try {
    // Determine effective channel for matching
    // - If channel provided (e.g. 'WHATSAPP_GROUP'), match commands with that channel OR null (global)
    // - If channel not provided (dashboard), match commands with 'DASHBOARD' channel OR null (global)
    //   (because dashboard commands are stored with channel='DASHBOARD')
    const effectiveChannel = channel || 'DASHBOARD'

    // Get all active custom commands (channel-specific + global)
    const commands = await db.customCommand.findMany({
      where: {
        isActive: true,
        OR: [
          { channel: null },  // global commands (apply to all channels)
          { channel: effectiveChannel },  // channel-specific commands
        ],
      },
      orderBy: { createdAt: 'desc' },  // newest first (more specific patterns)
    })

    if (commands.length === 0) return null

    const msgLower = message.toLowerCase().trim()

    for (const cmd of commands) {
      const patternLower = cmd.triggerPattern.toLowerCase().trim()

      // Check if pattern matches
      // Pattern can be:
      // 1. Exact match: "halo dina" matches only "halo dina"
      // 2. Wildcard: "kirim invoice *" matches "kirim invoice Jenni"
      // 3. Contains: "*halo*" matches "halo" anywhere in message

      let matched = false
      let capturedInput = ''

      if (patternLower.includes('*')) {
        // Wildcard pattern
        // Convert to regex: escape special chars, replace * with (.*)
        const regexStr = patternLower
          .split('*')
          .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('(.*)')
        const regex = new RegExp(`^${regexStr}$`, 'i')
        const match = msgLower.match(regex)
        if (match) {
          matched = true
          // capturedInput = first wildcard group (or full message if no group)
          capturedInput = match[1] || message
        }
      } else {
        // Exact match (case-insensitive)
        if (msgLower === patternLower) {
          matched = true
          capturedInput = message
        }
      }

      if (matched) {
        // Increment match count
        await db.customCommand.update({
          where: { id: cmd.id },
          data: { matchCount: { increment: 1 } },
        })

        // Build response with placeholders replaced
        let response = cmd.responseTemplate
        response = response.replace(/\{user_input\}/gi, capturedInput)
        response = response.replace(/\{input\}/gi, capturedInput)
        response = response.replace(/\{message\}/gi, message)

        // Try to extract customer name from message (if any)
        const nameMatch = message.match(/(?:konsumen|debitur|nasabah)\s+([A-Za-z][A-Za-z\s]+?)(?:\s+(?:di|blok|bank|hp|yang|,|$))/i)
        if (nameMatch) {
          response = response.replace(/\{nama\}/gi, nameMatch[1])
        }

        // Try to extract block
        const blockMatch = message.match(/blok\s+([A-Za-z]\d+)/i)
        if (blockMatch) {
          response = response.replace(/\{blok\}/gi, blockMatch[1])
        }

        return response
      }
    }

    return null
  } catch (err) {
    console.error('matchCustomCommand error:', err)
    return null
  }
}

// ============================================================
// TEACH: User wants to teach DINA a new command
// Format: "ajar: [trigger] | [response]"
// Example: "ajar: kirim invoice * | Invoice {user_input} sudah dikirim ke email"
// ============================================================

export interface TeachResult {
  success: boolean
  message: string
  commandId?: string
}

export async function teachCustomCommand(
  message: string,
  options: { senderNumber?: string; channel?: string }
): Promise<TeachResult> {
  try {
    // Extract trigger | response from message
    // Pattern: "ajar: X | Y" or "ajar X | Y" or "ajar X = Y"
    const teachMatch = message.match(/ajar\s*:?\s*(.+?)\s*(?:\||=)\s*(.+)$/i)
    if (!teachMatch) {
      return {
        success: false,
        message: `❌ Format ajaran salah. Pakai format:

**\`ajar: [trigger] | [response]\`**

**Contoh:**
• \`ajar: kirim invoice * | Invoice {user_input} sudah dikirim ke email\`
• \`ajar: cek stok * | Stok {user_input} sedang saya cek di gudang\`
• \`ajar: halo dina | Halo juga! Ada yang bisa saya bantu? 😊\`

**Placeholder yang bisa dipakai di response:**
• \`{user_input}\` — teks yang user ketik (setelah trigger)
• \`{nama}\` — nama konsumen yang disebut (auto-extract)
• \`{blok}\` — blok konsumen yang disebut (auto-extract)
• \`{message}\` — full message user

**Wildcards di trigger:**
• \`*\` — cocok dengan teks apa saja
• Contoh: \`kirim invoice *\` cocok dengan "kirim invoice Jenni", "kirim invoice Budi", dll`,
      }
    }

    const triggerPattern = teachMatch[1].trim()
    const responseTemplate = teachMatch[2].trim()

    // Validate
    if (triggerPattern.length < 3) {
      return { success: false, message: '❌ Trigger pattern terlalu pendek (min 3 karakter).' }
    }
    if (responseTemplate.length < 1) {
      return { success: false, message: '❌ Response template kosong.' }
    }

    // Check if trigger already exists (avoid duplicates)
    const existing = await db.customCommand.findFirst({
      where: { triggerPattern: { equals: triggerPattern, mode: 'insensitive' } },
    })
    if (existing) {
      // Update existing
      await db.customCommand.update({
        where: { id: existing.id },
        data: {
          responseTemplate,
          responseType: 'template',
          createdBy: options.senderNumber || 'dashboard',
          channel: options.channel || null,
          updatedAt: new Date(),
        },
      })
      return {
        success: true,
        commandId: existing.id,
        message: `✅ **Command diperbarui!**

**Trigger:** \`${triggerPattern}\`
**Response:** \`${responseTemplate}\`

Sekarang kalau Anda ketik sesuatu yang cocok dengan trigger ini, saya akan otomatis balas dengan response di atas. 🤖`,
      }
    }

    // Create new
    const newCmd = await db.customCommand.create({
      data: {
        triggerPattern,
        responseTemplate,
        responseType: 'template',
        exampleTrigger: triggerPattern,
        createdBy: options.senderNumber || 'dashboard',
        channel: options.channel || null,
        isActive: true,
      },
    })

    return {
      success: true,
      commandId: newCmd.id,
      message: `✅ **Command baru dipelajari!**

**Trigger:** \`${triggerPattern}\`
**Response:** \`${responseTemplate}\`

Sekarang kalau Anda ketik sesuatu yang cocok dengan trigger ini, saya akan otomatis balas dengan response di atas. 🤖

**Coba test sekarang:** ketik trigger-nya (dengan teks pengganti kalau ada \`*\`)`,
    }
  } catch (err: any) {
    return { success: false, message: `❌ Gagal menyimpan command: ${err?.message || 'unknown error'}` }
  }
}

// ============================================================
// LIST: Show all custom commands
// ============================================================

export async function listCustomCommands(): Promise<string> {
  try {
    const commands = await db.customCommand.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (commands.length === 0) {
      return `📚 **Custom Commands**

Belum ada command yang dipelajari. Ajarin saya command baru dengan format:

\`\`\`
ajar: [trigger] | [response]
\`\`\`

**Contoh:**
\`\`\`
ajar: kirim invoice * | Invoice {user_input} sudah dikirim ke email
\`\`\`

Placeholder: \`{user_input}\`, \`{nama}\`, \`{blok}\`, \`{message}\`
Wildcard: \`*\` (cocok teks apa saja)`
    }

    const list = commands.map((c, i) => {
      const trigger = c.triggerPattern
      const response = c.responseTemplate.substring(0, 60) + (c.responseTemplate.length > 60 ? '...' : '')
      const matchInfo = c.matchCount > 0 ? ` (dipakai ${c.matchCount}x)` : ''
      return `${i + 1}. \`${trigger}\` → "${response}"${matchInfo}`
    }).join('\n')

    return `📚 **Custom Commands** (${commands.length} commands)

${list}

**Hapus command:** \`lupa command [nomor]\` atau \`lupa command [trigger]\`
**Ajarin command baru:** \`ajar: [trigger] | [response]\` 🤖`
  } catch (err: any) {
    return `❌ Gagal mengambil daftar command: ${err?.message || 'unknown error'}`
  }
}

// ============================================================
// DELETE: Remove a custom command
// ============================================================

export async function deleteCustomCommand(identifier: string): Promise<string> {
  try {
    // Try by number first
    const num = parseInt(identifier)
    if (!isNaN(num) && num >= 1) {
      const commands = await db.customCommand.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })
      if (num > commands.length) {
        return `❌ Nomor ${num} tidak valid. Total command: ${commands.length}.`
      }
      const target = commands[num - 1]
      await db.customCommand.update({
        where: { id: target.id },
        data: { isActive: false },
      })
      return `✅ Command dihapus: \`${target.triggerPattern}\` → "${target.responseTemplate.substring(0, 50)}..."`
    }

    // Try by trigger pattern (contains match)
    const target = await db.customCommand.findFirst({
      where: {
        isActive: true,
        triggerPattern: { contains: identifier, mode: 'insensitive' },
      },
    })
    if (!target) {
      return `❌ Command dengan trigger mengandung "${identifier}" tidak ditemukan.

Ketik "list command" untuk melihat semua custom commands.`
    }
    await db.customCommand.update({
      where: { id: target.id },
      data: { isActive: false },
    })
    return `✅ Command dihapus: \`${target.triggerPattern}\` → "${target.responseTemplate.substring(0, 50)}..."`
  } catch (err: any) {
    return `❌ Gagal menghapus command: ${err?.message || 'unknown error'}`
  }
}
