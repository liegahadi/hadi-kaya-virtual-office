// Test generate-laporan-keuangan route dengan mock request
import ZAI from 'z-ai-web-dev-sdk'

const systemPrompt = `Anda adalah auditor keuangan. Reply dengan 'OK' saja.`
const userPrompt = 'Test: buat 1 halaman laporan keuangan sederhana untuk laundry dengan laba 5jt'

async function test() {
  console.log('=== Test AI generate (mini prompt) ===')
  try {
    const zai = await ZAI.create()
    console.log('ZAI initialized OK')
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })
    
    const html = completion.choices[0]?.message?.content || ''
    console.log('Response length:', html.length)
    console.log('First 200 chars:', html.substring(0, 200))
  } catch (err: any) {
    console.error('ERROR:', err?.message || err)
    console.error('Stack:', err?.stack)
  }
}

test()
