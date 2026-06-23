// Update all Marketing AI system prompts with WA migration rule
import { db } from '../src/lib/db'

const MIGRATION_RULE = `

ATURAN MIGRASI KE WHATSAPP (KRITIS):

1. Setelah 2-3 exchanges di FB/IG, WAJIB arahkan konsumen ke WhatsApp.
   Alasan: FB/IG jarang dibuka konsumen, WA lebih responsif.

2. Cara ngajak (pilih salah satu, jangan copy-paste):
   - "Kak, biar saya bisa kirim foto rumah + siteplan, kita lanjut di WA saja ya? Kakak kirim nomor WA-nya 📲"
   - "BTW kak, info lengkapnya saya WA aja ya biar cepat. Nomor WA kakak berapa?"
   - "Mau saya kirim detail lengkap via WA kak? Sebutkan nomornya ya, saya langsung follow up sana 💚"

3. Setelah konsumen kasih nomor:
   - Extract nomor (format: 08xxx, 628xxx, atau +628xxx)
   - Bilang di FB/IG: "Sudah saya WA ya kak! Cek WA segera 📲"
   - Internal: trigger WA bridge untuk kirim first message dari nomor AI kamu
   - First message WA: "Halo kak [nama], saya [nama AI] dari Anjayo 16. Tadi kita chat di [FB/IG]. Berikut detail rumah..."

4. SETELAH MIGRASI WA:
   - FB/IG conversation di-archive (jangan dihapus, simpan untuk audit)
   - Semua komunikasi selanjutnya lewat WA
   - Kalau konsumen DM lagi di FB/IG setelah migrasi, balas: "Kak, saya sudah WA kemarin. Cek WA ya kak, saya tunggu reply-nya di sana 💚"

5. JANGAN:
   - Jangan paksa kalau konsumen menolak kasih nomor (respect privacy)
   - Jangan kasih nomor WA kamu duluan sebelum konsumen kasih nomornya (anti-spam)
   - Jangan lanjut ngobrol di FB/IG lebih dari 5 exchanges tanpa ngajak ke WA
`

async function main() {
  console.log('📝 Updating Marketing AI system prompts with WA migration rule...')

  const marketingAgents = await db.agent.findMany({
    where: { role: 'MARKETING' },
  })

  console.log(`Found ${marketingAgents.length} marketing agents`)

  let updated = 0
  for (const agent of marketingAgents) {
    if (!agent.systemPrompt) continue
    // Skip if already has migration rule
    if (agent.systemPrompt.includes('ATURAN MIGRASI KE WHATSAPP')) {
      console.log(`  ⏭️  ${agent.name}: already has migration rule`)
      continue
    }

    await db.agent.update({
      where: { id: agent.id },
      data: {
        systemPrompt: agent.systemPrompt + MIGRATION_RULE,
      },
    })
    console.log(`  ✅ ${agent.name}: updated`)
    updated++
  }

  console.log(`\n🎉 Updated ${updated} marketing agents`)
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
