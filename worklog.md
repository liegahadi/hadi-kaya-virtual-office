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
