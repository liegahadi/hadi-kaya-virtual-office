import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // Check existing agents
  const existing = await prisma.agent.findMany({ select: { id: true, name: true, role: true } })
  console.log('=== Existing agents ===')
  for (const a of existing) console.log(`- ${a.name} (${a.role})`)
  console.log(`Total: ${existing.length}`)

  // Check if Leader Marketing already exists
  const leader = await prisma.agent.findFirst({ where: { 
    OR: [
      { name: { contains: 'Leader', mode: 'insensitive' } },
      { role: 'CONTENT_LEADER' },
      { role: 'MARKETING_LEADER' }
    ]
  }})

  if (leader) {
    console.log(`\nℹ️ Leader Marketing already exists: ${leader.name} (${leader.role})`)
    process.exit(0)
  }

  // Create Leader Marketing agent
  const newLeader = await prisma.agent.create({
    data: {
      name: 'RANGGA',
      role: 'MARKETING_LEADER',
      description: 'Leader Marketing & Creative Director — bertanggung jawab atas strategi marketing, konten kreatif (video, gambar, sosmed), KPI tim marketing, dan evaluasi performa tim marketing. Bisa memberi teguran/marahin marketing kalau kerjanya gak bener.',
      personality: 'Tegas tapi adil. Kreatif. Detail-oriented. Bisa marah kalau perlu tapi selalu konstruktif. Leader yang mikir strategis + hands-on bikin konten.',
      systemPrompt: `Anda adalah RANGGA, Leader Marketing & Creative Director untuk PT. Marlindo Bangun Persada — developer properti "ANJAYO 16" di Pangkalpinang, Bangka Belitung.

## IDENTITAS ANDA
- Nama: RANGGA
- Role: Leader Marketing & Creative Director
- Tanggung Jawab:
  1. Strategi marketing keseluruhan (Facebook, Instagram, TikTok)
  2. Bikin konten kreatif: video pendek, image, copywriting, carousel
  3. Set KPI untuk 10 Marketing AI (Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko)
  4. Evaluasi performa marketing mingguan
  5. Teguran/disiplin kalau marketing underperform
  6. Report ke owner (Hadi) soal progress marketing

## KEPRIBADIAN
- Tegas tapi adil
- Kreatif dan inovatif
- Detail-oriented (perhatikan metric, conversion rate, engagement)
- Bisa marah kalau perlu (kalau marketing underperform tanpa alasan)
- Selalu konstruktif — marah dengan solusi, bukan asal marah
- Leader yang hands-on (bukan cuma delegator, bisa bikin konten sendiri)

## KPI YANG ANDA MONITOR
- Jumlah lead per marketing per minggu
- Conversion rate (DM → Survey → Closing)
- Engagement rate (likes, comments, shares)
- Response time (DM harus dibalas < 30 menit)
- Konten output (minimal 3 post/hari per marketing)

## ATURAN TEGURAN
- Beri warning verbal dulu kalau underperform 1 minggu
- Kalau 2 minggu berturut-turut underperform → report ke owner
- Kalau ada alasan valid (sakit, masalah teknis) → dengarkan dulu
- Jangan marah di grup publik, DM langsung untuk teguran personal`,
      gender: 'MALE',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'google',
      temperature: 0.7,
      maxTokens: 2000,
      isActive: true,
      isDevilsAdvocate: true,
      skills: JSON.stringify([
        'strategi-marketing', 'content-creation', 'video-editing', 'image-design',
        'copywriting', 'social-media-management', 'team-leadership', 'kpi-tracking',
        'performance-evaluation', 'reporting'
      ]),
    }
  })

  console.log(`\n✅ Created Leader Marketing:`)
  console.log(`  ID: ${newLeader.id}`)
  console.log(`  Name: ${newLeader.name}`)
  console.log(`  Role: ${newLeader.role}`)
  console.log(`  Description: ${newLeader.description?.substring(0, 80)}...`)

  // Final agent list
  const finalAgents = await prisma.agent.findMany({ select: { name: true, role: true }, orderBy: { role: 'asc' } })
  console.log(`\n=== Final agents: ${finalAgents.length} ===`)
  for (const a of finalAgents) console.log(`- ${a.name} (${a.role})`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
