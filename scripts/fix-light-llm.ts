// Fix all agents: update lightLlmModel to valid OpenRouter free model
import { db } from '../src/lib/db'

async function main() {
  console.log('🔧 Updating all agents to use valid OpenRouter free model...')

  const result = await db.agent.updateMany({
    where: {
      OR: [
        { lightLlmModel: 'gemini-2.0-flash' },
        { lightLlmModel: null },
      ],
    },
    data: {
      lightLlmModel: 'nvidia/nemotron-3-nano-30b-a3b:free',
      lightLlmProvider: 'openrouter',
    },
  })

  console.log(`✅ Updated ${result.count} agents`)
  console.log('   New light model: nvidia/nemotron-3-nano-30b-a3b:free')

  // Verify
  const sample = await db.agent.findMany({
    select: { name: true, role: true, lightLlmModel: true, lightLlmProvider: true },
    take: 5,
  })
  console.log('\n📋 Sample agents:')
  for (const a of sample) {
    console.log(`   ${a.name} (${a.role}): ${a.lightLlmModel} via ${a.lightLlmProvider}`)
  }
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
