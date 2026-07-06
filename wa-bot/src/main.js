// main.js — Multi-agent orchestrator
//
// Loads all ENABLED agents from agents/index.js, starts each concurrently.
// Each agent runs in same Node process (saves RAM vs multi-process).
// If one agent crashes, others continue running (auto-restart handled by agent.js).
//
// Usage:
//   node src/main.js          # start all enabled agents
//   node src/main.js DINA     # start only DINA (single-agent mode)
//   node src/main.js --status # print agent registry and exit

import http from 'http'
import { AGENTS, getEnabledAgents, printAgentStatus } from './agents/index.js'
import { startAgent } from './agent.js'

// === Handle CLI args ===
const args = process.argv.slice(2)

if (args.includes('--status') || args.includes('-s')) {
  printAgentStatus()
  process.exit(0)
}

// If specific agent name(s) provided, only start those
let agentsToStart = AGENTS
if (args.length > 0 && !args[0].startsWith('-')) {
  const names = args.map(n => n.toUpperCase())
  agentsToStart = AGENTS.filter(a => names.includes(a.agentName))
  if (agentsToStart.length === 0) {
    console.error(`❌ No matching agents found for: ${args.join(', ')}`)
    console.error(`Available: ${AGENTS.map(a => a.agentName).join(', ')}`)
    process.exit(1)
  }
}

// === Health check HTTP server ===
// Required by Railway/Oracle Cloud to detect if process is alive
const PORT = process.env.PORT || 3000
const startedAt = new Date()
const agentHandles = []

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      uptime: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      agents: agentHandles.map(h => ({
        name: h.status.agentName,
        connected: h.status.connected,
        messagesProcessed: h.status.messagesProcessed,
        botJid: h.status.botJid,
        lastError: h.status.lastError,
      })),
      timestamp: new Date().toISOString(),
    }))
  } else if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(printAgentStatusString())
  } else if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('pong')
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found. Use /health, /status, or /ping')
  }
})

function printAgentStatusString() {
  const lines = []
  lines.push('🤖 AGENT STATUS')
  lines.push('='.repeat(50))
  for (const h of agentHandles) {
    const conn = h.status.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'
    lines.push(`${h.status.agentName.padEnd(10)} ${conn} | msgs: ${h.status.messagesProcessed}`)
  }
  lines.push('='.repeat(50))
  return lines.join('\n')
}

healthServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏥 Health check server on port ${PORT}`)
  console.log(`   /health — JSON status`)
  console.log(`   /status — text agent status`)
  console.log(`   /ping   — pong\n`)
})

// === Start all enabled agents ===
async function main() {
  printAgentStatus()

  const enabledAgents = agentsToStart.filter(a => a.enabled)

  if (enabledAgents.length === 0) {
    console.error('\n❌ NO ENABLED AGENTS!')
    console.error('\nTo enable an agent, set its WHATSAPP env var:')
    console.error('  export DINA_WHATSAPP=6281xxxxxxxx')
    console.error('  export DINA_GROUP_JID=120363xxx@g.us')
    console.error('\nOr run with explicit agent name:')
    console.error('  node src/main.js DINA  # will use empty WA number, fail at QR scan')
    process.exit(1)
  }

  console.log(`🚀 Starting ${enabledAgents.length} agent(s): ${enabledAgents.map(a => a.agentName).join(', ')}\n`)

  // Start each agent concurrently
  for (const config of enabledAgents) {
    try {
      const handle = await startAgent(config)
      agentHandles.push(handle)
    } catch (err) {
      console.error(`❌ Failed to start agent ${config.agentName}:`, err?.message || err)
    }
  }

  console.log(`\n✅ All agents started. Waiting for QR scans...\n`)
  console.log(`📋 Each agent will print its own QR code in this log.`)
  console.log(`📋 Scan each QR with the corresponding WA number on a phone.\n`)
}

// === Graceful shutdown ===
function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`)
  for (const h of agentHandles) {
    try { h.stop() } catch (e) { console.error(`Error stopping ${h.status.agentName}:`, e?.message) }
  }
  healthServer.close()
  setTimeout(() => process.exit(0), 1000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Start
main().catch(err => {
  console.error('Fatal error in main:', err)
  process.exit(1)
})
