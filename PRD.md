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

## 20. TAB BERKAS — IMPLEMENTASI LENGKAP (Phase 1–5, 15–17 Juli 2026)

Section ini mendokumentasikan semua yang sudah dibangun di Tab Berkas (BerkasViewV2, Bank Builder, Annotation Editor) — termasuk code structure, perubahan yang terjadi, dan keputusan teknis. Ini menjadi baseline sebelum kita lanjut ke fase AI Agents.

### 20.1 Arsitektur Tab Berkas (Current State)

Tab Berkas adalah jantung operasional sistem — tempat owner mengelola data konsumen, generate dokumen KPR, upload berkas, dan test template annotation.

**Komponen utama:**

```
src/components/
├── berkas-view-v2.tsx              (2500+ lines, main view)
├── bank-builder/
│   ├── bank-builder.tsx             (Bank Builder modal + Dokumen Wajib config)
│   ├── bank-builder-modal.tsx       (Modal wrapper)
│   └── bank-annotation-editor.tsx   (Visual PDF annotation editor)
├── berkas/
│   └── bank-template-preview.tsx    (PDF canvas overlay preview, real-time)
└── berkas-docs/docs/                (React components per dokumen)

src/lib/berkas/
├── types.ts                          (BerkasState, ApplicantData, PropertyData, SpouseData)
├── constants.ts                      (CompanySetting defaults, ALL_DOC_TYPES, dll)
├── formatters.ts                     (Date format helpers)
├── upload-helper.ts                  (File hash, upload utils)
├── flpp-overlay/                     (BTN FLPP — fields.ts + generate.ts)
├── ajb-overlay/                      (BTN AJB — fields.ts + generate.ts)
├── bsb-overlay/                      (BSB Syariah 6 dokumen — fields.ts + generate.ts)
├── spr-mandiri-overlay/              (Mandiri SPR — fields.ts + generate.ts)
├── mandiri-overlay/                  (Mandiri Surat Pernyataan — fields.ts + generate.ts)
├── surat/                            (Surat tidak punya rumah, surat penghasilan, dll)
├── docx-template/                    (docxtemplater wrapper untuk SK Kerja + Slip Gaji)
└── templates/                        (Sample templates)

src/app/api/documents/
├── generate-flpp/route.ts            (BTN FLPP generator)
├── preview-flpp/route.ts             (BTN FLPP preview)
├── generate-ajb/route.ts             (BTN AJB)
├── generate-bsb/route.ts             (BSB Syariah)
├── generate-mandiri/route.ts         (Mandiri Surat Pernyataan)
├── generate-spr-mandiri/route.ts     (Mandiri SPR)
├── preview-*/route.ts                (Mirrors untuk preview)
├── fill-docx-template/route.ts       (SK Kerja + Slip Gaji via docxtemplater)
└── preview-docx-template/route.ts    (HTML preview untuk SK/Slip)

src/app/api/bank-config/
├── route.ts                          (CRUD BankConfig + PUT untuk update documents JSON)
└── [id]/
    └── template/
        ├── route.ts                  (POST upload template, GET templates, DELETE template permanen)
        ├── pdf-proxy/route.ts        (Proxy PDF dari local/Drive → frontend, avoid CORS)
        ├── render/route.ts           (Server-side pdf-lib overlay untuk download)
        └── (scan-annotations folder dihapus pas rollback ke b3d6f00)

public/templates/                     (Local template PDFs: btn-flpp.pdf, bsb-*.pdf, spr-mandiri.pdf, dll)
```

### 20.2 Bank Config Builder — Sistem Multi-Bank

**Konsep:** 1 bank bisa punya banyak template PDF (FLPP, SPR, AJB, dll). Setiap template punya annotations (posisi field di PDF) yang map ke field database konsumen.

**Struktur data (BankConfig.documents JSON):**
```json
{
  "requiredDocuments": ["ktp", "kk", "npwp", "akta-nikah", ...],
  "formboxFields": ["applicant.fullName", "applicant.ktpNumber", ...],
  "customDocs": [{"id": "custom-doc-xxx", "label": "Form BCA Syariah", "category": "perusahaan"}],
  "customFields": [{"id": "custom-field-xxx", "label": "No. NPWP Pasangan", "category": "pasangan"}],
  "customComposites": [
    {
      "id": "composite-xxx-pasangan",
      "label": "TTL Pasangan Composite",
      "category": "pasangan",
      "source1": "spouse.pob",
      "source2": "spouse.dob",
      "separator": ", ",
      "dateFormat": "long"
    }
  ],
  "templates": [
    {
      "id": "tpl-xxx",
      "name": "SPR MANDIRI",
      "stage": "entry",
      "fileId": "drive-xxx" | null,
      "templatePath": "/public/templates/mandiri/spr-mandiri.pdf" | null,
      "fileName": "SPR MANDIRI v1.pdf",
      "version": 1,
      "annotations": [
        {
          "id": "scan-p1-i0",
          "page": 1,
          "x": 0.438, "y": 0.111,
          "width": 0.065, "height": 0.015,
          "label": "No surat",
          "fieldMapping": "custom.text",
          "fieldType": "text",
          "fontSize": 10
        }
      ]
    }
  ]
}
```

**4 source of truth yang sync:**
1. **Parent** (Bank Builder > Dokumen Wajib): `requiredDocuments` + `formboxFields` + `customDocs` + `customFields` + `customComposites`
2. **Child 1 — Upload Sidebar** (BerkasViewV2 left sidebar): loop `requiredUploads` dari DB, dynamic
3. **Child 2 — Formbox Sidebar** (BerkasViewV2 left sidebar): `isFieldVisible(fieldId)` check `bankFormboxFields`
4. **Child 3 — Field Mapping Dropdown** (Bank Builder > Annotation): `buildGroupedWithCustoms()` filter by `formboxFields`

### 20.3 FORMBOX_CATEGORIES — Parent Schema (6 kategori, 38+ fields)

6 kategori dengan fieldType metadata:
1. **Perusahaan (Developer)** — 13 fields: companyName, directorName, directorNik, directorPhone, directorAddress, officeAddress, city, btnAccount, mandiriAccount, bsbAccount, btnBranch, mandiriBranch, bsbBranch
2. **Data Nasabah** — 16 fields: fullName, ktpNumber, pob, dob, address, rtRw, kelurahan, kecamatan, city, postalCode, phone, npwpNumber, btnAccountNumber, domicileAddress, email, nip
3. **Pekerjaan Debitur** — 5 fields: jobTitle, companyName, companyAddress, companyPhone, monthlyIncome
4. **Data Pasangan** — 5 fields: fullName, ktpNumber, pob, dob, address
5. **Pekerjaan Pasangan** — 2 fields: job, jobType
6. **Unit Properti** — 18 fields: projectName, houseAddress, blockLetter, houseNumber, landSize, houseSize, shmNumber, nibNumber, price, dpAmount, plafonKpr, tenor, dateOfDocument, akadDate, akadNumber, lpaDate, lpaNumber, sp3kDate

**fieldType** (10 types): text, number, date, phone, email, currency, address, longtext, image, file

### 20.4 Auto-Derived Fields (Composite + Transform)

**8 auto-derived fields** — muncul otomatis di Field Mapping dropdown saat sub-field di-check:

| ID | Label | Source | Output Example |
|---|---|---|---|
| `applicant.pobDobComposite` | Tempat, Tgl Lahir (gabungan) | applicant.pob + applicant.dob | "Jakarta, 17 Agustus 1990" |
| `spouse.pobDobComposite` | Tempat, Tgl Lahir Pasangan (gabungan) | spouse.pob + spouse.dob | "Bandung, 5 Mei 1992" |
| `company.cityLongDateComposite` | Kota + Tanggal Panjang | company.city + dateOfDocument | "Pangkalpinang, 17 Agustus 2026" |
| `property.blokRumahComposite` | Blok - No Rumah | property.blockLetter + property.houseNumber | "E-6" |
| `property.ltlbComposite` | Luas Tanah / Luas Bangunan | property.landSize + property.houseSize | "36/84" |
| `property.sprRomanMonth` | Bulan SPR (Romawi) | dateOfDocument | "VIII" |
| `property.sprMonthName` | Nama Bulan | dateOfDocument | "Agustus" |
| `property.sprLongDate` | Tanggal Panjang | dateOfDocument | "17 Agustus 2026" |
| `property.sprShortDate` | Tanggal Pendek | dateOfDocument | "17/08/2026" |

**Plus user-defined custom composites** — user bikin sendiri di Bank Builder > Dokumen Wajib > Custom Composite Fields. Format: 2 source fields + separator + optional date format.

### 20.5 Wiring Diagram (Parent → Children Sync)

```
PARENT (BankConfig DB — documents JSON):
┌──────────────────────────────────────────────────────────┐
│ • requiredDocuments (ktp, kk, npwp, ...)                 │
│ • formboxFields (applicant.fullName, applicant.nik, ...)  │
│ • customDocs (custom-doc-xxx, label, category)            │
│ • customFields (custom-field-xxx, label, category)        │
│ • customComposites (composite-xxx, source1, source2, ...) │
└──────────────────────────────────────────────────────────┘
        │ save (PUT /api/bank-config)
        │ → bankConfigVersion++ (state di BerkasViewV2)
        │ → useEffect re-fetch BankConfig
        ↓
CHILDREN (3 tempat yang harus ikut parent):
┌──────────────────┬──────────────────┬──────────────────┐
│ Upload Sidebar   │ Formbox Sidebar  │ Field Mapping    │
│ (left sidebar)   │ (left sidebar)   │ (Bank Builder    │
│                  │ pengisian data   │  > Annotation)   │
│                  │ konsumen         │                  │
│ ✅ Dynamic loop  │ ✅ isFieldVisible│ ✅ buildGrouped  │
│   dari required- │   per field      │   WithCustoms()  │
│   Documents      │ ✅ Custom field  │   filter by      │
│ ✅ Custom doc    │   render per     │   formboxFields  │
│   muncul otomatis│   kategori       │ ✅ Custom field  │
│                  │ ✅ 'NGANGGUR' →  │   muncul sbg     │
│                  │   'TIDAK BEKERJA'│   '(Custom)'     │
│                  │                  │ ✅ Auto-derived  │
│                  │                  │   muncul sbg     │
│                  │                  │   '(Auto)'       │
│                  │                  │ ✅ Custom        │
│                  │                  │   composite      │
│                  │                  │   '(Composite)'  │
└──────────────────┴──────────────────┴──────────────────┘
```

### 20.6 Bank Builder Annotation Editor (Visual PDF Editor)

**Fitur lengkap:**
- Zoom (50%–300%) + page navigation
- Grid overlay (toggle, 30% opacity)
- Drag-move + 4 resize handles per annotation
- Font size (6–72px)
- Multi-template support (1 bank bisa multiple PDFs: FLPP, SPR, AJB, dll)
- Template versioning (v1 → v2 → v3, replace existing)
- Test dari Konsumen Existing (pilih konsumen → auto-fill test data ke annotation)
- Real-time preview: text muncul di annotation box saat value ada
- Template deletion permanen (file disk + DB + Drive)
- Storage: local disk (preferred) ATAU Google Drive (fallback)

**Field Mapping dropdown struktur** (urutan SESUAI parent):
1. Data Perusahaan (Global)
2. Data Nasabah
3. Data Pekerjaan / Wirausaha (Debitur)
4. Data Pasangan Nasabah
5. Data Pekerjaan Pasangan
6. Unit Properti
7. Sistem (Realtime) — always show all
8. Custom — always show all

### 20.7 Preview vs Download Coordinate System

**Critical fix (Phase 5):** Preview (Canvas) dan Download (pdf-lib) punya origin berbeda — sebelum fix, text position beda antara preview dan download.

**Canvas (Preview — client-side):**
- Origin: top-left, Y goes DOWN
- `ctx.textBaseline = 'top'`
- Text drawn at `y + 2` (relative to TOP of box)

**PDF (Download — server-side, pdf-lib):**
- Origin: bottom-left, Y goes UP
- `y_bottom = pageHeight - (ann.y * pageHeight) - boxHeightPx`
- Text drawn with baseline at `textY = y_bottom + boxHeightPx - fontSize - 2` (match TOP of box)

**Sekarang coordinate preview == download.** Saat user drag annotation ke posisi X, hasil preview dan hasil download sama persis.

### 20.8 BTN/BSB Hardcoded Overlay vs Bank Builder Template

**2 approach berjalan paralel:**

| Approach | Banks | Code | Workflow |
|---|---|---|---|
| **Hardcoded overlay** (BTN, BSB, Mandiri SPR, Mandiri Pernyataan) | BTN, BSB_SYARIAH, MANDIRI (via legacy) | `src/lib/berkas/{flpp,ajb,bsb,spr-mandiri,mandiri}-overlay/fields.ts + generate.ts` | Klik tombol → fetch /api/documents/generate-xxx → return PDF |
| **Bank Builder template** (Mandiri future, BNI, BCA, dll) | Bank manapun yang setup via Bank Builder | Bank Builder > Template PDF + Annotation | Pilih template di Preview Dokumen → fetch /api/bank-config/[id]/template/render → return PDF |

**isFieldVisible() rule:**
- BTN + BSB_SYARIAH → return `true` (semua field visible, hardcoded behavior)
- Mandiri + bank future → check `bankFormboxFields` (only show if checked in Bank Builder)

### 20.9 PENDING REQUIREMENT — DINA Task

**SK Kerja, Slip Gaji (7 lembar), Laporan Keuangan 6 Bulan Terakhir** — saat ini manual via template upload (docxtemplater). User ingin **DINA yang fully handle** task ini:
- DINA chat: "bikin SK Kerja untuk Budi" → DINA otomatis:
  - Ambil data konsumen dari DB
  - Generate docx dari template
  - Save ke Google Drive
  - Kirim file ke user via WhatsApp/DM
- Slip Gaji auto-generate 7 lembar (current month + 6 bulan ke belakang)
- Laporan Keuangan 6 bulan terakhir (untuk wirausaha)

**Saat ini:**
- ✅ Backend ready: `/api/documents/fill-docx-template` + `/api/documents/preview-docx-template`
- ✅ DINA v3 tools already defined: `generate_sk_kerja`, `generate_slip_gaji`, `generate_laporan_keuangan` (di `src/lib/agents/dina-tools-v3.ts`)
- ⏳ Implementation: DINA belum bisa otomatis upload template baru (user masih perlu upload manual dulu)
- ⏳ Testing: belum di-test end-to-end via DINA chat

### 20.10 Phase History (15–17 Juli 2026)

| Phase | Commit | What |
|---|---|---|
| Phase 1 | `aab5d97` | Refactor FIELD_MAPPINGS_GROUPED — hapus field extra, mirror parent urutan, fix catMap bug |
| Phase 2 | `854b8a7` | Auto-derived fields (composite + transform) muncul otomatis di dropdown |
| Phase 3 | `fc28544` | Expand test data mapping + add composite Blok/LT-LB + 'NGANGGUR' → 'TIDAK BEKERJA' |
| Phase 4 | `9541585` | Sidebar render custom fields dari DB + add missing parent fields (one-time) |
| Phase 5 | `58b7d82` | Fix preview vs download coordinate mismatch + alamat perumahan wiring + user-defined custom composite UI |

**Rollback history:**
- `b3d6f00` — Rollback dari Adobe approach (5 commit Adobe annotation dibuang)
- `16ff1ba` — Empty commit trigger Vercel redeploy setelah force push
- `59e9700` — feat(bank-builder): hapus template permanen
- `fc28544` → `9541585` → `58b7d82` — Phase 3-5 development sequential

### 20.11 Current State (Snapshot 17 Juli 2026)

**Working:**
- ✅ Tab Berkas full functional (BTN, BSB, Mandiri overlay + Bank Builder templates)
- ✅ Bank Builder complete: Dokumen Wajib + Form Box Fields + Custom Composite + Template PDF + Annotation Editor + Hapus Template
- ✅ Parent → 3 children sync (upload sidebar, formbox sidebar, field mapping dropdown)
- ✅ Custom fields auto-render di sidebar + auto-save ke DB
- ✅ Custom composites user-defined
- ✅ 8 auto-derived composite + transform fields
- ✅ Preview == Download coordinate match
- ✅ Alamat perumahan (property.houseAddress) wired end-to-end
- ✅ Delete template permanen (file + DB + Drive)
- ✅ 'NGANGGUR' → 'TIDAK BEKERJA' display label
- ✅ Local file storage preferred (Drive optional)

**Pending:**
- ⏳ DINA fully handle SK Kerja + Slip Gaji + Laporan Keuangan generation
- ⏳ Smart rendering by fieldType di sidebar (currency → Rp prefix, phone → +62 format, dll)
- ⏳ Re-introduce Adobe annotation scan (different branch, future)
- ⏳ BTN/BSB setup via Bank Builder (saat ini hardcoded, change kalau user update berkas BTN/BSB)

---

## 21. AI AGENTS ROADMAP — DINA & Friends

Section ini jadi blueprint untuk pengembangan AI agents berikutnya. Dari yang user describe, ada 5 AI persona utama (1 already done, 4 next) + 10 marketing AI.

### 21.1 User Vision (Quote dari owner)

> 1 AI buat berkas, dia yg bantu generate dan buatin semua berkas, kecuali edit" surat pemerintahan (DONE — DINA)
> 1 AI untuk finance, dia yg buat PO, bikin laporan, bikin pengajuan pembelian pembayaran, yang susahnya ya dia ni harus bisa fleksibel, karna bos ni, tiap mgg pasti SOP berubah WKWKWKWL, bos yg bikin sop, boss juga yg suka melanggar SOP
> 1 AI buat mesen barang sekaligus tracking material, dan progress pembangunan
> 1 AI sebagai leader marketing, dia yg bikin dan generate foto ataupun video, terus kirim ke 10 AI marketing yg melakukan promosi chat dengan konsumen

### 21.2 AI Agents Roster (Current + Planned)

| # | Agent | Role | Status | Complexity |
|---|---|---|---|---|
| 1 | **DINA** | Document AI — generate semua berkas KPR | ✅ v3 Function Calling | HIGH |
| 2 | **RINA** | Finance AI — PO, laporan, pengajuan dana, pembayaran | 🟡 Existing chat API, basic | HIGH (SOP dynamic) |
| 3 | **MITRA** | Material AI — pesan barang + tracking material + progress pembangunan | 🟡 Existing chat API, basic | MEDIUM-HIGH |
| 4 | **RATNA** | Leader Marketing AI — generate foto/video + kirim ke 10 marketing | 🟡 Existing chat API, basic | HIGH (image gen) |
| 5–14 | **10 Marketing AI** (Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko) | Promosi chat dengan konsumen | 🟡 Existing chat API, basic | MEDIUM (per-agent persona) |

**Total: 14 AI agents** (1 DINA + 1 RINA + 1 MITRA + 1 RATNA + 10 Marketing)

### 21.3 Where to Start — Proposed Flow

**Pertanyaan user: "kita harus prepare atau start dari mana?"**

Jawabanku: **Mulai dari DINA end-to-end test dulu, baru lanjut ke agent berikutnya.** Reasoning:

1. DINA paling critical (berkas = core business) — harus PERFECT sebelum kita serah-terima ke agent lain
2. DINA v3 (Function Calling) sudah built, tapi belum di-test end-to-end via WhatsApp
3. Pattern yang dibikin untuk DINA → reuse untuk RINA/MITRA/RATNA (LLM Router, BaseAgent, tools, memory)
4. Kalau DINA jalan smooth, agent lain tinggal ikut pattern

**Proposed order:**
1. **DINA Phase 1** — Test function calling via dashboard chat (input: text, output: tool calls + final reply). Verify 10 tools jalan.
2. **DINA Phase 2** — WhatsApp deployment (1 nomor WA untuk DINA, scan QR, owner chat ke DINA)
3. **DINA Phase 3** — Generate SK Kerja + Slip Gaji + Laporan Keuangan end-to-end via chat
4. **DINA Phase 4** — Pending reasoning (DINA bingung → minta owner answer di Memory tab)
5. **RATNA (Leader Marketing)** — Image/video generation via z-ai-web-dev-sdk, distribute ke 10 marketing AI
6. **10 Marketing AI** — Persona-based chat dengan konsumen, melayani FAQ + objection handling
7. **RINA (Finance)** — PO, laporan, pengajuan dana. HARDCORE: SOP dynamic (boss changes weekly)
8. **MITRA (Material)** — Pesan barang + tracking + progress pembangunan (foto progress, material stock)

### 21.4 Requirements per AI Agent

#### 21.4.1 DINA (Document AI) — Generate Berkas

**Already done:**
- ✅ Function calling v3 (10 tools: upload_berkas, generate_sk_kerja, generate_slip_gaji, generate_laporan_keuangan, get_customer_status, update_customer_field, create_customer, delete_customer, send_file, query_experience)
- ✅ LLM Router (Gemini → Nemotron fallback)
- ✅ Multi-account rotation support
- ✅ Anti-curhat, anti-confusion nama system prompt
- ✅ Pending action confirmation (delete → "ya"/"batal")

**Pending (Phase 1–4):**
- ⏳ End-to-end test via dashboard chat
- ⏳ WhatsApp deployment (1 nomor, scan QR, owner chat DINA langsung)
- ⏳ Generate SK Kerja end-to-end (chat → generate → save Drive → send file)
- ⏳ Generate Slip Gaji 7 lembar end-to-end
- ⏳ Generate Laporan Keuangan 6 bulan end-to-end
- ⏳ Pending reasoning (confused → "pending question" → owner answer di Memory tab → auto-save as lesson learned)

**Tools DINA butuh tambahan:**
- `template_upload` — DINA minta user upload template SK/Slip baru (kalau belum ada)
- `template_list` — DINA check template apa yang sudah ada
- `pending_question_create` — DINA bikin pending question kalau bingung
- `pending_question_resolve` — Owner answer, DINA save as memory

#### 21.4.2 RINA (Finance AI) — PO, Laporan, Pengajuan Dana

**Use case:**
- Owner chat: "bikin PO untuk beli semen 50 sak" → RINA generate PO PDF
- Owner chat: "laporan pengeluaran minggu ini" → RINA generate laporan
- Owner chat: "pengajuan dana minggu depan 50jt" → RINA bikin pengajuan

**Yang susah: SOP dynamic**
- Boss ubah SOP tiap minggu (literal)
- Boss juga pelanggar SOP-nya sendiri
- RINA harus adaptif: kalau SOP berubah, RINA ikut
- Kalau boss minta yang melanggar SOP, RINA warning tapi tetap jalanin (dengan catatan)

**Tools RINA butuh:**
- `create_po` — bikin PO baru (vendor + items + qty + price)
- `generate_laporan_mingguan` — laporan pengeluaran + pemasukan mingguan
- `generate_pengajuan_dana` — pengajuan dana ke boss
- `record_payment` — catat pembayaran keluar
- `get_sop` — ambil SOP active terbaru
- `update_sop` — owner update SOP (RINA ikut)
- `flag_sop_violation` — RINA warning kalau request melanggar SOP (tapi tetap jalanin kalau owner insist)
- `query_vendor` — cari vendor dengan harga terbaik
- `query_material_price` — cek harga material terkini

**Prisma models ready:** PO, POLine, Supplier, SupplierPayment, FundRequest, RAB, RABLine, MaterialStock, MaterialUsage — semua sudah ada di schema.

**Penting:** RINA harus **conversation-driven SOP update** — owner bilang "mulai sekarang PO semen harus minta approval dulu" → RINA auto-update SOP di DB → next time RINA enforce SOP baru.

#### 21.4.3 MITRA (Material AI) — Pesan Barang + Tracking Material + Progress Pembangunan

**Use case:**
- Owner chat: "pesan 100 batu bata untuk Blok C" → MITRA bikin PO otomatis (atau koordinasi sama RINA)
- Owner chat: "stock semen sisa berapa?" → MITRA cek MaterialStock
- Owner chat: "foto progress Blok C minggu ini" → MITRA minta owner upload foto, save ke ProgressPhoto
- Owner chat: "material yang dipakai Blok C minggu ini apa aja?" → MITRA query MaterialUsage

**Tools MITRA butuh:**
- `create_material_request` — pesan material baru (auto-route ke RINA untuk PO)
- `check_material_stock` — cek stock material di gudang
- `record_material_usage` — catat material terpakai per unit/blok
- `upload_progress_photo` — upload foto progress pembangunan
- `get_progress_report` — laporan progress per blok/unit
- `query_unit_status` — cek status pembangunan unit (sudah sampe tahap apa)
- `list_pending_material_requests` — material yang belum dipesan

**Prisma models ready:** MaterialStock, MaterialUsage, ProgressPhoto, UnitBudgetTracking, Unit — semua sudah ada di schema.

**Sinergi dengan RINA:** MITRA handle "apa yang dibutuhkan" + RINA handle "beli dari mana + berapa + cara bayar". Bisa jadi MITRA → RINA handoff via internal messaging.

#### 21.4.4 RATNA (Leader Marketing AI) — Generate Foto/Video + Distribute

**Use case:**
- Owner chat: "bikin foto rumah Blok E yang baru selesai, kirim ke marketing" → RATNA:
  - Generate foto rumah (image generation via z-ai-web-dev-sdk, OR ambil dari progress photo yang sudah ada)
  - Bikin caption marketing (kombinasi: harga, type, keunggulan, CTA)
  - Distribute ke 10 marketing AI (via internal messaging)
  - 10 marketing AI terima + forward ke prospek masing-masing

**Tools RATNA butuh:**
- `generate_marketing_image` — generate foto rumah ilustrasi (z-ai image gen)
- `edit_existing_photo` — edit progress photo jadi marketing material (tambah text, filter, dll)
- `generate_marketing_caption` — bikin caption untuk postingan
- `generate_video_script` — bikin script video pendek (Reels/TikTok)
- `distribute_to_marketing_agents` — kirim konten ke 10 marketing AI
- `get_marketing_performance` — analytics: berapa prospek yang convert dari konten tertentu
- `schedule_content` — jadwal posting (kalau integrasi dengan IG/TikTok/FB API)

**Tech needed:**
- z-ai-web-dev-sdk image generation (free)
- z-ai-web-dev-sdk image editing (free)
- Maybe Canva API untuk template design (optional, kalau z-ai kurang)
- Internal agent-to-agent messaging system (belum ada, perlu dibikin)

#### 21.4.5 10 Marketing AI — Promosi Chat dengan Konsumen

**Persona-based chat:**
- 10 persona berbeda (Ayu: cheerful, Bima: informatif, Citra: manipulatif, dll)
- Masing-masing handle prospek tertentu (1 prospek = 1 marketing AI, locked)
- Chat dengan prospek via WhatsApp
- FAQ + objection handling (knowledge base already seeded: 25 FAQ + 10 objection + 7 product info)

**Use case:**
- Prospek WA: "rumah subsidi-nya berapa?" → Ayu jawab pakai knowledge base
- Prospek WA: "DP-nya bisa cicil?" → Bima jawab + upsell SBUM
- Prospek WA: "aku kerja di batam, bisa KPR?" → Citra handle (objection handling, remote KPR)
- Prospek WA: "mau survey dulu" → Dian schedule survey, koordinasi sama owner

**Tools Marketing AI butuh:**
- `get_prospect_info` — ambil data prospek yang chat
- `get_knowledge` — cari FAQ/objection/product info yang relevan
- `schedule_survey` — jadwalkan survey
- `assign_to_owner` — handoff ke owner kalau prospek hot lead
- `record_prospect_response` — catat response prospek (untuk analytics)
- `escalate_to_dina` — handoff ke DINA kalau prospek mau proses KPR (mulai berkas)
- `query_team_capacity` — check marketing AI lain yang available (kalau 1 AI overload)

**Penting:**
- Setiap marketing AI punya nomor WA sendiri (multi-account Baileys)
- 1 marketing AI handle max N prospek (cap, kalau overload → redistribute)
- Persona consistency (Ayu selalu cheerful, ga boleh tiba-tiba jadi informatif)

### 21.5 Cross-Agent Communication

**Internal agent-to-agent messaging** — belum ada, perlu dibangun. Use case:
- RATNA → 10 Marketing: "ini foto baru, distribute ke prospek masing-masing"
- MITRA → RINA: "butuh 50 sak semen untuk Blok C, tolong PO"
- DINA → Marketing AI: "konsumen Budi udah selesai berkas, lanjut survey"
- Marketing AI → DINA: "prospect Asep mau proses KPR, tolong handle berkas"

**Schema proposal:**
```prisma
model AgentMessage {
  id          String   @id @default(cuid())
  fromAgentId String?  // NULL = dari human (owner)
  toAgentId   String?  // NULL = broadcast
  type        String   // REQUEST | RESPONSE | BROADCAST | HANDOFF
  subject     String
  body        String
  payload     String?  // JSON: data terstruktur (file URL, customer ID, dll)
  status      String   @default("PENDING") // PENDING | READ | ACTIONED | ARCHIVED
  createdAt   DateTime @default(now())
  readAt      DateTime?
  actionedAt  DateTime?
  
  fromAgent   Agent?   @relation("AgentMsgFrom", fields: [fromAgentId], references: [id])
  toAgent     Agent?   @relation("AgentMsgTo", fields: [toAgentId], references: [id])
}
```

### 21.6 Memory System — Pending Reasoning

**Konsep "pending reasoning"** (sudah disinggung di section 19.6):
- Agent bingung → bikin "pending question" entry
- Owner answer di Memory Tab
- Setelah "Done", auto-save as memory (Title + Description + Resolution)
- Bukan Q&A pattern matching, tapi **lessons learned**

**Penting untuk RINA (SOP dynamic):**
- Boss ubah SOP → RINA bingung → pending question: "SOP baru kah perubahan ini?"
- Owner answer → RINA save as memory → next time RINA ikuti SOP baru

**Penting untuk Marketing AI:**
- Prospek tanya hal baru yang ga ada di knowledge base → marketing AI pending question: "prospek tanya X, jawaban apa?"
- Owner answer → save as knowledge item baru → semua marketing AI updated

### 21.7 LLM Router — Shared Infrastructure

**Sudah dibangun** (`src/lib/agents/llm-router.ts`):
- Multi-provider (Gemini → Nemotron → Llama → OpenRouter → Ollama future)
- Multi-account rotation (multiple API keys per provider)
- `callLLM()` untuk non-tool calls
- `callLLMWithTools()` untuk function calling (Gemini native + OpenAI-compatible)
- Round-robin antar API key
- Auto-skip on retryable errors (429, 5xx, timeout)

**Berlaku untuk SEMUA agent** — DINA, RINA, MITRA, RATNA, 10 Marketing. Tidak ada exception.

### 21.8 WhatsApp Multi-Agent Architecture

**Saat ini:** 1 nomor WA untuk DINA (Belum jalan — WA IP blocked).

**Target:** 14 nomor WA (1 per agent):
- DINA: 6287761323344 (sudah dipunya, belum connect)
- RINA: perlu beli nomor baru
- MITRA: perlu beli nomor baru
- RATNA: perlu beli nomor baru
- 10 Marketing: perlu beli 10 nomor baru

**Tech:**
- Baileys (`@whiskeysockets/baileys`) — multi-account ready
- Setiap nomor WA jalan di session Baileys terpisah
- Incoming message routing: nomor tujuan → agent ID → trigger chat handler

**Hosting challenge:**
- Vercel ga support persistent WebSocket (Baileys butuh koneksi terus-menerus)
- Plan: Hostinger VPS (1 VPS jalanin 14 Baileys sessions)
- Atau: Railway/Render (kalau budget boleh)

### 21.9 What I Want to Start With (My Recommendation)

**Karena user nanya "apa yang ingin kamu mulai?" — pilihan aku:**

**Option A — DINA WhatsApp end-to-end** (recommended):
- Test DINA function calling via WA (bukan dashboard)
- Owner chat DINA langsung, ga perlu buka dashboard
- Verify: "status Budi", "bikin SK Kerja Jenni", "hapus konsumen yang fake"
- Kalau jalan smooth → pattern siap apply ke agent lain

**Option B — RATNA + 10 Marketing** (foundational untuk marketing):
- Marketing adalah ujung depan (cari prospek → convert → customer)
- Tanpa marketing, ga ada customer → ga ada berkas → DINA idle
- Tapi RATNA butuh image gen infra + 10 nomor WA = banyak invest awal

**Option C — RINA Finance** (critical untuk operasional):
- Finance = darah operasional (PO, payment, laporan)
- Tapi RINA paling kompleks (SOP dynamic)
- Risk: kalau RINA ga robust, owner frustrasi

**Option D — MITRA Material + Progress** (operasional):
- Tracking material + progress = visibility
- Tapi ga urgent (saat ini masih manual, masih bisa jalan)

**My pick: Option A.** Reasoning:
1. DINA paling ready (v3 sudah built, tinggal deploy)
2. ROI paling tinggi (berkas = core business, owner paling sering pake)
3. Pattern DINA → reuse untuk agent lain (ga bikin dari nol)
4. Owner paling familiar dengan DINA use case → feedback cepat

### 21.10 Required Infrastructure Before AI Agents Deploy

**Yang harus siap sebelum agent manapun go-live:**

1. **Vercel environment variables:**
   - `GEMINI_API_KEYS` (comma-separated, multi-account)
   - `OPENROUTER_API_KEYS` (comma-separated)
   - `GOOGLE_OAUTH_CLIENT_ID` + `SECRET` (sudah ada, untuk Drive)
   - `DATABASE_URL` (Aiven PostgreSQL, sudah ada)
   - `WA_SESSION_PATH` (kalau di VPS, kalau Vercel ga support persistent)

2. **Database migrations:**
   - `AgentMessage` model (cross-agent messaging)
   - `PendingQuestion` model (pending reasoning)
   - `Memory` model extensions (lessons learned category)
   - `SOP` model (untuk RINA — SOP active versioning)

3. **VPS setup (untuk Baileys):**
   - Hostinger VPS (or Railway)
   - Node.js 20+
   - PM2 process manager (jaga 14 Baileys sessions tetap jalan)
   - Nginx reverse proxy (WA webhook → Next.js API)

4. **Phone numbers (SIM cards):**
   - 14 nomor WA baru (DINA sudah ada 1, tinggal 13 lagi)
   - Atau: mulai dari 1 dulu (DINA), tambah nominal kalau agent lain go-live

5. **Multi-account LLM API keys:**
   - Gemini: daftar 3-5 akun (free tier 15 RPM per akun → 45-75 RPM total)
   - OpenRouter: daftar 2-3 akun (free models)
   - Future: Ollama self-hosted (kalau mau 100% free)

6. **Internal agent messaging system:**
   - Build `AgentMessage` schema + API
   - Setiap agent poll/subscribe messages addressed to them
   - Optional: WebSocket untuk real-time (kalau di VPS)

### 21.11 Open Questions untuk Owner

Sebelum mulai execute, butuh jawaban:

1. **WhatsApp nomor:** Mau beli 14 nomor baru sekaligus, atau mulai dari 1 (DINA) dulu?
2. **VPS budget:** Hostinger VPS OK? Mau pakai Railway/Render (lebih mahal tapi simpler)?
3. **Gemini API keys:** Mau daftar 3-5 akun baru sekaligus, atau 1 dulu?
4. **SOP RINA:** Bisa kasih contoh SOP yang sering berubah? Biar aku design schema-nya.
5. **Image generation RATNA:** Mau pakai z-ai (free, ilustrasi) atau butuh foto real rumah? Kalau real, perlu progress photo pipeline dulu.
6. **Marketing AI personas:** 10 persona yang sudah ada (Ayu/Bima/Citra/...) masih relevant? Atau mau redesign?
7. **Priority urutan agent:** Setuju dengan my pick (DINA dulu), atau owner prefer urutan lain?

---

## 22. NEXT STEPS — Action Items

Berdasarkan section 21, next concrete steps:

### Step 1 (Immediate — DINA WhatsApp)
1. Setup Hostinger VPS (or Railway) untuk Baileys
2. Deploy DINA WA bot (1 nomor: 6287761323344)
3. Test owner chat → DINA response via WA
4. Verify 10 tools jalan via WA (bukan dashboard)

### Step 2 (Short-term — DINA Generate Berkas)
1. Test generate_sk_kerja via WA chat
2. Test generate_slip_gaji (7 lembar otomatis)
3. Test generate_laporan_keuangan (wirausaha)
4. Verify file auto-save ke Drive + auto-send ke owner

### Step 3 (Mid-term — Agent Infrastructure)
1. Build `AgentMessage` schema + API (cross-agent messaging)
2. Build `PendingQuestion` model + UI (pending reasoning)
3. Build `SOP` model (untuk RINA)
4. Add DINA tools: `template_upload`, `template_list`, `pending_question_create`, `pending_question_resolve`

### Step 4 (Long-term — RINA/MITRA/RATNA/Marketing)
1. RINA — finance AI with dynamic SOP
2. MITRA — material + progress tracking
3. RATNA — marketing leader with image gen
4. 10 Marketing AI — persona-based prospek chat

### Step 5 (Future — Multi-Team)
1. Apply Teams concept (section 16) untuk onboarding tim lain
2. Self-service Bank Builder (sudah siap, tinggal pakai)
3. Per-team custom AI persona (kalau tim lain butuh persona beda)

---


## 23. AI AGENTS ROADMAP — DEFERRED (17 Juli 2026)

**Status:** Deferred sampai Tab Berkas fully complete.

### 23.1 Decision Context
Setelah eksplorasi mendalam (section 21-22), disimpulkan bahwa AI Agents roadmap (DINA WhatsApp, RINA, MITRA, RATNA, 10 Marketing) ditunda dulu sampai:

1. Tab Berkas fully functional (SK Kerja + Slip Gaji + Laporan Keuangan untuk semua bank)
2. 9router infrastructure ready (LLM router dengan multi-provider fallback)
3. VPS hosting disiapkan (untuk Baileys WA bot persistent connection)

### 23.2 9router — What We Learned

**9router** (https://github.com/decolua/9router):
- Open-source local proxy/router untuk LLM (22.4K stars, MIT, v0.5.35)
- 40+ providers (Kiro AI free unlimited Claude 4.5, OpenCode Free, Vertex AI, OpenRouter, dll)
- 3-tier fallback: Subscription → Cheap → Free
- Multi-account per provider (round-robin)
- RTK token saver (20-40% hemat)
- Custom combos (fallback chain per agent)
- Format translation (OpenAI ↔ Claude ↔ Gemini)
- Cloud sync across devices
- Dashboard UI di port 20128

### 23.3 Deployment Options Investigated

| Opsi | Biaya | Trade-off | Status |
|---|---|---|---|
| HF Space free tier | FREE | Docker Spaces butuh PRO ($9/bln) | ❌ Blocked |
| Hostinger VPS | Rp 50-70K/bln | Bayar via bank transfer (no card) | ✅ Recommended |
| Komputer + CF Tunnel | FREE | Laptop harus on 24/7 | ⚠️ Tidak reliable |
| Oracle Cloud Always Free | FREE | Signup strict, butuh card untuk verifikasi | ⚠️ Risk ditolak |
| Render Free | FREE | No persistent disk free, 15-min sleep | ❌ Not viable |

**Konklusi:** Hostinger VPS via bank transfer = paling realistis. Bisa host 9router + n8n + WA bot Baileys dalam 1 VPS.

### 23.4 MiroFish Integration
- **MiroFish** (github.com/666ghj/MiroFish, 68.7K stars, AGPL-3.0) = AI prediction engine (swarm intelligence)
- Fungsi: simulasi multi-agent untuk predict outcome (e.g., "kalau harga naik 5%, apa yang terjadi?")
- Bertabrakan dengan 9router? **TIDAK.** MiroFish bisa pakai 9router sebagai LLM gateway
- Bertabrakan dengan n8n? **TIDAK.** n8n bisa call MiroFish via HTTP node
- Bertabrakan dengan OpenClaw? **TIDAK.** OpenClaw = messaging client yang pakai 9router

**All tools saling melengkapi:**
```
        ┌─────────────┐
        │ 9router     │ ← LLM router (VPS)
        └──────┬──────┘
               │
   ┌───────────┼───────────┬───────────────┐
   ↓           ↓           ↓               ↓
hadi-kaya   n8n          OpenClaw       MiroFish
(Vercel)   (workflow)   (messaging)   (prediction)
```

### 23.5 When to Resume AI Agents
Setelah semua ini selesai:
1. ✅ Tab Berkas fully complete (SK Kerja + Slip Gaji + Laporan Keuangan untuk semua bank)
2. ✅ Buy Hostinger VPS (Rp 600K/tahun)
3. ✅ Deploy 9router di VPS
4. ✅ Connect providers (Kiro AI, OpenCode Free, Gemini, OpenRouter)
5. ✅ Update hadi-kaya code → thin wrapper ke 9router
6. ✅ Test DINA dashboard chat dengan 9router backend
7. ⏳ Deploy WA bot Baileys di VPS (1 nomor DINA dulu)
8. ⏳ Test DINA WA end-to-end
9. ⏳ Extend ke RINA, MITRA, RATNA, 10 Marketing (bertahap)

### 23.6 LLM Rate Limit Problem — Root Cause
Per 1 chat message, DINA v3 (function calling) bisa call LLM 3-5 kali:
- Round 1: LLM decide call `get_customer_status("Budi")` → 1st call
- Round 2: LLM decide call `generate_sk_kerja(customerId)` → 2nd call
- Round 3: LLM produce final text reply → 3rd call

5 message berurutan × 3 calls = 15 calls = KENA LIMIT (Gemini free 15 RPM).

**Solutions investigated (untuk implementasi future):**
- Multi-account rotation (5 akun Gemini = 75 RPM)
- 9router fallback (Kiro free unlimited → OpenCode → Gemini)
- Reduce LLM rounds (force final reply setelah 1 tool call)
- Smart caching (kalau same question, return cached)

### 23.7 Vercel Cron Ping — Risk Analysis
Untuk keep HF Space alive (kalau pakai HF):
- Vercel free cron = 1x daily (tidak cukup untuk ping tiap 10 menit)
- Vercel Pro cron = $20/bulan (mahal)
- Alternatif: cron-job.org (free, interval bebas)
- Ping GET / (no LLM call) = tidak kena LLM rate limit
- Tapi HF Space sleep mechanism = kalau 30 min idle, sleep → ping tiap 10 min OK

**Tapi HF Space free Docker butuh PRO** → ini blocking issue.

### 23.8 Action Items (When Resumed)
1. Beli Hostinger VPS via bank transfer (Rp 600K/tahun)
2. Setup Docker + 9router + n8n di VPS
3. Connect 4 providers (Kiro OAuth, OpenCode toggle, Gemini API key, OpenRouter API key)
4. Bikin 3 combos (dina-combo, rina-combo, marketing-combo)
5. Setup Cloudflare Tunnel untuk HTTPS (free)
6. Update hadi-kaya llm-router.ts → thin wrapper ke 9router
7. Set Vercel env vars (LLM_ENDPOINT, LLM_API_KEY, LLM_MODEL_*)
8. Test DINA dashboard chat dengan 9router backend
9. Deploy WA bot Baileys di VPS (1 nomor DINA: 6287761323344)
10. Test DINA WA end-to-end

---


## 24. FINANCE & MATERIAL SYSTEM (RINA + MITRA)

> **PURPOSE SECTION**: Bagian ini jadi "single source of truth" untuk konteks Finance & Material.
> Setiap ada pertanyaan/diskusi tentang finance/material di sesi mendatang, **RECALL section ini dari PRD** sebelum jawab.
> Backup reference: `upload/18072026 Backup.json` (snapshot 17 Juli 2026).

### 24.1 Overview

Sistem Finance & Material adalah modul tracking keuangan proyek konstruksi PT. Marlindo Bangun Persada. Tracking 3 arus uang keluar:
1. **Purchase Orders (PO)** — pembelian material dari supplier (122 PO, Rp 307M+)
2. **Wage Payments** — pembayaran upah tukang per item pekerjaan (58 pembayaran, Rp 89M+)
3. **Other Expenses** — pengeluaran operasional/non-material (94 expense, Rp 196M+)

Total arus kas tercatat per backup 17 Juli 2026: **Rp 593,880,469** (± 6 bulan operasional, Jan–Jul 2026).

Material tracking terpisah:
- **Materials** — 163 material master dengan default price
- **Stock** — saldo gudang real-time per material
- **Usages** — pemakaian material per unit/proyek (110 records)
- **Categories** — 15 kategori material (Pondasi, Badan Rumah, Atap, Plafon, Plaster, Keramik, Kusen Jendela, Subsitank, Kamar Mandi, Carpot, Listrik, Pengecatan, Pintu, Pipa Air, Stok Gudang)
- **Suppliers** — 20 supplier dengan data bank untuk transfer

### 24.2 Database Schema (11 Entities)

Source: `upload/18072026 Backup.json` (top-level keys). Di-app, ini disimpan di Aiven PostgreSQL via Prisma.

#### 24.2.1 Project
```
{
  id: string (e.g., 's6db33dgx')
  name: string (e.g., 'Anjayo 16')
  type: 'Subsidi' | 'Komersil'
}
```
**Current state**: 8 projects (2 Subsidi, 6 Komersil)
- Anjayo 16 (Subsidi) — project utama KPR
- Permata Muntai (Subsidi)
- Toko Kopi, Kantor Anjayo, Rumah Pasir Putih, Anjayo 1, Rumah Stadion, Rumah Pojok (Komersil)

#### 24.2.2 Unit
```
{
  id: string
  projectId: string  // FK to Project
  block: string      // e.g., 'E', 'D', 'Rumah', 'XinKofi'
  unitNumber: string // e.g., '1', '22', 'Apho', '*'
}
```
**Current state**: 21 units across 8 projects (Anjayo 16: 13 units E/D, sisanya 1-2 unit per project komersil)

#### 24.2.3 Supplier
```
{
  id: string
  name: string         // e.g., 'Toko Acil'
  owner: string        // e.g., 'Achmad Jani'
  phone: string        // e.g., '085289989869'
  bankName: string     // 'BCA' | 'BNI' | 'MANDIRI' | 'BRI' | ''
  bankAccount: string  // account number
}
```
**Current state**: 20 suppliers. Top: Toko Acil (BCA), Bintang Baru (BCA), Tanah Asiung (BCA), Ibtia Batako (BNI), Gatot Pasir (MANDIRI), Karmin Kuesen (BRI). Beberapa supplier data bank kosong (Toko Cash, Mulia Keramik, Syam Batako, dll — perlu dilengkapi).

#### 24.2.4 Material
```
{
  id: string
  name: string         // e.g., 'Semen', 'Batako', 'Tanah Puru'
  categoryId: string   // FK to Category
  unit: string         // 'Pcs' | 'Keping' | 'Sak' | 'm³' (current: 162 Pcs, 1 Keping)
  defaultPrice: number // in Rupiah
}
```
**Current state**: 163 materials. Harga sample: Semen Rp 64.000/Pcs, Batako Rp 1.900/Keping, Tanah Puru Rp 250.000/Pcs, Pasir Rp 450.000/Pcs, Gypsum Rp 63.000/Pcs.

#### 24.2.5 Category
```
{ id: string, name: string }
```
**Current state**: 15 kategori (Pondasi, Badan Rumah, Atap, Plafon, Plaster, Keramik, Kusen Jendela, Subsitank, Kamar Mandi, Carpot dan Meja Dapur, Listrik, Pengecatan, Pemasangan Pintu, Pipa Air, Stok gudang).

#### 24.2.6 WageType (Upah per Pekerjaan)
```
{
  id: string
  projectId: string  // FK to Project (wage types project-specific)
  name: string       // e.g., 'Pondasi', 'Pemasangan Bata', 'Plaster'
  price: number      // full task budget in Rupiah
}
```
**Current state**: 24 wage types. Anjayo 16 (12 types): Pondasi Rp 1.2M, Pemasangan Bata Rp 4.5M, Plaster Rp 4M, Pemasangan Atap Rp 1.5M, Pengecatan Rp 1M, Subsitank & Urukan Rp 800K, Instalasi 11 titik Listrik Rp 350K, Plafon Rp 1.1M, Pemasangan Keramik Rp 1.9M, Serah Terima Kunci Rp 2.1M, Retensi Rp 1.2M, Pemasangan Pintu Rp 350K, Carpot Rp 1M.
Rumah Pojok (10 types — borongan rumah komersil): Nol Bata/Ringbalk/Tebeng Layar Rp 5M, Cor Dak Rp 5M, Atap Rp 7M, Plaster Keliling + Acian Rp 11M, Installasi Listrik Rp 5M, Pemasangan Plafon Rp 5.25M, Pasang Keramik Rp 10.9M, Finishing Rp 3.495M, Septiktank Rp 2M.
Toko Kopi: Pembayaran pertama Rp 2M. Kantor Anjayo: Plafon Dapur Rp 1.3M.

#### 24.2.7 PurchaseOrder (PO)
```
{
  id: string
  poNumber: string       // format: 'PO-YYYYMM-NNNN' (e.g., 'PO-202607-0122')
  supplierId: string     // FK to Supplier
  date: string           // ISO date (e.g., '2026-07-17')
  status: 'UNPAID' | 'PAID'
  notes: string
  items: Array<{
    id: string
    materialId: string   // FK to Material
    qty: number
    price: number        // per-unit price (may differ from material.defaultPrice)
    projectId: string    // item allocated to specific project
    unitId: string       // item allocated to specific unit
    block: string        // for display (denormalized)
  }>
}
```
**Current state**: 122 POs (83 PAID, 39 UNPAID). Date range: Jan 3 – Jul 17, 2026. Total value: **Rp 307,727,000**.
Format PO number: `PO-YYYYMM-NNNN` (sequential per month).

#### 24.2.8 WagePayment
```
{
  id: string
  date: string           // ISO date
  projectId: string
  unitId: string
  wageTypeId: string     // FK to WageType
  workerName: string     // e.g., 'Heri', 'Wasku'
  amount: number         // actual paid amount (may differ from wageType.price for partial)
  fullTaskBudget: number // total budget from WageType.price
  status: 'PAID' | 'UNPAID'
  workDescription: string
  evidenceImage: string? // URL to photo of completed work
}
```
**Current state**: 58 wage payments (45 PAID, 13 UNPAID). Date range: Jan 17 – Jul 17, 2026. Total value: **Rp 89,400,000**. Top worker: Heri (pondasi, retensi Anjayo 16 units D/E).

#### 24.2.9 OtherExpense
```
{
  id: string
  description: string
  category: string       // 12 categories (see below)
  amount: number
  date: string
  status: 'PAID' | 'UNPAID'
  paymentCycle: string   // 'Weekly' | 'Monthly' | 'One-time' | ''
}
```
**Current state**: 94 expenses (70 PAID, 24 UNPAID). Total value: **Rp 196,753,469**.
Categories distribution:
- **Gaji** (22 items) — payroll karyawan
- **Operasional Kantor** (19) — operasional (printer, mesin kopi, ATK)
- **SLF** (8) — Sertifikat Laik Fungsi per unit
- **Komisi** (11) — komisi marketing/notaris
- **Biaya Notaris** (8) — fee notaris per unit
- **Reimburse** (7) — pengembalian dana
- **Listrik** (5) — biaya listrik
- **PPH** (5) — pajak penghasilan
- **Kasbon** (3) — kasbon karyawan/kerja
- **Lainnya** (3)
- **Hutang / Tunggakan** (2)
- **PBB** (1) — pajak bumi bangunan

#### 24.2.10 Memo (Pengajuan Dana)
```
{
  id: string
  memoNumber: string     // format: 'MBP-W-NNNNNN' (weekly) | 'MBP-D-NNNNNN' (daily)
  date: string
  type: 'MINGGUAN' | 'HARIAN'
  poIds: string[]        // POs included in this memo
  wageIds: string[]      // WagePayments included
  expenseIds: string[]   // OtherExpenses included
  totalAmount: number    // sum of all included items
  status: 'PENDING' | 'COMPLETED'
  notes: string
}
```
**Current state**: 44 memos (33 MINGGUAN, 11 HARIAN; 39 COMPLETED, 5 PENDING).
Memo number format:
- Weekly: `MBP-W-NNNNNN` (e.g., MBP-W-865968)
- Daily: `MBP-D-NNNNNN` (e.g., MBP-D-169313)
Memo adalah grouping pembayaran — owner kumpulkan beberapa PO/wage/expense jadi 1 pengajuan untuk transfer sekali.

#### 24.2.11 Stock
```
{ materialId: string, quantity: number }  // 1-to-1 with Material
```
**Current state**: 163 stock records (1 per material). Sample: Semen 268 Pcs, Batako 11.750 Keping, Tanah Puru 30 Pcs.

#### 24.2.12 Usage (Pemakaian Material)
```
{
  id: string
  date: string
  unitId: string         // which unit consumed
  projectId: string
  items: Array<{
    materialId: string
    qty: number
    price: number        // price at time of usage (for cost tracking)
  }>
}
```
**Current state**: 110 usage records. Each usage deducts from Stock.

### 24.3 Finance Flow (PO → Memo → Payment)

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Buat PO      │ →   │ 2. PO Status │ →   │ 3. Buat Memo │ →   │ 4. Transfer  │
│ (UNPAID)        │     │    change?   │     │  (grouping)  │     │   + mark     │
│                 │     │              │     │              │     │   PAID       │
└─────────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                  ↓
                                          Same flow for:
                                          - WagePayment
                                          - OtherExpense
```

**Detail flow:**
1. Owner buat PO baru (status: UNPAID). Pilih supplier, material, qty, price, project/unit.
2. Saat material diterima, owner bisa mark PO PAID (kalau langsung dibayar).
3. Untuk pengajuan dana mingguan/harian, owner gabungkan beberapa PO + WagePayment + OtherExpense jadi 1 Memo.
4. Owner transfer ke bank supplier (atau cash ke tukang), lalu mark semua items di Memo jadi PAID.
5. Memo status: PENDING → COMPLETED setelah semua items PAID.

### 24.4 Material Flow (Material → Stock → Usage)

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│ Material Master │ ↔   │ Stock (saldo gudang) │ ←   │ Usage (pemakaian)│
│ (default price) │     │ quantity             │     │ per unit/project │
└─────────────────┘     └──────────────────────┘     └──────────────────┘
        ↓                            ↑                          ↓
   PO adds stock             PO items increment           Usage items decrement
                             (qty from PO items)          (qty from usage items)
```

**Detail flow:**
1. Material master dibuat sekali (name, category, unit, defaultPrice).
2. Setiap PO yang PAID menambah Stock (material yang diterima di gudang).
3. Setiap Usage mengurangi Stock (material dipakai untuk unit tertentu).
4. Cost per Usage = qty × price (price di-snapshot saat usage, bukan pakai defaultPrice).

### 24.5 Files & API Endpoints

#### Backend (Next.js API Routes)
- `/api/finance/po` — CRUD PurchaseOrder
- `/api/finance/po/[id]/compile-pdf` — compile PO items jadi PDF
- `/api/finance/po/[id]/pdf` — download PO as PDF
- `/api/finance/po/[id]/documents` — list PO documents
- `/api/finance/suppliers` — CRUD Supplier
- `/api/finance/suppliers/[id]/prices` — supplier-specific material prices
- `/api/finance/daily-expense` — CRUD OtherExpense
- `/api/finance/weekly-report` — generate weekly report

#### Database Explorer (read-only)
- `/api/database-explorer/finance` — browse finance tables (PO, Wage, Expense, Memo, Supplier, WageType)
- `/api/database-explorer/material` — browse material tables (Material, Category, Stock, Usage)
- `/api/database-explorer/marketing` — browse marketing tables
- `/api/database-explorer/berkas` — browse berkas tables

#### Backend Libraries
- `src/lib/finance/po-generator.ts` — PO PDF generator
- `src/lib/finance/pdf-generator.ts` — generic PDF generator

#### Frontend (Dashboard)
- `src/components/dashboard/database-tab.tsx` — database explorer UI

#### Backup/Restore
- `/api/admin/backup` — export all finance/material data to JSON (snapshot)
- `/api/admin/restore` — import JSON backup
- Scripts: `scripts/backup-db.ts`, `scripts/restore-db.ts`

### 24.6 RINA — Finance AI Agent (Planned, Deferred)

> Status: PLANNED — implementation deferred sampai Tab Berkas + DINA WA deploy (per Section 23.5)

**Scope RINA (when activated):**
1. **Chat-based inquiry**: Owner tanya "RINA, berapa total PO ke Toko Acil bulan ini?" → RINA query DB → jawab
2. **Memo generation**: "RINA, buat memo mingguan untuk PO yang UNPAID + wage Heri minggu ini" → RINA draft Memo
3. **Cash flow report**: "RINA, kas keluar bulan Juli" → RINA generate report (PDF/Excel)
4. **Supplier reconciliation**: "RINA, supplier mana yang masih punya PO UNPAID?" → list + total
5. **Project cost tracking**: "RINA, berapa biaya Anjayo 16 unit E/1 sampai sekarang?" → sum all PO/wage/expense for that unit
6. **Budget vs Actual**: "RINA, bandingkan budget vs realisasi Rumah Pojok" → compare wageType.price totals vs actual wagePayment.amount

**RINA tools (planned, function calling):**
- `query_purchase_orders(filters)` — list PO with filter (supplier, project, status, date range)
- `query_wage_payments(filters)` — list WagePayment
- `query_other_expenses(filters)` — list OtherExpense
- `query_memos(filters)` — list Memo
- `create_memo(poIds, wageIds, expenseIds, type)` — draft new Memo
- `mark_memo_paid(memoId)` — set Memo + all items to PAID
- `get_project_cost(projectId, unitId?)` — sum all costs for project/unit
- `get_supplier_outstanding(supplierId?)` — list unpaid PO per supplier
- `generate_cashflow_report(startDate, endDate, format)` — PDF/Excel report

**LLM provider for RINA:** sama dengan DINA (z-ai-web-dev-sdk direct, atau 9router kalau sudah deploy).

### 24.7 MITRA — Material AI Agent (Planned, Deferred)

> Status: PLANNED — implementation deferred sampai RINA jalan (per Section 23.5)

**Scope MITRA (when activated):**
1. **Stock alert**: "MITRA, material apa yang stocknya mau habis?" → check Stock < threshold → notify
2. **Material recommendation**: "MITRA, untuk pondasi unit E/8 butuh material apa aja?" → suggest material list per category
3. **Supplier price comparison**: "MITRA, harga semen di supplier mana yang paling murah?" → query supplier prices
4. **Usage tracking**: "MITRA, catat pemakaian 10 sak semen untuk unit D/9 hari ini" → create Usage record
5. **Stock card report**: "MITRA, kartu stok semen bulan Juli" → list all in (PO) + out (Usage) per material per period
6. **Waste analysis**: "MITRA, material mana yang over-usage di Anjayo 16?" → compare budgeted vs actual usage

**MITRA tools (planned):**
- `query_materials(filters)` — list Material with filter (category, name search)
- `query_stock(materialId?)` — get current stock level(s)
- `query_usages(filters)` — list Usage records
- `create_usage(unitId, projectId, items)` — record material usage (decrement stock)
- `get_stock_card(materialId, startDate, endDate)` — kartu stok per material
- `get_low_stock(threshold)` — materials below threshold
- `compare_supplier_prices(materialId)` — prices across suppliers

### 24.8 Pending Issues (Finance & Material)

1. **Supplier data incomplete** — 11 dari 20 supplier tidak punya data bank (Toko Toko Cash, Mulia Keramik, Syam Batako, Lestari Jaya Aluminium, Jaya Indah, Mitra Agung, Bisma, Yanto Al mizan papan, Hendi Genteng Beton, Abot Batako, Roshid Kusen). Perlu dilengkapi untuk auto-generate transfer instruction di Memo PDF.

2. **Material category incomplete** — Sample materials yang dicek punya `categoryId` yang tidak match dengan daftar 15 categories di backup. Perlu verify data integrity (mungkin kategori di-add/remove tanpa re-link materials).

3. **PO number format** — Saat ini: `PO-YYYYMM-NNNN` (sequential per month). Perlu cek apakah ada collision risk kalau banyak PO per bulan. Current max: PO-202607-0122 (122nd PO di Juli 2026 — angka tinggi, mungkin perlu 5 digit: `PO-YYYYMM-NNNNN`).

4. **Memo status workflow** — Hanya 2 status (PENDING/COMPLETED). Tidak ada "DRAFT" atau "REJECTED" untuk tracking pengajuan yang ditolak/ditunda.

5. **Evidence image storage** — `evidenceImage` di WagePayment disimpan sebagai URL/string. Belum clear apakah di-upload ke Google Drive atau di-store locally. Perlu define storage strategy.

6. **No RAB integration** — Backup punya field `materialRABs: []` dan `rabExplanations: []` (empty). RAB (Rencana Anggaran Biaya) belum terhubung dengan Material/PO/Wage. Idealnya: RAB → material plan → PO budget → actual PO → variance analysis.

7. **No approval workflow** — Tidak ada approval chain. Owner buat PO → langsung UNPAID → langsung mark PAID. Tidak ada "request approval" step. Mungkin OK untuk operasi kecil, tapi kalau ada lebih dari 1 decision maker perlu ditambah.

8. **No project cost budget** — Tidak ada field `budgetedCost` di Project. Jadi tidak bisa otomatis compare budget vs actual per project. Hanya bisa sum actual.

### 24.9 Recall Triggers (Penting!)

**RECALL section 24 ini kalau user bertanya tentang:**
- "Finance", "Keuangan", "Arus kas", "Cash flow"
- "RINA", "Finance AI"
- "PO", "Purchase Order", "Pembelian material"
- "Wage", "Upah tukang", "Pembayaran upah"
- "Memo", "Pengajuan dana", "MBP"
- "Supplier", "Vendor material"
- "Material", "Stok", "Gudang", "Pemakaian material"
- "MITRA", "Material AI"
- "RAB", "Rencana Anggaran Biaya"
- "Project cost", "Biaya proyek", "Cost tracking"
- "Backup", "Restore", "18072026 Backup.json"
- "Anjayo 16 cost", "Rumah Pojok cost", atau cost any project

**RECALL caranya:** Baca section 24 ini dari PRD.md → gunakan data schema + current state numbers untuk jawab pertanyaan user dengan akurat.

### 24.10 Backup File Reference

- **Latest backup**: `upload/18072026 Backup.json` (snapshot 17 Juli 2026)
- **Backup structure**: 12 top-level keys (projects, units, suppliers, materials, categories, wageTypes, purchaseOrders, wagePayments, otherExpenses, memos, stock, usages, cloudConfig, materialRABs, rabExplanations, backupDate)
- **Backup endpoint**: `POST /api/admin/backup` (dipanggil manual dari dashboard)
- **Restore endpoint**: `POST /api/admin/restore` (upload JSON → restore all tables)
- **Auto-backup**: `cloudConfig.autoBackupEnabled = true` (tapi `isConnected = false` — belum connected ke cloud storage)

---

## 25. FINANCE MODULE — LOCKED DECISIONS (20 Juli 2026)

> **PURPOSE**: Bagian ini jadi "single source of truth" untuk semua keputusan Finance module yang udah di-lock lewat diskusi panjang dengan Claude Code (NVIDIA NIM/GLM-5.2) di laptop owner.
> Semua AI assistant (z.ai, Cursor, Claude Code, ChatGPT) WAJIB baca section ini sebelum mulai kerja Finance.
> Kalau ada perubahan keputusan, update section ini (bukan di tempat lain).

### 25.1 Context

Owner selama 7 bulan pakai sistem lama (Google AI Studio React+Electron app) untuk tracking Finance & Material konstruksi. Banyak bottleneck muncul:
- PO dibuat SETELAH barang datang (salah SOP)
- "Hammer pay" (1 klik mark semua item di Memo jadi PAID, padahal belum transfer semua)
- Re-pick unpaid item tiap minggu manual (no filter, no search, no select-all)
- Bukti transfer ga pernah persist (ephemeral state, hilang pas tutup page)
- No direct-use path (kamar mandi/carpot/pipa inflate warehouse, harus di-bleed manual)
- No stock opname audit
- AVCO confusion on mixed-price batches
- Bank detail cuma auto-fill di supplier, tukang harus buka record PO tiap kali

Owner mau rebuild Finance+Material flow di hadi-kaya-virtual-office (Next.js), BUKAN copy-paste plek dari sistem lama — bangun dari nol pakai SOP yang udah dipikirin matang.

### 25.2 PO Number Format (LOCKED)

**Format**: `PO/{projectCode}/{blockNumber|GDG}/{seq}/{MMYY}`

**Contoh**:
- `PO-A16-A12-001-0726` (di DB/filename, dash separator)
- `PO/A16/A12/001/0726` (di display, slash separator)

**Aturan**:
- `projectCode` = singkatan per proyek (lihat 25.3 untuk 8 kode)
- `blockNumber|GDG`:
  - `blockNumber` (e.g. "A12") = composite field di Unit (block + unitNumber merged)
  - `GDG` = literal untuk stok gudang umum (bukan unit spesifik)
- `seq` = nomor urut, reset per tahun per unit
- `MMYY` = 2 digit bulan + 2 digit tahun

**8 Project Codes** (Claude usulin, owner koreksi via dashboard):
| Nama Project | Type | Code |
|--------------|------|------|
| Anjayo 16 | Subsidi | A16 |
| Permata Muntai | Subsidi | PM |
| Toko Kopi | Komersil | TK |
| Kantor Anjayo | Komersil | KA |
| Rumah Pasir Putih | Komersil | RP |
| Anjayo 1 | Komersil | A01 |
| Rumah Stadion | Komersil | RS |
| Rumah Pojok | Komersil | RPK |

### 25.3 Finance SOP Decisions (LOCKED)

#### Q1 — Prioritas Eksekusi
**A** Dashboard Finance UI dulu (cashflow + outstanding hutang). Setelah UI ready, baru RINA AI chat / RAB integration.

#### Q2 — Evidence Image Storage
**A** Google Drive. Folder structure: `/Finance/{projectCode}/{poNumber|kind}/{filename}`.
Reuse Google OAuth yang udah wired (hard rule: no new infra, no new creds).

#### Q3 — Memo Status Workflow
**A** PENDING/COMPLETED saja. No DRAFT/REJECTED. Memo = batching tool pengajuan dana mingguan/harian, bukan approval workflow.

#### Q4 — PO Number Format
Locked per 25.2 di atas.

#### Q5 — Supplier Bank Data Kosong
Skip dulu. Owner isi manual via dashboard (11 supplier bank kosong di backup JSON).

#### Q6 — RINA Deploy
**A** Dashboard only. RINA jadi in-app chat di tab Finance, reuse BaseAgent/agent infra yang udah ada. WA bot (B/C) premature sampai RINA proven.

#### Q7 — LLM Provider untuk RINA
**A** GLM-4.6 via z-ai-web-dev-sdk (existing llm-router.ts). No new creds, no new SDK. 9router skip (bayar, redundant sama OpenRouter). Gemini standby kalo reasoning angka Finance kurang.

#### Q8 — Project budgetedCost Field
**Defer**. Pakai RAB sebagai source (single source of truth, no duplicate data). Kalo urgent mau insight sebelum RAB ready, fallback nullable field sementara, deprecate pas RAB masuk.

### 25.4 Detailed Finance Flow Decisions (LOCKED)

#### A1 — Approval Step
**A** Skip. Single-user v1 (owner = boss = user yang input), self-approve. Approval queue baru ditambah pas multi-user (C7).

#### A2 — PO Planned vs Actual
**A** Two columns. `plannedTotal` = Σ qty×price (rencana). `actualTotal` dari uploaded Nota (realisasi, bisa >1 nota karna nota abis). PO locked setelah nota pertama. Hutang = `actual − Σ payments`. Jangan edit PO existing biar history kebaca.

#### A3 — Material Master vs Toko Names
Material master = nama umum (e.g. "Wastafel"). Toko kasih nama merek (e.g. "ACP"). Crosscheck pakai harga + tanya toko langsung. Saat input PO, pilih dari material master yang sudah ada, ga boleh buat baru diam-diam.

#### A4 — PO Scope
1 PO = 1 supplier, bisa 1 atau multi item pekerjaan. 2 versi untuk owner:
- PO perencanaan (1 PO banyak supplier untuk tahap pondasi-atas)
- PO eksekusi (1 PO 1 supplier untuk 1 atau lebih item pekerjaan)

#### A5 — Wage Payment (Tukang)
1 WagePayment = 1 termin. Bisa bayar sebagian (partial). Per Payment record + progress bar. Bos mood: bisa full 1.2jt atau partial 500K.

#### A6 — Wage Evidence Foto
Foto hasil/progress pekerjaan (BUKAN hadir/bon). Upload ke Drive. Future: RINA bantu draft dari deskripsi, tapi input data tetap manual dulu.

#### A7 — RAB Snapshot untuk Wage
`fullTaskBudget` snapshot lock pas WagePayment create (RAB price dikunci pas tukang teken kontrak). `amount` beda vs `fullTaskBudget` → `budgetVarianceReason` wajib diisi.

#### A8 — OtherExpense Categories
Default fix 12-16 kategori + editable via Settings (tambah/kurang).

#### A9 — Cash Material
**Wajib via PO**. Buang `isMaterialCash`/`materialItems` hack dari sistem lama. OtherExpense = pure operasional (gaji, SLF, notary, KWH, fuel, komisi, reimburse, kasbon, PBB, PPH, hutang, lainnya).

#### A10 — Memo Item Telat/Ditunda
**A** Memo status: PENDING → (partial) → COMPLETED. Status baris individu: UNPAID/PAID. Bisa partial-bayar sebagian item, sisa tetap PENDING → lanjut minggu depan.

#### A11 — Mark Paid
**A** Per-recipient partial pay. Centang supplier/tukang/kategori yang udah dibayar → mark PAID, sisa tetap UNPAID. Memo PENDING sampai semua selesai. **Replaces hammer pay**.

#### A12 — PDF Bundle Arsip
**B** Bundle SEMUA money-out (PO + Wage + Expense) per entity → 1 PDF arsip. Plus bulanan → 1 PDF lengkap (semua money-out bulan itu jadi 1 bundle).

#### A13 — Antrean Hutang Belum Dibayar
**D** Tabel sortable campuran (sortable per kolom: penerima, kategori, project). Paling fleksibel.

### 25.5 Material SOP Decisions (LOCKED)

#### B1 — Stock Opname
**PERLU**. `StockAdjustment{materialId, deltaQty, reason, type, prevQty, newQty, date}` audit log. NO silent set; tiap perubahan saldo insert adjustment + reason wajib.

#### B2 — Low-Stock Alert
Per-material `minStock` threshold (semen/bata/pasir set tinggi). Notification saat stok di bawah threshold.

#### B3 — Sisa Material Setelah Rumah Selesai
**A** Return-to-stock action (kembali ke gudang global).

#### B4 — Direct-Use Flag
`POItem.directUse: Boolean = false`. Saat true → auto-create `MaterialUsage` ke unit (skip stok, auto-Usage). Contoh: kamar mandi, carpot, pipa air.

#### B5 — Costing Method
**A** AVCO + snapshot. AVCO running price di `Stock.avgPrice`. Saat Usage dibuat, `MaterialUsageItem.price` = AVCO saat itu, di-lock permanen (frozen). Efek:
- Unit A1 (awal): modal material pakai AVCO 64rb/zak → frozen
- PO baru 200@68rb → AVCO drift ke ~67rb
- Unit A6 (akhir): modal pakai AVCO 67rb → frozen
- → Modal real per unit stabil, kenaikan harga keliatan otomatis (64→67)

#### B6 — UnitAnalysis (Biaya Total Unit)
Total realisasi (PO + Wage + Expense yang dialokasikan ke unit). RAB comparison nunggu RAB ready (defer).

#### B7 — Material Default Price
Harga acuan, tampil saat bikin PO (bisa diubah). Plus pantau harga supplier per material (fitur bandingkan supplier, future).

### 25.6 Finance ↔ Material Crossover Decisions (LOCKED)

#### C1 — Stok Naik Kapan
**C** Saat PO received (button "Barang diterima" terpisah dari "sudah dibayar"). 2 lifecycle independen. Stok naik di momen received, BUKAN saat PO create atau PAID.

#### C2 — Force SOP (Owner delegate to AI)
- Stock **tidak boleh minus** via Usage (sistem block)
- Kalo gudang ga cukup → opname/adjust dulu (alasan wajib + audit log)
- Kecuali via direct-use (POItem.directUse → auto Usage skip cek stok, soalnya emang fresh dari PO bukan dari gudang)
- Manual adjust = `StockAdjustment{reason, type, prevQty, newQty}` audit log

#### C3 — Biaya Unit A12 = Usage-Based
Pakai Usage yang dialokasiin ke A12 (bukan PO). Direct-use auto Usage → konsisten. PO-ke-gudang belum dihitung biaya unit sampai dipakai. Untuk audit:
```
Modal A12 = Material dipakai (Usage) Rp X + Upah Rp Y + Ops Rp Z
Sisa gudang muncul terpisah sbg "uang terikat stok Rp W" (bukan biaya unit)
```

#### C4 — Stok vs Biaya Rumah
**Stok = global expenditure** (uang udah keluar), **BUKAN biaya rumah** sampai dipakai. Dual tampil:
- Finance = uang keluar real
- Material = modal real per unit (Usage-based)
- Beda angka normal (selisih = stok belum dipakai)

#### C5 — Subsidi vs Komersil
Beda RAB. Komersil-no-rab untuk rumah bos/mertua (no RAB pasti, pengeluaran material tidak pasti).

#### C6 — RAB Format
Owner lupa simpan. Akan dikirim besok (format PO + RAB Material + RAB Upah Tukang). Sementara defer.

#### C7 — Multi-User
v1 single-user (owner). Multi-user + login nanti. Tapi perlu diingat: multi-team/multi-user bisa beda RAB harga pekerjaan tukang, RAB harga/jenis/kebutuhan/qty material.

#### C8 — Pengajuan Material dari Lapangan
**Roadmap** v2. Mandor/bng lapangan request material via WA → owner buat PO. Future feature.

### 25.7 Tab Structure & Dashboard (LOCKED)

#### S9 — Tab Layout
**2** tab terpisah: "Finance" + "Material". Bukan campuran.

#### S10 — Default View Finance
Cashflow + Outstanding hutang belum dibayar muncul pertama pas buka tab Finance.

#### Dashboard Finance Layout A (LOCKED)
```
┌─ KPI TILES (4) ──────────────────────────────────┐
│ Total Keluar bln ini | Outstanding Material       │
│ Outstanding Upah     | Outstanding Ops            │
├─ CASHFLOW 6 BULAN (recharts stacked bar) ─────────┤
│ Material (biru) / Upah (hijau) / Ops (abu)        │
│ Toggle: Bulan ini / 6 bln / 12 bln                │
├─ OUTSTANDING HUTANG BELUM DIBAYAR ────────────────┤
│ Per Penerima              │ Per Kategori           │
│ Toko Acil Rp 3.5jt [Bayar]│ Material Rp 8.2jt      │
│ Heri (upah) Rp 2jt [Bayar]│ Upah Rp 3.1jt          │
│                          │ Ops Rp 1.2jt            │
├─ [Buat Memo] [Laporan Bulanan] [Laporan Tahunan] ─┤
└───────────────────────────────────────────────────┘
```

### 25.8 Worker Bank Account (LOCKED)

#### #7 — Tukang Bank Account
**A** Field bank di Worker (master tukang), BISA null = tunai.
- `defaultBankName`, `defaultBankAccount`, `defaultBankHolder`
- `isCashOnly` Boolean (tunai only — biasanya dipaksa transfer buat track record)
- Override per Payment: `Payment.bankName/bankAccount/bankHolder` snapshot (soalnya tukang rekening beda tiap minggu)

### 25.9 9 Master Tukang (Auto-Seed dari Backup)

Worker master di-auto-seed dari backup JSON (distinct workerNames):
1. Heri
2. Wasku
3. Remy
4. Arif
5. Damar
6. Gellent
7. Koni
8. Parto
9. Yayat

Default bank null (owner isi weekly atau via Payment override).

### 25.10 Material Benchmark (Owner Input)

Untuk default `minStock` + RAB estimate:
- 1 rumah = **59-63 zak semen** (~61 zak average)
- 1 rumah = **9 mobil pasir**

### 25.11 Schema Prisma Delta (LOCKED)

#### DROP Stale Models (0 usage, no live data — verified):
- PO
- POLine
- SupplierPayment
- FundRequest
- MaterialStock
- old MaterialUsage (rewrite, name preserved)

Cascading cleanup:
- `Agent`: drop `pos PO[]`, `fundRequests FundRequest[]`
- `Approval`: drop `pos PO[]`
- `Supplier`: drop `pos PO[]`, `payments SupplierPayment[]`; add new relations
- `Project`: drop `materialStock MaterialStock[]`

#### MODIFY Existing:
- `Project`: `code String?` → `code String? @unique` (nullable-safe vs existing prod rows + seed.ts; import backfill + dashboard set)
- `Unit`: no field change (blockNumber already composite "A12")
- `Supplier`: ADD `bankName String?`, `bankAccount String?`, `bankHolder String?`

#### NEW Models (±14):
**Finance Core:**
1. `PurchaseOrder` (+ format PO/{code}/{blockNumber|GDG}/{seq}/{MMYY}, plannedTotal/actualTotal/locked/receivedAt)
2. `POItem` (+ directUse Boolean, deliveredQty, allocation override)
3. `Nota` (1 PO bisa >1 nota, karna nota abis)
4. `Payment` (partial per-recipient, voided flag, polymorphic FK to PO|WagePayment|OtherExpense, bank snapshot)
5. `WageType` (benchmark upah per pekerjaan per project, RAB price)
6. `WagePayment` (1 record = 1 termin, fullTaskBudget snapshot, amount, budgetVarianceReason)
7. `OtherExpense` (pure operasional, no material)
8. `Worker` (master tukang + bank + isCashOnly)
9. `Memo` (pengajuan dana, memoNumber sequential)
10. `MemoLine` (append-only history, PROPOSED|PAID|SKIPPED, carriedOverFromMemoLineId self-ref)

**Material:**
11. `Category` (master kategori, 15 dari backup)
12. `Material` (master material, 163 dari backup, minStock, lastPrice AVCO)
13. `Stock` (1:1 ke Material via PK=materialId, avgPrice AVCO running)
14. `StockAdjustment` (audit log, type: INITIAL|PO_RECEIVED|USAGE_OUT|DIRECT_USE_SKIP|OPNAME|RETURN_TO_STOCK)
15. `MaterialUsage` (rewritten: +source enum, +poId link)
16. `MaterialUsageItem` (line item, AVCO snapshot frozen)

**Files:**
17. `FileRef` (polymorphic Drive pointer, kind: PO_DOC|NOTA|TRANSFER_PROOF|WAGE_EVIDENCE|EXPENSE_PROOF|REPORT|BUNDLE_MONTHLY|BUNDLE_ENTITY)

#### Convention:
- Enum = String + comment (codebase has 0 native enums; native breaks convention + painful Postgres migration)
- Money type = Float (matches codebase; tech-debt → migrate to Decimal/cents when reconciliation matters at scale)
- Deferred YAGNI for v1: MaterialRAB/RAB/RABLine (RAB format arrives later), Project.budgetedCost, ProjectType enum, multi-user/AppUser FK, per-POItem nota attribution

### 25.12 Laporan Finance Design (3 Jenis — "Kaya Buku")

#### Konvensi Akuntansi Konstruksi yang Diterapin:
- **Job-costing per unit** = biaya rumah A12 = (Material Usage ke A12) + (Wage ke A12) + (Expense alokasi A12)
- **Committed Cost** = PO plannedTotal. Paid-to-date = Σ Payment. Outstanding = planned − paid = "hutang belum dibayar"
- **Variance** = plannedTotal vs actualTotal. Favorable (actual < planned) / unfavorable (actual > planned). Flag merah kalo unfavorable material
- **WIP** = unit belum selesai → cost-to-date. Sisa ke selesai = (kalo ada RAB) budgeted − cost-to-date
- **Subsidi vs Komersil** = pisah per project type
- **Cashflow** = uang keluar REAL (Payment). Stok belum dipakai = expenditure global, BUKAN biaya rumah

#### 1️⃣ LAPORAN BULANAN
**OVERVIEW (halaman 1):**
- Cashflow bulan ini: total keluar per kategori (Material/Upah/Ops)
- Outstanding hutang akhir bulan (PO+Wage+Expense belum PAID)
- KPI tiles: Total material dibeli, Total upah dibayar, Total operasional, Belum dibayar
- Variance bulan ini (planned vs actual, favorable/unfavorable)
- Top 5 penerima pembayaran bulan ini

**DETAIL ("kaya buku"):**
1. Pembelian material per toko/supplier — per supplier: list PO (no, tanggal, item, planned, actual, variance), subtotal supplier, grand total
2. Pembayaran upah tukang per unit — per unit: list wage (pekerjaan, tukang, termin, amount, budget, progress%, foto evidence ref), subtotal unit, grand total
3. Pembayaran upah tukang per blok — aggregate blok (A1-A5) → total per blok + breakdown unit
4. Pemakaian material per unit — per unit: list Usage (material, qty, AVCO price snapshot, sub, source warehouse/direct), subtotal unit, grand total
5. Pemakaian material per blok — aggregate per blok
6. Biaya lain-lainnya (Other Expense) — per kategori, list item, subtotal, grand total; pisah global vs project-scoped
7. Lampiran bukti — ref ke FileRef bundle (nota, transfer proof, evidence)

#### 2️⃣ LAPORAN TAHUNAN
**OVERVIEW:**
- Cashflow 12 bulan (tabel + bar chart, per kategori)
- Total keluar tahun ini vs tahun lalu (YoY)
- Outstanding akhir tahun
- Variance tahunan (planned vs actual, sumber overspending)
- Biaya per project (ranking mana project paling mahal)
- Unit selesai vs masih WIP tahun ini

**DETAIL:**
- Per bulan breakdown (12 section ringkas)
- Per project rollup tahunan
- Per blok/aggregate unit tahunan
- Per supplier tahunan
- Top spending categories + trend

#### 3️⃣ LAPORAN PER PROYEK (Lifecycle)
**OVERVIEW:**
- Project header (code, nama, type, total unit, status)
- Total biaya proyek cost-to-date = material + upah + ops
- Biaya per unit (ranking unit mana paling mahal)
- Unit selesai vs WIP + biaya masing-masing
- Outstanding hutang proyek ini
- Variance proyek (planned vs actual)

**DETAIL:**
1. Biaya per unit (lengkap) — material usage + wage + expense + HPP total + status
2. Upah tukang per unit + per blok
3. Pemakaian material per unit + per blok
4. Pembelian material per supplier (scoping proyek)
5. Biaya operasional (scoping proyek + alokasi global yang masuk)
6. WIP / per-unit cost-to-date
7. Timeline pembayaran — kronologi Payment
8. Lampiran — FileRef bundle per project

#### Cross-Cutting Conventions:
- Angka ribuan pakai titik, "Rp", empty row = ""
- Variance unfavorable → tebal/merah; favorable → hijau
- No kop surat di template (hard rule 1)
- Font + layout via pdf-lib (DXA width), konsisten dengan SK/Slip generator

### 25.13 7 Format Dokumen Fisik (Owner's Real Formats)

Owner punya 7 PDF format fisik yang dipakai di lapangan:
1. **Format PO** — kop placeholder, no PO, tanggal, supplier, table material (nama/qty/satuan/harga), subtotal+PPN+total, tanda tangan
2. **RAB Material** — table material per kategori pekerjaan, qty, harga, subtotal
3. **RAB Upah Tukang** — table tukang per pekerjaan, harga per pekerjaan (match WageType.price)
4. **Pengajuan Dana Mingguan** — list item (PO/Wage/Expense) + total + period (= Memo display)
5. **Pengajuan Dana (Front Payment)** — variant untuk bayar DP/tahap awal
6. **Bukti Kas Keluar** — voucher per-recipient + rekening + terbilang + tanda tangan
7. **Contoh Pengajuan Mingguan** — filled real example (test data)

PDF generator sistem baru pakai format fisik ini (overlay via pdf-lib yang udah di stack). BUKAN ketiplek sistem lama — bangun dari nol.

### 25.14 Implementation Plan (Phase A-E)

#### Phase A — Prisma Schema Migration ✅ DONE (commit `3210d8a`)
- ✅ Drop 5 stale models (PO, POLine, SupplierPayment, FundRequest, MaterialStock) + old MaterialUsage (rewrite, name preserved)
- ✅ Add ±14 new models (Finance core: PurchaseOrder/POItem/Nota/Payment/WageType/WagePayment/OtherExpense/Worker/Memo/MemoLine + Material: Category/Material/Stock/StockAdjustment/MaterialUsageItem + Files: FileRef)
- ✅ Modify Project.code → @unique (nullable-safe), Supplier + bankName/bankAccount/bankHolder
- ✅ Add back-relations di Project + Unit (purchaseOrders, wagePayments, otherExpenses, materialUsages)
- ✅ Verified: `npx prisma validate` ✓, `npx prisma format` ✓, `npx prisma generate` ✓, `npx next build` ✓
- ⚠️ 3 file code lama masih reference stale models (inter-agent.ts, weekly-report, database-explorer) — akan di-replace di Phase C
- 📊 Stats: +739 insertions, -504 deletions di `prisma/schema.prisma`

#### Phase B — Import Backup JSON ✅ SCRIPT READY (commit `0a48052`)
Script: `scripts/import-finance-backup.ts` — idempotent, upsert by name/unique
Source: `docs/finance-reference/backup-18072026.json` (2.9MB, 16 keys)
- Project: upsert by name, backfill code per 25.2
- Supplier: upsert by name, map bankName/bankAccount, 11 empty import as null
- Unit: upsert by {projectId, blockNumber} (merge block+unitNumber)
- Material/Category: upsert, fix categoryId="Lainnya" integrity issue
- WageType: upsert {projectId, name}
- PurchaseOrder + POItem: generate poNumber per new format back-computed from PO.date
- WagePayment: snapshot fullTaskBudget from WageType.price, evidenceImage base64 → FileRef placeholder (real upload later)
- OtherExpense: map category, status, paymentCycle
- Worker: auto-seed 9 master from backup (25.9)
- Memo + MemoLine: explode poIds/wageIds/expenseIds into MemoLine rows
- Stock: upsert + StockAdjustment{type:INITIAL} per material
- MaterialUsage + Items: map 110 usages, price = backup snapshot (AVCO frozen), source=WAREHOUSE_DISTRIBUTION
- Skip Drive upload of base64 evidence (separate migration step)
- For PAID items: create Payment record for audit ledger completeness

⚠️  Belum di-run di sandbox z.ai (soalnya sandbox pakai SQLite, schema beda). Owner jalankan di laptop dengan DATABASE_URL ke Aiven prod:
```bash
DATABASE_URL='postgres://avnadmin:[PASSWORD]@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb' \
  npx tsx scripts/import-finance-backup.ts
```

#### Phase C — API Routes ✅ DONE (commit `93b493e`)
Pattern: `src/app/api/*/route.ts`, `export const dynamic = 'force-dynamic'`, `import { db } from '@/lib/db'` (NOT @/lib/prisma), `params Promise<{id}>` (Next16 async params)

NEW LIB (4 files):
- `src/lib/finance/po-number.ts` — generatePoNumber (format PO-{code}-{blockNumber|GDG}-{seq}-{MMYY}, seq per unit per tahun)
- `src/lib/finance/avco.ts` — AVCO compute (updateAvcoOnReceive, getCurrentAvcoPrice, updateAvcoOnUsage)
- `src/lib/finance/status.ts` — recompute cached status dari Payment ledger (recomputePoStatus, recomputeWageStatus, recomputeExpenseStatus, recomputeMemoStatus)
- `src/lib/finance/terbilang.ts` — convert number to Indonesian words

NEW API ROUTES (13 files) under `src/app/api/finance/`:
- `dashboard/route.ts` — KPI + cashflow 6 months + outstanding per-penerima & per-kategori (Layout A per 25.7)
- `po/route.ts` (GET list, POST create with auto-poNumber), `po/[id]/route.ts` (GET, PATCH if not locked, DELETE=void)
- `suppliers/route.ts` (GET, POST), `suppliers/[id]/route.ts` (GET, PATCH, DELETE)
- `wages/route.ts` (GET, POST with fullTaskBudget snapshot from WageType.price per A7), `wages/[id]/route.ts` (GET, PATCH, DELETE=void)
- `expenses/route.ts` (GET, POST), `expenses/[id]/route.ts` (GET, PATCH, DELETE=void)
- `payments/route.ts` (GET, POST — partial per-recipient A11; auto-populate supplierId/workerId + bank from linked entity; recompute status after create)
- `payments/[id]/route.ts` (PATCH=void, no hard delete for audit)
- `memos/route.ts` (GET, POST with auto-memoNumber MBP-{W|D}-{seq}-{MMYY}), `memos/[id]/route.ts` (GET with enriched lines, PATCH, DELETE=void)
- `memos/[id]/pay/route.ts` (POST — pay one recipient's items A11; creates Payment per line + marks PAID + recomputes memo status)
- `material/route.ts` (GET with stock+category, POST with init stock)
- `material/usage/route.ts` (GET, POST with AVCO snapshot + auto-decrement stock + StockAdjustment audit)
- `material/stock/route.ts` (GET with lowStock filter)
- `material/stock/[materialId]/adjust/route.ts` (POST — opname with reason wajib + audit log per C2 SOP)

CLEANUP (replace stale phase-0 code):
- Remove daily-expense, weekly-report, po/[id]/{compile-pdf,documents,pdf}, suppliers/[id]/prices (replaced by new routes)
- Remove po-generator.ts + pdf-generator.ts (replaced)
- Rewrite database-explorer/finance + material routes pakai model baru
- Fix inter-agent.ts (db.pO→db.purchaseOrder, db.materialStock→db.stock)

#### Phase D — Dashboard UI ✅ DONE v1 (commit `dbffa50`)
File: `src/components/dashboard/dashboard.tsx` — added 'finance' | 'material' to activeTab union, added 2 TabButton (Wallet icon Finance, Package icon Material) after Berkas, added conditional renders

NEW Components:
- `src/components/finance/finance-view.tsx` — Layout A per 25.7:
  - 4 KPI tiles (Total Keluar Bln Ini, Outstanding Material, Outstanding Upah, Outstanding Ops)
  - Total Outstanding badge (red gradient, prominent)
  - Cashflow 6 bulan chart (recharts stacked bar — Material/Upah/Ops)
  - 2 outstanding tables side-by-side (Per Penerima + Per Kategori)
  - Action buttons: Buat Memo, Laporan Bulanan, Laporan Tahunan (placeholder)
- `src/components/material/material-view.tsx`:
  - 3 summary tiles (Total Material, Low Stock count, Nilai Stok AVCO)
  - Search + Low-stock filter toggle
  - Material table (name, kategori, stok, min stock, AVCO, nilai, status LOW/OK badge, Aksi Opname)

Phase D v1 limitations (read-only):
- Dashboard Finance: read-only, no form input yet (PO/Wage/Expense/Memo forms akan datang di iterasi berikutnya)
- Material: read-only list + low-stock alert, no opname form yet
- Laporan Bulanan/Tahunan buttons: placeholder, PDF generation deferred

Modal pattern: side-by-side (formbox left, picker right — hard rule 5). Rupiah formatting via existing helper. Dark-theme modal override (text-slate-900 + colorScheme:light).

DEFERRED to next iteration:
- src/components/finance/po-form.tsx (multi-item PO + directUse checkbox)
- src/components/finance/memo-form.tsx (select-all/filter/search)
- src/components/finance/payment-modal.tsx (per-recipient partial pay + bank override + transfer-proof upload)
- src/components/finance/wage-form.tsx
- src/components/finance/expense-form.tsx
- Material opname modal

#### Phase E — PDF Generation ✅ DONE v1 (commit `d87c7d0`)
Reuse existing libs (all already installed): pdf-lib@1.17.1, docx@9.7.1 (WidthType.DXA), docxtemplater+pizzip, mammoth, jspdf. NO exceljs → reports PDF only (Excel YAGNI v1).

NEW LIB (2 files):
- `src/lib/finance/pdf/po-pdf.ts` — generatePoPDF (pdf-lib, A4 portrait)
  Layout: kop placeholder + no PO + tanggal + supplier info + table material (No/Nama/Qty/Satuan/Harga/Subtotal) + total row + terbilang + notes + tanda tangan
- `src/lib/finance/pdf/bukti-kas-keluar.ts` — generateBuktiKasKeluarPDF
  Layout: kop + no voucher + tanggal + penerima info + bank info + description + amount (highlighted) + terbilang + notes + tanda tangan

NEW API ROUTES (2 files):
- `GET /api/finance/po/[id]/pdf` — generate PO PDF
- `GET /api/finance/payments/[id]/bukti-kas-keluar` — generate Bukti Kas Keluar PDF for a Payment

DEFERRED to next iteration:
- Laporan Bulanan/Tahunan/Per-Proyek PDF (advanced reports, see 25.12)
- Pengajuan Mingguan PDF (Memo display, see 25.13 no.5)
- Bundle arsip PDF per-entity + monthly (see 25.4 A12)
- Overlay pakai format fisik owner (currently pakai simple layout)

#### Ship ✅ READY (commit per phase udah push ke origin/main)
- Worktree ga dipakai (kerja langsung di main, push per phase)
- Commit per phase udah push: Phase A `3210d8a`, Phase B `0a48052`, Phase C `93b493e`, Phase D `dbffa50`, Phase E `d87c7d0`
- `npx next build` pass setelah tiap phase
- ⚠️ Belum deploy ke Vercel (owner hold sampai Phase B di-run di laptop + test pass)

### 25.15 Keep Untouched (Terkonek ke Berkas)

JANGAN hapus/diubah:
- ✅ Pipeline Konsumen (tab) — terkonek ke Berkas via `customer.stage`
- ✅ Site Plan (tab) — terkonek ke Unit
- ✅ Customer models — `Unit.customerId` + `GoogleDoc.customerId` FK langsung ke Customer
- ✅ Berkas tab (terkonek Customer via CustomerFolder, AddCustomerModal, customer.stage buat hitung status berkas)

### 25.16 Critical Files untuk Finance Module

- `prisma/schema.prisma` — drop 5 stale + rewrite MaterialUsage + add 14 + modify Project/Unit/Supplier
- `scripts/import-finance-backup.ts` — new
- `src/components/dashboard/dashboard.tsx` — add finance+material tabs
- `src/components/finance/*` + `src/components/material/*` — new UI
- `src/app/api/finance/**/*.ts` — new routes
- `src/lib/finance/**` — po-number, avco, status, reports, pdf, terbilang
- `.env` — owner confirms DATABASE_URL (currently stale SQLite path, prod = Aiven Postgres)

### 25.17 Pending (Defer ke Next Iteration)

- RAB format integration (owner akan kasih format besok)
- Project budgetedCost (pakai RAB sebagai source)
- Multi-user + login (v1 single-user)
- WhatsApp bot RINA (dashboard only dulu)
- Pengajuan material dari lapangan via WA (mandor request)
- 9router integration (paused, butuh VPS)
- AI generate laporan keuangan route fix (workaround: Formbox Manual)
- HF Token revoke (security cleanup — owner MUST revoke di https://huggingface.co/settings/tokens karena token bocor di chat sebelumnya, jangan tulis token-nya di repo)

### 25.18 Recall Triggers (Tambah ke Section 24.9)

**RECALL section 25 ini kalau owner bertanya tentang:**
- "PO format", "PO/A16/A12", "PO number", "GDG"
- "Direct use", "directUse flag", "kamar mandi langsung pakai"
- "AVCO", "snapshot harga", "modal per unit"
- "Hammer pay", "partial pay", "per-recipient"
- "Stock opname", "StockAdjustment", "audit log stock"
- "Memo line", "carry over", "skipped item"
- "Variance", "planned vs actual", "favorable/unfavorable"
- "WIP", "cost-to-date", "committed cost"
- "FileRef", "bundle arsip", "bundle bulanan"
- "Worker bank", "tukang rekening beda tiap minggu"
- "Project code", "A16", "PM", "TK", "KA", "RP", "A01", "RS", "RPK"
- "Laporan bulanan", "Laporan tahunan", "Laporan per proyek"
- "7 PDF format", "format PO fisik", "bukti kas keluar"
- "Dashboard layout A", "KPI tiles", "outstanding hutang"
- "Finance module plan", "Phase A-E"

**RECALL caranya:** Baca section 25 ini dari PRD.md → ikutin semua keputusan yang udah di-lock → jangan nekat bikin keputusan baru tanpa konfirmasi owner.

---

## 26. AI AGENTS — TELEGRAM BOT PLAN (21 Juli 2026)

> **Decision**: RINA + DINA pakai **Telegram bot** dulu (bukan WhatsApp). WA plan disimpan untuk future iteration kalau sudah ada VPS Hostinger.
> **Reasoning**: Telegram gratis, no SIM card, webhook jalan di Vercel (no VPS needed), support multi-bot, official Bot API.

### 26.1 Why Telegram (vs WhatsApp)

| Aspect | Telegram Bot | WhatsApp (Baileys) |
|--------|--------------|---------------------|
| **Hosting** | Vercel webhook (gratis) | VPS Hostinger (Rp 600K/tahun) |
| **Phone/SIM** | ❌ Tidak perlu | ✅ 1 SIM per bot |
| **Official API** | ✅ Bot API documented | ❌ Unofficial (Baileys) |
| **IP Block** | ❌ Tidak ada | ⚠️ WA block IP datacenter |
| **Multi-bot** | ✅ 1 token per bot | ✅ 1 nomor per bot |
| **File upload** | ✅ 20MB free | ✅ |
| **Menu/Command** | ✅ Inline keyboard + commands | ✅ Text commands |
| **Cost** | Rp 0 | Rp 600K/tahun + SIM |
| **Setup time** | 30 menit | 2-3 jam + setup VPS |

### 26.2 RINA Bot — Finance AI (Telegram)

**Bot username**: `@HadiKayaRinaBot` (akan didaftarkan via @BotFather)

**Capabilities**:
1. **Command-based** (structured, cepat):
   - `/start` — menu utama (inline keyboard)
   - `/outstanding` — list hutang belum dibayar (per penerima/kategori)
   - `/memo` — draft Memo mingguan (pilih items via inline button)
   - `/po <projectCode>` — list PO per project
   - `/cost <blockNumber>` — biaya unit (e.g., `/cost A12`)
   - `/project <code>` — cost-to-date per project (e.g., `/project A16`)
   - `/stock` — low-stock alert
   - `/cashflow [bulan]` — cashflow summary
   - `/memo pay <memoId>` — mark Memo items PAID (partial per-recipient)
2. **Menu buttons** (inline keyboard):
   ```
   📊 Dashboard | 💰 Outstanding
   📝 Buat Memo | 🏗️ Cost per Project
   📦 Stock Alert | 📈 Laporan
   ```
3. **File upload**:
   - Upload foto → auto-save ke Google Drive (evidence/nota)
   - Upload PDF nota → link ke PO
4. **Free text fallback** (GLM-4.6):
   - "RINA, berapa total ke Toko Acil bulan ini?" → query DB → jawab
   - "RINA, bikin memo mingguan untuk PO UNPAID + wage Heri" → draft Memo

**LLM**: GLM-4.6 via z-ai-web-dev-sdk (existing llm-router.ts, hard rule 10)

### 26.3 DINA Bot — Document AI (Telegram)

**Bot username**: `@HadiKayaDinaBot`

**Capabilities**:
1. **Command-based**:
   - `/start` — menu utama
   - `/berkas <customerId>` — list berkas konsumen
   - `/generate sk <templateId>` — generate SK Kerja + Slip Gaji
   - `/generate laporan <templateId>` — generate Laporan Keuangan
   - `/status <customerId>` — status berkas konsumen
2. **Menu buttons**:
   ```
   📁 List Konsumen | 📄 Generate SK+Slip
   💼 Generate Laporan | 🔍 Cari Berkas
   ```
3. **File upload**: scan KTP/sertifikat → OCR → auto-fill form
4. **Free text**: "DINA, buat SK Kerja untuk Budi Santoso" → AI parse → generate

### 26.4 Marketing AI — Free Chat (Telegram, future)

10 Marketing AI bots (Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko):
- **Free chat** (no command, natural conversation)
- Setiap bot: 1 Telegram token, 1 persona
- Target: chat dengan prospek KPR di grup Telegram atau DM
- Pakai BaseAgent + memory layer + knowledge retrieval yang udah z.ai built

### 26.5 Telegram Bot Architecture

```
┌─────────────────┐     webhook      ┌──────────────────────────┐
│ Telegram Server │ ───────────────→ │ /api/telegram/[bot]/webhook │
│  (api.tg)       │                  │  (Vercel route)            │
└─────────────────┘                  └──────────────────────────┘
                                                ↓
                                      ┌──────────────────┐
                                      │ Bot Handler      │
                                      │ - parse command  │
                                      │ - call tool      │
                                      │ - LLM fallback   │
                                      └──────────────────┘
                                                ↓
                                      ┌──────────────────┐
                                      │ Tools (RINA)     │
                                      │ - query PO       │
                                      │ - draft Memo     │
                                      │ - recompute Debt │
                                      │ - generate PDF   │
                                      └──────────────────┘
```

### 26.6 Implementation Plan (Telegram)

**Phase F.1 — Setup (1 jam)**:
- Daftar bot via @BotFather di Telegram (dapat token untuk RINA + DINA)
- Set env vars di Vercel: `TELEGRAM_RINA_TOKEN`, `TELEGRAM_DINA_TOKEN`
- Set webhook: `POST https://api.telegram.org/bot<token>/setWebhook?url=https://hadi-kaya-virtual-office.vercel.app/api/telegram/rina/webhook`

**Phase F.2 — Bot Handler (2 jam)**:
- `src/lib/telegram/bot-handler.ts` — shared handler (command parser + LLM fallback)
- `src/lib/telegram/rina-tools.ts` — RINA tools (query finance data, draft memo)
- `src/lib/telegram/dina-tools.ts` — DINA tools (generate berkas, query customer)
- `src/app/api/telegram/[bot]/webhook/route.ts` — webhook receiver

**Phase F.3 — Commands + Menu (2 jam)**:
- Implement commands per 26.2 (RINA) + 26.3 (DINA)
- Inline keyboard menu
- File upload handler → save to Google Drive

**Phase F.4 — LLM Fallback (1 jam)**:
- Free text → GLM-4.6 → parse intent → call tool → response
- Reuse BaseAgent + memory layer

**Phase F.5 — Testing (1 jam)**:
- Test commands via Telegram app
- Test file upload
- Test LLM free chat

### 26.7 WhatsApp Bot Plan (DEFERRED — Save for Future)

**Trigger untuk resume WA**:
- VPS Hostinger sudah dibeli (Rp 600K/tahun)
- 1 SIM card untuk DINA sudah siap (6287761323344)
- Telegram RINA proven + owner eksplisit mau WA juga

**Yang sudah ready** (code di repo):
- `wa-bot/` folder (Baileys v6.7, multi-agent config-driven)
- `mini-services/wa-bridge/` (Bun-based bridge)
- 14 AI Agents persona di DB (DINA, RINA, MITRA, RATNA, 10 Marketing)
- Behavior rules di PRD section 8 (group tag, DM rules, work hours)

**Yang belum**:
- Beli VPS Hostinger via bank transfer
- Setup Docker + n8n + WA bot di VPS
- Setup Cloudflare Tunnel untuk HTTPS (free)
- Test WA end-to-end (1 nomor DINA dulu)
- Extend ke RINA, MITRA, RATNA, 10 Marketing (bertahap)

### 26.8 LLM Provider untuk Bots

- **RINA + DINA**: GLM-4.6 via z-ai-web-dev-sdk (free, hardcoded config per hard rule 10)
- **Marketing AI** (future): multi-provider via 9router kalau sudah deploy di VPS, atau OpenRouter fallback
- **Fallback**: kalau GLM-4.6 rate limit, fallback ke Gemini 2.5 Pro direct (1500 RPM free)

### 26.9 Security Notes

- Telegram bot token = secret, simpan di Vercel env vars (jangan commit ke repo)
- Webhook verify `X-Telegram-Bot-Api-Secret-Token` header (optional, tapi recommended)
- Owner chat ID whitelist (biar bot ga respon ke orang lain)
- File upload: scan MIME type, limit 20MB, save to Drive folder `/Telegram/{bot}/{date}/`

### 26.10 Recall Triggers (Telegram)

**RECALL section 26 kalau owner bertanya tentang:**
- "Telegram", "Bot Telegram", "RINA bot", "DINA bot"
- "BotFather", "Telegram token", "webhook Telegram"
- "Inline keyboard", "Telegram command", "/memo", "/outstanding"
- "Marketing AI bot", "10 Marketing AI"
- "WhatsApp bot" (recall 26.7 untuk deferred WA plan)

---

## 27. VERCEL-ONLY SETUP — No Local Command Line Needed (22 Juli 2026)

> Owner pusing dengan Windows PowerShell setup (env var syntax beda dari Linux bash).
> Solution: Vercel-only approach — schema + data import langsung dari sandbox z.ai, owner tinggal push ke GitHub.

### 27.1 What Was Done (from sandbox z.ai)

1. **Schema pushed to Aiven** — `npx prisma db push --accept-data-loss` di-run dari sandbox dengan `DATABASE_URL=Aiven`. Semua 14 model baru (Phase A) udah ada di Aiven DB.

2. **Backup JSON imported to Aiven** — `npx tsx scripts/import-finance-backup.ts` di-run dari sandbox. Data yang ter-import:
   - 8 Projects (dengan code A16/PM/TK/KA/RP/A01/RS/RPK)
   - 21 Units (blockNumber composite: E1, D8, RumahPojok, dll)
   - 20 Suppliers (dengan bank fields)
   - 15 Categories
   - 163 Materials + 163 Stocks + 163 StockAdjustments (INITIAL)
   - 24 WageTypes
   - 9 Workers (Heri, Wasku, Remy, Arif, Damar, Gellent, Koni, Parto, Yayat)
   - 120 PurchaseOrders + 500 POItems + ~50 Payments (PAID POs)
   - 58 WagePayments + ~30 Payments (PAID wages)
   - 94 OtherExpenses + ~50 Payments (PAID expenses)
   - 44 Memos + 279 MemoLines
   - 110 MaterialUsages + 230 MaterialUsageItems (AVCO snapshot frozen)

3. **API route `/api/admin/import-backup`** — untuk re-import dari browser (idempotent, upsert by name). Owner bisa hit URL kalau perlu re-import.

4. **Shared lib `src/lib/finance/import-backup.ts`** — extract import logic, dipakai oleh both CLI script + API route.

### 27.2 Owner Flow (Simplified)

**Cukup 2 langkah:**

1. **Push ke GitHub** (atau aku push dari sandbox):
   ```bash
   git pull origin main  # di laptop, untuk dapat code terbaru
   ```
   Vercel auto-deploy dalam 2 menit.

2. **Buka dashboard**:
   - https://hadi-kaya-virtual-office.vercel.app
   - Login → klik tab **Finance** → dashboard muncul dengan KPI + cashflow + outstanding
   - Klik tab **Material** → list 163 material + stok + low-stock alert

**Tidak perlu**:
- ❌ `npx prisma db push` lokal (schema udah di-push ke Aiven dari sandbox)
- ❌ `npx tsx scripts/import-finance-backup.ts` lokal (data udah di-import ke Aiven dari sandbox)
- ❌ Edit `.env` lokal (DATABASE_URL hanya perlu di Vercel env vars, udah ada)
- ❌ `npm run dev` lokal (langsung pakai Vercel production)

### 27.3 API Route for Re-Import (Optional)

Kalau perlu re-import data (e.g., kalau ada data baru di backup JSON):

1. Set env var di Vercel: `ADMIN_SECRET` = "pilih-secret-anda" (Settings → Environment Variables)
2. Hit URL (POST atau GET):
   ```
   GET  https://hadi-kaya-virtual-office.vercel.app/api/admin/import-backup?secret=XXX
   → cek status import (sudah/belum)

   POST https://hadi-kaya-virtual-office.vercel.app/api/admin/import-backup?secret=XXX
   → run import (idempotent, upsert by name)
   ```
3. Response JSON dengan stats (imported/skipped/errors per section)

**Note**: API route `maxDuration = 300` (5 menit). Butuh Vercel Pro plan. Kalau Hobby (60s), import mungkin timeout — pakai CLI approach instead.

### 27.4 Windows PowerShell Fallback (Kalau Perlu Run Lokal)

Kalau Vercel import timeout atau ada masalah, owner bisa run lokal:

**Option A — Edit `.env` file (paling gampang)**:
1. Bikin file `.env` di root project (sudah di .gitignore, aman)
2. Isi:
   ```
   DATABASE_URL="postgres://avnadmin:PASSWORD@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb?sslmode=require"
   ```
3. Run:
   ```powershell
   npx prisma db push
   npx tsx scripts/import-finance-backup.ts
   npm run dev
   ```

**Option B — PowerShell env var (temporary, per session)**:
```powershell
$env:DATABASE_URL = "postgres://avnadmin:PASSWORD@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb?sslmode=require"
npx prisma db push
npx tsx scripts/import-finance-backup.ts
npm run dev
```

**⚠️ JANGAN pakai syntax Linux bash** `DATABASE_URL=value command` — itu ga jalan di PowerShell!

### 27.5 Current State (22 Juli 2026)

- ✅ Schema Phase A udah di Aiven DB (14 model baru)
- ✅ Data import udah jalan dari sandbox (120 PO, 58 wage, 94 expense, 163 material, dll)
- ✅ API routes Phase C udah deploy ke Vercel (auto-deploy dari GitHub)
- ✅ Dashboard UI Phase D udah deploy (Finance + Material tabs)
- ✅ PDF generation Phase E udah deploy (PO PDF + Bukti Kas Keluar)
- ⏳ Vercel deploy terbaru: tunggu push terakhir (lib import-backup + API route admin/import-backup)

### 27.6 What's Next (Owner Decision)

Setelah Vercel deploy selesai + owner verify dashboard Finance+Material jalan:

1. **Form input UI** (Phase D v2) — PO form, Wage form, Expense form, Memo form, Payment modal, Stock opname modal. Saat ini dashboard read-only.
2. **Telegram Bot** (Phase F) — RINA + DINA bot via Telegram (PRD section 26)
3. **Laporan PDF** (Phase E v2) — Bulanan/Tahunan/Per-Proyek + bundle arsip
4. **RAB integration** — tunggu owner kirim format RAB
5. **Multi-user** — v2, tunggu kebutuhan

---

## 28. ITERASI 2 — UI Fix + Form Input + RAB + Laporan + Telegram (23 Juli 2026)

> Iterasi kedua setelah Vercel-only setup. Owner request: fix UI dark theme + form input UI + RAB integration + Laporan PDF + Telegram bot.

### 28.1 UI Dark Theme Fix

**Masalah**: App default DARK theme, tapi komponen Finance/Material pakai text-slate-800 (dark text) di bg white → font ga keliatan.

**Fix**: Rewrite finance-view.tsx + material-view.tsx dengan:
- Cards: `bg-slate-900/50 border-slate-800`
- Text: `text-slate-100/300/400` (light text di dark bg)
- KPI tiles: `bg-{color}-950/40 border-{color}-800/50` (subtle, ga blinding)
- Badges: `bg-{color}-900/60 text-{color}-200 border-{color}-700`
- Recharts tooltip: `bg-slate-900 border-slate-700 text-slate-200`
- Inputs: `bg-slate-800 border-slate-700 text-slate-100`

### 28.2 Form Input UI (Phase D v2)

5 modal components baru:

1. **po-form.tsx** — Buat PO Baru
   - Multi-item PO dengan directUse checkbox per item (kamar mandi/carpot/pipa → skip stok)
   - Supplier/Project/Unit/Date picker
   - Format ribuan untuk qty + price (titik setiap 3 angka)
   - Planned total auto-calc
   - Auto-generate poNumber di API (format PO-{code}-{blockNumber|GDG}-{seq}-{MMYY})

2. **memo-form.tsx** — Buat Memo Pengajuan
   - Fetch UNPAID POs + Wages + Expenses (auto-load dari API)
   - Search filter
   - Select-all / Clear buttons (fix bottleneck lama: re-pick manual tiap minggu)
   - Total auto-calc
   - Tipe W (mingguan) / D (harian)
   - Auto-generate memoNumber di API (MBP-{W|D}-{seq}-{MMYY})

3. **payment-modal.tsx** — Bayar (partial per-recipient, A11)
   - Trigger dari "Bayar" button di Outstanding per Penerima
   - Amount bisa partial (kurang dari outstanding)
   - Method: TRANSFER / CASH / GIRO
   - Bank override (snapshot per payment — tukang rekening beda tiap minggu)
   - Date picker
   - Auto-populate bank dari supplier/worker master
   - Recompute status setelah payment (PO/Wage/Expense → PAID/PARTIAL_PAID/UNPAID)

4. **material-form.tsx** — Material Baru
   - Nama, kategori (dari existing), satuan, minStock, lastPrice
   - Auto-create Stock record + StockAdjustment INITIAL

5. **opname-modal.tsx** — Stok Opname
   - 2 mode: SET (stok baru) atau DELTA (tambah/kurang)
   - Reason WAJIB (audit log per C2 SOP)
   - Auto-compute prevQty + newQty
   - Insert StockAdjustment record (type: OPNAME)

### 28.3 RAB Integration (Phase D — RAB)

**Source**: `docs/finance-reference/04-rab-material.pdf` + `06-rab-upah-tukang.pdf`

**Script**: `scripts/seed-rab-anjayo-16.ts` (idempotent, run ke Aiven)

**RAB Upah Tukang** (13 pekerjaan standard Anjayo 16, total Rp 21M per rumah):
1. Pondasi + Cor Sloof + Pasang Bata 3 keping — Rp 1.2M
2. Subsitank (Gali Lobang+Cor), Pipa Subsitank & Urukan — Rp 800K
3. Pasang Bata + Tebeng Layar. Cor Ring Balok, Cor Kolom, Pas kusen, Roster, Dak — Rp 4.5M
4. Rangka Atap + Penutup Atap + NOK + List Plank — Rp 1.5M
5. Plester Keliling + Instalasi Pipa Listrik + Openingan & Finishing + Finishing Dak — Rp 4M
6. Instalasi 11 Titik (Termasuk pasang mangkok listrik + Pemasangan saklar) — Rp 350K
7. Pemasangan Plafon — Rp 1.1M
8. Pasang Keramik Lantai + Plint + Pas Keramik lantai kamar mandi + dinding — Rp 1.9M
9. Pasang Pintu kunci & daun pintu — Rp 350K
10. Pembuatan Meja Dapur dan rabat Belakang, Pembatas Belakang, Carpot — Rp 1M
11. Pengecatan — Rp 1M
12. Serah Terima kunci + Pembersihan awal & akhir 15% — Rp 2.1M
13. Retensi — Rp 1.2M

**RAB Material** (26 lines, total Rp 52.8M per rumah):
- Pondasi: Besi 10/8/6, Paku 2/3, Semen 7 zak, Benang, Batu Cor, Bata 3200 keping
- Pemasangan Bata: Semen 25 zak, Pasir 3 mobil, Bata 8000 keping
- Subsitank: Pipa Subsitank 4 btg, Semen 5 zak
- Plafon: Gypsum 30 lembar, Holo 2x4 20 btg
- Atap: Rangka Atap, Genteng 30 m2
- Keramik: Keramik 40x40 60 m2, Keramik Dinding 30 m2
- Listrik: Kabel 1x1.5 100m, Saklar+Stop 11 set
- Pintu: Pintu Depan, Pintu Kamar 2 bh
- Pengecatan: Cat Tembok 6 galon
- Pipa Air: Pipa 3/4 20 btg

**Material.minStock benchmark** (updated di Aiven):
- Semen: 60 (59-63 zak per rumah)
- Bata: 3000
- Pasir: 5
- Batu Cor: 1
- Gypsum: 20

### 28.4 Laporan Bulanan PDF (Phase E v2)

**Lib**: `src/lib/finance/pdf/report-monthly.ts` — `generateMonthlyReportPDF`

**Layout** (per PRD 25.12):
- Kop placeholder (no kop surat per hard rule 1)
- Judul: LAPORAN KEUANGAN BULANAN + periode + project
- Ringkasan KPI (6 baris): Total Material, Upah, Ops, TOTAL, Outstanding Awal, Outstanding Akhir
- Detail Section 1: Pembelian Material per Supplier (variance planned vs actual, red/green)
- Detail Section 2: Pembayaran Upah per Unit (worker, pekerjaan, amount, budget, % progress)
- Detail Section 3: Upah per Blok (aggregate)
- Detail Section 4: Pemakaian Material per Unit (qty, AVCO price, subtotal, source)
- Detail Section 5: Biaya Lain-lain (kategori, penerima, amount)
- Tanda tangan pemilik

**API**: `GET /api/finance/reports/[type]?month=YYYY-MM&projectId=XXX`
- type: `monthly` (DONE) | `annual` (placeholder) | `project` (placeholder)
- Output: PDF inline (Content-Disposition: inline)

**Trigger**: Finance dashboard → "Laporan Bulanan" button → window.open API endpoint

### 28.5 Telegram Bot (Phase F)

**Lib**: `src/lib/telegram/bot-handler.ts` — shared handler untuk RINA + DINA

**API**: `POST /api/telegram/[bot]/webhook` — Vercel webhook receiver (no VPS needed)

**Bot Config** (env vars di Vercel):
- `TELEGRAM_RINA_TOKEN` — token dari @BotFather untuk @HadiKayaRinaBot
- `TELEGRAM_DINA_TOKEN` — token dari @BotFather untuk @HadiKayaDinaBot
- `TELEGRAM_OWNER_CHAT_ID` — chat ID owner (whitelist, per PRD 26.9 security)

**RINA Commands** (per PRD 26.2):
- `/start` — menu utama (inline keyboard)
- `/outstanding` — hutang belum dibayar (per penerima + per kategori)
- `/cashflow` — cashflow 6 bulan terakhir
- `/stock` — low stock alert
- `/cost A12` — biaya unit A12
- `/project A16` — biaya project Anjayo 16
- `/memo` — info buat memo (deferred — too complex for Telegram)
- `/help` — daftar command

**DINA Commands** (per PRD 26.3):
- `/start` — menu utama
- `/konsumen` — list konsumen (20 terbaru)
- `/berkas` — info generate berkas (deferred)
- `/help` — daftar command

**Inline Keyboard Menu**:
- RINA: Outstanding Hutang | Cashflow | Low Stock Alert | Help
- DINA: List Konsumen | Info Berkas

**File Upload**: Foto/document upload → "diterima, upload ke Drive future" (placeholder)

**Setup** (owner flow):
1. Buka Telegram → cari @BotFather
2. `/newbot` → bikin @HadiKayaRinaBot + @HadiKayaDinaBot
3. Dapat token masing-masing
4. Set env vars di Vercel: TELEGRAM_RINA_TOKEN, TELEGRAM_DINA_TOKEN, TELEGRAM_OWNER_CHAT_ID
5. Get chat ID owner: chat ke @userinfobot, dapatkan chat ID
6. Set webhook: `GET /api/telegram/rina/webhook?action=setup` (dan untuk dina)
7. Test: chat bot di Telegram → `/start`

### 28.6 Status Iterasi 2 — ALL DONE ✅

Iterasi 2 selesai 23 Juli 2026. Semua task dikerjakan, tested (build pass), dan push ke `origin/main`. Owner tinggal pull + tunggu Vercel auto-deploy + test.

| # | Task | Status | Commit | Files |
|---|------|--------|--------|-------|
| 1 | UI Dark Theme Fix | ✅ DONE | `3eeb883` | finance-view.tsx, material-view.tsx rewrite |
| 2 | PO Form Modal | ✅ DONE | `3eeb883` | po-form.tsx (multi-item + directUse) |
| 3 | Memo Form Modal | ✅ DONE | `3eeb883` | memo-form.tsx (select-all/search) |
| 4 | Payment Modal | ✅ DONE | `3eeb883` | payment-modal.tsx (partial per-recipient) |
| 5 | Material Form Modal | ✅ DONE | `3eeb883` | material-form.tsx |
| 6 | Opname Modal | ✅ DONE | `3eeb883` | opname-modal.tsx (SET/DELTA + reason wajib) |
| 7 | RAB Integration (Anjayo 16) | ✅ DONE | `21abeb0` | seed-rab-anjayo-16.ts (13 WageTypes + 26 RABLines) |
| 8 | Laporan Bulanan PDF | ✅ DONE | `21abeb0` | report-monthly.ts + reports/[type]/route.ts |
| 9 | Telegram Bot (RINA + DINA) | ✅ DONE | `694a056` | bot-handler.ts + telegram/[bot]/webhook/route.ts |
| 10 | PRD Section 28 | ✅ DONE | `694a056` | this section |

**Verification**:
- `npx tsc --noEmit`: ✓ (0 errors di semua file baru)
- `npx next build`: ✓ Compiled successfully
- Schema Aiven: ✓ (Phase A applied)
- Data Aiven: ✓ (120 PO + 58 wage + 94 expense + 163 material + 13 WageTypes + 26 RABLines + 9 Workers + 44 Memos + 110 Usages)

**Owner Action Required** (setelah Vercel deploy):
1. Buka https://hadi-kaya-virtual-office.vercel.app → login
2. Test tab Finance: UI dark theme, KPI tiles, cashflow chart, outstanding tables
3. Test "Buat PO Baru" modal (pilih supplier/project/items, save)
4. Test "Buat Memo Pengajuan" modal (pilih UNPAID items, save)
5. Test "Bayar" button (payment modal, partial per-recipient)
6. Test "Laporan Bulanan" button (PDF download di tab baru)
7. Test tab Material: list 163 material, low-stock filter, "Material Baru" + "Opname" buttons
8. Setup Telegram bot (opsional, lihat 28.5 step-by-step)

### 28.7 Pending → Moved to Section 29 (Iterasi 3 Plan)

Lihat section 29 untuk plan iterasi 3 yang lebih detail (urutan task, estimasi, priority).

---

## 29. ITERASI 3 PLAN — Next Steps (23 Juli 2026)

> Plan untuk iterasi 3. Owner review → pilih mau mulai dari mana → aku kerjakan sesuai priority.
> Estimasi waktu: 11-16 jam kerja aku (bisa di-batch per task).

### 29.1 Priority Order + Estimasi

| # | Task | Priority | Estimasi | Dependency | Value |
|---|------|----------|----------|------------|-------|
| 1 | Polish Finance UI | HIGH | 1-2 jam | — | Owner bisa browse 122 PO + filter by project/supplier/status/search |
| 2 | Laporan Tahunan PDF | HIGH | 2-3 jam | Laporan Bulanan (DONE) | Owner bisa lihat annual report untuk tax + audit |
| 3 | Laporan Per-Proyek PDF | HIGH | 2-3 jam | — | Owner bisa compare cost per project (mana paling mahal/profitable) |
| 4 | Bundle Arsip PDF | MEDIUM | 2-3 jam | FileRef (DONE) | 1 PO + notas + transfer proof → 1 PDF arsip |
| 5 | Telegram LLM Free Text | MEDIUM | 2-3 jam | Telegram Bot (DONE) | Owner chat natural "RINA, berapa total ke Toko Acil?" → AI jawab |
| 6 | Telegram File Upload → Drive | MEDIUM | 2-3 jam | Telegram Bot (DONE) + Google Drive (DONE) | Foto evidence/nota auto-save ke Drive via bot |
| 7 | WhatsApp Bot | LOW | 5-10 jam | VPS Hostinger (BELUM ADA) | Deferred sampai VPS ready |
| 8 | Multi-user + Login | LOW | 5-10 jam | — | v2, kalau ada staff lain input |
| 9 | 9router integration | LOW | 3-5 jam | VPS Hostinger | Deferred, paused |
| 10 | RAB vs Actual comparison | LOW | 2-3 jam | RAB (DONE) | Compare realisasi vs RAB per item pekerjaan |

### 29.2 Detail Per Task

#### Task 1: Polish Finance UI (HIGH — quick win)

**Masalah**: Owner import 122 PO, tapi dashboard Finance cuma show KPI + chart + outstanding. Ga ada list PO yang bisa di-browse/filter.

**Yang akan dikerjakan**:
- Tambah tab "List PO" di Finance (sub-tab: Dashboard | PO List | Wages | Expenses | Memos)
- PO List: table dengan filter (project, supplier, status, search by poNumber)
- Sorting (by date, amount, status)
- Pagination (10-20 per page)
- Click row → detail modal (PO items, payments, notas)
- Download PO PDF button per row
- Same pattern untuk Wages, Expenses, Memos list

**Files**:
- `src/components/finance/po-list.tsx` (new)
- `src/components/finance/wage-list.tsx` (new)
- `src/components/finance/expense-list.tsx` (new)
- `src/components/finance/memo-list.tsx` (new)
- Update `finance-view.tsx` dengan sub-tab navigation

**Estimasi**: 1-2 jam

#### Task 2: Laporan Tahunan PDF (HIGH)

**Yang akan dikerjakan**:
- `src/lib/finance/pdf/report-annual.ts` — generateAnnualReportPDF
- Layout: 12 bulan breakdown (cashflow table + bar chart) + per project rollup + per supplier rollup + top spending categories
- API: `GET /api/finance/reports/annual?year=2026` (sudah ada placeholder)
- Button "Laporan Tahunan" di Finance dashboard → window.open API

**Estimasi**: 2-3 jam

#### Task 3: Laporan Per-Proyek PDF (HIGH)

**Yang akan dikerjakan**:
- `src/lib/finance/pdf/report-project.ts` — generateProjectReportPDF
- Layout: project header + total cost-to-date + biaya per unit (ranking) + unit selesai vs WIP + outstanding hutang project + variance + timeline pembayaran
- API: `GET /api/finance/reports/project?projectId=XXX` (sudah ada placeholder)
- Tambah button "Laporan Per-Proyek" di Finance dashboard → modal pilih project → download PDF

**Estimasi**: 2-3 jam

#### Task 4: Bundle Arsip PDF (MEDIUM)

**Yang akan dikerjakan**:
- `src/lib/finance/pdf/bundle.ts` — bundleEntityPDF + bundleMonthlyPDF
- Per-entity: merge PO doc + notas + transfer proofs → 1 PDF (pakai pdf-lib copyPages)
- Monthly: semua money-out bulan itu → 1 PDF lengkap
- API: `GET /api/finance/po/[id]/bundle` + `GET /api/finance/reports/bundle-monthly?month=YYYY-MM`
- Per PRD 25.4 A12: bundle SEMUA money-out (PO + Wage + Expense)

**Estimasi**: 2-3 jam

#### Task 5: Telegram LLM Free Text (MEDIUM)

**Yang akan dikerjakan**:
- Update `src/lib/telegram/bot-handler.ts` — tambah LLM fallback
- Pakai z-ai-web-dev-sdk (GLM-4.6, hard rule 10)
- Flow: command tidak dikenali → kirim ke LLM dengan context (finance data summary) → LLM jawab natural
- Contoh: "RINA, berapa total ke Toko Acil bulan ini?" → LLM parse intent → query DB → jawab "Total ke Toko Acil bulan Juli 2026: Rp 5.2jt dari 3 PO"
- System prompt: RINA persona + finance tools list + DB schema summary

**Estimasi**: 2-3 jam

#### Task 6: Telegram File Upload → Drive (MEDIUM)

**Yang akan dikerjakan**:
- Update `src/lib/telegram/bot-handler.ts` — handle document/photo message
- Download file dari Telegram (getFile API)
- Upload ke Google Drive (reuse existing Google OAuth + Drive helper)
- Save ke folder `/Telegram/{bot}/{date}/{filename}`
- Create FileRef record (kind: WAGE_EVIDENCE | NOTA | TRANSFER_PROOF)
- Reply ke user: "✅ File tersimpan: [Drive URL]"

**Estimasi**: 2-3 jam

### 29.3 Status Iterasi 3 — ALL DONE ✅ (23 Juli 2026)

Owner pilih "langsung lanjutkan semuanya" → semua 6 task dikerjakan, tested, push ke `origin/main`.

| # | Task | Status | Commit | Files |
|---|------|--------|--------|-------|
| 1 | Polish Finance UI | ✅ DONE | `761dc0f` | po-list.tsx, wage-list.tsx, expense-list.tsx, memo-list.tsx, finance-view.tsx (sub-tab nav) |
| 2 | Laporan Tahunan PDF | ✅ DONE | `95bb9f6` | report-annual.ts + reports/[type]/route.ts (annual implemented) |
| 3 | Laporan Per-Proyek PDF | ✅ DONE | `95bb9f6` | report-project.ts + reports/[type]/route.ts (project implemented) |
| 4 | Bundle Arsip PDF | ✅ DONE | `dbf7667` | bundle.ts (bundlePoPDF + bundleMonthlyPDF) + po/[id]/bundle/route.ts + reports/bundle-monthly/route.ts |
| 5 | Telegram LLM Free Text | ✅ DONE | `66811b7` | bot-handler.ts (handleFreeText + callZaiChat GLM-4.6 + finance context) |
| 6 | Telegram File Upload → Drive | ✅ DONE | `66811b7` | bot-handler.ts (handleFileUpload: download dari Telegram → upload ke Drive → save FileRef) |

**Verification**:
- `npx tsc --noEmit`: ✓ (0 errors)
- `npx next build`: ✓ Compiled successfully

**Owner Action Required** (setelah Vercel deploy):
1. Buka https://hadi-kaya-virtual-office.vercel.app → login
2. Tab Finance → sub-tab "Purchase Orders" → browse 122 PO dengan filter+search
3. Sub-tab "Upah Tukang" → browse 58 wages
4. Sub-tab "Biaya Lain" → browse 94 expenses
5. Sub-tab "Memo Pengajuan" → browse 44 memos
6. Dashboard → "Laporan Tahunan" button → PDF download (12 bulan + per project + per supplier)
7. Dashboard → "Laporan Per-Proyek" (access via /api/finance/reports/project?projectId=XXX)
8. Setup Telegram bot (jika belum) → chat free text ke RINA → LLM jawab pakai finance context
9. Kirim foto ke RINA bot → auto-upload ke Google Drive → reply dengan Drive URL

### 29.4 Batch 3 (LOW — Deferred)

Task 7-10 tetap deferred (nunggu kebutuhan + infra):
- 7. WhatsApp Bot — butuh VPS Hostinger
- 8. Multi-user + Login — v2, kalau ada staff lain input
- 9. 9router integration — paused
- 10. RAB vs Actual comparison — bisa dikerjakan kapan saja, tinggal request

---

## 30. ITERASI 4 — RAB vs Actual + Feature Ideas (23 Juli 2026)

### 30.1 Task 10: RAB vs Actual Comparison ✅ DONE (commit `1ef2cac`)

**Yang dikerjakan**:
- `src/lib/finance/rab-comparison.ts` — computeRabComparison(projectId)
  - Material: RABLine (planned) vs MaterialUsageItem (actual) per workItem
  - Upah: WageType.price × unitCount vs sum(WagePayment.amount)
  - Variance: actual - planned (positive = unfavorable, negative = favorable)
  - Include unplanned spending detection (actual tanpa RAB → 100% over)
- `GET /api/finance/reports/rab-comparison?projectId=XXX`
- `src/components/finance/rab-comparison.tsx` — UI dengan project selector + 2 comparison tables + grand total summary
- Sub-tab "RAB vs Actual" di Finance (TrendingDown icon)
- Status badges: Hemat (green), Over (red), Pas (gray)

### 30.2 Feature Ideas untuk Iterasi Mendatang (Owner Decision)

Aku susun 12 ide fitur baru, grouped by value:

#### HIGH VALUE (Recommended)

| # | Fitur | Deskripsi | Estimasi |
|---|-------|-----------|----------|
| 1 | **Material Usage Form** | Form catat pemakaian material: pilih unit, pilih material, qty, workItem → auto-decrement stock + AVCO snapshot. Saat ini owner bisa opname tapi belum bisa catat usage dari UI. | 1-2 jam |
| 2 | **Wage Form Modal** | Form create wage payment baru: pilih worker, wageType (auto-fill budget), unit, amount, workDescription. Saat ini cuma bisa via API. | 1 jam |
| 3 | **Expense Form Modal** | Form create expense baru: kategori, penerima, amount, description, project/unit. Saat ini cuma bisa via API. | 1 jam |
| 4 | **Supplier Management UI** | Halaman supplier: list, add, edit, view PO history per supplier + total hutang. Saat ini cuma dropdown di PO form. | 1-2 jam |
| 5 | **Export CSV/Excel** | Export PO list, wage list, expense list ke CSV untuk accounting external (pajak, audit). | 1 jam |

#### MEDIUM VALUE

| # | Fitur | Deskripsi | Estimasi |
|---|-------|-----------|----------|
| 6 | **Cost per Unit Ranking** | Dashboard sub-tab: biaya per unit A1-A12, ranking termahal-termurah. Detect outlier. | 1-2 jam |
| 7 | **Supplier Price Comparison** | Bandingkan harga material antar supplier. "Semen paling murah di toko mana?" | 2-3 jam |
| 8 | **Budget Forecasting** | Berdasarkan RAB + actual cost per unit selesai, prediksi modal untuk unit yang belum dibangun. | 2-3 jam |
| 9 | **Project Code Editor** | Owner edit project.code via dashboard (untuk set kode project yang belum ada). | 30 menit |
| 10 | **Notification Badge** | Low stock alert + outstanding hutang jatuh tempo → badge angka di tab Finance/Material. | 1-2 jam |

#### LOW VALUE (Nice to have)

| # | Fitur | Deskripsi | Estimasi |
|---|-------|-----------|----------|
| 11 | **Site Plan Cost Heatmap** | Overlay biaya per unit di Site Plan (hijau=murah, merah=mahal). | 3-4 jam |
| 12 | **DINA Telegram Generate Berkas** | DINA bot trigger generate SK Kerja + Slip Gaji via Telegram. Upload KTP → OCR → generate. | 3-5 jam |

### 30.3 Rekomendasi Urutan

**Batch A (form input lengkap, 4-5 jam)**:
1. Material Usage Form
2. Wage Form Modal
3. Expense Form Modal
4. Supplier Management UI
5. Project Code Editor

→ Setelah ini, owner bisa input SEMUA data dari UI (ga perlu API/manual).

**Batch B (analisis, 4-6 jam)**:
6. Cost per Unit Ranking
7. Export CSV/Excel
8. Supplier Price Comparison
9. Budget Forecasting
10. Notification Badge

**Batch C (visual/advanced, 6-9 jam)**:
11. Site Plan Cost Heatmap
12. DINA Telegram Generate Berkas

---
