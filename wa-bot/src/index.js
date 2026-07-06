// DINA WhatsApp Bot — Baileys
// Connects to WhatsApp Web, routes messages to DINA API on Vercel
// Deploy this to Railway.app (free 500 hours/month)
// 
// Setup:
// 1. Deploy this folder to Railway
// 2. Set env vars: VERCEL_API_URL, OWNER_WHATSAPP, GROUP_JID
// 3. Scan QR code in Railway logs
// 4. DINA is now online on WhatsApp!

import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysMessage, makeInMemoryStore } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fetch from 'node-fetch'

const logger = pino({ level: 'silent' })
const store = makeInMemoryStore({ logger })

// Environment variables
const VERCEL_API_URL = process.env.VERCEL_API_URL || 'https://hadi-kaya-virtual-office.vercel.app'
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP || '628117176687' // Owner's WhatsApp number (without +)
const GROUP_JID = process.env.GROUP_JID || '' // Group JID where DINA participates (e.g., 12345@g.us)
const BOT_NAME = process.env.BOT_NAME || 'DINA'
const WORK_START = parseInt(process.env.WORK_START || '9')  // 9 AM
const WORK_END = parseInt(process.env.WORK_END || '17')     // 5 PM

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
async function sendFile(sock, jid, fileDataUrl, fileName, caption) {
  try {
    if (fileDataUrl.startsWith('data:image')) {
      // Send as image
      const buffer = Buffer.from(fileDataUrl.split(',')[1], 'base64')
      await sock.sendMessage(jid, {
        image: buffer,
        caption: caption || fileName,
      })
    } else if (fileDataUrl.startsWith('data:application/pdf')) {
      // Send as document
      const buffer = Buffer.from(fileDataUrl.split(',')[1], 'base64')
      await sock.sendMessage(jid, {
        document: buffer,
        fileName: fileName || 'document.pdf',
        caption: caption || '',
        mimetype: 'application/pdf',
      })
    }
  } catch (err) {
    console.error('Send file error:', err)
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
  sock.ev.on('connection.update', (update) => {
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
      console.log(`   Work hours: ${WORK_START}:00 - ${WORK_END}:00 (Mon-Sat)`)
    }
  })

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

      // Check if message mentions bot (in groups, bot must be mentioned)
      const isGroup = isGroupMessage(jid)
      const isPrivate = isPrivateChat(jid)

      // In groups, only respond if bot is mentioned or message starts with "dina"
      if (isGroup) {
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const botJid = sock.user?.id
        const isMentioned = mentionedJids.includes(botJid)
        const startsWithDina = text.toLowerCase().startsWith('dina') || text.toLowerCase().startsWith('dina ')
        
        if (!isMentioned && !startsWithDina) continue
      }

      // Private chat from non-owner → reject
      if (isPrivate && !isOwner(senderJid)) {
        await sock.sendMessage(jid, {
          text: `Maaf, saya ${BOT_NAME} hanya melayani di grup. Silakan join grup untuk berkomunikasi dengan saya. 🙏`
        })
        continue
      }

      // Check work hours (for non-owner in private chat)
      if (isPrivate && !isWorkHours() && !isOwner(senderJid)) {
        await sock.sendMessage(jid, {
          text: `Maaf, saya sedang offline. Jam kerja saya: ${WORK_START}:00 - ${WORK_END}:00 (Senin-Sabtu). Pesan Anda akan saya balas saat saya online. 🙏`
        })
        // Store message for later processing (when bot comes online)
        continue
      }

      // Clean message text (remove "dina" prefix if present)
      let cleanText = text.trim()
      if (cleanText.toLowerCase().startsWith('dina ')) {
        cleanText = cleanText.substring(5).trim()
      } else if (cleanText.toLowerCase().startsWith('dina')) {
        cleanText = cleanText.substring(4).trim()
      }

      if (!cleanText) continue

      // Show typing indicator
      await sock.presenceSubscribe(jid)
      await sock.sendPresenceUpdate('composing', jid)

      // Call DINA API
      const response = await callDina(cleanText, senderNumber, senderName, isGroup)

      // Send text response
      if (response.success && response.response) {
        await sock.sendPresenceUpdate('paused', jid)
        await sock.sendMessage(jid, { text: response.response })
      }

      // If DINA has files to send (berkas request)
      if (response.success && response.files && response.files.length > 0) {
        for (const file of response.files) {
          await sendFile(sock, jid, file.dataUrl, file.fileName, file.caption)
        }
      }
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...')
  process.exit(0)
})
