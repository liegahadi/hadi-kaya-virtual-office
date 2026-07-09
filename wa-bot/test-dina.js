import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

const logger = pino({ level: 'debug' })

console.log('Starting DINA bot test...')
const { state, saveCreds } = await useMultiFileAuthState('auth_state_dina')

const sock = makeWASocket({
  auth: state,
  logger,
  printQRInTerminal: true,
  browser: ['DINA-Bot', 'Chrome', '1.0.0'],
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', (update) => {
  console.log('[CONNECTION UPDATE]', JSON.stringify(update).substring(0, 200))
  
  const { connection, lastDisconnect, qr } = update
  
  if (qr) {
    console.log('\n=== QR CODE GENERATED ===')
    qrcode.generate(qr, { small: true })
    console.log('=== END QR CODE ===\n')
  }
  
  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
    console.log('[CLOSE] Reason:', (lastDisconnect?.error)?.output?.statusCode, 'Reconnect:', shouldReconnect)
    if (shouldReconnect) {
      setTimeout(() => process.exit(0), 2000)
    }
  } else if (connection === 'open') {
    console.log('[OPEN] ✅ DINA connected!', sock.user?.id)
  }
})

setTimeout(() => {
  console.log('[TIMEOUT] 30 seconds elapsed, exiting...')
  process.exit(0)
}, 30000)
