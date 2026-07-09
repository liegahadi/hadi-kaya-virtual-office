// ============================================================
// WA BRIDGE MINI-SERVICE
// ============================================================
// Persistent WhatsApp connection via Baileys
// Port: 3001
//
// Endpoints:
// - GET  /status          → connection status
// - GET  /qr              → QR code (base64 image)
// - POST /connect/:agentId → start connection for agent
// - POST /disconnect      → disconnect
// - POST /send            → send message { to, message }
// ============================================================

import { serve } from 'bun'
import { makeWASocket, useMultiFileAuthState, DisconnectReason, type BaileysEventMap } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'
import P from 'pino'

// ============================================================
// STATE
// ============================================================
let sock: ReturnType<typeof makeWASocket> | null = null
let currentQR: string | null = null
let connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'WAITING_QR' = 'DISCONNECTED'
let connectedAgentId: string | null = null
let connectedPhoneNumber: string | null = null
let lastError: string | null = null

// ============================================================
// MAIN: Start WA connection
// ============================================================
async function startConnection(agentId: string) {
  if (sock && connectionState === 'CONNECTED') {
    return { success: false, error: 'Already connected. Disconnect first.' }
  }

  connectedAgentId = agentId
  connectionState = 'CONNECTING'
  currentQR = null
  lastError = null

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/rina')

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: P({ level: 'silent' }),
      browser: ['Hadi Kaya Virtual Office', 'Chrome', '1.0.0'],
      defaultQueryTimeoutMs: 60000,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update: BaileysEventMap['connection.update']) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        currentQR = qr
        connectionState = 'WAITING_QR'
        console.log('[WA] QR Code generated, waiting for scan...')
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        console.log(`[WA] Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`)

        if (shouldReconnect) {
          connectionState = 'CONNECTING'
          currentQR = null
          // Reconnect after 2 seconds
          setTimeout(() => {
            if (connectedAgentId) startConnection(connectedAgentId)
          }, 2000)
        } else {
          connectionState = 'DISCONNECTED'
          lastError = 'Logged out. Need to re-scan QR.'
        }
      } else if (connection === 'open') {
        connectionState = 'CONNECTED'
        currentQR = null
        console.log('[WA] Connected successfully!')
      }
    })

    sock.ev.on('messages.upsert', async (m: BaileysEventMap['messages.upsert']) => {
      if (m.type !== 'notify') return

      for (const msg of m.messages) {
        try {
          await handleIncomingMessage(msg)
        } catch (err) {
          console.error('[WA] Error handling message:', err)
        }
      }
    })

    return { success: true, message: 'Connecting...' }
  } catch (err) {
    connectionState = 'DISCONNECTED'
    lastError = err instanceof Error ? err.message : 'Unknown error'
    console.error('[WA] Start connection error:', err)
    return { success: false, error: lastError }
  }
}

// ============================================================
// HANDLE INCOMING MESSAGE
// ============================================================
async function handleIncomingMessage(msg: any) {
  // Skip if from self or status broadcast
  if (msg.key.fromMe) return
  if (msg.key.remoteJid === 'status@broadcast') return

  const from = msg.key.remoteJid || ''
  const phoneNumber = from.split('@')[0]

  // Extract text message
  let text = ''
  if (msg.message?.conversation) {
    text = msg.message.conversation
  } else if (msg.message?.extendedTextMessage?.text) {
    text = msg.message.extendedTextMessage.text
  } else if (msg.message?.imageMessage?.caption) {
    text = msg.message.imageMessage.caption
  } else {
    // Skip non-text for now
    return
  }

  console.log(`[WA] Message from ${phoneNumber}: ${text.substring(0, 80)}...`)

  // Forward to Next.js API for processing
  try {
    const response = await fetch('http://localhost:3000/api/wa/incoming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: phoneNumber,
        text,
        agentId: connectedAgentId,
        messageId: msg.key.id,
        timestamp: msg.messageTimestamp,
      }),
    })

    const data = await response.json()

    if (data.success && data.data?.response) {
      // Send reply via WA
      await sendWAMessage(phoneNumber, data.data.response)
      console.log(`[WA] Replied to ${phoneNumber}`)
    }
  } catch (err) {
    console.error('[WA] Forward to API error:', err)
    // Send error reply
    await sendWAMessage(phoneNumber, 'Maaf, sedang ada gangguan sistem. Coba lagi sebentar ya 🙏')
  }
}

// ============================================================
// SEND WA MESSAGE
// ============================================================
async function sendWAMessage(to: string, message: string): Promise<boolean> {
  if (!sock || connectionState !== 'CONNECTED') {
    console.error('[WA] Not connected, cannot send')
    return false
  }

  try {
    // Format phone number (ensure +62 or 62 prefix)
    let jid = to.replace(/[^0-9]/g, '')
    if (jid.startsWith('0')) jid = '62' + jid.substring(1)
    if (!jid.startsWith('62')) jid = '62' + jid
    jid = jid + '@s.whatsapp.net'

    await sock.sendMessage(jid, { text: message })
    return true
  } catch (err) {
    console.error('[WA] Send message error:', err)
    return false
  }
}

// ============================================================
// DISCONNECT
// ============================================================
async function disconnect() {
  if (sock) {
    try {
      await sock.logout()
    } catch {
      // Force close
    }
    sock = null
  }
  connectionState = 'DISCONNECTED'
  currentQR = null
  connectedAgentId = null
  connectedPhoneNumber = null
  console.log('[WA] Disconnected')
}

// ============================================================
// HTTP SERVER
// ============================================================
const PORT = 3001

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // ===== GET /status =====
    if (path === '/status' && method === 'GET') {
      return Response.json({
        success: true,
        data: {
          state: connectionState,
          agentId: connectedAgentId,
          phoneNumber: connectedPhoneNumber,
          lastError,
          timestamp: new Date().toISOString(),
        },
      }, { headers: corsHeaders })
    }

    // ===== GET /qr =====
    if (path === '/qr' && method === 'GET') {
      if (!currentQR) {
        return Response.json({
          success: false,
          error: 'No QR available. Connection state: ' + connectionState,
        }, { headers: corsHeaders })
      }

      // Generate QR as base64 image
      try {
        const qrImage = await QRCode.toDataURL(currentQR, { width: 300 })
        return Response.json({
          success: true,
          data: {
            qr: qrImage,
            state: connectionState,
          },
        }, { headers: corsHeaders })
      } catch (err) {
        return Response.json({
          success: false,
          error: 'Failed to generate QR image',
        }, { headers: corsHeaders })
      }
    }

    // ===== POST /connect/:agentId =====
    const connectMatch = path.match(/^\/connect\/(.+)$/)
    if (connectMatch && method === 'POST') {
      const agentId = connectMatch[1]
      const result = await startConnection(agentId)
      return Response.json({ success: result.success, ...result }, { headers: corsHeaders })
    }

    // ===== POST /disconnect =====
    if (path === '/disconnect' && method === 'POST') {
      await disconnect()
      return Response.json({ success: true, message: 'Disconnected' }, { headers: corsHeaders })
    }

    // ===== POST /send =====
    if (path === '/send' && method === 'POST') {
      const body = await req.json()
      const { to, message } = body

      if (!to || !message) {
        return Response.json({ success: false, error: 'to and message required' }, { headers: corsHeaders })
      }

      const sent = await sendWAMessage(to, message)
      return Response.json({ success: sent }, { headers: corsHeaders })
    }

    // ===== 404 =====
    return Response.json({ success: false, error: 'Not found' }, { status: 404, headers: corsHeaders })
  },
})

console.log(`[WA Bridge] Server running on http://localhost:${PORT}`)
console.log('[WA Bridge] Endpoints:')
console.log('  GET  /status          - Connection status')
console.log('  GET  /qr              - QR code (base64)')
console.log('  POST /connect/:agentId - Start connection')
console.log('  POST /disconnect      - Disconnect')
console.log('  POST /send            - Send message {to, message}')
