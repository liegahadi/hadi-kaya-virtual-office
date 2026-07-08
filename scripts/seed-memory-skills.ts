// Seed initial skills + memories for all agents
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  console.log('=== Seeding Skills ===')

  // 1. Prompt Engineer Skill (umum — all agents)
  await prisma.skill.upsert({
    where: { id: 'skill-prompt-engineer' },
    update: {},
    create: {
      id: 'skill-prompt-engineer',
      name: 'prompt-engineer',
      displayName: 'Prompt Engineer',
      description: 'Expert prompt engineer untuk design, optimize, dan evaluate prompts untuk LLM. Gunakan saat perlu generate dokumen, image generation, atau task yang butuh prompt optimal.',
      prompt: `Expert prompt engineer specializing in designing, optimizing, and evaluating prompts that maximize LLM performance.

Core Workflow:
1. Understand requirements — Define task, success criteria, constraints
2. Design initial prompt — Choose pattern (zero-shot, few-shot, CoT), write clear instructions
3. Test and evaluate — Run diverse test cases, measure quality
4. Iterate and optimize — Make one change at a time; refine based on failures
5. Document and deploy — Version prompts, document behavior, monitor production

MUST DO:
- Test prompts with diverse, realistic inputs including edge cases
- Use few-shot examples that match target distribution
- Consider token costs and latency in design

MUST NOT DO:
- Deploy prompts without systematic evaluation
- Use few-shot examples that contradict instructions
- Make multiple changes simultaneously when debugging`,
      category: 'UMUM',
      agentId: null,
      source: 'PROMPT_ENGINEER',
      isActive: true,
      version: 1,
    },
  })
  console.log('✅ Prompt Engineer skill')

  // 2. Business Doc Generator (DINA)
  await prisma.skill.upsert({
    where: { id: 'skill-business-doc-generator' },
    update: {},
    create: {
      id: 'skill-business-doc-generator',
      name: 'business-doc-generator',
      displayName: 'Business Document Generator',
      description: 'Generate business documents (laporan keuangan, SK kerja, slip gaji, proposal) dengan format profesional dan rapi.',
      prompt: `Professional business document generator. Generate dokumen bisnis dengan:
- Format rapi dan profesional
- Struktur yang jelas (header, body, footer)
- Data sesuai input (tidak disimplify, exact seperti diberikan)
- Bahasa formal Indonesia
- Kop surat jika diberikan
- Bisa dalam format .docx untuk Google Docs

Output harus variatif per konsumen (tidak template sama persis).`,
      category: 'DINA',
      agentId: null,
      source: 'CAVINHUANG',
      isActive: true,
      version: 1,
    },
  })
  console.log('✅ Business Doc Generator skill')

  // 3. Generate Laporan Keuangan (DINA)
  await prisma.skill.upsert({
    where: { id: 'skill-generate-laporan-keuangan' },
    update: {},
    create: {
      id: 'skill-generate-laporan-keuangan',
      name: 'generate-laporan-keuangan',
      displayName: 'Generate Laporan Keuangan Wirausaha',
      description: 'Generate laporan keuangan untuk konsumen wirausaha. Format Laporan Laba Rugi formal (Pendapatan, HPP, Laba Kotor, Biaya Operasional, Laba Bersih). Data dari owner via chat, tidak disimplify.',
      prompt: `Generate Laporan Keuangan untuk konsumen wirausaha dalam format Laporan Laba Rugi formal.

Struktur:
1. Header: Kop surat perusahaan konsumen + nama dokumen + periode
2. PENDAPATAN: Semua sumber pendapatan (range min-max per bulan)
3. HPP (Harga Pokok Penjualan): Biaya langsung produksi
4. LABA KOTOR: Pendapatan - HPP
5. BIAYA OPERASIONAL: List semua biaya operasional
6. LABA BERSIH: Laba Kotor - Biaya Operasional

Rules:
- Data TIDAK disimplify — exact seperti yang owner berikan
- Range = per bulan
- Format Rupiah: Rp xxx.xxx.xxx
- Variatif per konsumen (tidak template sama persis)
- Output .docx untuk Google Docs`,
      category: 'DINA',
      agentId: null,
      source: 'MANUAL',
      isActive: true,
      version: 1,
    },
  })
  console.log('✅ Generate Laporan Keuangan skill')

  // 4. Generate SK Kerja + Slip Gaji (DINA)
  await prisma.skill.upsert({
    where: { id: 'skill-generate-sk-slip' },
    update: {},
    create: {
      id: 'skill-generate-sk-slip',
      name: 'generate-sk-slip',
      displayName: 'Generate SK Kerja + Slip Gaji',
      description: 'Generate SK Kerja + 7 Slip Gaji (6 bulan ke belakang + current) untuk konsumen karyawan. Output .docx ke Google Drive.',
      prompt: `Generate SK Kerja + Slip Gaji untuk konsumen karyawan.

SK Kerja:
- Surat Keterangan Kerja dari perusahaan tempat konsumen bekerja
- Format formal dengan kop surat
- Isi: nama, NIK, jabatan, lama bekerja, gaji

Slip Gaji (7 lembar):
- 6 bulan ke belakang + 1 bulan current
- Isi: gaji pokok, tunjangan tetap, tunjangan variabel, potongan, gaji bersih
- Kop surat sama dengan SK Kerja

Output: 1 file .docx berisi SK Kerja + 7 slip gaji. Save ke Google Drive di folder konsumen.`,
      category: 'DINA',
      agentId: null,
      source: 'MANUAL',
      isActive: true,
      version: 1,
    },
  })
  console.log('✅ Generate SK Kerja + Slip Gaji skill')

  console.log('\n=== Seeding Umum Memories (All Agents) ===')

  // Umum memories for all agents
  const umumMemories = [
    { content: 'Grup WhatsApp: DINA dan semua agent HANYA merespon jika di-tag (@Nama). Pesan tanpa tag tidak direspons.', category: 'UTAMA', importance: 0.9 },
    { content: 'DM non-owner yang sudah ada di grup: balas "hanya melayani di grup". DM non-owner yang tidak di grup: silent ignore (diam total).', category: 'UTAMA', importance: 0.9 },
    { content: 'JANGAN PERNAH share link grup WhatsApp ke siapapun, termasuk owner. Aturan permanen.', category: 'UTAMA', importance: 1.0 },
    { content: 'Bank config management (tambah/edit bank) = DASHBOARD ONLY. WhatsApp FORBIDDEN untuk siapapun, termasuk owner.', category: 'UTAMA', importance: 0.9 },
    { content: 'Bank TIDAK BISA dihapus oleh siapapun, apapun alasannya. Aturan permanen, tidak ada pengecualian.', category: 'UTAMA', importance: 1.0 },
  ]

  for (const mem of umumMemories) {
    const existing = await prisma.memory.findFirst({ where: { content: mem.content, memoryType: 'umum' } })
    if (!existing) {
      await prisma.memory.create({
        data: {
          ...mem,
          memoryType: 'umum',
          source: 'MANUAL',
          version: 1,
          isActive: true,
        },
      })
      console.log(`✅ Umum memory: ${mem.content.substring(0, 50)}...`)
    }
  }

  console.log('\n=== Seeding DINA Memories ===')

  const dinaAgent = await prisma.agent.findFirst({ where: { name: 'Dina' } })
  if (dinaAgent) {
    const dinaMemories = [
      { content: 'PendingAction harus selalu DB-backed (tidak in-memory). Vercel lambda tidak persist module state antar request.', category: 'BERKAS', importance: 0.9 },
      { content: 'Konfirmasi delete: hanya pesan SINGKAT (≤15 chars) atau pure keyword (ya, iya, konfirmasi, lanjut). "ya hapus aja" = BUKAN konfirmasi valid.', category: 'BERKAS', importance: 0.8 },
      { content: 'Block/house number: gunakan transform blockLetter+houseNumber, bukan kavlingNumber (stale setelah reload).', category: 'BERKAS', importance: 0.7 },
      { content: 'Berkas wajib semua bank: KTP, KK, NPWP, Surat Menikah/Belum Menikah/Cerai, Sertifikat, IMB/PBG, PBB, SK Kerja/NIB, Slip Gaji/Laporan Keuangan.', category: 'BERKAS', importance: 0.8 },
      { content: 'Mandiri: karyawan only, gaji fix income + gaji transfer. Wajib mutasi rekening 3 bulan terakhir. Tidak terima wirausaha.', category: 'BERKAS', importance: 0.8 },
      { content: 'BTN/BSB: karyawan transfer (mutasi wajib), non-transfer (mutasi opsional), wirausaha (mutasi 6 bulan opsional). Bank apapun.', category: 'BERKAS', importance: 0.8 },
    ]

    for (const mem of dinaMemories) {
      const existing = await prisma.memory.findFirst({ where: { content: mem.content, agentId: dinaAgent.id } })
      if (!existing) {
        await prisma.memory.create({
          data: {
            ...mem,
            agentId: dinaAgent.id,
            memoryType: 'long_term',
            source: 'CONVERSATION',
            version: 1,
            isActive: true,
          },
        })
        console.log(`✅ DINA memory: ${mem.content.substring(0, 50)}...`)
      }
    }
  }

  console.log('\n=== Done! ===')
  const totalMemories = await prisma.memory.count()
  const totalSkills = await prisma.skill.count()
  console.log(`Total memories: ${totalMemories}`)
  console.log(`Total skills: ${totalSkills}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
