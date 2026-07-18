// Test /api/documents/generate-laporan-keuangan route secara langsung (tanpa server)
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

async function test() {
  console.log('=== Test ZAI SDK langsung ===')
  
  // Cek config
  const configPath = path.join(process.cwd(), '.z-ai-config')
  console.log('Config path:', configPath)
  console.log('Config exists:', fs.existsSync(configPath))
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    console.log('Config baseUrl:', config.baseUrl)
    console.log('Config apiKey:', config.apiKey ? '***' : 'MISSING')
  }
  
  try {
    const zai = await ZAI.create()
    console.log('✅ ZAI initialized')
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a helpful assistant. Reply with "OK" only.' },
        { role: 'user', content: 'test' },
      ],
      thinking: { type: 'disabled' },
    })
    
    console.log('✅ ZAI chat completion OK')
    console.log('Response:', completion.choices[0]?.message?.content)
  } catch (err) {
    console.error('❌ ZAI error:', err)
  }
}

test().catch(console.error)
