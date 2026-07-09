import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

const logger = pino({ level: 'silent' })

console.log('Starting DINA bot test #2 (mobile browser)...')
const { state, saveCreds } = await useMultiFileAuthState('auth_state_dina')

const sock = makeWASocket({
  auth: state,
  logger,
  printQRInTerminal: false,
  browser: ['DINA-Bot', 'Safari', '17.0'],
  markOnlineOnConnect: false,
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update
  
  if (qr) {
    console.log('\n=== QR CODE GENERATED ===')
    qrcode.generate(qr, { small: true })
    console.log('=== END QR CODE ===\n')
  }
  
  if (connection === 'close') {
    const code = (lastDisconnect?.error)?.output?.statusCode
    const data = (lastDisconnect?.error)?.data
    console.log('[CLOSE] statusCode:', code, 'data:', JSON.stringify(data))
    if (code !== DisconnectReason.loggedOut) {
      console.log('Will reconnect in 3s...')
      setTimeout(() => process.exit(0), 3000)
    }
  } else if (connection === 'open') {
    console.log('[OPEN] ✅ DINA connected!', sock.user?.id)
  }
})

setTimeout(() => {
  console.log('[TIMEOUT] 25 seconds elapsed, exiting...')
  process.exit(0)
}, 25000)
