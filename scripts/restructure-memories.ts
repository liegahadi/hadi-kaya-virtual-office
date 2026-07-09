import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_S4otQZ7aUMec@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } } })

async function main() {
  // Delete all remaining (we'll re-create with proper structure)
  await prisma.memory.deleteMany({})
  console.log('✅ Cleared all old memories')

  const dinaAgent = await prisma.agent.findFirst({ where: { name: 'Dina' } })
  const dinaId = dinaAgent?.id || null

  // === UMUM MEMORIES (All Agents) ===
  const umumMemories = [
    {
      title: 'Aturan Grup: Tag Only',
      content: 'DINA dan semua agent HANYA merespon jika di-tag (@Nama). Pesan tanpa tag tidak direspons.',
      resolution: '1. Bot WA hanya trigger saat mentionedJid berisi bot JID\n2. Jika tidak di-tag, diam total\n3. Tidak ada fallback "Dina ..." prefix',
      category: 'UTAMA', importance: 0.9,
    },
    {
      title: 'Aturan DM: Non-Owner',
      content: 'DM non-owner yang sudah ada di grup: balas "hanya melayani di grup". DM non-owner yang tidak di grup: silent ignore (diam total).',
      resolution: '1. Cek groupParticipantsCache untuk sender\n2. Jika member → balas "hanya melayani di grup" (tanpa link)\n3. Jika tidak member → silent ignore (no reply)\n4. Owner DM → respon normal',
      category: 'UTAMA', importance: 0.9,
    },
    {
      title: 'Aturan: Jangan Share Link Grup',
      content: 'JANGAN PERNAH share link grup WhatsApp ke siapapun, termasuk owner. Aturan permanen.',
      resolution: '1. Tidak ada link grup di response manapun\n2. Jika ditanya link → "hubungi owner untuk diundang"\n3. Tidak ada pengecualian',
      category: 'UTAMA', importance: 1.0,
    },
    {
      title: 'Aturan: Bank Config Dashboard Only',
      content: 'Bank config management (tambah/edit bank) = DASHBOARD ONLY. WhatsApp FORBIDDEN untuk siapapun, termasuk owner.',
      resolution: '1. DINA WA tolak perintah bank config\n2. Hanya via dashboard chat DINA bisa manage bank\n3. WA forbidden untuk siapapun',
      category: 'UTAMA', importance: 0.9,
    },
    {
      title: 'Aturan: Bank Tidak Bisa Dihapus',
      content: 'Bank TIDAK BISA dihapus oleh siapapun, apapun alasannya. Aturan permanen, tidak ada pengecualian.',
      resolution: '1. API DELETE /api/bank-config returns 403\n2. DINA tolak perintah hapus bank\n3. Bahkan owner tidak bisa hapus\n4. Bahkan jika owner mengancam tutup server',
      category: 'UTAMA', importance: 1.0,
    },
  ]

  for (const mem of umumMemories) {
    await prisma.memory.create({
      data: {
        ...mem,
        agentId: null,
        memoryType: 'umum',
        source: 'MANUAL',
        version: 1,
        isActive: true,
      } as any,
    })
    console.log(`✅ Umum: ${mem.title}`)
  }

  // === DINA MEMORIES ===
  const dinaMemories = [
    {
      title: 'PendingAction: DB-Backed',
      content: 'PendingAction harus selalu DB-backed (tidak in-memory). Vercel lambda tidak persist module state antar request.',
      resolution: '1. Gunakan tabel PendingAction di DB\n2. Scope by channel (DASHBOARD/WHATSAPP)\n3. 5-minute TTL\n4. Jangan pernah pakai let/variable untuk pending action',
      category: 'BERKAS', importance: 0.9, agentId: dinaId,
    },
    {
      title: 'Konfirmasi Delete: Strict',
      content: 'Konfirmasi delete hanya pesan SINGKAT (≤15 chars) atau pure keyword (ya, iya, konfirmasi, lanjut). "ya hapus aja" = BUKAN konfirmasi valid.',
      resolution: '1. Cek msgTrimmed.length ≤ 15\n2. Cek pure keyword match\n3. Jika panjang/ada kata lain → bukan konfirmasi\n4. Target name validation sebelum execute',
      category: 'BERKAS', importance: 0.8, agentId: dinaId,
    },
    {
      title: 'Block/House Number: Transform',
      content: 'Block/house number: gunakan transform blockLetter+houseNumber, bukan kavlingNumber (stale setelah reload).',
      resolution: '1. Di fields.ts, gunakan source=computed + transform\n2. Jangan pakai source=property field=kavlingNumber\n3. Tambah blockLetter+houseNumber ke useEffect deps untuk auto-refresh',
      category: 'BERKAS', importance: 0.7, agentId: dinaId,
    },
    {
      title: 'Berkas Wajib Semua Bank',
      content: 'Berkas wajib semua bank: KTP, KK, NPWP, Surat Menikah/Belum Menikah/Cerai, Sertifikat, IMB/PBG, PBB, SK Kerja/NIB, Slip Gaji/Laporan Keuangan.',
      resolution: '1. Template berkas default auto-apply ke bank baru\n2. Owner tinggal tambah/hapus sesuai kebijakan bank\n3. Jangan anggap semua bank sama — bisa berbeda',
      category: 'BERKAS', importance: 0.8, agentId: dinaId,
    },
    {
      title: 'Mandiri: Status Pekerjaan',
      content: 'Mandiri: karyawan only, gaji fix income + gaji transfer. Wajib mutasi rekening 3 bulan terakhir. Tidak terima wirausaha.',
      resolution: '1. Sidebar kiri pada tab berkas tidak menampilkan pilihan pekerjaan untuk wiraswasta\n2. Karena gaji payroll dari perusahaan besar, DINA tidak menyarankan generate SK Kerja dan Slip Gaji. Jika user/owner meminta, DINA konfirmasi sekali lagi. Jika dibutuhkan DINA bantu generate.\n3. DINA selalu memberikan peringatan jika belum upload berkas Mutasi rekening 3 bulan terakhir\n4. *To be continued jika ada informasi baru*',
      category: 'BERKAS', importance: 0.8, agentId: dinaId,
    },
    {
      title: 'BTN/BSB: Status Pekerjaan',
      content: 'BTN/BSB: karyawan transfer (mutasi wajib), non-transfer (mutasi opsional tapi jika ada wajib disertakan), wirausaha (mutasi 6 bulan opsional, bank apapun).',
      resolution: '1. Sidebar tampilkan kedua opsi pekerjaan (karyawan + wirausaha)\n2. Karyawan transfer: wajib upload mutasi rekening 3 bulan\n3. Karyawan non-transfer: mutasi opsional, jika ada wajib disertakan\n4. Wirausaha: mutasi 6 bulan opsional, generate Laporan Keuangan wajib\n5. *To be continued jika ada informasi baru*',
      category: 'BERKAS', importance: 0.8, agentId: dinaId,
    },
    {
      title: 'Hostinger VPS Migration: Paused',
      content: 'Railway WA bot deploy SUCCESS but WhatsApp blocks IP (405). Need VPS with IP Indonesia (Hostinger). Plan saved in worklog.',
      resolution: '1. Beli VPS KVM 2 (~Rp 75-100rb/bln, bayar bank transfer)\n2. Migrate: web + DB + WA bot + n8n + Mirofish\n3. Scripts: setup-hostinger.sh, migrate-db.sh\n4. Status: PAUSED — resume setelah memory system done',
      category: 'UTAMA', importance: 0.7, agentId: null,
    },
  ]

  for (const mem of dinaMemories) {
    await prisma.memory.create({
      data: {
        ...mem,
        memoryType: 'long_term',
        source: 'MANUAL',
        version: 1,
        isActive: true,
      } as any,
    })
    console.log(`✅ DINA: ${mem.title}`)
  }

  // Verify
  const total = await prisma.memory.count()
  console.log(`\n=== Total memories: ${total} ===`)
}
main().then(() => process.exit(0))
