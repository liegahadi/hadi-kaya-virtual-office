import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })
async function main() {
  const dinaAgent = await prisma.agent.findFirst({ where: { name: 'Dina' } })
  
  await prisma.memory.create({
    data: {
      agentId: dinaAgent?.id || null,
      category: 'BERKAS',
      memoryType: 'long_term',
      title: 'Definisi: Konsumen Aktif',
      content: 'Konsumen "aktif" = konsumen yang sedang dalam proses (belum AKAD). Jika semua konsumen sudah di tahap AKAD, berarti tidak ada konsumen aktif. Jika ada konsumen yang belum lengkap dokumennya, berarti masih ada konsumen aktif yang sedang diproses.',
      resolution: '1. Saat user tanya "berapa konsumen aktif", hitung yang stage-nya BUKAN AKAD dan BUKAN SERAH_TERIMA\n2. "Belum ada konsumen aktif" = semua sudah AKAD atau belum ada sama sekali\n3. Jangan bilang "belum ada konsumen aktif" jika masih ada yang di stage DM/SURVEY/CLOSING/BOOKING/SLIK/PEMBERKASAN/SP3K\n4. Jelaskan ke user: "X konsumen aktif, Y sudah akad" jika ditanya',
      importance: 0.8,
      source: 'USER_FEEDBACK',
      version: 1,
      isActive: true,
    } as any,
  })
  console.log('✅ Memory: Definisi Konsumen Aktif')

  // Also add memory about not hallucinating customer data
  await prisma.memory.create({
    data: {
      agentId: dinaAgent?.id || null,
      category: 'BERKAS',
      memoryType: 'long_term',
      title: 'Anti-Halusinasi: Data Konsumen',
      content: 'Jangan menebak jumlah atau status konsumen. Selalu query database untuk data akurat. Jangan bilang "belum ada konsumen aktif" tanpa cek DB dulu.',
      resolution: '1. Selalu query getAllCustomers sebelum jawab pertanyaan tentang konsumen\n2. Jangan menebak stage atau dokumen yang belum diupload\n3. Jika data di DB menunjukkan 3 konsumen, jangan bilang 1\n4. Gunakan tool result sebagai sumber kebenaran, bukan asumsi',
      importance: 0.9,
      source: 'USER_FEEDBACK',
      version: 1,
      isActive: true,
    } as any,
  })
  console.log('✅ Memory: Anti-Halusinasi Data Konsumen')

  const total = await prisma.memory.count()
  console.log(`\nTotal memories: ${total}`)
}
main().then(() => process.exit(0))
