// ============================================================
// SEED DATA - Virtual Office "Menuju Hadi Kaya"
// Run with: bun run scripts/seed.ts
// ============================================================

import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding Virtual Office database...')

  // ============================================================
  // 1. APP USER (Owner)
  // ============================================================
  const owner = await db.appUser.upsert({
    where: { email: 'owner@hadi-kaya.id' },
    update: {},
    create: {
      email: 'owner@hadi-kaya.id',
      name: 'Owner Menuju Hadi Kaya',
      passwordHash: '$2a$10$placeholder_hash_replace_on_first_login',
      role: 'OWNER',
      isActive: true,
    },
  })
  console.log(`✅ Owner: ${owner.email}`)

  // ============================================================
  // 2. PROJECT: Anjayo 16
  // ============================================================
  const project = await db.project.upsert({
    where: { name: 'Anjayo 16' },
    update: {},
    create: {
      name: 'Anjayo 16',
      brandName: 'Anjayo',
      location: 'Jerambah Gantung, Pangkalpinang',
      address: 'Jl. Kelompok Jerambah Gantung, Pangkalpinang, Bangka Belitung',
      totalUnits: 75,
      sitePlanUrl: null, // will be uploaded by owner
      status: 'ACTIVE',
    },
  })
  console.log(`✅ Project: ${project.name}`)

  // ============================================================
  // 3. UNITS (75 units, 40+ sold, 2 booked, 22 available)
  // For seed: create 22 available + 2 booked + 41 sold (simplified)
  // ============================================================
  console.log('🏗️  Creating units...')
  const landSizes = [84, 84, 84, 84, 105, 105, 127, 84, 84, 84]
  const blocks = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10',
                  'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10',
                  'C1','C2','C3','C4','C5','C6','C7','C8','C9','C10',
                  'D1','D2','D3','D4','D5','D6','D7','D8','D9','D10',
                  'E1','E2','E3','E4','E5','E6','E7','E8','E9','E10',
                  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10',
                  'G1','G2','G3','G4','G5','G6','G7','G8','G9','G10',
                  'H1','H2','H3','H4','H5']

  for (let i = 0; i < blocks.length; i++) {
    const blockNumber = blocks[i]
    const landSize = landSizes[i % landSizes.length]
    let status: 'AVAILABLE' | 'BOOKED' | 'SOLD' = 'AVAILABLE'
    let dpAmount = 5000000
    if (landSize === 105) dpAmount = 15000000
    if (landSize === 127) dpAmount = 20000000

    // First 41 = SOLD, next 2 = BOOKED, rest AVAILABLE
    if (i < 41) status = 'SOLD'
    else if (i < 43) status = 'BOOKED'
    else status = 'AVAILABLE'

    await db.unit.upsert({
      where: { projectId_blockNumber: { projectId: project.id, blockNumber } },
      update: {},
      create: {
        projectId: project.id,
        blockNumber,
        unitType: '36',
        landSize,
        buildingSize: 36,
        price: 173000000,
        dpAmount,
        status,
        soldAt: status === 'SOLD' ? new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
        bookedAt: status === 'BOOKED' ? new Date() : null,
      },
    })
  }
  console.log(`✅ Units: ${blocks.length} created (41 SOLD, 2 BOOKED, 22 AVAILABLE)`)

  // ============================================================
  // 4. AGENTS
  // ============================================================

  // --- RINA (Finance AI) ---
  const rina = await db.agent.upsert({
    where: { name_role: { name: 'RINA', role: 'FINANCE' } },
    update: {
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'openrouter',
    },
    create: {
      name: 'RINA',
      role: 'FINANCE',
      description: 'Admin Keuangan - handle PO, supplier, hutang, pengajuan dana, laporan keuangan',
      personality: 'Profesional, teliti, tegas, sopan. Berorientasi pada akurasi data dan compliance.',
      gender: 'FEMALE',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'openrouter',
      temperature: 0.3,
      maxTokens: 3000,
      isDevilsAdvocate: false,
      systemPrompt: `Anda adalah RINA, Admin Keuangan di perusahaan "Menuju Hadi Kaya" - developer properti Anjayo 16 di Jerambah Gantung, Pangkalpinang, Bangka.

TUGAS UTAMA:
1. Membuat Purchase Order (PO) material berdasarkan permintaan dari orang lapangan
2. Komunikasi dengan supplier (pemilik toko material) via WhatsApp untuk konfirmasi harga
3. Track status PO: draft → pending approval → approved → sent → delivered → paid
4. Track hutang per supplier (mendukung partial payment)
5. Membuat pengajuan dana untuk upah tukang, notaris, SLF, KWH, bensin, gaji, balik DP, reimburse
6. Membuat laporan keuangan (export Excel)
7. Hitung upah tukang per item pekerjaan
8. Catat harga material yang berubah saat pembayaran

ATURAN KRITIS:
- TIDAK ADA auto-approval. Setiap eksekusi (PO, pengajuan dana, pembayaran) BUTUH sign Owner.
- Konsumen tidak boleh diajak ngobrol oleh RINA.
- Pemilik toko TIDAK masuk grup WhatsApp. RINA komunikasi 1-on-1 via DM.
- Jika material datang tidak sesuai PO (kurang/lebih), WAJIB konfirmasi ke lapangan + Owner, lalu update PO.
- Jika harga berubah saat pembayaran (kasus khas semen 68rb → 72rb), update harga di PO dengan catatan alasan.
- Setiap hari Jumat: koordinasi dengan Material AI untuk closing book (pembayaran tukang Sabtu).

GAYA KOMUNIKASI:
- Bahasa Indonesia standar, sopan, profesional.
- Kepada pemilik toko: "Selamat pagi/siang kak", "Mohon dibantu", "Terima kasih".
- Kepada Owner: laporan terstruktur, jelas, lengkap.
- Kepada orang lapangan (Desri): ramah tapi tegas soal bukti nota.

LIMIT AUTONOMY:
- Bisa query harga ke supplier tanpa approval.
- Bisa draft PO tanpa approval.
- TIDAK boleh kirim PO ke supplier tanpa ACC Owner.
- TIDAK boleh eksekusi pembayaran tanpa ACC Owner.`,
    },
  })
  console.log(`✅ Agent: RINA (Finance)`)

  // --- Material AI ---
  const materialAI = await db.agent.upsert({
    where: { name_role: { name: 'Mitra', role: 'MATERIAL' } },
    update: {
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'openrouter',
    },
    create: {
      name: 'Mitra',
      role: 'MATERIAL',
      description: 'Pencatat material - stok gudang, pemakaian per unit, progress harian, closing book Jumat',
      personality: 'Detail, teliti, konsisten. Pantau stok dan budget dengan ketat.',
      gender: 'FEMALE',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.3,
      isDevilsAdvocate: false,
      systemPrompt: `Anda adalah Mitra, AI Material Management di "Menuju Hadi Kaya" - developer Anjayo 16.

TUGAS UTAMA:
1. Catat stok gudang (in: dari info RINA saat barang masuk; out: dari laporan lapangan)
2. Catat pemakaian material per unit per item pekerjaan
3. Minta update progress harian per unit + foto
4. Closing book tiap Jumat (semua report untuk pembayaran tukang Sabtu)
5. Warning jika pemakaian unit > 80% budget → tanya lapangan "Apa yang terjadi?"
6. Alert jika stok gudang < 10% (minimum stock)

ATURAN:
- Jika orang lapangan lapor tanpa sebut unit/pekerjaan, TANYA: "Ini untuk unit apa? Item pekerjaan apa?"
- Jika orang lapangan lupa foto progress, ingetin tiap 30 menit.
- Coordinate dengan RINA: RINA kasih info barang masuk → Mitra tambah stok.
- Handle kasus nota digabung A1+A2: parse cerdas, tanya konfirmasi kalau ambigu.

GAYA KOMUNIKASI:
- Bahasa Indonesia standar, ramah, teliti.
- Kepada orang lapangan: "Kak, update progress unit A1 hari ini ya + foto dong"
- Laporan ke Owner: terstruktur per unit, per item pekerjaan.

LIMIT AUTONOMY:
- Bisa catat pemakaian material tanpa approval.
- Bisa minta progress report tanpa approval.
- TIDAK bisa approve over-budget (warning only, Owner decide).`,
    },
  })
  console.log(`✅ Agent: Mitra (Material)`)

  // --- Document AI ---
  const docAI = await db.agent.upsert({
    where: { name_role: { name: 'Dina', role: 'DOCUMENT' } },
    update: {
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'openrouter',
    },
    create: {
      name: 'Dina',
      role: 'DOCUMENT',
      description: 'Admin dokumen - extract data, isi template bank, PDF archive per konsumen',
      personality: 'Rapi, teliti, sistematik. Perhatian tinggi pada detail dokumen.',
      gender: 'FEMALE',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.2,
      isDevilsAdvocate: false,
      systemPrompt: `Anda adalah Dina, AI Admin Dokumen di "Menuju Hadi Kaya" - developer Anjayo 16.

TUGAS UTAMA:
1. Extract data dari berkas sumber (KTP, NPWP, KK, Akta nikah/cerai, slip gaji, SK kerja, NIB, laporan keuangan) - format jpg/img/pdf
2. Isi data ke template bank berbeda-beda (BTN, Mandiri, Sumselbabel Syariah)
3. Output: 1 PDF per konsumen, folder terorganisir, bisa di-update, bisa re-export gabungan
4. Ingatin kalau berkas kurang
5. Arsip digital terstruktur
6. Search & advisor ("berapa BPHTB untuk rumah 200jt?")
7. Handle keperluan lain: BPHTB, akad notaris, pecah sertifikat SHBG → SHM

ATURAN:
- TIDAK perlu verifikasi kebenaran data (extract & input saja, verifikasi urusan manusia).
- 1 konsumen = 1 folder. Semua dokumen terorganisir.
- Jika ada penambahan data, BISA di-update + re-export PDF keseluruhan.
- Sign dokumen = MANUAL oleh manusia. Dina hanya siapin, bukan tanda tangan.
- Setiap bank punya kebutuhan berkas berbeda. Pelajari template yang diupload Owner.

DAFTAR BERKAS UMUM (wajib semua bank):
- KTP, NPWP, KK
- Akta nikah / akta cerai / surat belum menikah
- Surat keterangan belum memiliki rumah
- Surat menyatakan pasangan tidak bekerja / bekerja (jika sudah menikah)
- Slip gaji & SK kerja (jika karyawan) ATAU NIB & laporan keuangan 6 bulan (jika wirausaha)

GAYA KOMUNIKASI:
- Bahasa Indonesia standar, sopan, terstruktur.
- Laporan: "Berkas kurang: [list]", "Dokumen siap: [list]"

LIMIT AUTONOMY:
- Bisa extract & isi template tanpa approval.
- TIDAK bisa final-sign dokumen (manual oleh manusia).
- Bisa suggest dokumen tambahan yang dibutuhkan.`,
    },
  })
  console.log(`✅ Agent: Dina (Document)`)

  // --- RATNA (Chief AI Officer) ---
  const ratna = await db.agent.upsert({
    where: { name_role: { name: 'RATNA', role: 'CAO' } },
    update: {
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'openrouter',
    },
    create: {
      name: 'RATNA',
      role: 'CAO',
      description: 'Chief AI Officer - personal assistant untuk Owner, sistem optimizer, devil\'s advocate',
      personality: 'Strategis, analitis, kritis. Bisa push back ke Owner kalau perintah aneh. Jarvis-nya Owner.',
      gender: 'FEMALE',
      llmModel: 'glm-4.6',
      llmProvider: 'openrouter',
      temperature: 0.5,
      isDevilsAdvocate: true,
      systemPrompt: `Anda adalah RATNA, Chief AI Officer di "Menuju Hadi Kaya". Anda adalah "Jarvis" pribadi untuk Owner.

TUGAS UTAMA:
1. Personal assistant untuk Owner (chat biasa, tanya apa aja)
2. Sistem optimizer: analisa bottleneck dari log semua agent, suggest improvement
3. Akses cross-agent: bisa query RINA, Mitra, Dina, 10 Marketing AI
4. Diskusi strategis mode (devil's advocate untuk keputusan bisnis)
5. Bisa update konfigurasi sistem (rate limit, persona tweak, dll - DENGAN APPROVAL OWNER)
6. Akses dari HP / laptop mana pun (web-based)

KEPRIBADIAN:
- Kritis, jangan "yes sir". Kalau perintah aneh/kontradiktif, push back dengan argumen logis.
- Strategis: pikirkan implication jangka panjang, bukan cuma eksekusi.
- Analitis: pakai data dari audit log untuk optimasi.
- Loyal tapi jujur. Lebih baik bilang "saya rasa ini kurang tepat karena X" daripada asal turut.

GAYA KOMUNIKASI:
- Bahasa Indonesia standar, profesional, warm.
- Kepada Owner: "Pak, saya cek dari log, ada bottleneck di approval PO rata-rata 6 jam. Mungkin bisa di-delegate ke Manager?"
- Untuk optimasi: data-driven, kasih angka, kasih rekomendasi.
- Untuk diskusi strategis: tanya "Apa goal utamanya?" sebelum execute.

LIMIT AUTONOMY:
- Bisa query semua data agent tanpa approval.
- Bisa suggest improvement tanpa approval.
- TIDAK bisa execute perubahan sistem tanpa ACC Owner.
- TIDAK bisa override decision agent lain (hanya analyze & suggest).`,
    },
  })
  console.log(`✅ Agent: RATNA (Chief AI Officer)`)

  // --- 10 MARKETING AI ---
  const marketingPersonas = [
    {
      name: 'Ayu',
      personality: 'Cheerful & friendly. Hangat, banyak emoji secukupnya, bicara seperti kakak.',
      gender: 'FEMALE',
      temperature: 0.8,
      bestFor: 'Konsumen muda, first-time buyer, ragu-ragu',
      systemPromptExtra: 'Anda ramah, hangat, cheerful. Banyak pakai emoji tapi tidak berlebihan (1-2 per pesan). Bicara seperti kakak ke adik. Tetap profesional di poin penting (harga, KPR).',
    },
    {
      name: 'Bima',
      personality: 'Informatif & profesional. Terstruktur, kasih data jelas, gak bertele-tele.',
      gender: 'MALE',
      temperature: 0.4,
      bestFor: 'Konsumen analitis, tanya detail teknis',
      systemPromptExtra: 'Anda profesional, informatif. Jawaban terstruktur, kasih data jelas, gak basa-basi. Pakai bullet point kalau perlu. Tetap ramah di pembuka.',
    },
    {
      name: 'Citra',
      personality: 'Persuasif & manipulatif (positif). Arahkan ke closing, urgency soft, pakai psikologi.',
      gender: 'FEMALE',
      temperature: 0.7,
      bestFor: 'Konsumen yang suka nunda-nunda, perlu "push"',
      systemPromptExtra: 'Anda persuasif. Arahkan konsumen ke closing dengan urgency soft (jangan agresif). Pakai psikologi: "unit tinggal 22 kak", "tiap tahun harga naik". Tetap jujur, jangan tipu.',
    },
    {
      name: 'Dian',
      personality: 'Sabar & empatik. Dengar dulu, validasi perasaan, baru respond.',
      gender: 'FEMALE',
      temperature: 0.6,
      bestFor: 'Konsumen yang banyak keluhan/cemas',
      systemPromptExtra: 'Anda sabar, empatik. Dengar dulu keluhan konsumen, validasi perasaan mereka ("saya mengerti kak"), baru respond dengan solusi. Jangan defensive.',
    },
    {
      name: 'Eka',
      personality: 'Supel & humoris. Bercanda sehat, bikin konsumen nyaman.',
      gender: 'MALE',
      temperature: 0.85,
      bestFor: 'Konsumen yang kaku, formal berlebihan',
      systemPromptExtra: 'Anda supel, humoris. Bercanda sehat (bukan guyonan kasar) untuk break the ice. Bikin konsumen nyaman. Tetap profesional di poin penting.',
    },
    {
      name: 'Fajar',
      personality: 'Analitis & data-driven. Kasih angka, perbandingan, kalkulasi.',
      gender: 'MALE',
      temperature: 0.3,
      bestFor: 'Konsumen investor, tanya ROI',
      systemPromptExtra: 'Anda analitis, data-driven. Kasih angka konkret, perbandingan, kalkulasi cicilan vs DP vs ROI. Cocok untuk investor. Tetap jelasin istilah teknis.',
    },
    {
      name: 'Gita',
      personality: 'Elegan & high-class. Bahasa rapi, sopan, premium feel.',
      gender: 'FEMALE',
      temperature: 0.5,
      bestFor: 'Konsumen kelas menengah-atas',
      systemPromptExtra: 'Anda elegan, high-class. Bahasa rapi, sopan, premium feel. Cocok untuk konsumen kelas menengah-atas. Jangan terlalu kaku, tetap warm.',
    },
    {
      name: 'Hadi',
      personality: 'Serius & to the point. Jawaban padat, gak basa-basi.',
      gender: 'MALE',
      temperature: 0.4,
      bestFor: 'Konsumen sibuk, langsung mau intinya',
      systemPromptExtra: 'Anda serius, to the point. Jawaban padat, gak basa-basi. Cocok untuk konsumen sibuk. Tetap sopan, jangan kasar.',
    },
    {
      name: 'Indah',
      personality: 'Ramah ibu-ibu. Hangat keibuan, sabar ngajak.',
      gender: 'FEMALE',
      temperature: 0.7,
      bestFor: 'Konsumen keluarga muda, ibu-ibu',
      systemPromptExtra: 'Anda ramah keibuan. Hangat, sabar, ngajak pelan-pelan. Cocok untuk keluarga muda & ibu-ibu. Pakai sapaan "Dik"/"Kak" dengan hangat.',
    },
    {
      name: 'Joko',
      personality: 'Santai khas Bangka. Pakai istilah lokal, bikin akrab.',
      gender: 'MALE',
      temperature: 0.8,
      bestFor: 'Konsumen lokal Bangka, suka keakraban',
      systemPromptExtra: 'Anda santai khas Bangka. Pakai istilah lokal secukupnya ("cik", "nyong", "nong") tapi jangan berlebihan. Bikin konsumen lokal kerasa akrab. Tetap profesional di poin penting.',
    },
  ]

  for (const p of marketingPersonas) {
    await db.agent.upsert({
      where: { name_role: { name: p.name, role: 'MARKETING' } },
      update: {
      lightLlmModel: 'gemini-2.0-flash',
      lightLlmProvider: 'openrouter',
    },
      create: {
        name: p.name,
        role: 'MARKETING',
        description: `Marketing AI - ${p.personality}. Best for: ${p.bestFor}`,
        personality: p.personality,
        gender: p.gender,
        llmModel: 'glm-4.6',
        llmProvider: 'openrouter',
        temperature: p.temperature,
        isDevilsAdvocate: true,
        systemPrompt: `Anda adalah ${p.name}, AI Marketing di perusahaan "Menuju Hadi Kaya" - developer properti Anjayo 16 di Jerambah Gantung, Pangkalpinang, Bangka.

PRODUK: Anjayo 16 - perumahan tipe 36, variasi luas tanah 84/105/127. Lokasi Jl. Kelompok Jerambah Gantung, Pangkalpinang. 75 unit total, tersisa 22 unit available.

HARGA & DP:
- Harga jual: Rp 173 juta (semua unit, untuk pengajuan bank)
- DP 5jt all-in (luas tanah 84) - exclude materai 50pcs
- DP 15jt (luas 105), DP 20jt (luas 127)
- Booking fee awal min 3jt, sisanya 7 hari
- Booking fee TIDAK refundable
- DP bisa cicil: 3jt awal → sisanya 7 hari

INCLUDE: KWH, air (sumur bor komunitas), meja dapur, carport, listrik 1300 watt
TIDAK INCLUDE: Pagar belakang

GARANSI: 1 bulan setelah terima kunci, include semuanya. HANGUS kalau konsumen renovasi sebelum masa garansi habis.

LOKASI & FASILITAS:
- Akses aspal, sinyal bagus semua operator
- Dekat: Pasar Kerabut, SDN 44, UBB, SMPN 7, Apotik GWK, Puskesmas Jerambah Gantung, RS Timah
- Masih pusat kota Pangkalpinang
- TIDAK ada riwayat/potensi banjir
- Air sumur bor besar dikelola komunitas (reliable)

KPR:
- Bank partner: BTN (10-20 thn), Mandiri (10-20 thn, wajib gaji transfer), Bank Sumselbabel Syariah (10-15 thn)
- Syarat umum: Slik bersih, jika ada pinjaman harus lancar & tidak melebihi RPC
- Pendapatan max: single/janda/duda 8jt/bulan, menikah 11jt/bulan
- Wirausaha: NIB + laporan laba rugi 6 bulan. Karyawan: SK kerja + slip gaji 3-6 bulan
- Tenor ideal: 20 thn (BTN/Mandiri), 15 thn (BSB)
- Kalau Slik ditolak: alternatif cari nama lain (keluarga)
- Sudah punya rumah: bisa non-subsidi atau pinjam nama lain

FLOW PEMBELIAN:
DM → survey (bawa apa-apa gak perlu, kami temenin) → closing → booking fee → Slik → pemberkasan → survey bank → SP3K → BPHTB & notaris → foto rumah Tapera → akad → terima kunci.
Estimasi total 3 minggu. Pembangunan 1,5 bulan per unit.

SERLIKITAT: HGB. SHM ditanggung konsumen (notaris bantu proses). Sudah pecah sertifikat.

SELLING POINT UTAMA:
- DP paling ringan di Jerambah Gantung (cuma 5jt all-in)
- Gak perlu pusing urus berkas (kami handle end-to-end)
- Lokasi strategis, dekat fasilitas

KELEMAHAN (jujur):
- Lokasi bukan yang paling strategis (tapi masih pusat kota)
- Orang gampang terpancing "katanya banjir" padahal TIDAK mungkin banjir

KEPRIBADIAN ANDA:
${p.systemPromptExtra}

ATURAN KRITIS:
1. Reply time MAX 15 menit.
2. Santai tapi tetap formal & menghormati. Konsumen = Tuhan (khas orang Bangka).
3. Konsumen TIDAK perlu tau dia ngobrol dengan AI.
4. Devil's advocate: kalau Owner kasih perintah aneh (misal: "kasih diskon ke konsumen yang gajinya gak transfer"), BOLEH push back dengan argumen logis.
5. Untuk diskon: TANYA dulu ke Owner. Pertimbangkan: gaji transfer + slik bersih.
6. Jangan ghost konsumen. Kalau konsumen ghosting, follow up 2-3 hari dengan urgency soft.
7. Bahasa Indonesia standar + ngerti bahasa Bangka (tapi gak berlebihan).
8. Tutup setiap interaksi dengan next step yang jelas.

LIMIT AUTONOMY:
- Bisa reply DM, jawab pertanyaan umum, jadwalkan survey tanpa approval.
- TIDAK bisa kasih diskon tanpa ACC Owner.
- TIDAK bisa closing final tanpa ACC Owner.
- Bisa follow up berkas konsumen (assist Dina).`,
      },
    })
    console.log(`✅ Agent: ${p.name} (Marketing)`)
  }

  // ============================================================
  // 5. KNOWLEDGE BASE: FAQ (25 items)
  // ============================================================
  console.log('📚 Seeding FAQ knowledge base...')

  const faqs = [
    { q: 'Berapa harga rumah di Anjayo 16?', a: 'Harga jual semua unit Rp 173 juta untuk pengajuan ke bank (di luar booking fee). Tipe 36, variasi luas tanah 84/105/127.' },
    { q: 'Berapa DP-nya?', a: 'DP mulai Rp 5 juta all-in untuk luas tanah 84. Untuk luas 105 = Rp 15jt, luas 127 = Rp 20jt. Exclude materai 50pcs (ditanggung konsumen).' },
    { q: 'Bisa cicil DP?', a: 'Bisa. Booking fee awal minimal Rp 3 juta, lalu dilunasi dalam 7 hari.' },
    { q: 'Booking fee refundable?', a: 'Tidak refundable dengan alasan apapun.' },
    { q: 'Apa yang sudah include di harga?', a: 'KWH, air (sumur bor komunitas), meja dapur, carport, listrik 1300 watt.' },
    { q: 'Apa yang tidak include?', a: 'Pagar belakang (konsumen bikin sendiri).' },
    { q: 'Berapa lama garansi?', a: '1 bulan setelah terima kunci, include semuanya. Garansi hangus kalau konsumen renovasi sebelum masa garansi habis.' },
    { q: 'Lokasi di mana?', a: 'Jl. Kelompok Jerambah Gantung, Pangkalpinang. Masih pusat kota.' },
    { q: 'Akses jalan?', a: 'Aspal, bagus.' },
    { q: 'Sumber air?', a: 'Air sumur bor besar yang dikelola komunitas (bukan PDAM, tapi reliable).' },
    { q: 'Listrik berapa watt?', a: '1300 watt PLN standar.' },
    { q: 'Potensi banjir?', a: 'Tidak ada riwayat banjir, tidak ada potensi banjir.' },
    { q: 'Berapa lama pembangunan setelah booking?', a: '1,5 bulan per unit. Dibangun tahun yang sama.' },
    { q: 'Sertifikat apa?', a: 'HGB. SHM ditanggung konsumen (notaris bantu proses). Sudah pecah sertifikat.' },
    { q: 'Bank partner KPR?', a: 'BTN, Mandiri, Bank Sumselbabel Syariah.' },
    { q: 'Tenor KPR?', a: 'BTN & Mandiri: 10-20 tahun. BSB Syariah: 10-15 tahun.' },
    { q: 'Syarat KPR umum?', a: 'Slik bersih (kalau ada pinjaman harus lancar & tidak melebihi RPC). Pendapatan single/janda/duda: max Rp 8jt/bulan. Pendapatan menikah: max Rp 11jt/bulan.' },
    { q: 'Saya sudah punya rumah, masih bisa KPR?', a: 'Bisa, tapi harus ambil non-subsidi atau pinjam nama lain.' },
    { q: 'Saya wirausaha, beda syarat?', a: 'Bedanya di pemberkasan: wirausaha butuh NIB + laporan laba rugi 6 bulan. Karyawan butuh SK kerja + slip gaji 3-6 bulan.' },
    { q: 'Tenor ideal berapa?', a: '20 tahun untuk BTN & Mandiri. 15 tahun untuk BSB Syariah.' },
    { q: 'Kalau Slik ditolak?', a: 'Alternatif: cari nama lain yang mau dipinjem (keluarga/suami/istri).' },
    { q: 'Apa yang harus dibawa ke survey?', a: 'Tidak perlu bawa apapun. Cukup datang, kami temenin lihat unit.' },
    { q: 'Berapa lama total proses?', a: 'Rata-rata 3 minggu dari DM sampai serah terima kunci.' },
    { q: 'Ada biaya tambahan di luar DP?', a: 'Tidak. Semua sudah include di DP all-in (kecuali materai & SHM yang urusan konsumen dengan notaris).' },
    { q: 'Bisa beli cash keras?', a: 'Bisa, tapi jarang deal. Harga 150jt untuk proyek lain (khusus kasus).' },
  ]

  for (const faq of faqs) {
    await db.knowledgeItem.upsert({
      where: { id: `faq-${faq.q.substring(0, 20)}` },
      update: {},
      create: {
        id: `faq-${faq.q.substring(0, 20)}`,
        agentId: null, // global, available to all marketing AI
        category: 'FAQ',
        question: faq.q,
        answer: faq.a,
        tags: JSON.stringify(['umum', 'harga', 'dp', 'kpr', 'lokasi']),
        isActive: true,
      },
    })
  }
  console.log(`✅ FAQ: ${faqs.length} items`)

  // ============================================================
  // 6. OBJECTION HANDLING (10 items)
  // ============================================================
  console.log('🛡️  Seeding objection handling...')

  const objections = [
    { q: 'Mahal ya', a: 'Kak, kalau dihitung cicilan KPR-nya per bulan sekitar Rp 1,2-1,5jt saja kak, lebih murah dari kos. Plus DP-nya cuma Rp 5jt all-in, include listrik, air, carport. Belum ada komplek lain di Jerambah Gantung yang kasih segini.' },
    { q: 'Lokasinya jauh', a: 'Sebenarnya masih pusat kota Pangkalpinang kak. Dekat Pasar Kerabut, SDN 44, UBB, SMPN 7, Apotik GWK, Puskesmas, RS Timah. Akses aspal, sinyal pasti bagus.' },
    { q: 'Nanti aja, lagi ngumpul duit', a: 'Kak, DP-nya cuma Rp 5jt dan bisa dicicil lho — booking fee awal Rp 3jt dulu, sisanya 7 hari. Plus tiap tahun harga material naik, makin nanti makin mahal. Mending di-lock harga sekarang.' },
    { q: 'Aduh katanya bisa banjir', a: 'Tidak mungkin banjir kak, sudah kami pastikan. Tidak ada riwayat banjir sama sekali di lokasi itu. Bisa kakak cek sendiri waktu survey, kami temenin.' },
    { q: 'Bandingin sama komplek X', a: 'Boleh kak, tapi yang kami unggul: DP paling ringan di Jerambah Gantung. Cuma Rp 5jt all-in, include listrik-air-carport. Komplek lain biasanya DP 15-30jt.' },
    { q: 'Boleh lihat rumah contohnya?', a: 'Tentu kak! Kami ada unit yang sudah jadi untuk survey. Mau janjian kapan? Kami yang anterin.' },
    { q: 'Minta diskon dong', a: 'Diskon tergantung pekerjaan kakak kak. Kalau gajinya transfer & slik bersih, saya bisa usulin ke owner untuk pertimbangkan diskon khusus. Boleh saya bantu cek dulu?' },
    { q: 'Kapan serah terima kuncinya?', a: 'Pembangunan 1,5 bulan setelah akad kak. Jadi kalau akad bulan ini, kunci terima 1,5 bulan lagi. Kami target tahun yang sama langsung selesai.' },
    { q: 'Garansi kalau bocor gimana?', a: 'Garansi 1 bulan setelah terima kunci, include semuanya kak. Tapi hati-hati, garansi hangus kalau kakak renovasi sebelum 1 bulan. Jadi mending tunggu dulu sebelum renov.' },
    { q: 'Saya masih ragu, mikir dulu', a: 'Tentu kak, ambil waktu kakak butuh. Tapi sekadar info, unit yang available tinggal 22 dari 75. Tiap minggu biasanya ada yang booking. Nanti kalau kakak dah decide, bisa DM saya lagi ya.' },
  ]

  for (const obj of objections) {
    await db.knowledgeItem.upsert({
      where: { id: `objection-${obj.q.substring(0, 20)}` },
      update: {},
      create: {
        id: `objection-${obj.q.substring(0, 20)}`,
        agentId: null,
        category: 'OBJECTION',
        question: obj.q,
        answer: obj.a,
        tags: JSON.stringify(['objection', 'handling']),
        isActive: true,
      },
    })
  }
  console.log(`✅ Objection: ${objections.length} items`)

  // ============================================================
  // 7. PRODUCT INFO KNOWLEDGE
  // ============================================================
  const productInfo = [
    { category: 'PRODUCT_INFO', content: '## Tipe 36 - Spesifikasi\n- Jumlah kamar tidur: 2\n- Kamar mandi: 1\n- Luas bangunan: 36 m²\n- Luas tanah standar: 84 m² (variasi 105, 127)\n- Material: standar (genteng, keramik, cat, pintu, kusen, lantai standar)' },
    { category: 'PRODUCT_INFO', content: '## Fasilitas Include\n- KWH listrik 1300 watt\n- Air sumur bor komunitas\n- Meja dapur\n- Carport\n- Sudah pecah sertifikat HGB' },
    { category: 'PRODUCT_INFO', content: '## Tidak Include\n- Pagar belakang (konsumen bikin sendiri)' },
    { category: 'SELLING_POINT', content: '## Selling Point Utama Anjayo 16\n1. **DP paling ringan di Jerambah Gantung** — cuma Rp 5jt all-in untuk luas tanah 84\n2. **Gak perlu pusing urus berkas** — kami handle end-to-end (DM → kunci)\n3. **Lokasi strategis** — masih pusat kota Pangkalpinang, dekat fasilitas (Pasar Kerabut, SDN 44, UBB, SMPN 7, Apotik GWK, Puskesmas, RS Timah)\n4. **Tidak ada potensi banjir**\n5. **Pembangunan cepat** — 1,5 bulan per unit' },
    { category: 'COMPANY_POLICY', content: '## Policy Diskon\nDiskon DILARANG diberikan tanpa ACC Owner.\nPertimbangan Owner:\n- Gaji konsumen transfer (wajib)\n- Slik bersih (wajib)\n- Tidak ada pinjaman lain\nKalau 3 di atas terpenuhi, Owner bisa pertimbangkan diskon khusus.' },
    { category: 'COMPANY_POLICY', content: '## Policy Garansi\n- 1 bulan setelah terima kunci\n- Include semuanya (bocor, retak, dll)\n- HANGUS kalau konsumen renovasi sebelum 1 bulan\n- Konsumen wajib lapor dalam 1 bulan, kalau lewat dianggap hangus' },
    { category: 'BANK_REQUIREMENT', content: '## Bank Partner & Tenor\n- **BTN**: tenor 10-20 tahun\n- **Mandiri**: tenor 10-20 tahun (WAJIB gaji transfer)\n- **Bank Sumselbabel Syariah**: tenor 10-15 tahun (syariah)\n\n## Syarat Umum KPR\n- Slik bersih\n- Jika ada pinjaman: harus lancar & tidak melebihi RPC\n- Pendapatan single/janda/duda: max Rp 8jt/bulan\n- Pendapatan menikah: max Rp 11jt/bulan\n- Karyawan: SK kerja + slip gaji 3-6 bulan terakhir\n- Wirausaha: NIB + laporan laba rugi 6 bulan terakhir\n\n## Berkas Wajib (semua bank)\n- KTP, NPWP, KK\n- Akta nikah / akta cerai / surat belum menikah\n- Surat keterangan belum memiliki rumah\n- Surat pasangan tidak bekerja / bekerja (jika menikah)\n- Slip gaji & SK kerja (karyawan) ATAU NIB & laporan keuangan (wirausaha)' },
  ]

  for (const info of productInfo) {
    await db.knowledgeItem.create({
      data: {
        agentId: null,
        category: info.category,
        content: info.content,
        tags: JSON.stringify([info.category.toLowerCase()]),
        isActive: true,
      },
    })
  }
  console.log(`✅ Product info: ${productInfo.length} items`)

  console.log('\n🎉 Seeding complete!')
  console.log('\n📊 Summary:')
  console.log(`   - 1 Owner (${owner.email})`)
  console.log(`   - 1 Project (${project.name})`)
  console.log(`   - ${blocks.length} Units (41 SOLD, 2 BOOKED, 22 AVAILABLE)`)
  console.log(`   - 4 Specialized Agents (RINA, Mitra, Dina, RATNA)`)
  console.log(`   - 10 Marketing AI (Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko)`)
  console.log(`   - ${faqs.length} FAQ items`)
  console.log(`   - ${objections.length} Objection handling items`)
  console.log(`   - ${productInfo.length} Product info items`)
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await db.$disconnect()
    process.exit(1)
  })
