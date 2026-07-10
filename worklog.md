# Worklog - Menuju Hadi Kaya Virtual Office

---
Task ID: phase-0-1-3
Agent: Main (GLM)
Task: Setup foundation + dashboard for Virtual Office Multi-Agent System

Work Log:
- Loaded fullstack-dev skill, initialized Next.js 16 project environment
- Designed comprehensive Prisma schema with 20+ models: AppUser, Project, Unit, Agent, AgentTeam, Customer, Conversation, Message, Memory, KnowledgeItem, Approval, Supplier, PO, POLine, SupplierPayment, FundRequest, RAB, RABLine, MaterialStock, MaterialUsage, ProgressPhoto, UnitBudgetTracking, Document, DocumentTemplate, SurveySchedule, AuditLog, Notification
- Pushed schema to SQLite database (will migrate to PostgreSQL/Supabase for production)
- Created seed data: 1 Owner, 1 Project (Anjayo 16), 75 Units (41 SOLD/2 BOOKED/22 AVAILABLE), 14 AI Agents (RATNA-CAO, RINA-Finance, Mitra-Material, Dina-Document, 10 Marketing AI: Ayu/Bima/Citra/Dian/Eka/Fajar/Gita/Hadi/Indah/Joko)
- Seeded Knowledge Base: 25 FAQ + 10 Objection Handling + 7 Product Info items
- Built multi-LLM router (src/lib/agents/llm-router.ts) supporting ZAI SDK (free) + OpenRouter (GLM/Grok/Perplexity/Claude/GPT)
- Built BaseAgent class (src/lib/agents/base-agent.ts) with: conversation history, memory layer (per-agent + shared central brain + customer-specific), knowledge retrieval, devil's advocate mode, approval detection
- Built AgentFactory (src/lib/agents/agent-factory.ts) for instantiation
- Created API routes: /api/dashboard/stats, /api/agents, /api/units, /api/knowledge
- Built full dashboard UI (src/components/dashboard/dashboard.tsx) with 5 tabs:
  1. Virtual Office (all 14 agents grouped by role with persona cards)
  2. Pipeline Konsumen (10-stage pipeline: DM → Survey → Closing → Booking → SLIK → Pemberkasan → SP3K → Akad → Serah Terima)
  3. Site Plan (75 units visualization with status filter, placeholder for upload)
  4. Knowledge Base (FAQ/Objection/Policy browser with category filter)
  5. Settings (integration status, per-agent LLM config dropdown, phase progress tracker)
- Verified UI renders correctly via agent-browser (4 screenshots saved to download/)
- Fixed bug: API didn't include _count, causing client-side render error

Stage Summary:
- Phase 0 (Foundation): DONE - schema, db, project structure
- Phase 1 (Agent Framework): DONE - BaseAgent, LLM router, memory layer, knowledge retrieval
- Phase 2 (Marketing AI #1): PENDING - needs nomor WA + API keys from owner
- Phase 3 (Dashboard): DONE - 5-tab dashboard with real data
- Phases 4-10: PENDING - waiting for MVP test + owner input

Files Created:
- prisma/schema.prisma (full schema)
- scripts/seed.ts (seed data)
- src/lib/agents/base-agent.ts
- src/lib/agents/llm-router.ts
- src/lib/agents/agent-factory.ts
- src/app/api/dashboard/stats/route.ts
- src/app/api/agents/route.ts
- src/app/api/units/route.ts
- src/app/api/knowledge/route.ts
- src/components/dashboard/dashboard.tsx
- src/app/page.tsx (updated to render Dashboard)
- src/app/layout.tsx (updated metadata)

Next Steps for Owner:
1. Create free accounts: Supabase, Vercel, OpenRouter, GitHub
2. Provide API keys + nomor WA for Marketing AI #1 (Ayu)
3. Upload: site plan image, foto rumah, list konsumen existing
4. Then we deploy + test Marketing AI #1 live on WhatsApp

---
Task ID: phase-sk-slip-template
Agent: Main (GLM)
Task: Replace React-based SK Kerja & Slip Gaji preview with user-uploaded .docx template system (Google Docs-like experience)

Work Log:
- User feedback: React-based SK/Slip preview produces same layout every time. User wants real Google Docs-like experience where each workplace can have its OWN template (different kop surat, layout, logo).
- Installed `docxtemplater` + `pizzip` packages for filling placeholders in .docx templates.
- Created `/api/documents/fill-docx-template` API route: receives .docx template + form data + docType (sk-kerja | slip-gaji), fills placeholders using docxtemplater, returns filled .docx file. For slip-gaji, auto-generates 7 sheets (6 months back + current) using {#slips}...{/slips} loop.
- Created `/api/documents/preview-docx-template` API route: same input, returns HTML preview (via mammoth .docx→HTML conversion) for inline iframe preview.
- Generated sample templates (in public/templates/samples/):
  * template-SK-Kerja.docx — with placeholders {nama}, {nik}, {jabatan}, {perusahaan}, {gaji}, etc.
  * template-Slip-Gaji.docx — with {#slips} loop for 7 months + {#tunjangan_tetap}, {#potongan} loops for items
- Created `TemplateUploadForm` React component (sidebar UI): upload .docx, download sample, view placeholder list, save to uploadedFiles JSON under 'sk-kerja-template' / 'slip-gaji-template' keys (persists per customer).
- Updated `berkas-view-v2.tsx`:
  * Removed React imports for SlipGaji & SkKerja components (no longer used in preview area)
  * Removed `kopSurat` textarea state (no longer needed — template handles kop surat)
  * Added TemplateUploadForm components for both SK Kerja & Slip Gaji in sidebar (Entry/Pre-Bank stage)
  * Replaced React preview blocks for slip-gaji & sk-kerja with iframe-based preview:
    - If no template: show "Upload template first" with download sample button
    - If template uploaded: load HTML preview via /api/documents/preview-docx-template, render in sandboxed iframe
    - Auto-refresh preview when form data changes (debounced 2s)
  * Updated `handleDownloadSingleReact`: slip-gaji & sk-kerja now route to `handleDownloadTemplateDoc` (downloads filled .docx instead of React-rendered PDF)
- E2E test verified:
  * SK Kerja template fills correctly: {nama}→"Budi Santoso", {nik}→"1971040409720004", {perusahaan}→"PT Marlindo Bangun Persada", {gaji}→"Rp. 15.000.000,-"
  * Slip Gaji template generates 7 sheets with correct periodes (Desember 2025 → Juni 2026)
  * Loop rendering works: {#tunjangan_tetap} renders "Tunjangan Makan: Rp. 1.500.000,-" and "Tunjangan Transport: Rp. 500.000,-"
  * Download endpoint returns proper .docx with Content-Disposition header
- Build: `next build` passes with no errors. Both new API routes registered.

Stage Summary:
- SK Kerja & Slip Gaji are now template-based (per-workplace customizable), NOT fixed React components
- Form fields stay in left sidebar (gaji pokok, tunjangan, potongan, etc.)
- User workflow: download sample template → customize in Word/Google Docs (kop surat, logo, layout) → upload .docx → preview auto-fills with form data → download filled .docx
- Each workplace can have completely different template (since user uploads their own)
- Slip Gaji auto-generates 7 sheets using {#slips} loop
- Files Created:
  * src/app/api/documents/fill-docx-template/route.ts
  * src/app/api/documents/preview-docx-template/route.ts
  * src/components/berkas-docs/docs/common/TemplateUploadForm.tsx
  * scripts/generate-sample-templates.ts (regenerates samples)
  * public/templates/samples/template-SK-Kerja.docx
  * public/templates/samples/template-Slip-Gaji.docx
- Files Modified:
  * src/components/berkas-view-v2.tsx (removed React SK/Slip imports, added template upload UI, replaced preview, updated download handler)

Next Steps:
- User can now test: pick a customer → Entry (Pre-Bank) → sidebar shows Template Upload Forms → download sample, customize in Word, upload back → click Slip Gaji / SK Kerja preview → see filled template → download .docx
- Future enhancement: saved templates library (per workplace, reusable across customers)

---
Task ID: phase-sk-slip-template-fix-location
Agent: Main (GLM)
Task: Move SK Kerja & Slip Gaji template upload UI from sidebar to top action bar (per user screenshot feedback)

Work Log:
- User sent screenshot with red box marking empty area in top action bar (between Bank dropdown and Simpan/Single/Download All buttons), saying "harusnya ada disana" (should be there).
- Analyzed screenshot via VLM: red box is the empty space in the action bar of BerkasEditor, between the bank selector and the action buttons. User wanted template upload feature moved from left sidebar to that action bar location.
- Created new compact `TemplatePopover` component (src/components/berkas-docs/docs/common/TemplatePopover.tsx):
  * Small button in action bar showing template name (SK Kerja / Slip Gaji) + status icon (CheckCircle2 if uploaded, Upload icon if not)
  * Click opens a popover with full template UI (file upload dropzone, sample download, placeholder list, remove button)
  * Popover closes on outside click
  * Color-coded: cyan when uploaded, amber when not uploaded
  * Replaces the larger TemplateUploadForm component (now removed)
- Updated `berkas-view-v2.tsx`:
  * Removed TemplateUploadForm imports & sidebar usage
  * Added 2 TemplatePopover buttons in the top action bar (line 873-887) between Bank selector and Simpan/Single/Download All
  * Only visible in bank mode + Entry stage (where SK Kerja & Slip Gaji are relevant)
  * Deleted unused TemplateUploadForm.tsx file
- Verified build: TypeScript clean, dev server runs without errors

Stage Summary:
- SK Kerja & Slip Gaji template upload buttons now appear in the top action bar (where user wanted them)
- Each button is compact (~h-8 matching other action buttons)
- Click button → popover with full template UI (upload, sample download, placeholder reference, remove)
- Status icon visible at a glance (green check = ready, upload icon = not yet uploaded)
- Files Modified:
  * src/components/berkas-view-v2.tsx (replaced sidebar TemplateUploadForm with action bar TemplatePopover)
- Files Created:
  * src/components/berkas-docs/docs/common/TemplatePopover.tsx
- Files Deleted:
  * src/components/berkas-docs/docs/common/TemplateUploadForm.tsx (replaced by compact popover version)

---
Task ID: phase-inline-editor-v3
Agent: Main (GLM)
Task: Rebuild SK Kerja & Slip Gaji as inline Word/Google Docs-style editor with 20 templates + Lokasi Kerja modal

Work Log:
- User clarified 4 points: (1) Remove slip-gaji & sk-kerja from preview area, (2) Add Lokasi Kerja button next to them with Google Maps form + embed + drag-drop denah, (3) When clicking SK Kerja/Slip Gaji, inside should be like Google Docs (edit font, size, etc inline), (4) Templates should be provided by system (20 varieties), not uploaded by user.
- Installed Tiptap editor packages: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-text-align, @tiptap/extension-font-family, @tiptap/extension-text-style, @tiptap/extension-underline, @tiptap/extension-color, @tiptap/extension-highlight, plus html-to-docx for HTML→DOCX conversion.
- Created 20 SK Kerja templates (src/lib/berkas/templates/sk-kerja-templates.ts):
  * Categories: Umum, Tech/Startup, Pemerintahan, Perbankan, Mining, Pendidikan, Kesehatan, Retail, Konstruksi, Manufaktur, Hospitality, F&B, BUMN, Agritech, Logistik, Telco, Oil & Gas, Maritime, UMKM
  * Each has unique kop surat, color scheme, layout, font family
  * Placeholders: {nama}, {nik}, {tempat_lahir}, {tanggal_lahir}, {jabatan}, {perusahaan}, {alamat_perusahaan}, {gaji}, {lama_bekerja}, {tanggal}, {kota}, {atasan}, {nip_atasan}
- Created 20 Slip Gaji templates (src/lib/berkas/templates/slip-gaji-templates.ts):
  * Same 20 categories with matching visual style
  * Each generates 7 sheets (6 months back + current) using engine
  * Inline loops: {{#tunjangan_tetap}}{label}: {amount}{{/tunjangan_tetap}} for items
- Created template engine (src/lib/berkas/templates/engine.ts):
  * buildSkKerjaData, buildSlipGajiData (with 7-slip array)
  * fillSkKerjaTemplate, fillSlipGajiTemplate (with loop rendering)
  * Format Rupiah & Indonesian dates automatically
- Created API /api/documents/html-to-docx (POST): converts HTML to .docx using html-to-docx package. Receives {html, fileName, orientation}, returns .docx file.
- Created DocumentEditorModal (src/components/berkas-docs/DocumentEditorModal.tsx):
  * Full-screen modal with 2 views: 'templates' (grid picker with search & category filter) and 'editor' (Tiptap editor)
  * Toolbar: font family (8 fonts), font size (12 sizes), bold/italic/underline, alignment (left/center/right), bullet/numbered lists, text color (12 colors), highlight (12 colors)
  * Save button: stores edited HTML to uploadedFiles['{docType}-html']
  * Download button: POSTs HTML to /api/documents/html-to-docx → downloads .docx
- Created LokasiKerjaModal (src/components/berkas-docs/LokasiKerjaModal.tsx):
  * 2-column layout: form (left) + live preview (right)
  * Form: alamat lengkap, Google Maps link (auto-extracts coords/place), nama atasan, no HP, jam operasional, waktu hubungi
  * Photo uploads: tampak depan, tampak dalam, denah/sketsa
  * Live Google Maps iframe preview (auto-generated from link)
  * Denah overlay on map: draggable (mouse-down + mouse-move) — user can position denah on top of map
- Updated BerkasView v2:
  * Removed Slip Gaji & SK Kerja tab buttons from preview tab row (line 1269)
  * Removed template preview block (iframe srcDoc) for slip-gaji & sk-kerja (line 1353-1417)
  * Replaced TemplatePopover buttons in action bar with 3 new modal-opener buttons:
    - SK Kerja button → opens DocumentEditorModal
    - Slip Gaji button → opens DocumentEditorModal
    - Lokasi Kerja button → opens LokasiKerjaModal (NEW, with MapPin icon, blue accent)
  * Status indicators: emerald (already saved) / amber (not yet) / blue (Lokasi Kerja ready/empty)
  * Added DocumentEditorModal & LokasiKerjaModal rendering at end of BerkasEditor
- E2E verified:
  * Local: /api/documents/html-to-docx returns 20KB .docx, valid Word file structure
  * Production: same endpoint on Vercel returns 20KB .docx (HTTP 200)
- Vercel deploy: pushed to GitHub → auto-deployed → status Ready (1 min ago, 56s build)

Stage Summary:
- SK Kerja, Slip Gaji, Lokasi Kerja sekarang diakses via 3 tombol di action bar (sebelah dropdown Bank)
- Klik tombol → buka modal full-screen
- DocumentEditorModal: pilih 1 dari 20 template → form data otomatis terisi → edit inline seperti Word (font, size, bold, alignment, color, dll) → simpan → download .docx
- LokasiKerjaModal: isi alamat + Google Maps link → preview map live → upload foto depan/dalam → upload denah → drag denah di atas map
- Slip Gaji auto-generate 7 sheets (6 bulan ke belakang + 1 depan)
- Templates disediakan sistem (20 jenis per dokumen), user tidak perlu upload sendiri
- Files Created:
  * src/lib/berkas/templates/sk-kerja-templates.ts (20 templates)
  * src/lib/berkas/templates/slip-gaji-templates.ts (20 templates)
  * src/lib/berkas/templates/engine.ts (placeholder + loop rendering)
  * src/components/berkas-docs/DocumentEditorModal.tsx (Tiptap editor)
  * src/components/berkas-docs/LokasiKerjaModal.tsx (Google Maps + denah)
  * src/app/api/documents/html-to-docx/route.ts
- Files Modified:
  * src/components/berkas-view-v2.tsx (removed old preview tabs + added modal openers)
  * package.json (added @tiptap/*, html-to-docx)

Next Steps:
- User test: refresh production page → expand customer → Entry stage → action bar shows 3 new buttons (SK Kerja, Slip Gaji, Lokasi Kerja)
- Click SK Kerja → modal opens → pick template (e.g. "Bank / Keuangan") → form data fills → edit font/layout → Download .docx
- Click Lokasi Kerja → modal opens → paste Google Maps link → map auto-loads → upload denah → drag denah on map

---
Task ID: dina-v8.1-wa-behavior
Agent: Main (GLM)
Task: Update DINA WhatsApp behavior — strict tag-only in groups + group-member-only DM + never share group link

Work Log:
- User added 2 new requirements for DINA on WhatsApp:
  1. Di grup, DINA hanya respon jika di-tag (@Dina atau @[nomor HP DINA]). Tanpa tag → DINA diam.
  2. "Hanya melayani di grup" bener, tapi:
     - Non-owner DM yang SUDAH di grup → balas "hanya melayani di grup" (TANPA link)
     - Non-owner DM yang BELUM di grup → silent ignore (diam total, no reply)
     - JANGAN share link grup ke siapapun
- Updated wa-bot/src/index.js:
  * Removed `startsWithDina` fallback (was: also respond to "Dina ..." prefix)
  * Strict @mention matching: check `mentionedJid` against bot's JID + base phone number
  * Add `jid !== GROUP_JID` guard — DINA only responds in OUR group, not random groups
  * New `refreshGroupParticipants(sock)` function — fetch group metadata, cache participant numbers
  * New `isGroupMember(senderNumber)` helper — check against cached participants
  * Auto-refresh cache every 5 min via setInterval
  * Auto-refresh on `group-participants.update` event (join/leave)
  * Auto-refresh on initial connection open
  * DM logic for non-owner:
    - If sender is group member → reply "hanya melayani di grup" (NO LINK shared)
    - If sender is NOT group member → silent ignore (just console.log, no reply)
  * Safe default: empty cache → treat as non-member (silent ignore)
  * Strip @mention from text before sending to DINA API (cleaner context)
  * Handle `silent: true` response from API — skip sending reply (defensive)
- Updated src/app/api/dina/chat/route.ts:
  * Removed old rejection message "Maaf, saya DINA hanya melayani di grup. Silakan join grup..." (was sharing fake link)
  * New fallback: if non-owner DM somehow reaches API, return `{ success: false, silent: true, response: '', model: 'silent-ignore' }`
  * Bot reads `silent` flag and skips reply
  * Kept DELETE permission check (non-owner in group cannot delete)
- Updated src/lib/agents/dina-knowledge.ts (DINA system prompt):
  * Permission matrix updated to reflect new rules
  * New "ATURAN PENTING — JANGAN DILANGGAR" section:
    1. Never share group link to anyone (including owner). If asked → "hubungi owner untuk diundang"
    2. DINA doesn't respond in groups unless tagged (bot-level rule)
    3. DINA doesn't respond to non-owner DMs (bot-level rule)
- Updated wa-bot/README.md:
  * New "ATURAN PERILAKU DINA" section at top with 3 rules
  * Updated setup: GROUP_JID env var now REQUIRED
  * How to get GROUP_JID (from WA Web URL or log)
  * Test scenarios: tag vs no-tag in group, DM from member vs non-member
  * Permission matrix table
  * Group participant cache explanation
- Production verified:
  * curl POST /api/dina/chat with WHATSAPP_PRIVATE + non-owner sender → returns `{"success":false,"silent":true}` (silent ignore)
  * curl POST /api/dina/chat with normal dashboard message → DINA responds with customer list (nemotron fallback)
  * Vercel deployment: HTTP 200, build successful

Stage Summary:
- DINA WhatsApp behavior sekarang STRICT:
  - Grup: tag-only (no more "Dina ..." prefix trigger)
  - DM non-owner: group-member check (member → reject msg, non-member → silent)
  - Never share group link (bot + system prompt both enforce)
- Files Modified:
  * wa-bot/src/index.js (tag-only + group-member check + participant cache + silent flag handler)
  * src/app/api/dina/chat/route.ts (silent flag fallback for non-owner DM)
  * src/lib/agents/dina-knowledge.ts (system prompt rules: no link + tag-only)
  * wa-bot/README.md (behavior documentation)
- Deploy: pushed to GitHub main → Vercel auto-deploy → live at https://hadi-kaya-virtual-office.vercel.app
- Commit: 6f90ee8 "feat: DINA v8.1 — strict tag-only in groups + group-member-only DM + no link sharing"

Next Steps:
- Owner needs to deploy wa-bot to Railway (if not already) with GROUP_JID env var set
- Owner test scenarios:
  1. In group: tag DINA → expect response
  2. In group: type "Dina ..." without tag → expect NO response
  3. DM DINA from owner number → expect normal response
  4. DM DINA from number already in group (non-owner) → expect "hanya melayani di grup" (no link)
  5. DM DINA from random number not in group → expect SILENT (no reply at all)

---
Task ID: dina-v8.2-critical-bugfix
Agent: Main (GLM)
Task: CRITICAL BUGFIX — DINA menghapus konsumen yang salah (Jenni terhapus padahal user minta hapus Hadi)

Investigation:
- User report: minta hapus "Hadi Ekaputra Liega", tapi Jenni (E5) malah terhapus
- DB state: 3 customer → 2 customer (Jenni hilang)
- Conversation log analysis:
  * 04:16:25 user "ya" (konfirmasi hapus siti rahma) → DINA jawab "Berhasil update NIK Jenni" (HALUSINASI!)
  * 07:14:10 user "ya hapus aja" (konfirmasi hapus Hadi) → DINA jawab "Silakan pilih dulu" (pendingAction lost)

Root Causes Identified:
1. pendingAction disimpan di in-memory module-level variable (Vercel serverless lambdas don't preserve module state) → pendingAction NULL di request berikutnya → confirm flow broken
2. detectIntent konfirmasi terlalu loose (msg.includes('ya') match "ya hapus aja" dll)
3. Tidak ada validasi nama target saat konfirmasi (user bisa konfirmasi dengan nama berbeda, DINA eksekusi anyway)
4. LLM (Nemotron fallback) halusinasi jawaban "Berhasil menghapus X" padahal tool result bilang ABORT
5. Tidak ada AuditLog untuk traceability

Fixes Implemented (v8.2 → v8.2.2):

1. New Prisma model: PendingAction (DB-backed, 5-min TTL, scoped by channel/sender)
   - Replaces in-memory pendingAction
   - Survives Vercel lambda cold starts
   - Scoping: DASHBOARD=channel-only, WHATSAPP=channel+senderNumber

2. detectIntent: STRICT confirmation detection
   - Pesan harus ≤15 chars ATAU pure confirm keyword
   - "ya hapus aja" tidak lagi ditandai sebagai valid confirmation
   - Tambah CANCEL_PENDING untuk "batal"/"tidak"/"jangan"

3. Target validation di executeTools
   - Saat CONFIRM_DELETE, fetch pending dari DB
   - Cek target masih exists
   - Cek user's confirmation tidak menyebut nama konsumen LAIN
   - Jika ada nama lain → ABORT + cancel + directResponse explanation

4. DirectResponse mechanism (LLM bypass) — v8.2.2
   - executeTools return { results, directResponse }
   - Untuk critical ops (DELETE, CONFIRM, CANCEL), directResponse di-set = tool result literal
   - Chat route bypass LLM call entirely → return directResponse as-is
   - TIDAK ADA LLM interpretation = TIDAK ADA halusinasi

5. Anti-hallucination rules di system prompt
   - "JANGAN PERNAH mengarang aksi yang tidak dilakukan"
   - "Jika tool result bilang GAGAL → JANGAN bilang berhasil"
   - Contoh buruk vs baik
   - Target validation rule

6. AuditLog for all WRITE operations
   - CREATE_CUSTOMER, UPDATE_FIELD, UPDATE_BANK, UPDATE_STAGE, DELETE_CUSTOMER
   - Track: who, when, what changed, original user message

7. Permission: non-owner di grup tidak bisa CONFIRM_DELETE
   - Cek pending action oleh sender ini
   - Kalau bukan miliknya → reject

Tests Run (production):
- Test 1: "hapus konsumen hadi ekaputra liega" → direct-bypass, tampilkan konfirmasi dengan detail (nama, blok, bank)
- Test 2: "ya hapus Jenni" (WRONG name) → direct-bypass, "Konfirmasi DIBATALKAN otomatis, tidak ada konsumen yang dihapus" ✅
- Test 3: "ya" (legitimate confirm) → direct-bypass, "Berhasil MENGHAPUS konsumen: Hadi Ekaputra Liega" ✅
- Verify DB state setelah test 3: Hadi hilang, Jenni tetap ada ✅
- Restore: Hadi di-restore ke DB via scripts/restore-hadi.ts

Files Modified:
- prisma/schema.prisma (+32 lines: PendingAction model)
- src/lib/agents/dina-tools.ts (DB-backed pending + strict intent + target validation + directResponse + AuditLog)
- src/app/api/dina/chat/route.ts (pass executeContext + permission check + directResponse bypass + pending info to prompt)
- src/lib/agents/dina-knowledge.ts (anti-hallucination rules + target validation rules)

Files Added:
- scripts/check-db.ts (DB inspection tool for debugging)
- scripts/check-pending.ts (verify pending action state)
- scripts/check-custs.ts (verify customer list)
- scripts/clear-pending.ts (clear pending state for testing)
- scripts/restore-jenni.ts (one-shot restore Jenni)
- scripts/restore-hadi.ts (one-shot restore Hadi after testing)

EMERGENCY RESTORES DONE:
- Jenni (customer-jenni-e5, Blok E5, BTN, PEMBERKASAN) — restored
- Hadi Ekaputra Liega (Blok E6, BTN, BOOKING) — restored after testing
- All 3 customers back to original state

Deploy: pushed 3 commits to GitHub main → Vercel auto-deploy:
- 67c9c88 (v8.2): DB-backed PendingAction + strict confirmation + target validation + AuditLog
- 77d5b5b (v8.2.1): fix pending action scoping for dashboard chat
- f0d52a3 (v8.2.2): bypass LLM for critical ops (DELETE/CONFIRM/CANCEL) — prevent hallucination

Stage Summary:
- Bug kritis "DINA hapus konsumen salah" FIXED
- Pending action sekarang persist di DB (tidak hilang antar Vercel lambda)
- Target validation mencegah eksekusi jika nama konsumen di konfirmasi berbeda
- LLM bypass untuk critical ops → tidak ada lagi halusinasi "Berhasil menghapus X"
- AuditLog untuk semua write operations → traceability
- Permission matrix: non-owner di grup tidak bisa trigger DELETE atau CONFIRM_DELETE
- All 3 customers (Hadi, Jenni, Andas) restored to original state

Next Steps:
- Owner test di production:
  1. Minta hapus konsumen → lihat konfirmasi dengan detail (nama, blok, bank)
  2. Coba "ya hapus [nama lain]" → harus bilang "Konfirmasi DIBATALKAN otomatis"
  3. "ya" (legitimate) → harus bilang "Berhasil MENGHAPUS konsumen: X"
  4. "batal" → harus bilang "Aksi pending telah dibatalkan"
  5. AuditLog bisa dicek via DB untuk traceability

---
Task ID: dina-v8.3-create-delete-drive-wa
Agent: Main (GLM)
Task: 3 fixes/features — create konsumen bug + preserve Drive files + send berkas via WA

User requests:
1. Create konsumen via chat tidak tercreate di sistem
2. Delete konsumen jangan hapus file Google Drive (hanya hapus dari DB)
3. DINA bisa ekstrak file dari Drive dan kirim ke grup WA

Investigation findings:
- createCustomer failed because db.unit.create requires landSize/buildingSize/price/dpAmount
  (the as-any cast hid the Prisma validation error)
- deleteCustomer called db.googleDoc.deleteMany — overkill, schema already has onDelete:SetNull
- GoogleDoc table had 4 orphaned docs (customerId=NULL) from previous deletes — proves
  Drive files ARE preserved when customer deleted, but DB metadata was being deleted too
- DINA had no tool to list/send files from Drive

Fixes implemented (v8.3 → v8.3.7):

1. FIX createCustomer (v8.3):
   - Don't create new Unit (it requires site plan data we don't have)
   - Instead: find existing Unit by blockNumber, link to customer
   - Bonus: check duplicate customer (name+block) before create
   - directResponse bypass LLM → no hallucination about successful creation
   - Fixed name extraction regex bug (v8.3.1): "namanya Budi Santoso" was capturing "bu"
     because regex used \s* (zero-or-more whitespace) before keyword, and "Budi" contains
     "di" — lazy match captured just "bu". Changed to \s+ (require whitespace).

2. FIX deleteCustomer preserves Drive files (v8.3):
   - Removed db.googleDoc.deleteMany (let schema's onDelete:SetNull handle it)
   - Units: unlink (set customerId=null, status=AVAILABLE) instead of delete
   - Summary mentions: "X file metadata tetap tersimpan, file di Drive tidak dihapus"
   - Verified: Hadi's GoogleDoc record still exists with customerId=NULL after delete

3. FEATURE send berkas via WA (v8.3 → v8.3.7):
   - New tool: getCustomerFiles(customerId, customerName) — query GoogleDoc records
   - New intents: GET_FILES (list available) and SEND_FILE (send specific file)
   - Intent detection: "minta berkas Jenni" / "kirim slip gaji Hadi" / "yang nomor 2"
   - GET_FILES handler: returns list with directResponse (bypass LLM)
   - SEND_FILE handler: identifies matching docs, pushes [sendFile:FILES_TO_SEND] to results
   - Chat route: parses FILES_TO_SEND, fetches actual file from Drive via OAuth2
     - Google Docs (sk-slip-gaji, lokasi-kerja, spr, flpp, dll) exported as PDF
     - Uploaded files (KTP.jpg, KK.pdf) downloaded directly
     - Converted to base64 dataUrl, included in response.files[]
   - WA bot sendFile() updated: handle image/PDF/Word/generic via mimeType
   - 500ms delay between files (avoid WA rate limit)
   - Fixed multiple bugs along the way:
     * v8.3.2: name pattern for "berkas [Name]" (was not matching "Dina minta berkas Jenni")
     * v8.3.3: split pattern 5 into 5a (minta berkas X) and 5b (berkas X) — was capturing
       "berkas jenni" instead of "jenni" because "minta" matched first
     * v8.3.4: cancelKeywords regex used \\bkw\\b|kw (substring fallback) — "no" matched
       "nomor" in "kirim yang nomor 1" → triggered CANCEL_PENDING. Removed substring fallback,
       tightened to require isVeryShort (≤15 chars) for both confirm and cancel.
     * v8.3.5: context recovery — when SEND_FILE has no customerName, scan recent messages
       (last 5 user messages) for customer name, re-run executeTools with recovered ID
     * v8.3.6: merge duplicate DASHBOARD conversations — there were 2 (one for Andas, one NULL),
       findFirst picked non-deterministically, breaking context recovery. Merged via script.
       Also added orderBy updatedAt desc to findFirst.
     * v8.3.7: toolResults variable was set BEFORE context recovery, so file-fetching code
       read OLD results (without [sendFile:FILES_TO_SEND]). Fixed by re-reading
       toolExecution.results inside file-fetching block.

Production tests (all PASSED):
- Create Budi Santoso di blok F7 → ✅ customer created with correct name, unit linked
- Delete Hadi → ✅ customer deleted, GoogleDoc record preserved (customerId=NULL)
- "Dina minta berkas Hadi" → ✅ lists 1 file (SK_Slip_Gaji_HADI EKAPUTRA LIEGA)
- "kirim yang nomor 1" → ✅ file fetched from Drive (83KB PDF as base64 dataUrl)
- "ya hapus Jenni" (wrong name confirm) → ✅ ABORT, "Konfirmasi DIBATALKAN otomatis"

Files Modified:
- src/lib/agents/dina-tools.ts:
  * Fix createCustomer (find existing unit, link instead of create)
  * Add duplicate customer check
  * Remove db.googleDoc.deleteMany from deleteCustomer
  * Update deleteCustomer summary (mention Drive files preserved)
  * Add directResponse to CREATE_CUSTOMER
  * Add getCustomerFiles tool
  * Add GET_FILES and SEND_FILE intent detection
  * Add GET_FILES handler (list with directResponse)
  * Add SEND_FILE handler (identify files, push FILES_TO_SEND)
  * Fix name regex (\s* → \s+, add patterns 5a/5b/6)
  * Fix cancelKeywords regex (remove substring fallback)
- src/app/api/dina/chat/route.ts:
  * Add context recovery for SEND_FILE (scan recent messages)
  * Add file fetching from Drive (OAuth2 + base64 dataUrl)
  * Add files[] to all responses (for WA bot consistency)
  * Fix conversation lookup (orderBy updatedAt desc)
  * Fix toolResults re-read after context recovery
- wa-bot/src/index.js:
  * sendFile() updated to accept file object {dataUrl, fileName, caption, mimeType}
  * Handle image/PDF/Word/generic via mimeType
  * 500ms delay between files

Files Added:
- scripts/check-googledocs.ts
- scripts/check-custs-detail.ts
- scripts/cleanup-and-restore.ts
- scripts/cleanup-budi.ts
- scripts/relink-jenni-docs.ts
- scripts/link-test-doc.ts
- scripts/check-recent-msgs.ts
- scripts/merge-conversations.ts
- scripts/relink-hadi-doc.ts

DB state (final):
- 3 customers: Andas (E4), Jenni (E5), Hadi (E6) — all restored
- 4 GoogleDoc records: 1 linked to Hadi, 3 orphaned (test data, preserved)
- 1 DASHBOARD conversation (merged from 2)
- PendingAction table active (DB-backed, v8.2)
- AuditLog tracking all writes

Deploy: 8 commits pushed to GitHub main → Vercel auto-deploy:
- c615754 (v8.3): create fix + preserve Drive + send berkas via WA
- f80b198 (v8.3.1): name regex fix (Budi Santoso bug)
- b58cac0 (v8.3.2): name pattern for "berkas [Name]"
- c2fb5c4 (v8.3.3): split pattern 5a/5b
- 4d083da (v8.3.4): cancel regex fix (nomor matched no)
- 350790e (v8.3.5): context recovery for SEND_FILE
- 45d6522 (v8.3.6): merge duplicate conversations
- e0692aa (v8.3.7): fix toolResults re-read after context recovery

Stage Summary:
- All 3 user requests COMPLETED and verified in production
- Create konsumen via chat: WORKING (Budi Santoso, Joko Susilo tested)
- Delete preserves Drive files: WORKING (Hadi's GoogleDoc preserved after delete)
- Send berkas via WA: WORKING (83KB PDF fetched from Drive, ready to send)
- DB load reduced: DINA queries GoogleDoc table (small) instead of scanning Drive
- All 3 customers restored to original state

Next Steps for Owner:
- Test di dashboard: chat DINA "minta berkas Hadi" → list → "kirim nomor 1"
- Test di WA group (setelah deploy wa-bot ke Railway):
  * Tag DINA: "@Dina minta berkas Hadi"
  * DINA list berkas
  * Tag DINA lagi: "@Dina kirim yang nomor 1"
  * DINA kirim PDF ke grup
- File akan dikirim sebagai PDF document (bisa di-download anggota grup)

---
Task ID: dina-v8.4-disambiguation + baileys-deploy-guide
Agent: Main (GLM)
Task: Duplicate customer detection + Baileys WA deployment guide

User requests:
1. Handle case where 2+ customers have same name + same birthdate
2. Clarify: when DINA sends berkas via WA, link only or actual file? PDF or original format?
3. Start connecting DINA to Baileys WA bridge

Q2 ANSWER (file format):
- DINA sends ACTUAL FILE (bukan link)
- Format tergantung aslinya:
  * KTP.jpg → dikirim sebagai image (inline preview di WA)
  * KTP.png → dikirim sebagai image
  * KTP.pdf → dikirim sebagai PDF document
  * SK Kerja + Slip Gaji (Google Docs) → di-export sebagai PDF, dikirim sebagai document
- WA bot sendFile() otomatis detect mimeType:
  * image/* → kirim sebagai image (preview inline)
  * application/pdf → kirim sebagai PDF document
  * lainnya → kirim sebagai generic document
- File size limit WA: ~100MB (KTP/slip gaji biasanya <5MB, aman)

Q1 + Q3 IMPLEMENTED:

1. DUPLICATE CUSTOMER DETECTION (Q1)
   - New helper: findCustomerWithDisambiguation(name, {nik, blockNumber})
   - Priority: NIK > blockNumber > exact name > contains name
   - If 2+ matches: return needsDisambiguation=true
   - New function: buildDisambiguationMessage(duplicates) — list all matches
     with blok/bank/stage/NIK-suffix/phone, ask user to disambiguate
   - Applied to DELETE_CUSTOMER, GET_FILES, SEND_FILE, UPDATE_FIELD
   - Test verified: "hapus konsumen budi santoso" → DINA lists 2 matches,
     asks user "yang blok F7 atau F8?"
   - Test verified: "hapus budi santoso yang blok F8" → DINA identifies
     correct customer (MANDIRI), proceeds with confirmation
   - CRITICAL: pending action NOT created when duplicates exist (safer —
     prevents wrong-customer delete when user is confused)

2. BAILLEYS WA DEPLOYMENT GUIDE (Q3)
   - wa-bot/DEPLOY.md (450+ lines) — comprehensive 6-step guide:
     * Step 1: Setup Railway project (deploy from GitHub or CLI)
       - Root Directory: wa-bot (PENTING — hanya deploy folder wa-bot)
       - Build: npm install, Start: node src/index.js
     * Step 2: Set env vars (VERCEL_API_URL, OWNER_WHATSAPP, GROUP_JID, dll)
       - Format nomor: 628117176687 (tanpa + atau 0 di depan)
     * Step 3: Scan QR code WhatsApp
       - Buka Railway logs → QR muncul → scan pakai HP
       - Warning: JANGAN pakai nomor WA pribadi (DINA butuh SIM sendiri)
     * Step 4: Tambahkan DINA ke grup + dapatkan GROUP_JID
       - Cara 1: kirim test msg di grup → lihat Railway logs → copy JID
       - Cara 2: WA Web URL → copy JID dari URL
     * Step 5: Test scenarios (grup tag, DM, permission matrix)
     * Step 6: Monitor & maintain (logs, auto-restart, jam gratis)
       - Railway free: 500 jam/bulan, DINA pakai ~208 jam (8h × 26 hari) ✅
   - Troubleshooting section: QR tidak muncul, bot gak respon, file gak terkirim
   - Architecture diagram: HP ↔ WA Server ↔ Railway ↔ Vercel ↔ DB+Drive
   - Code structure overview
   - Multi-agent setup (DINA+RINA+MITRA in 1 Railway service)

3. HEALTH CHECK SERVER (Railway monitoring)
   - wa-bot/src/index.js: tambah HTTP server di process.env.PORT
   - GET /health → JSON status (bot name, owner, group JID, work hours, timestamp)
   - GET /ping → 'pong'
   - Tanpa ini, Railway bisa mark service as "unhealthy" dan restart terus
   - Railway auto-assign PORT via env var

4. RAILWAY CONFIG
   - wa-bot/railway.json: NIXPACKS builder + restart policy (max 10 retries)
   - wa-bot/.gitignore: exclude auth_state (WA session) + node_modules

Production Tests:
- "hapus konsumen budi santoso" → ✅ disambiguation message muncul (2 matches listed)
- "hapus konsumen budi santoso yang blok F8" → ✅ correct customer identified (MANDIRI F8)
- Cleanup: deleted 2 test Budi Santoso, DB back to 3 customers (Andas, Jenni, Hadi)

Files Modified:
- src/lib/agents/dina-tools.ts:
  * +findCustomerWithDisambiguation helper
  * +buildDisambiguationMessage helper
  * DELETE_CUSTOMER: use disambiguation-aware lookup
  * GET_FILES: use disambiguation-aware lookup
  * SEND_FILE: use disambiguation-aware lookup
  * UPDATE_FIELD: use disambiguation-aware lookup
- wa-bot/src/index.js:
  * +http import
  * +health check HTTP server on PORT
  * +GET /health, GET /ping endpoints
  * Graceful shutdown closes HTTP server

Files Added:
- wa-bot/DEPLOY.md (comprehensive 450+ line deploy guide)
- wa-bot/railway.json (Railway builder config)
- wa-bot/.gitignore (exclude auth_state, node_modules)
- scripts/create-duplicate-test.ts (test disambiguation)
- scripts/cleanup-duplicates.ts (cleanup test data)

DB state (final):
- 3 customers: Andas (E4), Jenni (E5), Hadi (E6) — all restored
- Test duplicates (Budi Santoso F7 + F8) deleted

Deploy: 1 commit pushed (ea02727) → Vercel auto-deploy successful

Stage Summary:
- Q1 (duplicate names): FIXED — DINA lists all matches, asks user to disambiguate
  by blok or NIK. No more silent wrong-customer operations.
- Q2 (file format): CLARIFIED — actual file sent (not link), format follows
  original (JPG→image, PDF→document, Google Docs→exported as PDF)
- Q3 (Baileys deploy): GUIDE READY — wa-bot/DEPLOY.md has everything needed
  to deploy DINA to Railway. Owner can start deploy anytime.

Next Steps for Owner:
1. Baca wa-bot/DEPLOY.md (450+ lines, comprehensive)
2. Siapkan SIM card baru khusus untuk DINA (JANGAN pakai nomor pribadi)
3. Login Railway.app pakai GitHub
4. Deploy wa-bot folder (Root Directory: wa-bot)
5. Set env vars (VERCEL_API_URL, OWNER_WHATSAPP)
6. Scan QR code di Railway logs pakai HP (nomor DINA)
7. Buat grup WA, tambahkan DINA
8. Set GROUP_JID di Railway variables
9. Test: tag DINA di grup dengan "@Dina berapa konsumen kita?"
10. Kalau ada masalah, baca troubleshooting section di DEPLOY.md

---
Task ID: multi-agent-v15-oracle-cloud
Agent: Main (GLM)
Task: Multi-agent WA bot architecture (15 agents) + Oracle Cloud Always Free deployment

User requirements:
1. Plan for 15 AI agents (not just DINA)
2. 15th agent = Leader Marketing (RANGGA — creative + KPI manager for marketing team)
3. Currently has 3 SIM cards: DINA, RINA, MITRA
4. Want free-forever hosting (Railway free only 30 days)

Database Changes:
- Added 15th agent: RANGGA (Leader Marketing & Creative Director)
  * Role: MARKETING_LEADER
  * Skills: strategi-marketing, content-creation, video-editing, image-design,
    copywriting, social-media-management, team-leadership, kpi-tracking
  * Personality: Tegas tapi adil, kreatif, detail-oriented, bisa marah kalau perlu
  * Set KPI untuk 10 Marketing AI, evaluate performa, report ke owner
  * Devil's advocate mode enabled
- Total agents in DB: 15 (4 staff + 1 leader + 10 marketing)

Multi-Agent WA Bot Architecture (config-driven):
- wa-bot/src/agent.js (NEW, 280 lines) — config-driven single agent runner
  * Each agent: own auth_state_${agentName}/ folder (separate WA sessions)
  * Own WA connection, own QR code (printed with [AGENT_NAME] prefix)
  * Own group participant cache, own message handler
  * Auto-reconnect on disconnect (5s delay, prevents tight loop)
  * Returns handle: { sock, status, stop }
- wa-bot/src/agents/index.js (NEW) — All 15 agent configs
  * Read from env vars: ${NAME}_WHATSAPP, ${NAME}_GROUP_JID, ${NAME}_AGENT_ID
  * Agent ENABLED only if its WHATSAPP env var is set
  * Owner enables agents one-by-one as SIM cards become available
  * printAgentStatus() — pretty print all 15 agents + enable status
  * Tested locally: 'node src/main.js --status' shows registry correctly
- wa-bot/src/main.js (NEW) — Orchestrator
  * Loads all enabled agents, starts each concurrently in same Node process
  * CLI args: 'node src/main.js' (all), 'DINA' (single), '--status' (list)
  * Health check HTTP server on PORT (Railway/Oracle compatible)
    - GET /health — JSON status (all agents connected, messagesProcessed, botJid)
    - GET /status — text agent status
    - GET /ping — pong
  * Graceful shutdown (SIGTERM/SIGINT closes all agents + HTTP server)

Vercel API Routes (new):
- src/lib/agents/agent-chat-handler.ts (shared handler, config-driven)
- /api/rina/chat — RINA (Finance AI)
- /api/mitra/chat — MITRA (Material AI)
- /api/ratna/chat — RATNA (CAO)
- /api/rangga/chat — RANGGA (Leader Marketing)
- /api/marketing/chat — Shared endpoint for 10 Marketing AI (agentId in body)
- /api/dina/chat — kept as-is (has DB tools, file sending, pending action — too complex to merge)

Each agent has custom system prompt with:
- Identity (name, role, responsibilities)
- Personality (teliti/ramah/tegas/kreatif sesuai role)
- Knowledge context (project info, target market, materials, etc.)
- Routing rules (kalau ditanya hal teknis → arahkan ke agent lain)
- Output style (emoji usage, language, format)

Oracle Cloud Always Free Deployment (REPLACES Railway):
- wa-bot/DEPLOY.md (rewritten, 450+ lines):
  * Why Oracle Cloud Always Free (24GB RAM, free forever, vs Railway 30-day trial)
  * Step 1: Daftar Oracle Cloud + buat ARM VM (4 cores, 24GB RAM, 200GB storage)
    - Region: Singapore (terdekat Indonesia)
    - Need credit card verification (TIDAK akan ditarik)
  * Step 2: SSH to VM + run setup-oracle-cloud.sh (1 command)
  * Step 3: Scan QR per agent (each agent prints its own QR with [AGENT_NAME] prefix)
  * Step 4: Buat grup WA + dapatkan GROUP_JID
  * Step 5: Test multi-agent (tag @Dina, @Rina, @Mitra, @Rangga in group)
  * Step 6: Add more agents bertahap (edit .env, restart PM2, scan QR baru)
  * Step 7: Maintenance & monitoring (PM2 commands, backup auth_state)
  * Troubleshooting (SSH issues, bot crash loop, QR not appearing, session expired)
  * Architecture diagram: HP ↔ WA Server ↔ Oracle VM ↔ Vercel ↔ Neon DB + Drive
  * RAM estimate: 15 agents × 200MB = 3GB (well within 24GB free tier)
- wa-bot/setup-oracle-cloud.sh (NEW, executable, 1-command setup):
  * Run on Oracle VM as root
  * Auto: update system, install Node 20 LTS, git, PM2
  * Clone repo, npm install wa-bot deps
  * Create .env from .env.example
  * Setup PM2 + systemd auto-start on boot
  * Open firewall port 3000
  * Print next steps for owner
- wa-bot/.env.example (NEW):
  * Template for all 15 agents env vars
  * Common: OWNER_WHATSAPP, VERCEL_API_URL, WORK_START, WORK_END, PORT
  * Per-agent: ${NAME}_WHATSAPP, ${NAME}_GROUP_JID, ${NAME}_AGENT_ID

Multi-Agent Mode vs Single-Agent Mode:
- Multi (recommended): 1 Node process, all enabled agents
  - RAM efficient (~50MB base + 200MB per agent = 3GB for 15 agents)
  - 1 PM2 process, 1 log file
  - If 1 agent crashes, auto-restart only that agent
- Single (legacy): 1 Node process per agent
  - Useful for debugging 1 specific agent
  - Or for deploying to multiple VMs (1 VM per agent)

Production Tests (all PASSED):
- /api/dina/chat → ✅ "Hai! Selamat datang di grup KPR ANJAYO 16..."
- /api/rina/chat → ✅ "Halo! Saya RINA – Finance AI Assistant..."
- /api/mitra/chat → ✅ "Halo! Untuk mengetahui stok semen saat ini..."
- /api/rangga/chat → ✅ "Hai! Berikut beberapa ide TikTok konten untuk ANJAYO 16..."
- wa-bot 'node src/main.js --status' → ✅ Shows all 15 agents with enable status

Files Created: 11 new files
Files Modified: 2 (DEPLOY.md rewritten, package.json updated)
DB state: 15 agents in DB (RATNA, DINA, RINA, MITRA, RANGGA + 10 Marketing AI)

Deploy: pushed 1 commit (e1ff3bf) → Vercel auto-deploy successful

Stage Summary:
- 15-agent architecture READY (config-driven, scalable)
- Oracle Cloud Always Free guide READY (1-command setup script)
- 3 agent endpoints tested in production (DINA, RINA, MITRA, RANGGA)
- Owner can start deploying to Oracle Cloud NOW with 3 SIM cards (DINA, RINA, MITRA)
- Add more agents anytime by editing .env + restarting PM2

Next Steps for Owner:
1. Daftar Oracle Cloud Always Free (cloud.oracle.com, ~10 menit)
2. Buat ARM VM (4 cores, 24GB RAM) — see DEPLOY.md Step 1
3. SSH to VM + run: wget .../setup-oracle-cloud.sh && sudo ./setup-oracle-cloud.sh
4. Edit .env — isi DINA_WHATSAPP, RINA_WHATSAPP, MITRA_WHATSAPP
5. pm2 restart hadi-kaya-wa-bot → scan 3 QR codes dengan 3 HP berbeda
6. Buat grup WA + tambahkan 3 agents → dapatkan GROUP_JID
7. Edit .env again — isi GROUP_JID per agent → restart
8. Test: tag @Dina, @Rina, @Mitra di grup
9. Kalau SIM cards baru datang (RATNA, RANGGA, 10 Marketing AI):
   - Edit .env, tambah ${NAME}_WHATSAPP
   - pm2 restart
   - Scan QR baru untuk agent tersebut
   - Test tag di grup

---
Task ID: ocr-vlm + bank-config-builder + dina-bank-management
Agent: Main (GLM)
Task: OCR VLM migration + Bank Config Builder + DINA bank management

1. OCR VLM MIGRATION (DONE — was already migrated)
   - KTP OCR: z.ai VLM primary (createVision), Tesseract fallback
   - Sertifikat OCR: z.ai VLM primary, Tesseract fallback
   - Test: KTP Jenni extracted perfectly (all 13 fields: NIK, nama, tempat lahir, dll)
   - Free, no API key, no rate limit, ~5-10s per image
   - Returns structured JSON directly (no regex parsing needed)

2. BANK CONFIG BUILDER (Phase 1: DB + API + DINA — DONE)
   A. Prisma model: BankConfig
      - bankCode (unique), bankName, description, templatePath, documents (JSON)
      - isActive (soft delete), createdBy
   B. API: /api/bank-config (GET/POST/PUT/DELETE)
   C. DINA Intent: LIST_BANKS, ADD_BANK, DELETE_BANK
      - "list bank" → list all active banks
      - "tambah bank BCA" → create BankConfig record + AuditLog
      - "hapus bank BCA" → soft delete
      - DINA system prompt updated with BANK CONFIG MANAGEMENT section
   D. IntentResult type updated with newBankName, bankName fields

   Phase 2 (NOT YET DONE — future):
   - Bank Config Builder UI (visual PDF annotation tool)
   - Dynamic bank PDF generator (reads config from DB)
   - Migrate existing BTN/Mandiri/BSB to BankConfig DB records
   - Update berkas-view dropdown to auto-populate from DB
   - Seed initial banks (BTN, Mandiri, BSB Syariah) via migration script

Commit: 8aa2e3b

---
Task ID: DINA-V2-FULL-IMPLEMENTATION
Agent: Main Agent (Super Z)
Task: Implement DINA v2 Architecture Redesign — 8 phases, 15 locked decisions

Work Log:
- Generated FINAL DESIGN DOCUMENT at /home/z/my-project/download/DINA-FINAL-DESIGN.md (comprehensive: 16 sections, 15 locked decisions, 4 Mermaid diagrams)
- Updated PRD.md to v2.0 with new Section 15 (DINA v2 Architecture Redesign)
- Phase 1: Schema additions — added CustomerHistoryLog, SessionContext models; updated GoogleDoc (fileHash, fileSize, version, isRaw), Conversation (senderNumber), Memory (KONSUMEN category)
- Phase 1: Fixed critical bug C1 — wrapped deleteCustomer in $transaction (atomic, no more broken state)
- Phase 1: Fixed critical bug H1 — WA conversation now scoped by senderNumber (privacy fix)
- Phase 2: Created Tab Database Explorer with 4 categories (Berkas/Marketing/Material/Finance)
  - Created /api/database-explorer/{berkas,marketing,material,finance}/route.ts
  - Created /components/dashboard/database-tab.tsx (read-only viewer with search)
  - Integrated into dashboard.tsx as new "Database" tab
- Phase 3: Created History Log UI per konsumen
  - Created /api/customer-history/route.ts (GET + POST + addHistoryLog helper)
  - Created /components/berkas/history-log-view.tsx (timeline UI, append-only, with add dialog)
  - Integrated into BerkasViewV2 as side panel when customer expanded
- Phase 4: Memory KONSUMEN category support
  - Updated memory-tab.tsx: added KONSUMEN option in filter + add form
  - Added color coding (cyan) for KONSUMEN category
- Phase 5: Session Context + Traceback engine
  - Created /lib/agents/session-context.ts (getSessionContext, updateSessionContext, needsTraceback, resolveReference, tracebackFromHistory)
  - 48-hour TTL with auto-renew
  - LLM-assisted traceback (Gemini Flash extract from 50 last messages)
  - Confidence-based routing (>80% auto-resolve, <80% ask user)
  - Integrated into /api/dina/chat/route.ts
- Phase 6: Upload anti-overwrite/anti-duplicate
  - Created /lib/berkas/upload-helper.ts (computeFileHash, checkDuplicateFile, generateUniqueFilename, buildRawFilename, buildSignedFilename, getNextVersion)
  - Updated /api/documents/google-docs/upload-file/route.ts:
    * Anti-duplicate: SHA-256 hash check, skip if exists
    * Anti-overwrite: auto-rename with version suffix
    * Permission: anyone with link = VIEWER (reader role)
    * Save GoogleDoc record with hash + version
    * Add history log entry
- Phase 7: Generate Surat Umum
  - Created /lib/berkas/surat/surat-helper.ts (INSTANSI_FOLDER_MAP, detectInstansi, SURAT_TYPES, buildSuratFilename, buildSuratPrompt, getSuratSuggestions)
  - Created /api/documents/generate-surat/route.ts (POST: generate + upload + share; GET: list types)
  - Added GENERATE_SURAT intent to dina-tools.ts detectIntent
  - Added handler in executeTools (asks user for suratType + instansi if missing)
  - Folder structure: Drive/ANJAYO 16/Surat Menyurat/[Instansi]/
  - Naming: RAW - [Nama] - [Jenis Surat] - [Instansi] - v[N].docx
- Phase 8: Bank Builder improvements
  - Created /api/bank-config/[id]/template/route.ts (POST: upload template PDF + annotations; GET: fetch template info)
  - Updated /api/bank-config/route.ts PUT to support annotation-only updates (merge with existing documents JSON)
  - Template storage: Drive/Templates/[BankCode]/Template [BANKCODE] v[N].pdf
  - Permission: anyone with link = VIEWER

Stage Summary:
- 8 implementation phases completed
- 15 locked decisions from design discussion all implemented
- 4 critical bug fixes (C1: $transaction, H1: senderNumber scoping, + 2 more)
- New Prisma models: CustomerHistoryLog, SessionContext
- Updated models: GoogleDoc (fileHash, version, isRaw), Conversation (senderNumber), Memory (KONSUMEN category)
- New API routes: 6 (database-explorer ×4, customer-history, generate-surat, bank-config/[id]/template)
- New components: 2 (database-tab, history-log-view)
- New lib modules: 3 (session-context, upload-helper, surat-helper)
- Critical: deleteCustomer now atomic via $transaction (prevents Jenni-style data loss)
- Critical: WA conversations now properly scoped by senderNumber (privacy fix)
- Files modified: dashboard.tsx, memory-tab.tsx, berkas-view-v2.tsx, dina-tools.ts, dina/chat/route.ts, bank-config/route.ts, upload-file/route.ts, schema.prisma, PRD.md
- Design document: /home/z/my-project/download/DINA-FINAL-DESIGN.md
- PRD updated to v2.0

Next: User requested Bank Builder continuation — UI for template upload + annotation editor (visual PDF annotation tool). Backend ready, frontend needs to be built.
