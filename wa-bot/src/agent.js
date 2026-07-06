// agent.js — Single agent runner (config-driven)
// Each agent has its own: BOT_NAME, WA number, GROUP_JID, work hours, persona
// Multiple agents can run concurrently in 1 Node process (saves RAM vs multi-process)

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fetch from 'node-fetch'

const logger = pino({ level: 'silent' })

const PENDING_TTL_MINUTES = 5
const GROUP_CACHE_TTL = 5 * 60 * 1000

/**
 * Start a single WA bot agent with given config
 * @param {Object} config
 *   - agentName: 'DINA' | 'RINA' | 'MITRA' | etc.
 *   - agentId: DB agent ID (for Vercel API routing)
 *   - agentRole: 'DOCUMENT' | 'FINANCE' | etc.
 *   - ownerWhatsapp: '628117176687'
 *   - groupJid: '120363xxx@g.us' (which group this agent participates in)
 *   - vercelApiUrl: 'https://hadi-kaya-virtual-office.vercel.app'
 *   - workStart: 9
 *   - workEnd: 17
 *   - apiEndpoint: '/api/dina/chat' | '/api/rina/chat' | etc. (which Vercel route handles this agent)
 * @returns {Object} control handle: { stop, getStatus }
 */
export async function startAgent(config) {
  const {
    agentName,
    agentId,
    agentRole,
    ownerWhatsapp,
    groupJid,
    vercelApiUrl,
    workStart = 9,
    workEnd = 17,
    apiEndpoint,
  } = config

  if (!agentName || !ownerWhatsapp || !vercelApiUrl || !apiEndpoint) {
    throw new Error(`Agent ${agentName || 'unknown'}: missing required config`)
  }

  const status = {
    agentName,
    connected: false,
    botJid: null,
    lastQr: null,
    lastError: null,
    startedAt: new Date(),
    messagesProcessed: 0,
  }

  // Each agent has own auth_state folder (so multiple agents can login to different WA numbers)
  const authFolder = `auth_state_${agentName.toLowerCase()}`
  console.log(`[${agentName}] 🚀 Starting agent (auth: ${authFolder}, group: ${groupJid || '(not set)'})`)

  // Group participant cache (per-agent, since each agent may be in different group)
  let groupParticipantsCache = new Set()
  let groupCacheLastUpdate = 0

  async function refreshGroupParticipants(sock) {
    if (!groupJid) return
    try {
      const metadata = await sock.groupMetadata(groupJid)
      groupParticipantsCache = new Set(
        metadata.participants.map(p => p.id.split('@')[0].split(':')[0])
      )
      groupCacheLastUpdate = Date.now()
      console.log(`[${agentName}] 📋 Group participants: ${groupParticipantsCache.size} members`)
    } catch (err) {
      console.error(`[${agentName}] Failed to fetch group metadata:`, err?.message || err)
    }
  }

  async function isGroupMember(senderNumber) {
    if (!groupJid) return false
    if (groupParticipantsCache.size === 0 || Date.now() - groupCacheLastUpdate > GROUP_CACHE_TTL) {
      if (groupParticipantsCache.size === 0) return false
    }
    return groupParticipantsCache.has(senderNumber)
  }

  function isOwner(senderJid) {
    const number = senderJid.split('@')[0].split(':')[0]
    return number === ownerWhatsapp || number.endsWith(ownerWhatsapp)
  }

  function isGroupMessage(jid) { return jid?.endsWith('@g.us') }
  function isPrivateChat(jid) { return jid?.endsWith('@s.whatsapp.net') }

  function isWorkHours() {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    if (day === 0) return false // Sunday off
    return hour >= workStart && hour < workEnd
  }

  // Call agent's Vercel API endpoint
  async function callAgentApi(message, senderNumber, senderName, isGroup, customerId) {
    try {
      const res = await fetch(`${vercelApiUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          customerId,
          channel: isGroup ? 'WHATSAPP_GROUP' : 'WHATSAPP_PRIVATE',
          senderNumber,
          senderName,
          isOwner: senderNumber === ownerWhatsapp,
          agentId,  // Tell API which agent is calling
        }),
      })
      const data = await res.json()
      return data
    } catch (err) {
      console.error(`[${agentName}] API error:`, err?.message || err)
      return { success: false, response: `Maaf, ${agentName} lagi ada gangguan teknis. 😅` }
    }
  }

  // Send file via WA (image/PDF/Word/generic)
  async function sendFile(sock, jid, file) {
    const { dataUrl, fileName, caption, mimeType } = file
    try {
      if (!dataUrl) return
      const buffer = Buffer.from(dataUrl.split(',')[1], 'base64')
      const mime = mimeType || (dataUrl.match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream'

      if (mime.startsWith('image/')) {
        await sock.sendMessage(jid, { image: buffer, caption: caption || fileName, mimetype: mime })
      } else if (mime === 'application/pdf') {
        await sock.sendMessage(jid, { document: buffer, fileName: fileName || 'document.pdf', caption: caption || '', mimetype: 'application/pdf' })
      } else {
        await sock.sendMessage(jid, { document: buffer, fileName: fileName || 'document', caption: caption || '', mimetype: mime })
      }
      console.log(`[${agentName}] ✅ Sent file: ${fileName} (${mime}, ${buffer.length} bytes)`)
    } catch (err) {
      console.error(`[${agentName}] Send file error:`, err?.message || err)
    }
  }

  // === Connect to WA ===
  const { state, saveCreds } = await useMultiFileAuthState(authFolder)

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,  // We handle QR ourselves
    defaultQueryTimeoutMs: undefined,
  })

  sock.ev.on('creds.update', saveCreds)

  // QR code handler — print with agent name prefix
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      status.lastQr = qr
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📱 [${agentName}] Scan QR Code dengan nomor WA ${agentName}:`)
      console.log(`${'='.repeat(60)}`)
      qrcode.generate(qr, { small: true })
      console.log(`${'='.repeat(60)}\n`)
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log(`[${agentName}] Connection closed. Reconnecting: ${shouldReconnect}`)
      status.connected = false
      if (shouldReconnect) {
        // Auto-reconnect after 5 seconds (avoid tight loop)
        setTimeout(() => startAgent(config), 5000)
      }
    } else if (connection === 'open') {
      status.connected = true
      status.botJid = sock.user?.id
      status.lastQr = null
      console.log(`[${agentName}] ✅ Connected! Bot: ${sock.user?.id}`)
      console.log(`[${agentName}]    Owner: ${ownerWhatsapp}`)
      console.log(`[${agentName}]    Group: ${groupJid || '(not set)'}`)
      console.log(`[${agentName}]    Work hours: ${workStart}:00 - ${workEnd}:00 (Mon-Sat)`)
      if (groupJid) {
        await refreshGroupParticipants(sock)
      }
    }
  })

  // Auto-refresh group participants every 5 minutes
  const refreshInterval = setInterval(async () => {
    if (groupJid && status.connected) {
      await refreshGroupParticipants(sock)
    }
  }, GROUP_CACHE_TTL)

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (msg.key.fromMe) continue

      const jid = msg.key.remoteJid
      const senderJid = msg.key.participant || msg.key.remoteJid
      const senderNumber = senderJid.split('@')[0].split(':')[0]
      const senderName = msg.pushName || senderNumber

      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   msg.message?.imageMessage?.caption ||
                   msg.message?.videoMessage?.caption || ''

      const isGroup = isGroupMessage(jid)
      const isPrivate = isPrivateChat(jid)

      // RULE 1: In groups, only respond if tagged
      if (isGroup) {
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const botJid = sock.user?.id
        const botJidBase = botJid?.split('@')[0].split(':')[0]
        const isMentioned = mentionedJids.some(mjid => {
          const mjidBase = mjid.split('@')[0].split(':')[0]
          return mjid === botJid || mjidBase === botJidBase
        })
        if (!isMentioned) continue
        // Only respond in OUR group
        if (groupJid && jid !== groupJid) continue
      }

      // RULE 2: Private chat — owner vs group member vs stranger
      if (isPrivate && !isOwner(senderJid)) {
        if (Date.now() - groupCacheLastUpdate > GROUP_CACHE_TTL) {
          await refreshGroupParticipants(sock)
        }
        const memberOfGroup = await isGroupMember(senderNumber)
        if (memberOfGroup) {
          await sock.sendMessage(jid, {
            text: `Maaf, saya ${agentName} hanya melayani di grup. Silakan ajukan pertanyaan di grup ya. 🙏`
          })
        } else {
          console.log(`[${agentName}] 🔇 Silent ignore: DM from ${senderNumber} (not a group member)`)
        }
        continue
      }

      // Work hours check (skip for owner)
      if (isPrivate && !isWorkHours() && !isOwner(senderJid)) {
        await sock.sendMessage(jid, {
          text: `Maaf, saya sedang offline. Jam kerja saya: ${workStart}:00 - ${workEnd}:00 (Senin-Sabtu). Pesan Anda akan saya balas saat saya online. 🙏`
        })
        continue
      }

      // Clean @mention from text
      let cleanText = text.trim()
      const botJidBase = sock.user?.id?.split('@')[0].split(':')[0]
      if (botJidBase) {
        const mentionRegex = new RegExp(`@${botJidBase}\\s*`, 'g')
        cleanText = cleanText.replace(mentionRegex, '').trim()
        cleanText = cleanText.replace(new RegExp(`@${agentName}\\s*`, 'gi'), '').trim()
      }
      if (!cleanText) continue

      // Typing indicator
      await sock.presenceSubscribe(jid)
      await sock.sendPresenceUpdate('composing', jid)

      // Call agent API
      const response = await callAgentApi(cleanText, senderNumber, senderName, isGroup)

      status.messagesProcessed++

      // Silent flag — skip reply
      if (response?.silent === true) {
        console.log(`[${agentName}] 🔇 API returned silent flag — not replying to ${senderNumber}`)
        continue
      }

      // Send text response
      if (response.success && response.response) {
        await sock.sendPresenceUpdate('paused', jid)
        await sock.sendMessage(jid, { text: response.response })
      }

      // Send files if any
      if (response.success && response.files && response.files.length > 0) {
        for (const file of response.files) {
          await sendFile(sock, jid, file)
          await new Promise(r => setTimeout(r, 500))
        }
      }
    }
  })

  // Group participant changes
  sock.ev.on('group-participants.update', async (event) => {
    if (event.id === groupJid) {
      console.log(`[${agentName}] 👥 Group participants changed: ${event.action} ${event.participants?.length || 0} user(s)`)
      await refreshGroupParticipants(sock)
    }
  })

  // Auto-reject calls
  sock.ev.on('call', async (callData) => {
    const callId = callData[0]?.id
    const from = callData[0]?.from
    if (callId && from) {
      await sock.rejectCall(callId, from)
      console.log(`[${agentName}] Rejected call from ${from}`)
    }
  })

  return {
    sock,
    status,
    config,
    stop: () => {
      clearInterval(refreshInterval)
      sock?.end?.(new Boom('Agent stopped by user'))
      console.log(`[${agentName}] 🛑 Agent stopped`)
    },
  }
}
