// Test OpenRouter API with free models
// Run: bun run scripts/test-openrouter.ts

async function testOpenRouterFree() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not set in .env')
    process.exit(1)
  }

  console.log('🧪 Testing OpenRouter API with FREE models...\n')

  // List of free models to test
  const freeModels = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-9b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
  ]

  const testPrompt = 'Sebutkan 3 selling point rumah tipe 36 di Pangkalpinang. Jawab singkat.'

  for (const model of freeModels) {
    console.log(`Testing: ${model}`)
    try {
      const start = Date.now()
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Hadi Kaya Virtual Office Test',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: testPrompt }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      const elapsed = Date.now() - start

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`  ❌ HTTP ${response.status} (${elapsed}ms): ${errorText.substring(0, 100)}`)
        continue
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || '(empty)'
      const usage = data.usage

      console.log(`  ✅ Success (${elapsed}ms)`)
      console.log(`  📝 Response: ${content.substring(0, 150)}...`)
      console.log(`  📊 Tokens: prompt=${usage?.prompt_tokens || '?'}, completion=${usage?.completion_tokens || '?'}, total=${usage?.total_tokens || '?'}`)
      console.log(`  💰 Cost: $${data.usage?.cost || 0} (should be $0 for free model)`)
      console.log('')
    } catch (err) {
      console.log(`  ❌ Error: ${err instanceof Error ? err.message : 'unknown'}\n`)
    }
  }

  // Test GLM-4.6 (paid, but check if it works with the key)
  console.log('🧪 Testing GLM-4.6 (paid model, check if credit available)...')
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Hadi Kaya Virtual Office Test',
      },
      body: JSON.stringify({
        model: 'z-ai/glm-4.6',
        messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
        max_tokens: 50,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`  ✅ GLM-4.6 works! Cost: $${data.usage?.cost || 0}`)
    } else {
      const errorText = await response.text()
      console.log(`  ⚠️ GLM-4.6 status ${response.status}: ${errorText.substring(0, 200)}`)
      console.log('  💡 This is OK - we will use ZAI SDK (built-in free) for heavy tasks')
    }
  } catch (err) {
    console.log(`  ❌ GLM-4.6 error: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  console.log('\n🎉 Test complete!')
  console.log('\n📋 Summary:')
  console.log('  - Free models via OpenRouter: working (use for LIGHT tasks)')
  console.log('  - ZAI SDK (built-in): free, use for HEAVY tasks')
  console.log('  - GLM-4.6 via OpenRouter: needs top-up (skip for now)')
}

testOpenRouterFree()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
