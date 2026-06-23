// Test specific free models that are confirmed available
async function testModels() {
  const apiKey = process.env.OPENROUTER_API_KEY!
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
  ]

  const prompt = 'Saya ingin beli rumah tipe 36 di Pangkalpinang. DP-nya berapa?'

  for (const model of models) {
    console.log(`\nTesting: ${model}`)
    try {
      const start = Date.now()
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Hadi Kaya Test',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
        }),
      })

      const elapsed = Date.now() - start

      if (!res.ok) {
        const err = await res.text()
        console.log(`  ❌ HTTP ${res.status} (${elapsed}ms): ${err.substring(0, 100)}`)
        continue
      }

      const data = await res.json()
      const content = data.choices[0]?.message?.content || '(empty)'
      console.log(`  ✅ OK (${elapsed}ms)`)
      console.log(`  📝: ${content.substring(0, 200)}`)
      console.log(`  💰: $${data.usage?.cost || 0}`)
    } catch (e) {
      console.log(`  ❌ ${e instanceof Error ? e.message : 'error'}`)
    }
  }

  // Also test ZAI SDK (built-in)
  console.log('\nTesting ZAI SDK (built-in GLM-4.6, free)...')
  try {
    const ZAI = (await import('z-ai-web-dev-sdk').then(m => m.default || m)) as any
    const zai = await ZAI.create()
    const start = Date.now()
    const res = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    })
    const elapsed = Date.now() - start
    console.log(`  ✅ OK (${elapsed}ms)`)
    console.log(`  📝: ${res.choices[0]?.message?.content?.substring(0, 200)}`)
    console.log(`  💰: FREE (built-in)`)
  } catch (e) {
    console.log(`  ❌ ${e instanceof Error ? e.message : 'error'}`)
  }
}

testModels()
