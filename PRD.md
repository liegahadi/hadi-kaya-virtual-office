# PRD — Hadi Kaya Virtual Office
## Product Requirements Document (Living Document)

**Versi:** 1.0  
**Tanggal:** 8 Juli 2026  
**Status:** Active Development  
**Owner:** Andrian Bong (Hadi) — PT. Marlindo Bangun Persada  

---

## 1. PROJECT OVERVIEW

### 1.1 Latar Belakang
PT. Marlindo Bangun Persada adalah developer properti yang sedang mengembangkan project perumahan subsidi "ANJAYO 16" di Pangkalpinang, Bangka Belitung. Project ini menjual rumah type 36/84 (luas bangunan 36m², luas tanah 84m²) dengan harga Rp 173.000.000, dibiayai melalui KPR subsidi dari 3 bank: BTN, Mandiri, dan BSB Syariah.

Owner (Hadi) ingin membangun **Virtual Office** — sistem terintegrasi yang mengotomatisasi seluruh proses dari marketing → sales → pemberkasan → KPR → akad → serah terima, dengan dukungan 15 AI agents yang masing-masing punya peran spesifik.

### 1.2 Tujuan Utama
1. **Otomatisasi Pemberkasan** — Generate semua dokumen KPR (SPR, FLPP, AJB, dll) secara otomatis dari data form
2. **Multi-Bank Support** — BTN, Mandiri, BSB Syariah, + bank baru di masa depan (self-service via Bank Config Builder)
3. **AI Assistant (DINA)** — Chat-based CRUD untuk manage konsumen, generate dokumen, kirim berkas via WhatsApp
4. **Multi-Agent System** — 15 AI agents (4 staff + 1 leader marketing + 10 marketing AI) yang bekerja autonomously
5. **WhatsApp Integration** — Semua agents online di WhatsApp, melayani owner dan prospek
6. **Google Drive Integration** — Auto-save semua dokumen ke Drive, terorganisir per konsumen
7. **OCR** — Auto-extract data dari KTP, Sertifikat, dokumen lainnya
8. **Memory System** — AI agents yang belajar (learning by doing), dengan memory utama + memory per-agent

### 1.3 Project Details
- **Nama Project:** ANJAYO 16
- **Lokasi:** Jl. Kelompok, Jerambah Gantung, Kerabut, Pangkalpinang
- **Type:** 36/84 (36m² bangunan, 84m² tanah)
- **Harga:** Rp 173.000.000
- **DP:** Rp 1.730.000 (1%)
- **SBUM:** Rp 4.000.000 (Bantuan Uang Muka pemerintah)
- **Plafon KPR:** Rp 167.270.000
- **Tenor:** 20 tahun
- **Listrik:** 1300 Watt
- **Air:** Sumur Bor Besar
- **Sertifikat:** SHGB
- **No. PBG:** SK-PBG-197106-24112023-001 (Tgl Terbit 24 November 2023)
- **No. Rekening BTN (Developer):** 00209.01.30.0003316
- **Total Unit:** 75 unit (41 SOLD, 2 BOOKED, 22 AVAILABLE saat project dimulai)

---

## 2. TECHNICAL STACK

### 2.1 Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Editor:** Tiptap (inline Word-style editor untuk SK Kerja + Slip Gaji)
- **PDF:** pdf-lib (overlay), jsPDF + html2canvas-pro (React component → PDF)
- **DOCX:** docxtemplater + pizzip (template fill), html-to-docx (HTML → DOCX)

### 2.2 Backend
- **Database:** Neon PostgreSQL (serverless)
- **ORM:** Prisma 6.19
- **Hosting:** Vercel (auto-deploy dari GitHub)
- **GitHub:** liegahadi/hadi-kaya-virtual-office
- **URL:** https://hadi-kaya-virtual-office.vercel.app

### 2.3 Integrasi
- **Google Drive/Docs API:** OAuth 2.0 (owner login once, token stored in DB)
- **Google Static Maps:** Untuk Lokasi Kerja (map screenshot)
- **OCR:** z.ai VLM (primary, free, high accuracy) + Tesseract.js (fallback)
- **AI LLM:** Gemini 2.0 Flash (primary, free) → OpenRouter Nemotron Nano 30B (fallback)
- **Image Generation:** z-ai-web-dev-sdk (images.generations.create + images.generations.edit) — free
- **WhatsApp Bot:** Baileys (@whiskeysockets/baileys) — multi-agent ready
- **Bot Hosting:** Railway (currently WA IP blocked) → Hostinger VPS (plan)

### 2.4 Credentials (untuk developer reference)
- Neon DB: `postgresql://neondb_owner:***@ep-noisy-wildflower-aoisf1uk.c-2.ap-southeast-1.aws.neon.tech/neondb`
- Vercel token: configured
- GitHub: liegahadi (token configured)
- OpenRouter: configured (free tier)
- GEMINI_API_KEY: set on Vercel
- GOOGLE_OAUTH_CLIENT_ID/SECRET: set on Vercel
- Owner WA: 08117176687 → 628117176687
- DINA WA: 6287761323344
- Railway API token: 25dfc120-f4f8-404f-80c4-b9943a7a0270
- Railway project: vigilant-communication (id: 50ff2ea0-d021-42c9-959d-1bbb01ae37f5)

---

## 3. AI AGENTS (15 Total)

### 3.1 Staff Agents (4)
| Agent | Role | Tugas | Status API | Status WA |
|-------|------|-------|------------|-----------|
| **DINA** | Document AI | KPR, berkas, bank, CRUD konsumen, generate dokumen, kirim berkas via WA | ✅ Live | Code ready, deploy blocked (WA IP) |
| **RINA** | Finance AI | Budget, invoice, RAB, supplier payments, fund requests | ✅ Live | Code ready |
| **MITRA** | Material AI | Stok material, supplier, PO, material usage | ✅ Live | Code ready |
| **RATNA** | CAO (Chief Admin Officer) | Koordinasi semua agents, audit log, scheduling, summary | ✅ Live | Code ready |

### 3.2 Leader Marketing (1)
| Agent | Role | Tugas | Status |
|-------|------|-------|--------|
| **RANGGA** | Marketing Leader & Creative Director | Strategi marketing, konten kreatif (video, gambar, sosmed), KPI tim marketing, evaluasi performa, teguran kalau underperform | ✅ Live API, WA ready |

### 3.3 Marketing AI (10)
| Agent | Tugas | Status |
|-------|-------|--------|
| Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko | Handle DM prospek (FB/IG/TikTok), bikin konten harian (min 3 post), follow up prospek, report ke RANGGA | API shared (/api/marketing/chat), WA ready |

### 3.4 DINA Capabilities (Detail)
- **CRUD Konsumen:** Create, update field apapun, delete (with confirmation + target validation)
- **Bulk Delete:** "hapus Andas, Jenni, dan Hadi" → list + confirm → execute
- **Delete All:** "hapus semua konsumen" → list all + confirm → execute
- **Send Berkas:** "minta berkas Hadi" → list files from Drive → user pick → DINA kirim PDF/image via WA
- **Custom Command Learning:** "ajar: trigger | response" → DINA learns new commands
- **Smart Fallback:** Kalau DINA gak paham, kasih helpful hints + format examples
- **Help Menu:** "bantuan" → show all commands
- **Anti-Hallucination:** DB-backed pending action, directResponse bypass LLM, target name validation
- **Disambiguation:** Kalau nama duplikat, DINA list semua + tanya blok/NIK
- **Bank Config Management:** "list bank", "tambah bank BCA" (dashboard only), "hapus bank" = DILARANG
- **Permission Matrix:**
  - Dashboard chat = owner (semua fitur)
  - WA private chat owner = semua fitur
  - WA private chat non-owner = silent ignore (jika tidak di grup) atau "hanya melayani di grup" (jika di grup)
  - WA group = tag-only (@Dina), READ/UPDATE/CREATE untuk semua, DELETE hanya owner
  - Bank config edit/tambah = DASHBOARD ONLY, WA forbidden untuk siapapun

### 3.5 DINA AI Capabilities (Planned — Belum Dikerjakan)
- **Generate Laporan Keuangan Wirausaha:** Owner kirim data via chat → DINA generate via Gemini → save .docx ke Google Drive → DINA kirim link
- **Generate SK Kerja + Slip Gaji via DINA:** Sama seperti laporan keuangan, DINA generate + save to Drive + kirim link
- **NLP Teaching:** "DINA, kalau saya bilang X, jawab Y" (natural language custom command)
- **Action Commands:** Custom commands yang trigger API calls / DB writes
- **Multi-step Workflows:** Command chaining

---

## 4. TAB BERKAS — Fitur Lengkap

### 4.1 Layout (3-Column)
- **Sidebar Kiri:** Form input (Data Perusahaan, Nasabah, Pekerjaan, Keluarga, Unit Properti, Upload dokumen)
- **Preview Tengah:** Live preview PDF/dokumen (auto-refresh saat form berubah)
- **DINA Sidebar Kanan:** Chat AI untuk CRUD konsumen

### 4.2 Form Sections (Sidebar Kiri)
- ✅ Data Perusahaan (Global) — Nama PT, Direktur, NIK, No. HP Owner, Alamat KTP Direktur, Alamat Kantor, Kota, Rekening per-bank
- ✅ Data Nasabah — Nama, NIK, NPWP, Rekening BTN, Tempat/Tanggal Lahir, Alamat KTP, WA, BSB-specific fields (Email, NIP, Alamat Domisili)
- ✅ Pekerjaan — KARYAWAN/WIRAUSAHA toggle, Jabatan, Perusahaan, Alamat, Gaji Bersih
- ✅ Data Bendaharawan (BSB only) — Nama Bendaharawan, NIP, Nama Atasan, NIP Atasan
- ✅ Status Keluarga — BELUM KAWIN/KAWIN, data pasangan (Nama, NIK, Pekerjaan, Status Pekerjaan)
- ✅ Unit Properti — Blok, No Rumah, Luas Tanah/Bangunan, No. Sertifikat (SHM), Kelurahan Sertipikat (was "No. NIB"), Harga, DP, Plafon, Tenor, Tgl Dokumen, Tgl Akad, No. Akad, Tgl LPA, No. LPA, Tgl SP3K
- ✅ Upload Dokumen Wajib — KTP, KK, NPWP, Akta Nikah/Belum Menikah, Slip Gaji, SK Kerja, Surat Belum Rumah, Sertifikat, PBB (+ spouse docs jika menikah)
- ✅ Upload Dokumen Cetak & TTD — SPR, Pernyataan, BPHTB, Notaris docs
- ✅ Post-SP3K BTN (stage AJB only) — 14 dokumen tambahan

### 4.3 Document Generators
| Bank | Dokumen | Type | Status |
|------|---------|------|--------|
| BTN | SPR | React component (replica scan) | ✅ Working |
| BTN | FLPP | PDF overlay (~250 fields, 12 pages after page 7 removal) | ✅ Working |
| BTN | AJB Bank | PDF overlay (264 lines, multi-page) | ✅ Working |
| Mandiri | SPR | PDF overlay (18 annotations, 1 page) | ✅ Working |
| Mandiri | Surat Pernyataan Rumah, Penghasilan, Tidak Punya Rumah | React components | ✅ Working |
| BSB Syariah | FLPP (14 pages), SPR, Permohonan, Kuasa Bendaharawan, Pernyataan, SBUM | PDF overlay (6 docs, 156+ fields) | ✅ Working |
| Common | BPHTB (Pernyataan + Kuasa) | React components | ✅ Working |
| Common | Notaris (BAST, Tanda Terima, Pernyataan SHGB, Kuasa) | React components | ✅ Working |
| SK Kerja + Slip Gaji | 20 templates (.docx) → Google Docs editor | Combined modal (inline edit) | ✅ Working |
| Lokasi Kerja | Google Maps + photos + denah | Modal | ✅ Working |
| Laporan Keuangan Wirausaha | AI-generated via DINA → Gemini → .docx → Google Drive | DINA intent | ⏳ Planned |

### 4.4 SK Kerja + Slip Gaji Modal (CombinedDocEditorModal)
- 20 templates (.docx) dengan kategori berbeda (Umum, Tech, Pemerintahan, Perbankan, Mining, dll)
- 1 file = SK Kerja + 7 Slip Gaji (6 bulan ke belakang + current)
- Embedded Google Docs editor (inline edit font, size, bold, alignment, color)
- Form Slip Gaji di panel kiri (Gaji Pokok, Tanggal Terima, Tunjangan Tetap/Variabel, Potongan, Kop Surat)
- Template picker di panel kanan
- Logo Generator (2 modes):
  - **Mode 1: Upload Recreate** — Upload foto logo → AI recreate clean (white bg, no noise)
  - **Mode 2: Prompt Generate** — Prompt by text → AI create logo from scratch
- Download as .docx (export from Google Docs)
- Auto-save to Google Drive (Hadi Kaya Docs > ANJAYO 16 > Berkas Konsumen > [Nama - Blok])

### 4.5 OCR
- **KTP OCR:** z.ai VLM primary (structured JSON, perfect accuracy) + Tesseract fallback
- **Sertifikat OCR:** z.ai VLM primary + Tesseract fallback
- **Planned:** OCR untuk KK, NPWP, dokumen lainnya

### 4.6 Google Drive Integration
- OAuth2 connection (owner login once, token stored in DB)
- Auto-upload files to Drive (folder: Hadi Kaya Docs > ANJAYO 16 > Berkas Konsumen > [Nama - Blok])
- File naming: [Dokumen] - [Nama Debitur] - Blok
- Merge uploads → 1 PDF → Drive (filename: [Jenis Dokumen] - [Nama Debitur] - Blok)
- Delete customer preserves Drive files (customerId set to NULL via onDelete:SetNull)
- Create Google Doc for SK+Slip (overwrite existing)
- Create Lokasi Kerja Google Doc

### 4.7 Annotation Fixes (All Applied)
- SPR BTN: blok + nomor rumah muncul (blockLetter + houseNumber, not stale kavlingNumber)
- SPR Mandiri: swap annotation (left=SHM, right=Kelurahan Sertipikat)
- SPR Mandiri: owner phone dari CompanySetting.directorPhone (global)
- FLPP: blok/rumah via transform (gak stale)
- FLPP page 7: physically removed from generated PDF (12 pages total)
- FLPP page 6: "Bangka Belitung" (was "KBB"), "PT. Marlindo" prefix, Nama Direktur (was company.name bold)
- FLPP page 12: tambah [DP] di bawah [Harga rumah]
- FLPP page 1: blok X+5 (ke kanan, biar gak di luar garis isian)
- FLPP page 13: nama debitur (was nama direktur)
- FLPP page 2: alamat kantor dari form (was "Pangkalpinang" fallback)
- BSB FLPP page 3: harga=angka, PT. prefix, penghasilan debitur, kota+date
- BSB FLPP page 5: kota+date
- BSB FLPP page 7: PT. prefix
- BSB FLPP page 12: applicant.companyName (was company.name)
- BSB Kuasa Bendaharawan: fix overlap (jabatan naik, alamat turun) + swap signatures (bendaharawan kiri, debitur kanan)
- BSB Pernyataan: hapus page 2, bottom annotation = nama atasan (was nama debitur), tambah nama bendaharawan
- BSB SBUM page 2: nama debitur (was nama direktur)
- AJB page 1 + 9: hapus nama debitur annotation di signature area
- React docs: signature space 60px → 100px (14 instances)

---

## 5. BANK CONFIG BUILDER (Phase 2 — In Progress)

### 5.1 Konsep
Self-service system untuk tambah/edit bank baru tanpa AI code changes. Owner atur sendiri:
- List berkas per bank (tambah/hapus/edit)
- PDF template + annotation coordinates
- Form fields per bank (jika berbeda)

### 5.2 Yang Sudah Dikerjakan
- ✅ BankConfig Prisma model (bankCode, bankName, description, templatePath, documents JSON, isActive)
- ✅ API /api/bank-config (GET/POST/PUT/DELETE — DELETE permanently disabled)
- ✅ DINA intent: LIST_BANKS, ADD_BANK (dashboard only)
- ✅ DINA system prompt: BANK CONFIG MANAGEMENT section
- ✅ Dynamic bank dropdown (hardcoded BTN/Mandiri/BSB + DB banks, no duplicates)
- ✅ Bank delete PERMANENTLY DISABLED (API returns 403, DINA rejects, system prompt forbids)

### 5.3 Yang Belum Dikerjakan
- ⏳ Bank Config Builder UI (visual PDF annotation tool — klik di PDF → pilih field)
- ⏳ Dynamic bank PDF generator (baca config dari DB, bukan hardcoded fields.ts)
- ⏳ Migrate BTN/Mandiri/BSB ke BankConfig DB records (read-only, don't touch existing code)
- ⏳ Form fields per bank (sidebar kiri berubah sesuai bank yang dipilih)
- ⏳ List berkas per bank (upload section berubah sesuai bank)
- ⏳ Permission: bank config edit/tambah = DASHBOARD ONLY, WA forbidden

### 5.4 Rules (Per User Requirements)
- **Bank TIDAK BISA dihapus** oleh siapapun, bahkan owner, bahkan jika mengancam tutup server
- **List berkas bisa diedit** oleh owner via dashboard only (tambah/hapus/ubah)
  - Tambah berkas = langsung eksekusi (no confirmation)
  - Hapus berkas = perlu konfirmasi
  - Hapus berkas dengan nama mirip/double = perlu konfirmasi ekstra
- **Existing BTN/Mandiri/BSB** tidak diganggu — code tetap sama, hanya bank BARU yang pakai BankConfig DB
- **WA forbidden** untuk bank config management (siapapun, termasuk owner)
- **Berkas wajib (sama untuk semua bank):** KTP, KK, NPWP, Surat Menikah/Belum Menikah/Cerai, Sertifikat, IMB/PBG, PBB, SK Kerja/NIB, Slip Gaji/Laporan Keuangan
- **Berkas tambahan** per bank = sesuai kebijakan bank masing-masing
- **Kategori berkas:** Dokumen Identitas, Dokumen Pekerjaan, Dokumen Properti, Dokumen Bank-specific
- **Dependencies per pekerjaan:** KARYAWAN → SK Kerja + Slip Gaji; WIRAUSAHA → NIB + Laporan Keuangan
- **Mandiri special:** tiap jenis pekerjaan beda dependencies — DINA harus bisa analisa + kasih saran

### 5.5 BankConfig Structure (Planned)
```
BankConfig {
  bankCode: "BCA"
  bankName: "Bank Central Asia"
  documents: [
    {
      id: "ktp", label: "KTP", type: "upload", required: true,
      category: "identitas", description: "Kartu Tanda Penduduk",
      conditional: null
    },
    {
      id: "sk-kerja", label: "SK Kerja", type: "upload", required: true,
      category: "pekerjaan", description: "Surat Keterangan Kerja",
      conditional: { field: "jobType", value: "KARYAWAN" }
    },
    {
      id: "form-permohonan", label: "Form Permohonan KPR", type: "pdf-overlay",
      templatePath: "/templates/bca-form.pdf", required: true,
      category: "bank", description: "Form permohonan KPR BCA"
    }
  ]
  formFields: [
    { id: "nama", label: "Nama Lengkap", source: "applicant.fullName", required: true },
    { id: "bca-account", label: "No. Rekening BCA", source: "applicant.bcaAccount", required: false }
  ]
}
```

---

## 6. MEMORY SYSTEM (Planned — Tab Baru "Memory")

### 6.1 Konsep
Sistem memory terpusat untuk semua 15 AI agents, terinspirasi dari `rohitg00/agentmemory` (Python) diadaptasi ke TypeScript/Prisma.

### 6.2 Struktur
1. **Memory Utama** — Database pengetahuan pusat (semua knowledge)
2. **Memory per Agent** — Filter memory utama sesuai role (DINA → berkas, RINA → finance, dll)
3. **Skill** — Memory yang diklaim agent sebagai kemampuan mereka

### 6.3 Tab Memory (Dashboard)
- Section 1: Memory Utama (semua ingatan/skill)
- Section 2: Memory & Skill per Agent (15 agents, masing-masing punya ingatan sendiri)
- Highlight memory/skill baru (3 hari)
- Klik memory → lihat isi documentation
- Edit, hapus, atau tambah memory/skill

### 6.4 Learning by Doing
- Agent otomatis belajar dari setiap percakapan (auto-extract insights)
- Notifikasi saat agent pelajari memory baru
- Highlight 3 hari untuk memory/skill baru
- RATNA + Mirofish: RATNA swarming agents untuk dapat pengetahuan baru → simpan di memory utama → distribusi ke agent yang sesuai
- Jika agent punya skill/memory baru yang sesuai tugasnya → kirim ke RATNA untuk disimpan

### 6.5 Memory Categories (Existing)
- UTAMA — General knowledge, decisions
- BERKAS — Documents, KPR, bank process
- FINANCE — Budget, payments, invoices
- MATERIAL — Stock, suppliers, PO
- MARKETING — Leads, prospects, campaigns
- DECISION — User decisions/actions logged

### 6.6 Implementation Plan
- Build from scratch (custom Prisma + Neon DB, adaptasi konsep AgentMemory)
- Tab baru "Memory" di dashboard
- Memory table sudah ada (sudah dipakai DINA sekarang)
- Perlu: UI untuk browse/edit/hapus memory, highlight system, agent-skill mapping, RATNA integration

---

## 7. WIRAUSAHA — LAPORAN KEUANGAN (Planned)

### 7.1 Flow
1. Owner chat DINA (WA atau dashboard): "DINA, buat laporan keuangan untuk konsumen X, wirausaha, jenis usaha warung, pendapatan 5-7 juta/bulan, pengeluaran 2-3 juta/bulan"
2. DINA generate laporan keuangan via Gemini → format Laporan Laba Rugi formal
3. Output = .docx file (format variatif per konsumen, tidak disimplify, sesuai data yang diberikan)
4. Auto-save ke Google Drive di folder konsumen (Hadi Kaya Docs > ANJAYO 16 > Berkas Konsumen > [Nama - Blok])
5. DINA kirim link Google Drive ke owner
6. Owner bisa edit (buka di Google Docs)

### 7.2 Rules
- **TIDAK auto-merge** dengan SK Kerja + Slip Gaji
- Auto-merge hanya untuk file yang di-upload dari sidebar kiri
- Format Laporan Laba Rugi formal: Pendapatan, HPP, Laba Kotor, Biaya Operasional, Laba Bersih
- Range pendapatan/pengeluaran = per bulan
- Data dari owner tidak disimplify — exact seperti yang diberikan
- Owner bisa kasih contoh laporan keuangan yang sudah pernah dibuat untuk konsumen lain sebagai acuan
- DINA harus jadi skill/intent untuk ini — bagian dari DINA's capabilities

### 7.3 Juga Berlaku Untuk
- SK Kerja + Slip Gaji juga bisa generate via DINA (sama seperti laporan keuangan)
- DINA generate → save to Google Drive → kirim link

---

## 8. WHATSAPP BOT (Multi-Agent)

### 8.1 Arsitektur
- 1 Node.js process, 15 agents concurrent (config-driven)
- Each agent: own auth_state folder, own WA connection, own QR code
- Baileys (@whiskeysockets/baileys) v6.7
- PM2 process manager (auto-restart)
- Health check HTTP server (port 3000)

### 8.2 Behavior Rules
- **Grup:** DINA hanya respon jika di-tag (@Dina atau @[nomor HP])
- **DM non-owner yang di grup:** Balas "hanya melayani di grup" (TANPA link grup)
- **DM non-owner yang tidak di grup:** Silent ignore (diam total)
- **DM owner:** Respon normal (semua fitur)
- **JANGAN PERNAH share link grup** ke siapapun
- **Bank config management:** Dashboard only, WA forbidden
- **Work hours:** 9-17 Senin-Sabtu (configurable)
- **Auto-reject calls**

### 8.3 Permission Matrix
| Aksi | Owner DM | Owner Grup (tag) | Anggota Grup Lain (tag) |
|------|----------|------------------|------------------------|
| READ (lihat data) | ✅ | ✅ | ✅ |
| UPDATE (ubah field) | ✅ | ✅ | ✅ |
| CREATE (tambah konsumen) | ✅ | ✅ | ✅ |
| DELETE (hapus konsumen) | ✅ (confirm) | ✅ (confirm) | ❌ "hanya owner" |
| Bank config | ❌ WA forbidden | ❌ WA forbidden | ❌ WA forbidden |
| Send berkas | ✅ | ✅ | ✅ |

### 8.4 Deployment Status
- Code ready: wa-bot/ folder (agent.js, agents/index.js, main.js)
- Railway deploy: SUCCESS (bot running, health check OK) — but WA blocks IP (405)
- Need: VPS with IP Indonesia (Hostinger plan saved in worklog)
- 3 SIM cards ready: DINA (6287761323344), RINA, MITRA
- 12 more SIM cards needed for remaining agents

### 8.5 Hostinger VPS Migration Plan (Paused)
- VPS KVM 2 (~Rp 75-100rb/bulan, 4 cores, 8GB RAM, IP Indonesia)
- Bayar via bank transfer/e-wallet (NO credit card needed)
- Migrate: WA bot + Next.js app + PostgreSQL DB + (optional) n8n + (optional) Mirofish
- Scripts planned: setup-hostinger.sh, migrate-db.sh, deploy-app.sh, deploy-wa-bot.sh

---

## 9. PHASE HISTORY

### Phase 0: Foundation (DONE)
- Prisma schema (20+ models)
- Seed data (1 Owner, 1 Project, 75 Units, 14→15 AI Agents)
- Multi-LLM router (ZAI SDK + OpenRouter)
- BaseAgent class (conversation history, memory layer, knowledge retrieval)
- Dashboard UI (5 tabs: Virtual Office, Pipeline, Site Plan, Knowledge Base, Settings)

### Phase 1: Agent Framework (DONE)
- BaseAgent, LLM router, memory layer, knowledge retrieval
- AgentFactory for instantiation

### Phase 2: Berkas System (DONE — ongoing fixes)
- BerkasView v2 (3-column layout)
- PDF overlay generators (BTN FLPP, SPR Mandiri, AJB, BSB 6 docs)
- React component generators (SPR BTN, BPHTB, Notaris, Mandiri docs)
- SK Kerja + Slip Gaji modal (20 templates + Google Docs editor)
- Lokasi Kerja modal (Google Maps + denah)
- Google Drive integration (OAuth + auto-upload + merge)
- OCR (VLM z.ai + Tesseract fallback)
- Logo Generator (2 modes: upload recreate + prompt generate)
- DINA AI chat sidebar (CRUD + send berkas + custom commands + smart fallback)

### Phase 3: DINA AI Evolution (DONE — v8.7)
- v8.1: WA behavior (tag-only, group-member-only DM, no link sharing)
- v8.2: DB-backed PendingAction (survive Vercel lambda), strict confirmation, target validation, anti-hallucination
- v8.3: Create customer fix + preserve Drive files + send berkas via WA
- v8.4: Duplicate customer disambiguation + Baileys multi-agent deploy guide
- v8.5: Bulk delete (multiple customers)
- v8.6: Smart fallback (helpful hints instead of hallucination)
- v8.7: Custom command learning ("ajar: trigger | response")
- v8.7.1: matchCustomCommand dashboard channel fix

### Phase 4: Multi-Agent Architecture (DONE — code ready, deploy blocked)
- 15 agents in DB (4 staff + 1 leader + 10 marketing)
- Config-driven wa-bot (agent.js, agents/index.js, main.js)
- API routes: /api/dina/chat, /api/rina/chat, /api/mitra/chat, /api/ratna/chat, /api/rangga/chat, /api/marketing/chat
- Agent chat handler (shared, config-driven)
- Railway deploy guide + Oracle Cloud setup script
- Dynamic bank dropdown (hardcoded + DB banks)

### Phase 5: Bank Config Builder (IN PROGRESS)
- Phase 1 DONE: BankConfig model + API + DINA intent + no-delete rule + dynamic dropdown
- Phase 2 PENDING: Bank Config Builder UI + dynamic PDF generator + migrate existing banks + form fields per bank

### Phase 6: Memory System (PLANNED)
- Tab "Memory" di dashboard
- Memory utama + memory per agent + skills
- Learning by doing + notifications + highlight
- RATNA + Mirofish integration (swarming for knowledge)

### Phase 7: Wirausaha Laporan Keuangan (PLANNED)
- DINA generate laporan keuangan via Gemini → .docx → Google Drive → link
- Also apply to SK Kerja + Slip Gaji generation via DINA

### Phase 8: WhatsApp Bot Deployment (BLOCKED — need VPS)
- Deploy 15 agents to VPS with IP Indonesia
- 3 SIM cards ready, 12 more needed
- Hostinger VPS migration plan saved

### Phase 9: Financial Tab — RINA (PLANNED)
- Budget tracking per unit
- Invoice management
- RAB (Rencana Anggaran Biaya)
- Supplier payments
- Fund requests
- Laporan laba rugi
- Pajak tracking
- Schema sudah ada (RAB, RABLine, Supplier, PO, POLine, SupplierPayment, FundRequest, UnitBudgetTracking)

### Phase 10: Future Enhancements (PLANNED)
- n8n automation (workflow automation, scheduled reports)
- Mirofish (decision making, multi-criteria analysis)
- User authentication & role-based access (untuk staff selain owner)
- Bank Config Builder visual UI (PDF annotation tool)
- OCR for more document types (KK, NPWP, dll)
- Templates library per workplace (reusable across customers)
- Self-hosted VPS (Hostinger) untuk full stack

---

## 10. IMPORTANT RULES & DECISIONS

### 10.1 Hard Rules (Tidak Bisa Diubah)
1. **Bank TIDAK BISA dihapus** — oleh siapapun, apapun alasannya, bahkan jika owner mengancam tutup server
2. **Link grup WhatsApp TIDAK BOLEH dibagikan** — oleh DINA maupun agent lainnya
3. **DINA hanya respon di grup jika di-tag** — tidak ada fallback "Dina ..." prefix
4. **DM non-owner yang tidak di grup = silent ignore** — DINA diam total
5. **Bank config management = dashboard only** — WA forbidden untuk siapapun (termasuk owner)
6. **Delete konsumen = perlu konfirmasi** — dengan target name validation
7. **Google Drive files preserved** saat hapus konsumen — hanya DB yang dihapus
8. **Existing BTN/Mandiri/BSB code TIDAK DIGANGGU** — bank baru pakai BankConfig DB

### 10.2 Key Technical Decisions
- **DINA model:** Gemini 2.0 Flash (primary, free) → Nemotron Nano 30B (fallback via OpenRouter)
- **Memory categories:** UTAMA, BERKAS, FINANCE, MATERIAL, MARKETING, DECISION
- **SK+Slip overwrite:** 1 file per customer in Drive (delete existing before create)
- **Google Drive folder:** Hadi Kaya Docs > ANJAYO 16 > Berkas Konsumen > [Nama - Blok]
- **File naming:** [Dokumen] - [Nama Debitur] - Blok (e.g., "KTP - Jenni - E5")
- **Merge naming:** [Jenis Dokumen] - [Nama Debitur] - Blok (e.g., "Data Entry BTN - Jenni - E5")
- **PendingAction:** DB-backed (not in-memory), 5-minute TTL, scoped by channel
- **directResponse:** Bypass LLM for critical operations (DELETE, CONFIRM, CANCEL, CREATE) — prevent hallucination
- **Baileys:** 1 process for all agents (saves RAM)
- **DINA work hours:** 9-17 Senin-Sabtu (configurable)
- **Marketing AI hours:** 8 pagi - 12 malam (16 jam × 30 hari = 480 jam/bulan)

### 10.3 Git Tags (Fallback Points)
- `before-page7-removal` (commit e5007ae) — semua fix sebelum FLPP page 7 dihapus

---

## 11. FILE STRUCTURE (Key Files)

```
src/
├── app/
│   ├── api/
│   │   ├── dina/chat/          — DINA AI chat endpoint
│   │   ├── rina/chat/          — RINA AI chat endpoint
│   │   ├── mitra/chat/         — MITRA AI chat endpoint
│   │   ├── ratna/chat/         — RATNA AI chat endpoint
│   │   ├── rangga/chat/        — RANGGA AI chat endpoint
│   │   ├── marketing/chat/     — Shared endpoint for 10 Marketing AI
│   │   ├── bank-config/        — Bank config CRUD API (DELETE disabled)
│   │   ├── company-settings/   — Company settings CRUD (global)
│   │   ├── ocr/ktp/            — KTP OCR (VLM + Tesseract)
│   │   ├── ocr/sertifikat/     — Sertifikat OCR (VLM + Tesseract)
│   │   ├── documents/
│   │   │   ├── generate-logo/  — AI logo generation (prompt)
│   │   │   ├── edit-logo/      — AI logo recreation (upload)
│   │   │   ├── preview-flpp/   — FLPP BTN preview
│   │   │   ├── preview-spr-mandiri/ — SPR Mandiri preview
│   │   │   ├── preview-bsb/    — BSB Syariah preview
│   │   │   ├── preview-ajb/    — AJB preview
│   │   │   ├── google-docs/    — Google Drive/Docs integration
│   │   │   └── html-to-docx/   — HTML → DOCX conversion
│   │   └── ...
│   └── ...
├── components/
│   ├── berkas-view-v2.tsx      — Main BerkasView (3-column layout)
│   ├── dashboard/dashboard.tsx — Dashboard (5 tabs)
│   └── berkas-docs/
│       ├── CombinedDocEditorModal.tsx — SK Kerja + Slip Gaji modal
│       ├── LokasiKerjaModal.tsx      — Lokasi Kerja modal
│       ├── LogoGenerator.tsx         — Logo generator (2 modes)
│       └── docs/
│           ├── btn/    — BTN docs (SPR, Lampiran, dll)
│           ├── mandiri/ — Mandiri docs (SPR_MANDIRI)
│           ├── common/  — Common docs (BPHTB, Pernyataan, dll)
│           ├── notaris/ — Notaris docs (BAST, Kuasa, dll)
│           └── ...
├── lib/
│   ├── berkas/
│   │   ├── flpp-overlay/   — FLPP BTN fields + generator
│   │   ├── spr-mandiri-overlay/ — SPR Mandiri fields + generator
│   │   ├── ajb-overlay/    — AJB BTN fields + generator
│   │   ├── bsb-overlay/    — BSB Syariah fields + generator
│   │   ├── mandiri-overlay/ — Mandiri docs fields + generator
│   │   ├── templates/      — 20 SK Kerja + 20 Slip Gaji templates
│   │   ├── types.ts        — BerkasState, ApplicantData, PropertyData
│   │   └── constants.ts    — COMPANY_INFO, DEFAULT_PROPERTY
│   ├── agents/
│   │   ├── dina-knowledge.ts    — DINA system prompt
│   │   ├── dina-tools.ts        — DINA tools (CRUD, intent detection, pending action)
│   │   ├── agent-chat-handler.ts — Shared handler for all agents
│   │   ├── custom-commands.ts   — Custom command learning system
│   │   ├── llm-router.ts        — Multi-LLM router (ZAI + OpenRouter)
│   │   └── base-agent.ts        — BaseAgent class
│   ├── google/
│   │   ├── auth.ts          — Google OAuth2 + Service Account
│   │   ├── folders.ts       — Auto folder structure
│   │   ├── static-map.ts    — Google Static Maps
│   │   └── template-filler.ts — Google Docs API placeholder fill
│   └── db.ts                — Prisma client
├── prisma/
│   └── schema.prisma        — Full schema (25+ models)
└── wa-bot/                  — WhatsApp bot (Baileys)
    ├── src/
    │   ├── main.js          — Multi-agent orchestrator
    │   ├── agent.js         — Single agent runner (config-driven)
    │   └── agents/index.js  — 15 agent configs
    ├── DEPLOY.md            — Oracle Cloud deploy guide
    ├── setup-oracle-cloud.sh — 1-command VPS setup
    └── .env.example         — Template env vars
```

---

## 12. CURRENT DATABASE STATE

### 12.1 Customers (3)
- Andas Saputra — Blok E4, BSB_SYARIAH, Stage SP3K
- JENNI — Blok E5, BTN, Stage PEMBERKASAN
- Hadi Ekaputra Liega — Blok E6, BTN, Stage BOOKING

### 12.2 Agents (15)
- RATNA (CAO), DINA (DOCUMENT), RINA (FINANCE), MITRA (MATERIAL), RANGGA (MARKETING_LEADER)
- Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko (MARKETING)

### 12.3 Key Tables
- Customer (40+ fields including detailed KPR data)
- CompanySetting (global: companyName, director, NIK, phone, address, office, bank accounts)
- BankConfig (self-service bank management, DELETE disabled)
- PendingAction (DB-backed, 5-min TTL, scoped by channel)
- CustomCommand (DINA learning system, trigger + response + wildcards)
- AuditLog (track all CREATE/UPDATE/DELETE operations)
- GoogleDoc (Drive file metadata, onDelete:SetNull)
- Conversation + Message (chat history, per agent per channel)
- Memory (categorized: UTAMA, BERKAS, FINANCE, MATERIAL, MARKETING, DECISION)

---

## 13. NEXT IMMEDIATE TASKS (Priority Order)

1. **Wirausaha Laporan Keuangan via DINA** — DINA generate via Gemini → .docx → Drive → link
2. **Bank Config Builder Phase 2** — Visual UI + dynamic generator + migrate existing banks
3. **Memory System** — Tab "Memory" + learning by doing + RATNA/Mirofish integration
4. **Financial Tab (RINA)** — Budget, invoice, RAB, supplier payments
5. **WhatsApp Bot Deployment** — VPS Hostinger + 15 SIM cards
6. **n8n + Mirofish** — Automation + decision making

---

## CHANGE LOG

| Date | Version | Change |
|------|---------|--------|
| 8 Jul 2026 | 1.0 | Initial PRD created. Covers all phases, features, plans, rules. |

---

*This PRD is a living document. Update when features are added, changed, or planned. Push to GitHub for persistence. When losing context, re-read this PRD to regain track.*
