// DINA WhatsApp Bot — Baileys
// Connects to WhatsApp Web, routes messages to DINA API on Vercel
// Deploy this to Railway.app (free 500 hours/month)
//
// === BEHAVIOR RULES (updated) ===
// 1. GRUP: DINA HANYA respon jika di-tag (@Dina atau @[nomor HP DINA])
//    - Pesan tanpa tag → DINA diam, tidak respon sama sekali
// 2. PRIVATE CHAT (DM):
//    - Owner → respon normal (semua fitur: READ, UPDATE, CREATE, DELETE)
//    - Non-owner yang SUDAH ada di grup → DINA balas "hanya melayani di grup"
//    - Non-owner yang BELUM ada di grup → DINA diam, tidak respon sama sekali
// 3. JANGAN PERNAH share link grup ke siapapun (owner maupun non-owner)
//
// Setup:
// 1. Deploy this folder to Railway
// 2. Set env vars: VERCEL_API_URL, OWNER_WHATSAPP, GROUP_JID
// 3. Scan QR code in Railway logs
// 4. DINA is now online on WhatsApp!

import makeWASocket, { useMultiFileAuthState, DisconnectReason, makeInMemoryStore } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fetch from 'node-fetch'
import http from 'http'

const logger = pino({ level: 'silent' })
const store = makeInMemoryStore({ logger })

// Environment variables
const VERCEL_API_URL = process.env.VERCEL_API_URL || 'https://hadi-kaya-virtual-office.vercel.app'
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP || '628117176687' // Owner's WhatsApp number (without +)
const GROUP_JID = process.env.GROUP_JID || '' // Group JID where DINA participates (e.g., 12345@g.us)
const BOT_NAME = process.env.BOT_NAME || 'DINA'
const WORK_START = parseInt(process.env.WORK_START || '9')  // 9 AM
const WORK_END = parseInt(process.env.WORK_END || '17')     // 5 PM

// ============================================================
// GROUP PARTICIPANT CACHE
// DINA needs to know who's in the group to decide:
//   - DM from non-owner IN group → reply "hanya melayani di grup"
//   - DM from non-owner NOT in group → silent ignore
// Cache is refreshed every 5 minutes + on-demand when cache is empty
// ============================================================
let groupParticipantsCache = new Set() // set of phone numbers (without @)
let groupCacheLastUpdate = 0
const GROUP_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function refreshGroupParticipants(sock) {
  if (!GROUP_JID) {
    console.log('⚠️  GROUP_JID not set — cannot check group membership. Set GROUP_JID env var.')
    return
  }
  try {
    const metadata = await sock.groupMetadata(GROUP_JID)
    groupParticipantsCache = new Set(
      metadata.participants.map(p => p.id.split('@')[0].split(':')[0])
    )
    groupCacheLastUpdate = Date.now()
    console.log(`📋 Group participants refreshed: ${groupParticipantsCache.size} members`)
  } catch (err) {
    console.error('Failed to fetch group metadata:', err?.message || err)
  }
}

async function isGroupMember(senderNumber) {
  // If no GROUP_JID set, treat everyone as non-member (safe default — silent ignore)
  if (!GROUP_JID) return false

  // Refresh cache if expired or empty
  if (groupParticipantsCache.size === 0 || Date.now() - groupCacheLastUpdate > GROUP_CACHE_TTL) {
    // We need the socket reference; pass it in via a global or restructure
    // For simplicity, refresh is triggered in the message handler with sock
    // If cache is empty here, return false (safe default)
    if (groupParticipantsCache.size === 0) return false
  }
  return groupParticipantsCache.has(senderNumber)
}

// Schedule: check if bot should be active
function isWorkHours() {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0=Sunday, 6=Saturday
  // Monday(1) - Saturday(6)
  if (day === 0) return false // Sunday off
  return hour >= WORK_START && hour < WORK_END
}

// Check if sender is owner
function isOwner(senderJid) {
  const number = senderJid.split('@')[0].split(':')[0]
  return number === OWNER_WHATSAPP || number.endsWith(OWNER_WHATSAPP)
}

// Check if message is from group
function isGroupMessage(jid) {
  return jid?.endsWith('@g.us')
}

// Check if message is private chat
function isPrivateChat(jid) {
  return jid?.endsWith('@s.whatsapp.net')
}

// Send message to DINA API and get response
async function callDina(message, senderNumber, senderName, isGroup, customerId) {
  try {
    const res = await fetch(`${VERCEL_API_URL}/api/dina/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        customerId,
        channel: isGroup ? 'WHATSAPP_GROUP' : 'WHATSAPP_PRIVATE',
        senderNumber,
        senderName,
        isOwner: senderNumber === OWNER_WHATSAPP,
      }),
    })
    const data = await res.json()
    return data
  } catch (err) {
    console.error('DINA API error:', err)
    return { success: false, response: 'Maaf, saya lagi ada gangguan teknis. 😅' }
  }
}

// Send file (image or document) via WA
// Supports: image (jpg/png/webp), PDF, Word doc, and any other document type
async function sendFile(sock, jid, file) {
  // file = { dataUrl, fileName, caption, mimeType }
  const { dataUrl, fileName, caption, mimeType } = file
  try {
    if (!dataUrl) return
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64')
    const mime = mimeType || (dataUrl.match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream'

    if (mime.startsWith('image/')) {
      // Send as image
      await sock.sendMessage(jid, {
        image: buffer,
        caption: caption || fileName,
        mimetype: mime,
      })
    } else if (mime === 'application/pdf') {
      // Send as PDF document
      await sock.sendMessage(jid, {
        document: buffer,
        fileName: fileName || 'document.pdf',
        caption: caption || '',
        mimetype: 'application/pdf',
      })
    } else {
      // Send as generic document (Word, Excel, etc.)
      await sock.sendMessage(jid, {
        document: buffer,
        fileName: fileName || 'document',
        caption: caption || '',
        mimetype: mime,
      })
    }
    console.log(`✅ Sent file: ${fileName} (${mime}, ${buffer.length} bytes)`)
  } catch (err) {
    console.error('Send file error:', err?.message || err)
  }
}

// Main bot function
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_state')

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  })

  store.bind(sock.ev)

  // Save credentials when updated
  sock.ev.on('creds.update', saveCreds)

  // Connection state
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Scan QR Code di WhatsApp kamu:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed. Reconnecting:', shouldReconnect)
      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === 'open') {
      console.log(`✅ ${BOT_NAME} berhasil terhubung ke WhatsApp!`)
      console.log(`   Owner: ${OWNER_WHATSAPP}`)
      console.log(`   Group JID: ${GROUP_JID || '(belum diset)'}`)
      console.log(`   Work hours: ${WORK_START}:00 - ${WORK_END}:00 (Mon-Sat)`)
      console.log(`   Bot Number: ${sock.user?.id}`)
      // Initial group participant cache load
      if (GROUP_JID) {
        await refreshGroupParticipants(sock)
      }
    }
  })

  // Auto-refresh group participants every 5 minutes
  setInterval(async () => {
    if (GROUP_JID) {
      await refreshGroupParticipants(sock)
    }
  }, GROUP_CACHE_TTL)

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      // Skip if message is from me (bot)
      if (msg.key.fromMe) continue

      const jid = msg.key.remoteJid
      const senderJid = msg.key.participant || msg.key.remoteJid
      const senderNumber = senderJid.split('@')[0].split(':')[0]
      const senderName = msg.pushName || senderNumber

      // Get message text
      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   msg.message?.imageMessage?.caption ||
                   msg.message?.videoMessage?.caption ||
                   ''

      const isGroup = isGroupMessage(jid)
      const isPrivate = isPrivateChat(jid)

      // ============================================================
      // RULE 1: In groups, DINA ONLY responds if tagged (@Dina or @[bot's number])
      // No fallback to "Dina ..." prefix — must be explicit @mention
      // ============================================================
      if (isGroup) {
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const botJid = sock.user?.id
        const botJidBase = botJid?.split('@')[0].split(':')[0] // bot's phone number

        const isMentioned = mentionedJids.some(mjid => {
          const mjidBase = mjid.split('@')[0].split(':')[0]
          return mjid === botJid || mjidBase === botJidBase
        })

        // STRICT: only respond if explicitly tagged
        if (!isMentioned) continue

        // Also require that the message is sent in OUR group (if GROUP_JID is set)
        // This prevents DINA from responding in random groups it's been added to
        if (GROUP_JID && jid !== GROUP_JID) continue
      }

      // ============================================================
      // RULE 2: Private chat logic
      //   - Owner → process normally
      //   - Non-owner IN group → reply "hanya melayani di grup" (NO LINK)
      //   - Non-owner NOT in group → SILENT IGNORE (no reply at all)
      // ============================================================
      if (isPrivate && !isOwner(senderJid)) {
        // Refresh cache if stale (best-effort)
        if (Date.now() - groupCacheLastUpdate > GROUP_CACHE_TTL) {
          await refreshGroupParticipants(sock)
        }

        const memberOfGroup = await isGroupMember(senderNumber)

        if (memberOfGroup) {
          // Reply with rejection — but NEVER share the group link
          await sock.sendMessage(jid, {
            text: `Maaf, saya ${BOT_NAME} hanya melayani di grup. Silakan ajukan pertanyaan di grup ya. 🙏`
          })
        } else {
          // Silent ignore — do not reply at all
          // (Logging only, no response sent)
          console.log(`🔇 Silent ignore: DM from ${senderNumber} (not a group member)`)
        }
        continue
      }

      // ============================================================
      // Owner in private chat OR group member tagged DINA → process normally
      // ============================================================

      // Check work hours (skip for owner)
      if (isPrivate && !isWorkHours() && !isOwner(senderJid)) {
        await sock.sendMessage(jid, {
          text: `Maaf, saya sedang offline. Jam kerja saya: ${WORK_START}:00 - ${WORK_END}:00 (Senin-Sabtu). Pesan Anda akan saya balas saat saya online. 🙏`
        })
        continue
      }

      // Clean message text (remove @mention of bot if present)
      let cleanText = text.trim()
      // Remove @Dina mention artifacts (the mention itself is shown as @number in text)
      const botJidBase = sock.user?.id?.split('@')[0].split(':')[0]
      if (botJidBase) {
        // Remove patterns like "@628117176687" or just "@" followed by bot number
        const mentionRegex = new RegExp(`@${botJidBase}\\s*`, 'g')
        cleanText = cleanText.replace(mentionRegex, '').trim()
        // Also remove "@Dina" case insensitive
        cleanText = cleanText.replace(/@dina\s*/gi, '').trim()
      }

      if (!cleanText) continue

      // Show typing indicator
      await sock.presenceSubscribe(jid)
      await sock.sendPresenceUpdate('composing', jid)

      // Call DINA API
      const response = await callDina(cleanText, senderNumber, senderName, isGroup)

      // SAFETY: if API returns silent=true, do NOT reply (defensive — should never happen)
      if (response?.silent === true) {
        console.log(`🔇 API returned silent flag — not replying to ${senderNumber}`)
        continue
      }

      // Send text response
      if (response.success && response.response) {
        await sock.sendPresenceUpdate('paused', jid)
        await sock.sendMessage(jid, { text: response.response })
      }

      // If DINA has files to send (berkas request)
      if (response.success && response.files && response.files.length > 0) {
        for (const file of response.files) {
          await sendFile(sock, jid, file)  // Pass full file object
          // Small delay between files to avoid WA rate limit
          await new Promise(r => setTimeout(r, 500))
        }
      }
    }
  })

  // Handle group join/leave events — refresh cache
  sock.ev.on('groups.upsert', async () => {
    if (GROUP_JID) await refreshGroupParticipants(sock)
  })

  sock.ev.on('group-participants.update', async (event) => {
    if (event.id === GROUP_JID) {
      console.log(`👥 Group participants changed: ${event.action} ${event.participants?.length || 0} user(s)`)
      await refreshGroupParticipants(sock)
    }
  })

  // Handle incoming calls (auto-reject)
  sock.ev.on('call', async (callData) => {
    const callId = callData[0]?.id
    const from = callData[0]?.from
    if (callId && from) {
      await sock.rejectCall(callId, from)
      console.log(`Rejected call from ${from}`)
    }
  })
}

// Start bot
startBot()

// === HEALTH CHECK HTTP SERVER (for Railway monitoring) ===
// Railway needs an HTTP port to detect if service is alive.
// Without this, Railway may mark service as "unhealthy" and restart it.
const PORT = process.env.PORT || 3000

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      bot: BOT_NAME,
      owner: OWNER_WHATSAPP,
      groupJid: GROUP_JID || '(not set)',
      workHours: `${WORK_START}:00 - ${WORK_END}:00 (Mon-Sat)`,
      timestamp: new Date().toISOString(),
    }))
  } else if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('pong')
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found. Use /health or /ping')
  }
})

healthServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Health check server listening on port ${PORT}`)
  console.log(`   Endpoint: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  healthServer.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...')
  healthServer.close()
  process.exit(0)
})
