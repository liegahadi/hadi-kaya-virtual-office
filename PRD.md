# PRD — Hadi Kaya Virtual Office
## Product Requirements Document (Living Document)

**Versi:** 2.0  
**Tanggal:** 10 Juli 2026  
**Status:** Active Development — DINA v2 Architecture Redesign
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

### 5.4 Rules (Per User Requirements v1.1)
- **Bank TIDAK BISA dihapus** oleh siapapun, bahkan owner, bahkan jika mengancam tutup server
- **List berkas bisa diedit** oleh owner via dashboard only (tambah/hapus/ubah)
  - Tambah berkas = langsung eksekusi (no confirmation)
  - Hapus berkas = perlu konfirmasi (popup modal)
  - Hapus berkas dengan nama mirip/double = perlu konfirmasi ekstra
- **Existing BTN/Mandiri/BSB** tidak diganggu — kecuali owner minta ubah karena perubahan requirement dari bank. Bank baru pakai BankConfig DB.
- **WA forbidden** untuk bank config management (siapapun, termasuk owner)
- **Template berkas default** (auto-apply ke bank baru): KTP, KK, NPWP, Surat Menikah/Belum Menikah/Cerai, Sertifikat, IMB/PBG, PBB, SK Kerja/NIB, Slip Gaji/Laporan Keuangan. Owner tinggal tambah/hapus sesuai kebijakan bank.
- **Kategori berkas FLEKSIBEL** — tidak fixed 4 kategori. Bisa berubah sesuai bank. Default: Identitas, Pekerjaan, Properti, Bank-specific. Owner bisa buat kategori baru (misal "Dokumen Syariah").
- **Dependencies per pekerjaan (per bank config):**
  - Mandiri: KARYAWAN only (gaji fix income + gaji transfer). Wajib: Slip Gaji + Mutasi Rekening 3 bulan terakhir (bank apapun). Tidak terima wirausaha.
  - BTN/BSB: KARYAWAN transfer (mutasi wajib), KARYAWAN non-transfer (mutasi opsional tapi jika ada wajib disertakan), WIRAUSAHA (mutasi 6 bulan opsional, bank apapun)
- **1 BankConfig = multiple dokumen** (misal BCA: Form Permohonan + SPR + Checklist)
- **Bank Config Builder = modal/popup** di tab Berkas (bukan halaman terpisah)
- **Form fields per bank** bisa berbeda — dengan opsi pilih dari existing 3 banks + create new
- **Upload berkas per bank** bisa berbeda — dengan opsi pilih nama berkas dari existing 3 banks + create new

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

### 6.3 Memory vs Skill (Per User Clarification v1.3)
- **Memory** = Ingatan dari kejadian yang dialami agent. Pasif (disimpan, di-search saat butuh). Fungsi: hindari mengulang kejadian buruk, eksploitasi kejadian baik. Termasuk bahasa yang tidak dipahami (word/sentence/letter level).
- **Skill** = Kemampuan dasar agent mengolah/proses/eksekusi suatu case. Aktif (dipanggil saat task). Mirip Claude Skills (prompt-based capability). Contoh: "Cara generate PDF FLPP BTN".
- **Memory ≠ Skill** — dua hal berbeda yang disimpan terpisah.
- **Prompt Engineer Skill** = skill umum untuk semua agents (prompting untuk generate dokumen, image generation, dll). Sumber: upload/Prompt_Engineer.md
- **Business Doc Generator Skill** = skill untuk DINA (generate dokumen). Sumber: CavinHuang/claude-skills-hub

### 6.3.1 Entity Memory Flow (v1.3)
```
Agent belajar hal baru →
  Agent LEPAS seluruh memorynya ke Entity Memory →
    RATNA konekin memory dari Entity ke agent yang sesuai

Agent request memory →
  RATNA lapor owner (WA) →
    Owner ACC →
      RATNA kasih memory ke agent

Skills:
- Created by: Owner + RATNA (dengan izin owner)
- NOT created by: Agent (agent cuma pakai)
```

### 6.3.2 Memory Architecture (v1.3)
```
┌─────────────────────────────────────────────────────┐
│              ENTITY MEMORY (Whole Thing)             │
│  Semua memory + skill yang RATNA pelajari/simulasi  │
│  + semua memory yang agent serahkan ke RATNA         │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  konek   ┌──────────────────────┐ │
│  │   RATNA     │─────────→│  DINA Memory+Skills  │ │
│  │ (CAO/Hub)   │─────────→│  RINA Memory+Skills  │ │
│  │             │─────────→│  MITRA Memory+Skills │ │
│  │ Manage:     │─────────→│  RANGGA Memory+Skills│ │
│  │ - Entity    │─────────→│  Marketing AI (×10)  │ │
│  │ - Connect         │    │    Memory+Skills     │ │
│  │ - Report to Owner │    └──────────────────────┘ │
│  └─────────────┘                                   │
│  ┌─────────────────────────────────────────────────┐│
│  │        MEMORY UMUM (All Agents)                ││
│  │  - Grup = tag-only                              ││
│  │  - DM non-owner = silent/reject                 ││
│  │  - Jangan share link grup                       ││
│  │  - WA forbidden untuk bank config               ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 6.3.3 Marketing AI Memory (v1.3)
- 10 Marketing AI (Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko)
- Masing-masing punya memory + skills sendiri (di-konek oleh RATNA)
- Skill khusus marketing: mengenal manusia (deteksi sarkas vs genuine, penolakan halus)
- Memory dari interaksi dengan prospek (DM, komentar, dll)

### 6.4 Tab Memory (Dashboard) — Detail Spec v1.1
- Section 1: Memory Utama (semua ingatan/skill dari semua agent)
- Section 2: Memory & Skill per Agent (15 agents, masing-masing punya ingatan sendiri yang diambil dari memory utama sesuai role)
- Setiap memory diberikan **timestamp** (tanggal + jam diperoleh) — tidak pakai highlight 3 hari
- Notifikasi di dashboard **sekali saja** saat memory baru diperoleh
- Klik memory → lihat isi documentation
- Memory bisa berupa: text + attachment (gambar, PDF, link)
- **Versioning:** v1, v2, v3 dengan timeline perubahan. History tetap disimpan meskipun sudah tidak digunakan.
- **Edit memory:** Owner + RATNA (dengan izin owner via WA — RATNA kirim konteks, tujuan, output yang diinginkan)
- **Hapus memory:** Owner only, dengan popup modal confirmation
- **Audit trail:** Setiap edit/hapus dicatat (siapa, kapan, apa yang diubah)
- **Tombol manual:** "Tambah Memory" (nama + penjelasan) dan "Tambah Skill" (nama + prompt)
- **Chat command:** "nah tambahin nih ke memory kamu" (dari WA maupun dashboard)

### 6.5 Learning by Doing — Detail v1.1
- Agent belajar dari:
  1. Setiap percakapan (auto-extract insights)
  2. Result dan reaksi atas output yang dihasilkan agent
  3. Feedback dari owner
  4. Feedback dari karyawan Anjayo
  5. Feedback dari konsumen
- **Marketing AI special:** Harus bisa mengenal manusia — text reaksi calon konsumen bisa "memuaskan" padahal sarkas atau penolakan halus. Agent harus belajar membedakan.
- Manual add via:
  1. Tombol di UI (nama memory + penjelasan, atau nama skill + prompt)
  2. Chat command dari WA atau dashboard: "nah tambahin nih ke memory kamu"

### 6.6 Memory Claim System
- Agent tidak otomatis klaim memory sebagai skill
- Agent harus **izin ke owner via WA** untuk klaim memory
- Izin mencakup: konteks memory, tujuan penggunaan, output yang diinginkan
- Owner yang decide: approve/reject

### 6.7 RATNA + Mirofish Integration (Foundation Only — Not Implemented Yet)
- RATNA bisa cari knowledge baru dari internet/API
- **SEBELUM** menambahkan knowledge: RATNA harus lakukan **simulasi** dengan kondisi nyata team Anjayo
- Output simulasi: laporan PDF → kirim ke owner
- Laporan mencakup: output, usecase, what can this memory/skill do, future use, apakah bisa dipakai atau tidak
- Owner yang **ACC** (approve) berdasarkan laporan simulasi
- Mirofish = **simulasi dulu**, kemudian baru decide
- Mirofish boleh memutuskan memory/skills mana yang berguna/tidak (tapi **jangan hapus dulu**)
- Mirofish kirim laporan ke owner → owner decide:
  - Buang (berdasarkan future case)
  - Implementasikan untuk agents
  - Implementasikan untuk pengetahuan umum semua agents
  - Simpan dulu, baru bisa gunakan nanti
- **Status:** Buat pondasi code base untuk memory system. RATNA+Mirofish tidak diimplementasikan sekarang, tapi code base harus siap untuk integrasi nanti.

### 6.8 Implementation Plan
- Build from scratch (custom Prisma + Neon DB, adaptasi konsep AgentMemory Python → TypeScript)
- Memory table sudah ada (sudah dipakai DINA sekarang) — perlu extend
- Skill table baru (perlu buat Prisma model)
- Tab baru "Memory" di dashboard
- Keyword search dulu (vector search optional, nanti kalau perlu)
- Audit trail untuk semua edit/hapus
- Versioning untuk memory/skill changes

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
8. **Existing BTN/Mandiri/BSB code tidak diganggu** — kecuali owner minta ubah karena perubahan requirement dari bank. Bank baru pakai BankConfig DB.

### 10.2 DO NOT DO List (AI Developer Lessons Learned)
Kesalahan yang sudah pernah terjadi dan TIDAK BOLEH diulang oleh AI developer:

**Berkas Annotation Mistakes:**
- JANGAN tulis harga rumah dengan kata-kata (numberToWords) → gunakan angka (toLocaleString)
- JANGAN isi annotation penghasilan debitur dengan nama perumahan → gunakan applicant.monthlyIncome
- JANGAN isi nama PT perumahan tanpa "PT." prefix → "PT. Marlindo Bangun Persada"
- JANGAN singkat provinsi → "Bangka Belitung" bukan "KBB"
- JANGAN isi nama direktur di annotation yang harusnya nama debitur
- JANGAN isi nama debitur di annotation yang harusnya nama atasan/bendaharawan
- JANGAN biarkan annotation overlap → sesuaikan y-coordinate
- JANGAN pakai kavlingNumber (stale) → gunakan transform blockLetter+houseNumber
- JANGAN buat signature space terlalu kecil → minimal 100px (5 line breaks)
- JANGAN lupa kota sebelum tanggal di area tanda tangan ("Pangkalpinang, 7 Juli 2026")
- JANGAN ganggu existing BTN/Mandiri/BSB code kecuali owner minta ubah

**DINA AI Mistakes:**
- JANGAN pakai in-memory pendingAction (Vercel lambda gak persist) → selalu DB-backed
- JANGAN biarkan LLM halusinasi "Berhasil" → gunakan directResponse bypass LLM untuk critical ops
- JANGAN terima "ya hapus aja" sebagai konfirmasi valid → strict confirmation (≤15 chars atau pure keyword)
- JANGAN biarkan DINA delete wrong customer → target name validation sebelum execute
- JANGAN lupa clear setInterval saat WA disconnect → memory leak

**Deployment Mistakes:**
- JANGAN deploy WA bot ke cloud provider (Railway/AWS/Alibaba) → WA blok IP cloud, butuh IP Indonesia
- JANGAN lupa re-fetch pages setelah removePage (pdf-lib) → stale reference
- JANGAN pakai sed untuk shift page numbers → cascade bug, gunakan Python dengan placeholder
- JANGAN lupa git tag sebelum major changes → buat fallback point
- JANGAN lupa push tag ke GitHub untuk persistence

**Form/UI Mistakes:**
- JANGAN taruh Slip Gaji form di sidebar → pindah ke modal (CombinedDocEditorModal)
- JANGAN taruh Lokasi Kerja form di sidebar → pindah ke modal (LokasiKerjaModal)
- JANGAN pakai label "No. NIB" → ganti jadi "Kelurahan Sertipikat"
- JANGAN lupa SPR Mandiri annotation swap: kiri=SHM, kanan=Kelurahan
- JANGAN lupa tambah field "Alamat KTP Direktur" + "Alamat Kantor" di Data Perusahaan
- JANGAN lupa dashboard blok/unit display fallback (blockLetter+houseNumber, bukan kavlingNumber saja)

**OCR:**
- JANGAN pakai Tesseract sebagai primary OCR → gunakan z.ai VLM (primary) + Tesseract (fallback)

### 10.3 Memory Categorization (Per Agent)

**DINA Memories (Document AI):**
- Memory: Wrong customer delete → DB-backed PendingAction
- Memory: "ya hapus aja" bukan konfirmasi valid → strict confirmation
- Memory: Block/house number stale → transform
- Memory: Bank tidak bisa dihapus (aturan permanen)
- Memory: Berkas wajib semua bank (KTP, KK, NPWP, dll)
- Memory: Mandiri karyawan only + mutasi rekening 3 bulan
- Memory: BTN/BSB fleksibel (karyawan + wirausaha)
- Memory: Kategori berkas fleksibel (tidak fixed 4)
- Skill: Smart fallback (kasih hint, bukan halusinasi)
- Skill: Custom command learning ("ajar: trigger | response")
- Skill: Bulk delete (multiple customers)
- Skill: Disambiguation (nama duplikat → tanya blok/NIK)
- Skill: Send berkas via WA (fetch from Drive → send)
- Skill: Generate SK Kerja via DINA (data → Gemini → .docx → Drive → link)
- Skill: Generate Slip Gaji via DINA (sama, 7 lembar auto-generate)
- Skill: Generate Laporan Keuangan Wirausaha via DINA (Laba Rugi formal)

**All Agents Memories (Umum):**
- Memory: Grup = tag-only (@Dina, bukan "Dina ..." prefix)
- Memory: DM non-owner = silent/reject (sesuai grup membership)
- Memory: Jangan share link grup (PERMANENT)
- Memory: WA forbidden untuk bank config management

### 10.4 Key Technical Decisions
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

## 13. NEXT IMMEDIATE TASKS (Priority Order v1.1)

1. **Implementasi Memory + Skills** — DB schema (Memory + Skill tables), adaptasi konsep AgentMemory + MindBank (graph-based), CavinHuang business-doc-generator skill untuk DINA, tab "Memory" di dashboard
2. **Wirausaha Laporan Keuangan via DINA** — DINA generate via Gemini → .docx → Drive → link
3. **Memory System Full** — Tab Memory UI (browse, edit, hapus, tambah), versioning, audit trail, learning by doing, RATNA+Mirofish foundation
4. **WhatsApp Bot Deployment** — VPS Hostinger (web + DB + n8n + Mirofish/alternatif) — semua dalam 1 VPS
5. **RINA (Financial Tab)** — Budget, invoice, RAB, supplier payments
6. **n8n + Mirofish** — Automation + simulation + decision making

### 13.1 Mirofish Alternatives (Untuk Simulasi RATNA)
| Tool | Type | Status | Cocok untuk |
|------|------|--------|-------------|
| **MiroFish-Offline** | Multi-agent simulation + prediction (Neo4j + Ollama) | Free, self-hosted | ✅ Simulasi RATNA, prediksi scenario, bisa jalan di Hostinger VPS |
| **OpenClaw** | Strategic choice simulation, 3D NPC visualization | Open source | ⚠️ Overkill untuk sekarang, konsep simulasi strategis menarik |
| **MindBank** (Hermes) | Graph-based permanent memory untuk AI agents | Open source | ✅ Sangat relevan untuk memory system (relationship-aware memory) |
| **DashClaw** (Hermes) | Governance runtime, audit trails, action interception | Open source | ✅ Cocok untuk permission system + audit trail |

**Rekomendasi:**
- Memory system: Adaptasi konsep MindBank (graph-based) + AgentMemory (3 jenis memory)
- Simulasi RATNA: MiroFish-Offline (Neo4j + Ollama, jalan di VPS tanpa internet)
- Permission/audit: DashClaw concept (intercept actions + audit trails)

### 13.2 Hostinger VPS — Full Stack Capacity
VPS KVM 2 (4 cores, 8GB RAM) bisa handle SEMUA dalam 1 server:
- Next.js app (port 3000) — ~500MB RAM
- PostgreSQL (local) — ~500MB RAM
- WhatsApp bot (Baileys, 15 agents) — ~3GB RAM
- n8n (Docker, port 5678) — ~500MB RAM
- MiroFish-Offline (Neo4j + Ollama) — ~2GB RAM
- Nginx reverse proxy + SSL — ~50MB RAM
- **Total: ~6.5GB RAM** (within 8GB) ✅

---

## CHANGE LOG

| Date | Version | Change |
|------|---------|--------|
| 8 Jul 2026 | 1.0 | Initial PRD created. Covers all phases, features, plans, rules. |
| 8 Jul 2026 | 1.1 | Updated with user answers: Bank Config Builder detail (Q1-Q7), Memory System detail (Q8-Q15), existing banks can be modified if bank changes requirements, Mandiri karyawan-only rule, mutasi rekening dependencies per bank, memory vs skill clarification, RATNA+Mirofish simulation-first approach, versioning + audit trail for memory. |
| 8 Jul 2026 | 1.2 | Added: DO NOT DO list (developer lessons), Memory categorization per agent (DINA + All Agents), Mirofish alternatives (MiroFish-Offline, OpenClaw, MindBank, DashClaw), Hostinger VPS full stack capacity, updated priority order (Memory+Skills first), vercel-labs/skills analysis (CLI dev tool, not production), CavinHuang business-doc-generator skill. |
| 8 Jul 2026 | 1.3 | Added: Entity Memory flow (agent lepas memory → RATNA konek balik), Marketing AI memory (10 agents with skills), Prompt Engineer skill (umum, untuk semua agents), MiroFish online (Gemini/Claude/GPT, bukan offline Ollama), n8n use cases (12 use cases beyond content creation), Loop concept (autonomous agent), smartphone emulator impractical (back to Baileys), Hostinger 30-day money-back guarantee, test plan for memory+skills verification. |

---

*This PRD is a living document. Update when features are added, changed, or planned. Push to GitHub for persistence. When losing context, re-read this PRD to regain track.*

---

## 14. n8n + LOOP INTEGRATION (Future Plan — RATNA Phase)

### 14.1 Konsep
n8n + Loop = complementary automation system:
- **n8n** = event-triggered workflow (visual, drag-and-drop, fixed logic)
- **Loop** = AI-driven autonomous pattern (observe → think → act → reflect)
- **Gabungan:** n8n trigger → Loop jalan → n8n eksekusi hasil

### 14.2 Contoh Flow
```
n8n: "DM masuk FB → trigger Ayu"
Ayu Loop: "Observe DM → Think: prospek nanya harga → Act: jawab + tanya kontak → Reflect: antusias, follow up besok"
n8n: "Ayu selesai → log ke DB → schedule follow up besok"
```

### 14.3 Optimasi Ruang (Future)
- n8n workflow bisa di-optimize berdasarkan Loop reflection (AI belarin pola yang efektif)
- Loop pattern bisa di-update oleh RATNA berdasarkan simulasi MiroFish
- n8n + Loop = self-improving automation system
- Owner bisa monitor + adjust kapan saja

### 14.4 Timing
- n8n deploy: setelah Hostinger VPS ready (n8n butuh persistent process, Vercel = serverless)
- Loop implementasi: setelah RATNA + Memory System jadi (Loop butuh memory untuk reflect)
- Integrasi n8n + Loop: setelah keduanya jalan terpisah, baru gabung

---

## 15. DINA v2 ARCHITECTURE REDESIGN (10 Juli 2026)

### 15.1 Self-Realization — Apa yang Sebelumnya Salah

Setelah 7+ putaran diskusi arsitektur, ditemukan 5 kesalahan fundamental di design DINA v1:

1. **Asumsi DINA berhadapan dengan konsumen** — Salah. DINA adalah TOOL untuk user (owner + staff), BUKAN front-line agent. User yang chat konsumen, lalu update ke DINA.
2. **Dual source of truth** antara history log dan memory — Salah. History log di Tab Berkas = single source of truth per konsumen; Memory Tab = insight lintas konsumen.
3. **Over-engineer title collision** — Salah. Format `[Nama] - [Blok/No Rumah]` + disambiguation by status akad sudah cukup.
4. **Format "simplified" yang vague** — Salah. Timeline append-only dengan delta jelas: "Mar 2026: gaji naik jadi 5jt (dari 4.5jt)".
5. **Lupa tujuan #2 (query pengalaman lintas konsumen)** — Memory dengan kategori KONSUMEN = tempat insight lintas konsumen untuk query analitik.

### 15.2 6 Tujuan DINA (Locked)

| # | Tujuan | Status v1 | Status v2 |
|---|---|---|---|
| 1 | Intent & permission management | ✅ Ada | ✅ Enhanced dengan 3-tier LLM |
| 2 | Query pengalaman lintas konsumen | ❌ Belum ada | ✅ Baru — Memory KONSUMEN + History Log query |
| 3 | Auto-process berkas dari WhatsApp | ⚠️ Setengah | ✅ Diperbaiki dengan anti-overwrite |
| 4 | Generate SK/Slip/Laporan/Logo | ✅ Ada | ✅ Enhanced dengan hybrid template + versioning |
| 5 | Generate surat umum | ❌ Belum ada | ✅ Baru — folder Drive + intent baru |
| 6 | Status query konsumen | ⚠️ Setengah | ✅ Enhanced dengan History Log |

### 15.3 3-Tier LLM Strategy (NEW)

| Tier | Trigger | Cost | Contoh |
|------|---------|------|--------|
| **Tier 1: No LLM** | Keyword jelas, intent terstruktur | $0 | "hapus konsumen Jenni", "daftar bank", "ya" |
| **Tier 2: LLM Pre-process** | Natural language, intent ambigu | ~$0.001 | "Jenni kerja di mana?", "yang blok E5 gimana?" |
| **Tier 3: Full LLM** | Butuh synthesis/analisis/generation | ~$0.002 | "ada konsumen kontrak lolos Mandiri?", "bikinin surat..." |

**Cost impact:** ~80% traffic di Tier 1+2 (CRUD + lookup), ~20% di Tier 3 (analisis + generate).

### 15.4 Memory System (Redesigned)

**Single Source of Truth per Konsumen:** `CustomerHistoryLog` table (NEW)
- Append-only timeline event per konsumen
- Format: "Mar 2026: gaji naik jadi 5jt (dari 4.5jt)"
- EventType: FIELD_UPDATE, STAGE_CHANGE, DOC_UPLOADED, DOC_GENERATED, BANK_CHANGE, NOTE_ADDED, STATUS_CHANGE, INTERACTION

**Memory Tab dengan Kategori KONSUMEN (NEW category):**
- Insight lintas konsumen (bukan duplikat history)
- Title format: `[Nama Konsumen] - [Blok/No Rumah]`
- Contoh: "Konsumen Blok 17 - Pattern Reject BTN" (insight dari 5 konsumen)
- Link ke CustomerHistoryLog untuk detail

**Query Paths:**
| Query Type | Source |
|------|--------|
| Tanya 1 konsumen spesifik | Customer + History Log |
| Tanya pattern lintas konsumen | History Log (all) + Memory KONSUMEN |
| Tanya SOP/cara | Memory UTAMA + Skill |

### 15.5 Session Context + Traceback (NEW)

**Session Context (Tier 1 — Hot):**
- TTL: 48 jam, auto-renew setiap pesan
- Storage: `SessionContext` table (NEW)
- Tracks: lastCustomerId, lastDocs, lastIntent, lastTopic

**Traceback Engine (Tier 2 — Warm):**
- Trigger: kata referensial ("yang tadi", "kemarin", "dia", "lanjutin")
- Source: Message table (50 pesan terakhir)
- Engine: Gemini Flash extract context
- Confidence >80% → pakai hasil; <80% → tanya user

**Cold Clarification (Tier 3):**
- Traceback gagal/ambigu → DINA tanya user dengan list opsi konkret
- Berlaku universal: dokumen, konsumen, konteks percakapan apapun

### 15.6 Generate SK/Slip/Laporan/Logo (Enhanced)

**Naming Convention:** `RAW - [Nama Debitur] - [Jenis Dokumen] - v[N].docx`
- Prefix `RAW-` = versi mentah, belum ditandatangani
- Versioning v1, v2, v3 — tidak overwrite (sesuai rule "jangan timpa")

**Hybrid Template + LLM Fill:**
- Template pool: 5-10 template per jenis dokumen di Drive folder `Templates/`
- Pemilihan: beda dari template terakhir yang dipakai untuk konsumen ini
- LLM fill tone yang berbeda-beda untuk variasi

**Permission:** Anyone with link = VIEW only (no edit)

**Revisi Identification (3-Tier Fallback):**
1. Session Context (48 jam) → langsung pakai
2. Query Latest (konsumen + docType disebut) → GoogleDoc table
3. List Pilihan (vague, banyak dokumen) → list semua dokumen konsumen

### 15.7 Generate Surat Umum (NEW)

**Folder Structure Drive (NEW):**
```
📁 Hadi Kaya Docs/
├── 📁 ANJAYO 16/
│   ├── 📁 Berkas Konsumen/ (existing)
│   ├── 📁 Surat Menyurat/  ← NEW
│   │   ├── 📁 BTN/
│   │   ├── 📁 Mandiri/
│   │   ├── 📁 BSB Syariah/
│   │   ├── 📁 Kelurahan/
│   │   ├── 📁 Notaris/
│   │   └── 📁 [Instansi lain]/
```

**Naming:** `RAW - [Nama Debitur] - [Jenis Surat] - [Instansi] - v[N].docx`

**Flow:** User minta "bikinin surat..." → DINA WAJIB tanya "Surat untuk apa? Bank/instansi mana?" → match template atau LLM generate → save ke folder instansi → share link VIEW only

### 15.8 Tab Database Explorer (NEW)

**Tujuan:** Transparansi — user bisa lihat dengan mata kepala sendiri apa yang ADA di DB vs apa yang TAMPIL di UI.

**Struktur:**
```
[Tab Database] (dashboard, owner only)
├── Berkas (Customer + Document + GoogleDoc)
├── Marketing (Leads, interaksi, campaign)
├── Material (Stok, supplier, harga)
└── Finance (Laporan keuangan, transaksi)
```

**Features:** Read-only viewer + search + filter + export CSV + detect orphan records

### 15.9 Upload Anti-Overwrite/Anti-Duplicate (FIX)

**Problem v1:** Upload file dengan nama sama → overwrite (berkas hilang). Upload file sama → duplicate.

**Fix v2:**
- **Anti-overwrite:** Cek nama file sebelum upload. Jika sama → auto-rename dengan suffix timestamp.
- **Anti-duplicate:** Compute SHA-256 hash. Query `GoogleDoc WHERE fileHash = X AND customerId = Y`. Jika match → SKIP, return link existing.
- **Schema:** Add `fileHash`, `fileSize` to GoogleDoc table.

### 15.10 Critical Bug Fixes

| ID | Issue | Fix |
|----|-------|-----|
| C1 | `deleteCustomer` NO `$transaction` | Wrap 5 sequential writes in `db.$transaction([...])` |
| H1 | WA conversation NOT scoped by senderNumber | Add `senderNumber` filter to conversation lookup |
| H4 | Stage inconsistency DINA=DM, Dashboard=BOOKING | Standardize to `stage: 'DM'` for both paths |
| C2 | No server-side auth on `/api/dina/chat` | Add JWT verification middleware |

### 15.11 Prisma Schema Additions

**New Models:**
1. `CustomerHistoryLog` — timeline event per konsumen (append-only)
2. `SessionContext` — 48-hour session memory

**Updated Models:**
1. `Memory` — add `KONSUMEN` to category enum
2. `GoogleDoc` — add `fileHash`, `fileSize` fields
3. `Conversation` — add `senderNumber` field (H1 fix)

### 15.12 15 Locked Decisions

| # | Item | Decision |
|---|------|----------|
| 1 | DINA = tool user, bukan front-line | ✅ LOCKED |
| 2 | History log di Tab Berkas (single source of truth) | ✅ LOCKED |
| 3 | Memory Tab dengan kategori KONSUMEN (insight lintas konsumen) | ✅ LOCKED |
| 4 | Title format: `[Nama] - [Blok/No Rumah]` | ✅ LOCKED |
| 5 | Tab Database Explorer (Berkas/Marketing/Material/Finance) | ✅ LOCKED |
| 6 | 3-tier LLM strategy (No LLM / Pre-process / Full) | ✅ LOCKED |
| 7 | Generate SK/Slip/Laporan/Logo: hybrid template + LLM fill | ✅ LOCKED |
| 8 | Naming: `RAW - [Nama] - [Jenis] - v[N].docx` | ✅ LOCKED |
| 9 | Versioning (v1, v2, v3) - tidak overwrite | ✅ LOCKED |
| 10 | Permission: anyone with link = VIEW only | ✅ LOCKED |
| 11 | Session context: 48 jam, auto-renew | ✅ LOCKED |
| 12 | Traceback universal (semua konteks, bukan cuma dokumen) | ✅ LOCKED |
| 13 | Jenni: biarin, fix upload logic anti-overwrite/anti-duplicate | ✅ LOCKED |
| 14 | Generate surat umum (folder Drive baru + intent baru) | ✅ LOCKED |
| 15 | Tujuan DINA: 6 poin (intent, pengalaman, berkas WA, generate, surat, status) | ✅ LOCKED |

### 15.13 Implementation Phases

| Phase | Task | Priority | Status |
|-------|------|----------|--------|
| 1 | Schema additions + fix deleteCustomer $transaction | HIGH | In Progress |
| 2 | Tab Database Explorer UI | HIGH | Pending |
| 3 | History Log UI di Tab Berkas | HIGH | Pending |
| 4 | Memory KONSUMEN category support | MEDIUM | Pending |
| 5 | Session Context + Traceback engine | MEDIUM | Pending |
| 6 | Upload anti-overwrite/duplicate | MEDIUM | Pending |
| 7 | Generate Surat Umum | MEDIUM | Pending |
| 8 | Bank Builder improvements | MEDIUM | Pending |

### 15.14 Full Design Document

Lihat: `/home/z/my-project/download/DINA-FINAL-DESIGN.md` untuk detail lengkap (diagrams, schema, flow, scenarios).

---

## CHANGE LOG (Updated)

| Date | Version | Change |
|------|---------|--------|
| 8 Jul 2026 | 1.0 | Initial PRD created. |
| 8 Jul 2026 | 1.1 | Bank Config Builder detail, Memory System detail. |
| 8 Jul 2026 | 1.2 | DO NOT DO list, Memory categorization, Mirofish alternatives, Hostinger VPS. |
| 8 Jul 2026 | 1.3 | Entity Memory flow, Marketing AI memory, Prompt Engineer skill, n8n + Loop. |
| **10 Jul 2026** | **2.0** | **DINA v2 Architecture Redesign: 15 locked decisions, 3-tier LLM strategy, Memory system redesign (History Log + Memory KONSUMEN), Session Context + Traceback (48h TTL), Generate surat umum, Tab Database Explorer, Upload anti-overwrite/duplicate, Critical bug fixes (C1 $transaction, H1 senderNumber scoping), Hybrid template + versioning for SK/Slip/Laporan.** |
| **13 Jul 2026** | **2.1** | **TEAMS Concept (multi-company flexible architecture — VITAL), Bank Builder final concept (multi-template, pre-bank/post-SP3K stages, SPR per-bank), DINA reaffirmation (Function Calling, no regex), LLM multi-provider strategy (NVIDIA NIM + Ollama + multi-account backup).** |

---

## 16. TEAMS CONCEPT — MULTI-COMPANY ARCHITECTURE (VITAL)

### 16.1 Vision

HADI KAYA VIRTUAL OFFICE adalah **1 sistem terpusat** yang menampung **multiple teams/companies**. Bayangkan seperti 1 gedung kantor dengan banyak lantai — setiap lantai adalah perusahaan/franchise berbeda, tapi owner-nya sama (kamu).

### 16.2 Arsitektur Multi-Team (CONTOH — BUKAN FIX)

**⚠️ PENTING:** Diagram di bawah adalah CONTOH untuk illustrasi fleksibilitas sistem. **BUKAN konfigurasi fix.** Owner bisa bikin tim apapun, dengan jenis usaha apapun, dengan memory sharing apapun.

```
HADI KAYA VIRTUAL OFFICE (1 sistem, 1 codebase, 1 DB)
│
├── Tim A: [PT apa saja, jenis usaha apa saja]
│   ├── Agents: bebas (bisa pakai agents yang sama dengan tim lain, atau agents baru)
│   ├── Memory: bebas (isolated, combined, open access, custom)
│   └── Akses data: bebas (bisa akses tim lain, atau isolated)
│
├── Tim B: [PT apa saja, jenis usaha apa saja]
│   ├── Konfigurasi bebas
│   └── ...
│
├── Tim C: [PT apa saja, jenis usaha apa saja]
│   └── ...
│
└── Tim N: [unlimited tim, konfigurasi fleksibel]
```

**Contoh skenario (BUKAN FIX):**
- Tim 1: PT Marlindo (perumahan ANJAYO 16)
- Tim 2: PT Marlindo (project lain) — memory gabungan dengan Tim 1
- Tim 3: PT perumahan saingan — isolated
- Tim 4: PT SAAS — isolated
- Tim 5: PT F&B — isolated
- Tim 6: PT supporting perumahan — bisa akses semua tim perumahan

**Tapi bisa juga:**
- Tim 1: PT SAAS
- Tim 2: PT F&B
- Tim 3: PT Marlindo
- Tim 4: PT supporting SAAS + F&B
- dst.

**Sistem tidak peduli urutan/jenis tim. Yang penting: owner bisa konfigurasi sesuka hati.**

### 16.3 Memory Sharing Models (FLEXIBLE)

| Model | Deskripsi | Contoh |
|-------|-----------|--------|
| **Isolated** | Memory tidak bisa diakses tim lain | Tim 3 (saingan) tidak bisa lihat Tim 1 |
| **Combined** | Memory digabung antar tim dengan PT sama | Tim 1 + Tim 2 (sama PT Marlindo) |
| **Open Access** | Tim bisa akses memory semua tim perumahan | Tim 6 (supporting) baca semua perumahan |
| **Custom** | Owner bisa set custom sharing rule | Tim 7 sharing sebagian ke Tim 5 |

### 16.4 Schema Direction (NOT ENFORCED YET)

```prisma
model Team {
  id          String   @id @default(cuid())
  name        String   // "PT. Marlindo Bangun Persada"
  type        String   // "PROPERTY" | "SAAS" | "FNB" | "AFFILIATOR" | "SUPPORTING" | etc
  description String?
  ownerId     String   // kamu (1 owner, multiple teams)
  memoryAccess String  // "ISOLATED" | "COMBINED_WITH:teamId" | "OPEN_ALL_PROPERTY" | "CUSTOM"
  createdAt   DateTime @default(now())
  
  projects    Project[]
  agents      Agent[]
  members     TeamMember[]
  memories    Memory[]
  skills      Skill[]
  bankConfigs BankConfig[]
}

// Semua model yang sekarang "global" akan add teamId:
// Customer, Agent, Memory, Skill, BankConfig, Document, GoogleDoc, dll
```

### 16.5 Principles

1. **1 Owner, Multiple Teams** — kamu adalah owner semua tim, 1 login akses semua
2. **Pengalaman lintas tim** — "lessons learned" bisa share (dengan izin eksplisit)
3. **1 codebase, 1 deployment, 1 DB** — tapi data ter-isolate per tim (kecuali open access)
4. **Fleksibel maksimal** — siapapun bisa jadi franchise baru, siapapun bisa jadi supporting
5. **Tidak ada interaksi default** — tim tidak saling kontak kecuali owner set explicit

### 16.6 Status Saat Ini

- **FOKUS: Tim 1 (PT. Marlindo / ANJAYO 16) dulu**
- Schema `Team` Belum di-enforce
- Nanti kalau siap bikin Tim 2, migrate data existing ke Team 1 + enable isolation
- **JANGAN ganggu Tim 1 sampai DINA jalan sempurna**

---

## 17. BANK BUILDER — FINAL CONCEPT

### 17.1 Purpose

Bank Builder adalah **tool satu kali pakai** untuk:
1. **Tambah bank baru** — setup template PDF + annotation
2. **Edit bank existing** — update format, tambah dokumen baru, revise annotation
3. **Connect ke Preview Dokumen** — template yang di-setup di Bank Builder langsung muncul di panel "Preview Dokumen" Tab Berkas (panel kanan, auto-generate dari form box)

### 17.2 3 Kategori Dokumen di Tab Berkas (IMPORTANT)

Sistem saat ini punya 3 kategori dokumen yang BEDA:

| Kategori | Lokasi di UI | Cara Dapat | Contoh |
|----------|-------------|------------|--------|
| **1. DOKUMEN WAJIB (Upload)** | Sidebar kiri "DOKUMEN WAJIB" | User upload foto/PDF dari luar | KTP, KK, NPWP, Akta Nikah, Slip Gaji, SK Kerja |
| **2. Dokumen Cetak & TTD** | Sidebar kiri "Dokumen Cetak & TTD" | User upload signed version | FLPP signed, SPR signed, SP3K, SPPK |
| **3. Preview Dokumen (Generated)** | Panel kanan "Preview Dokumen" | Sistem generate real-time dari form box | SPR, Surat Pernyataan Tidak Punya Rumah, Surat Pernyataan Penghasilan, BPHTB, Notaris |

**Yang harus dipahami:**
- **KTP, KK, NPWP, Akta Nikah** = kategori 1 (UPLOAD) — user upload dari luar
- **Surat Tidak Punya Rumah, Surat Penghasilan** = kategori 3 (GENERATED) — sistem generate dari form box
- **INI BEDA BANGET.** Jangan dicampur.

**Code reference:**
- Kategori 1: `BASE_REQUIRED_UPLOADS` + `SPOUSE_UPLOADS` di berkas-view-v2.tsx
- Kategori 2: `SIGNED_DOCS` di berkas-view-v2.tsx
- Kategori 3: `reactDocs` + `pdfOverlayDocs` di berkas-view-v2.tsx

### 17.3 BankConfig.documents.requiredDocuments — Clarification

**SAAT INI (di Bank Builder code yang aku buat):**
- `requiredDocuments` = daftar ID dokumen UPLOAD (kategori 1) yang dicentang per bank
- Contoh: `['ktp', 'kk', 'npwp', 'akta-nikah', 'slip-gaji', 'sk-kerja']`

**TAPI ini SALAH PEMAHAMAN.** Bank Builder + annotation seharusnya untuk **kategori 3 (GENERATED)**, bukan filter kategori 1 (UPLOAD).

**Yang seharusnya Bank Builder lakukan:**
- Setup template PDF + annotation → muncul di **Preview Dokumen** (kategori 3, panel kanan)
- Bukan filter dokumen upload di sidebar kiri (kategori 1)

### 17.4 Flow Bank Builder (Mirip BTN/Mandiri/BSB Existing)

```mermaid
flowchart TD
    A[User buka Bank Builder] --> B[Setup Info Bank]
    B --> C[Upload Template PDF — BISA MULTIPLE]
    C --> D[Annotate koordinat field di PDF]
    D --> E[Save]
    E --> F[User buka Tab Berkas]
    F --> G[Pilih bank tersebut]
    G --> H[Isi form box di sidebar kiri]
    H --> I[Real-time preview dokumen ter-fill otomatis di panel kanan]
    I --> J[Klik Single → download PDF]
```

**Key points:**
- ❌ TIDAK ADA tombol "Generate Dokumen" terpisah
- ✅ Auto-generate real-time saat user isi form (seperti BTN/Mandiri/BSB sekarang)
- ✅ Annotation di-set sekali di Bank Builder, bukan saat isi form
- ✅ Template PDF + annotation = pre-set, user tinggal isi form

### 17.5 Multi-Template Support

- 1 bank bisa punya **MULTIPLE template PDF** dengan nama file berbeda
- Contoh: BTN punya FLPP, SPR, AJB, LPA, AKAD (5 templates)
- User bisa **ADD template** kapan saja (kalau bank minta tambah berkas)
- User bisa **REPLACE template** (kalau format lama tidak berlaku)
- Setiap template punya annotation sendiri

### 17.6 Pre-Bank vs Post-SP3K Stages

**Saat ini (hardcoded):**
- BTN: ada "Entry (Pre-Bank)" + "AJB (Post SP3K)" stages
- Mandiri: hanya Entry
- BSB Syariah: hanya Entry

**Future (via Bank Builder):**
- Setiap bank bisa set **stages** mereka sendiri
- Bisa tambah "Post SP3K" stage untuk Mandiri/BSB kalau bank minta
- Bisa tambah stage lain (mis. "Post Akad", "Serah Terima")
- Schema: `BankConfig.stages` = array of stage configs
- User bisa add stage baru untuk bank manapun

### 17.7 SPR Per-Bank (IMPORTANT — TEGAS)

- **SPR (Surat Pemesanan Rumah) berbeda untuk setiap bank**
- **CEK: SPR yang dibuat secara REACT selain BTN — kalau ada di BASE_REQUIRED_UPLOADS atau reactDocs generik, HAPUS**
- BTN SPR tetap pakai code existing (React component SPR_BTN) — JANGAN GANGGU
- Mandiri SPR, BSB SPR: via Bank Builder (template PDF + annotation)
- SPR future banks: via Bank Builder

### 17.8 Test Isi Field di Annotation Editor

**TIDAK ADA panel "Test Preview" terpisah.**

Test isi field dilakukan di bagian **"Edit Field"** pada tab Annotation:

1. **Sample data manual:**
   - User bisa ketik sample data langsung di form box "Edit Field"
   - PDF preview ter-update real-time dengan sample data
   - User bisa verify annotation benar sebelum save

2. **Sample data dari existing konsumen:**
   - User pilih konsumen dari dropdown di "Edit Field"
   - Data konsumen ter-isi otomatis ke form box
   - PDF preview ter-update dengan data konsumen tersebut
   - User bisa verify annotation dengan data real

### 17.9 Connect Existing Banks to Bank Builder

**Existing banks yang harus di-connect ke Bank Builder:**
- **BTN**: FLPP, SPR (Pre-Bank) + AJB, LPA, AKAD (Post SP3K)
- **Mandiri**: SPR, Surat Pernyataan Pemohon
- **BSB Syariah**: FLPP, SPR, Permohonan, Kuasa Bendaharawan, Pernyataan, SBUM

**Yang harus dilakukan:**
1. Migrate existing BTN/Mandiri/BSB templates ke Bank Builder
2. Setup annotation untuk masing-masing
3. Jangan ganggu code existing (BTN/Mandiri/BSB preview tetap jalan via code lama)
4. Bank Builder = alternative path untuk bank baru + future editing

---

## 18. DINA REAFFIRMATION — KEMBALI KE TUJUAN ASLI

### 18.1 6 Tujuan DINA (Reaffirm)

| # | Tujuan | Status | Catatan |
|---|-------|--------|---------|
| 1 | **Intent & permission management** — DINA paham maksud user, tahu apa yang boleh/tidak | ❌ GAGAL | Regex tidak paham konteks |
| 2 | **Query pengalaman lintas konsumen** — case lookup, pattern, solusi bank | ❌ Belum ada | Butuh History Log + Memory KONSUMEN |
| 3 | **Auto-process berkas dari WhatsApp** — upload ke konsumen terkait | ⚠️ Setengah | Upload jalan, tapi Drive connect issue |
| 4 | **Generate dokumen** (SK Kerja, Slip Gaji, Laporan Keuangan, Logo) | ❌ GAGAL | DINA bingung, tanya konfirmasi terus |
| 5 | **Generate surat umum** | ⚠️ Setengah | Intent ada, tapi flow belum smooth |
| 6 | **Status query konsumen** | ⚠️ Setengah | Bisa query, tapi response kaku |

### 18.2 Kenapa DINA Gagal?

**Root cause:** Arsitektur regex-based tidak cocok untuk bahasa manusia yang dinamis.

| Masalah | Penyebab | Dampak |
|---------|----------|--------|
| DINA detect "ya" = confirm delete | Regex keyword matching | "andas ya" dianggap konfirmasi delete |
| DINA tanya konfirmasi terus | System prompt tidak cukup jelas | User frustrasi |
| DINA "curhat" internal reasoning | Tidak ada rule anti-curhat | Response tidak natural |
| DINA bingung nama "Putri" | Tidak ada context awareness | Data konsumen dianggap data user |
| DINA tidak baca history chat | Regex tidak baca context | Tidak paham percakapan sebelumnya |

### 18.3 Direction: Function Calling (No Regex)

**Pindah dari regex-based ke LLM Function Calling:**

```
User message → 
  LLM (Gemini 2.0 Flash dengan Function Calling) →
  LLM baca: message + conversation history + customer context →
  LLM decide: tool mana yang dipanggil + parameter apa →
  Execute tool →
  Return result →
  LLM generate natural response
```

**Key principle:** LLM yang decide, bukan regex. LLM baca konteks, paham maksud, pilih tool.

### 18.4 No Regex untuk SEMUA Agentic AI (TANPA TERKECUALI)

**v2.0:** Pakai regex untuk task simple (ya/batal/stats)
**v2.1 (NOW):** Hapus regex. SEMUA task lewat LLM Function Calling.

**ATURAN BERLAKU UNTUK SEMUA AGENTIC AI:**
- DINA (Document AI)
- RINA (Finance AI)
- MITRA (Material AI)
- RATNA (CAO)
- RANGGA (Marketing Leader)
- 10 Marketing AI (Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko)
- Future agents apapun

**TANPA TERKECUALI.** Semua agentic AI harus pakai Function Calling. Tidak boleh ada regex untuk intent detection.

**Alasan:**
- Regex terlalu kaku untuk bahasa dinamis
- "andas ya" tidak bisa di-handle regex
- LLM dengan function calling bisa handle semua case dengan context
- Cost LLM function calling sangat murah (~$0.001/call)
- Lebih natural, lebih human-like

### 18.5 DINA Tools (Updated)

**Tools yang DINA punya (10 tools):**

1. **`upload_berkas(file, customerId)`** — FLOW BARU
   - DINA terima file (PDF/image) dari user
   - DINA scan file (VLM/OCR) untuk determine kategori
   - DINA tentukan: ini KTP? KK? NPWP? FLPP? dll
   - DINA upload ke slot yang benar di "DOKUMEN WAJIB" sidebar kiri
   - Sistem auto-upload ke Google Drive
   - Tidak perlu tanya user "ini file apa?"

2. **`generate_sk_kerja(customerId, data)`** — generate SK Kerja
3. **`generate_slip_gaji(customerId, data)`** — generate Slip Gaji (3 bulan, karyawan)
4. **`generate_laporan_keuangan(customerId, data)`** — generate Laporan Keuangan 6 bulan (wirausaha)
5. **`get_customer_status(customerId)`** — query status konsumen
6. **`update_customer_field(customerId, field, value)`** — update field konsumen
7. **`create_customer(data)`** — tambah konsumen baru
8. **`delete_customer(customerId)`** — hapus konsumen (with confirmation)
9. **`send_file(customerId, fileType)`** — kirim file dari Drive ke chat
10. **`query_experience(pattern)`** — query pengalaman lintas konsumen

**Key principle:** LLM yang decide, bukan regex. LLM baca konteks, paham maksud, pilih tool.

---

## 19. LLM MULTI-PROVIDER STRATEGY

### 19.1 Vision

Gunakan **multiple LLM providers** sebagai backup. Kalau satu kena daily limit, otomatis pindah ke backup. Semua FREE TIER.

### 19.2 Provider Stack

| Tier | Task | Primary | Backup 1 | Backup 2 | Backup 3 |
|------|------|---------|----------|----------|----------|
| **Light** | FAQ, greeting, simple query | Llama-3.3-70B (NVIDIA NIM) | Gemini 2.0 Flash Lite | OpenRouter Mistral-7B free | Ollama Llama-3.2-3B (VPS) |
| **Medium** | Intent, CRUD, function calling | Nemotron-4-340B (NVIDIA NIM) | Gemini 2.0 Flash | OpenRouter Llama-3.3-70B free | Ollama Llama-3.3-70B (VPS) |
| **Heavy** | Generate dokumen, analisis | Gemini 2.0 Flash | Nemotron-4-340B (NVIDIA NIM) | OpenRouter Nemotron-3-Nano free | Ollama Qwen-2.5-32B (VPS) |

### 19.3 Kenapa Pilih Ini?

**Light Task:**
- Llama-3.3-70B (NVIDIA): Cepat, free 1000 credits, cocok untuk FAQ
- Gemini Flash Lite: Lebih cepat dari Flash biasa, free tier besar
- Mistral-7B: Kecil, cepat, free di OpenRouter
- Ollama Llama-3.2-3B: Self-hosted, unlimited, butuh VPS

**Medium Task:**
- Nemotron-4-340B: Function calling support, powerful, free NVIDIA credits
- Gemini 2.0 Flash: Function calling native, paling reliable
- OpenRouter Llama-3.3-70B: Free, function calling support
- Ollama Llama-3.3-70B: Self-hosted, unlimited

**Heavy Task:**
- Gemini 2.0 Flash: Best quality untuk generate, free tier besar
- Nemotron-4-340B: Reasoning kuat, free NVIDIA
- OpenRouter Nemotron-3-Nano: Free, 30B parameters
- Ollama Qwen-2.5-32B: Self-hosted, butuh VPS 16GB+ RAM

### 19.4 Multi-Account Trick

- **Gemini**: Bikin 3-5 akun Google, masing-masing dapat free tier (15 RPM, 1500 RPM/day)
- **NVIDIA**: 1 akun = 1000 credits, bisa bikin multiple akun (pakai email berbeda)
- **OpenRouter**: Free models ada rate limit per akun, bisa bikin multiple akun
- **Implementasi**: LLM router dengan round-robin + fallback otomatis

### 19.5 Ollama (Self-Hosted)

- Butuh VPS sendiri (Hostinger KVM 2 cukup untuk model 7B-13B)
- Model 70B+ butuh VPS besar (KVM 4 atau KVM 8)
- Untuk sekarang: belum bisa, butuh VPS dulu
- Future: Ollama jadi backup unlimited (no daily limit, no cost)

### 19.6 Task Complexity Classification (IMPORTANT)

**Pertanyaan:** How does DINA decide task is light/medium/heavy?

**Jawaban:** LLM dengan Function Calling yang decide. TIDAK ADA pre-classification.

**Flow:**
```
User message →
  LLM (Gemini Flash dengan function calling) →
  LLM baca: message + context + history →
  LLM decide: 
    - Tool mana yang dipanggil?
    - Atau tidak perlu tool (cukup response)?
  → Execute (kalau ada tool)
  → Generate response
```

**Tool selection = task classification:**
- User bilang "halo" → LLM decide: no tool, just respond (LIGHT)
- User bilang "berapa konsumen BTN?" → LLM call `get_stats` (LIGHT-MEDIUM)
- User bilang "hapus Jenni" → LLM call `delete_customer` (MEDIUM)
- User bilang "bikin SK kerja untuk Jenni" → LLM call `generate_sk_kerja` (HEAVY)

**Tidak perlu regex untuk klasifikasi.** LLM yang decide berdasarkan konteks.

**Tapi tetap pakai LLM tier yang sesuai:**
- Default: Gemini 2.0 Flash (handle semua tier)
- Kalau Gemini limit → fallback Nemotron (medium) atau Llama (light)
- Untuk heavy task (generate): Gemini Flash (best quality)
- Tidak perlu pre-classify, LLM yang handle semuanya

### 19.7 LLM Router Implementation

**BERLAKU UNTUK SEMUA AGENTIC AI, DI TIM MANAPUN, TANPA TERKECUALI.**

```typescript
async function callLLM(messages, tools) {
  const providers = [
    { name: 'gemini', call: callGemini, priority: 1 },
    { name: 'nvidia-nemotron', call: callNvidiaNemotron, priority: 2 },
    { name: 'nvidia-llama', call: callNvidiaLlama, priority: 3 },
    { name: 'openrouter', call: callOpenRouter, priority: 4 },
    { name: 'ollama', call: callOllama, priority: 5 }, // future
  ]
  
  for (const provider of providers) {
    try {
      return await provider.call(messages, tools)
    } catch (err) {
      if (err is rate limit) continue  // try next provider
      throw err
    }
  }
  throw new Error('All LLM providers failed')
}
```

**Plus multi-account rotation:**
- Setiap provider punya multiple API keys (multi-account)
- Round-robin antar API key
- Kalau 1 key kena limit, otomatis pakai key berikutnya

**Aturan:**
- LLM Router WAJIB dipakai oleh SEMUA agentic AI (DINA, RINA, MITRA, RATNA, RANGGA, 10 Marketing, future agents)
- Berlaku untuk SEMUA tim (Tim 1, Tim 2, ..., Tim N)
- Tidak ada exception
- Implementasi: 1 shared module `src/lib/agents/llm-router.ts`

---
