// agents/index.js — All 15 agent configurations
//
// Each agent has:
//   - agentName: WA display name
//   - agentId: DB agent ID (set by owner after seeding, see scripts/add-leader-marketing.ts)
//   - agentRole: DOCUMENT | FINANCE | MATERIAL | CAO | MARKETING_LEADER | MARKETING
//   - apiEndpoint: which Vercel route handles this agent
//   - enabled: true if WA number is ready (owner has SIM card + scanned QR)
//
// Owner must set these env vars (per agent) BEFORE enabling:
//   - ${AGENT_NAME}_WHATSAPP — agent's WA number (e.g., DINA_WHATSAPP=6281...)
//   - ${AGENT_NAME}_GROUP_JID — group JID where this agent participates
//
// Common env vars (shared by all agents):
//   - OWNER_WHATSAPP — owner's WA number (628117176687)
//   - VERCEL_API_URL — https://hadi-kaya-virtual-office.vercel.app
//   - WORK_START, WORK_END — 9, 17 (default)

const OWNER = process.env.OWNER_WHATSAPP || '628117176687'
const VERCEL_URL = process.env.VERCEL_API_URL || 'https://hadi-kaya-virtual-office.vercel.app'
const WORK_START = parseInt(process.env.WORK_START || '9')
const WORK_END = parseInt(process.env.WORK_END || '17')

// Helper to build agent config from env
function buildAgent(opts) {
  const { name, role, apiEndpoint, defaultAgentId } = opts
  const whatsapp = process.env[`${name}_WHATSAPP`] || ''
  const groupJid = process.env[`${name}_GROUP_JID`] || ''
  const agentId = process.env[`${name}_AGENT_ID`] || defaultAgentId || ''
  // Agent is "enabled" only if WA number is set
  const enabled = !!whatsapp
  return {
    agentName: name,
    agentId,
    agentRole: role,
    ownerWhatsapp: OWNER,
    groupJid,
    vercelApiUrl: VERCEL_URL,
    workStart: WORK_START,
    workEnd: WORK_END,
    apiEndpoint,
    whatsappNumber: whatsapp,  // for logging only
    enabled,
  }
}

// All 15 agents
// Owner: enable agents one by one as SIM cards become available
// Just set ${NAME}_WHATSAPP env var to enable
export const AGENTS = [
  // === 4 STAFF AGENTS ===
  buildAgent({
    name: 'DINA',
    role: 'DOCUMENT',
    apiEndpoint: '/api/dina/chat',
    defaultAgentId: 'agent-dina',
  }),
  buildAgent({
    name: 'RINA',
    role: 'FINANCE',
    apiEndpoint: '/api/rina/chat',
    defaultAgentId: 'agent-rina',
  }),
  buildAgent({
    name: 'MITRA',
    role: 'MATERIAL',
    apiEndpoint: '/api/mitra/chat',
    defaultAgentId: 'agent-mitra',
  }),
  buildAgent({
    name: 'RATNA',
    role: 'CAO',
    apiEndpoint: '/api/ratna/chat',
    defaultAgentId: 'agent-ratna',
  }),

  // === 1 LEADER MARKETING (RANGGA) ===
  buildAgent({
    name: 'RANGGA',
    role: 'MARKETING_LEADER',
    apiEndpoint: '/api/rangga/chat',
    defaultAgentId: 'agent-rangga',
  }),

  // === 10 MARKETING AI ===
  buildAgent({ name: 'AYU', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-ayu' }),
  buildAgent({ name: 'BIMA', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-bima' }),
  buildAgent({ name: 'CITRA', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-citra' }),
  buildAgent({ name: 'DIAN', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-dian' }),
  buildAgent({ name: 'EKA', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-eka' }),
  buildAgent({ name: 'FAJAR', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-fajar' }),
  buildAgent({ name: 'GITA', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-gita' }),
  buildAgent({ name: 'HADI', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-hadi' }),
  buildAgent({ name: 'INDAH', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-indah' }),
  buildAgent({ name: 'JOKO', role: 'MARKETING', apiEndpoint: '/api/marketing/chat', defaultAgentId: 'agent-joko' }),
]

// Get only enabled agents
export function getEnabledAgents() {
  return AGENTS.filter(a => a.enabled)
}

// Get agent by name
export function getAgent(name) {
  return AGENTS.find(a => a.agentName === name.toUpperCase())
}

// Pretty-print agent status
export function printAgentStatus() {
  console.log('\n' + '='.repeat(70))
  console.log('🤖 AGENT REGISTRY — 15 agents total')
  console.log('='.repeat(70))
  for (const a of AGENTS) {
    const status = a.enabled ? '✅ ENABLED ' : '⏸️  DISABLED'
    const wa = a.whatsappNumber || '(no WA number set)'
    console.log(`${status} | ${a.agentName.padEnd(8)} | ${a.agentRole.padEnd(16)} | ${wa}`)
  }
  console.log('='.repeat(70))
  const enabled = getEnabledAgents().length
  console.log(`📊 Total: ${AGENTS.length} agents | ${enabled} enabled | ${AGENTS.length - enabled} pending SIM card`)
  console.log('='.repeat(70) + '\n')
}
