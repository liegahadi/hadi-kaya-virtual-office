# Hadi Kaya Virtual Office - Project Context

## Overview
Sistem Virtual Office untuk PT. Marlindo Bangun Persada (developer properti "Anjayo 16" di Pangkalpinang).
Mengelola KPR document generation untuk 3 bank (BTN, Mandiri, BSB Syariah) + BPHTB + Notaris workflows.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: Neon PostgreSQL + Prisma ORM
- **UI**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **PDF**: pdf-lib (overlay), html2canvas-pro + jsPDF (React→PDF)
- **Google Integration**: Google Drive API + Google Docs API (OAuth 2.0)
- **OCR**: Tesseract.js (KTP & Sertifikat auto-fill)
- **Deployment**: Vercel (auto-deploy from GitHub)

## Repository
- **GitHub**: https://github.com/liegahadi/hadi-kaya-virtual-office
- **Live**: https://hadi-kaya-virtual-office.vercel.app/

## Key Directories
```
src/app/api/           # API routes (auth, documents, customers, ocr, etc.)
src/components/        # React components (berkas-view-v2, modals, docs)
src/lib/berkas/        # Types, constants, formatters, overlay field configs
src/lib/google/        # Google OAuth, folders, static-map, template-filler
src/prisma/            # Database schema
public/templates/      # PDF + DOCX templates
scripts/               # Template generators, annotation extractors
```

## Environment Variables
- DATABASE_URL (Neon PostgreSQL)
- GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET
- GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY (legacy)
- GOOGLE_DRIVE_FOLDER_ID (legacy)

## Build & Deploy
```bash
npm install
npm run dev          # Dev server
npm run build        # Production build
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to DB
npx tsx scripts/generate-docx-templates.ts  # Generate 20 .docx templates
git push origin main # Auto-deploy to Vercel
```

## Important Notes
- App default theme is DARK (modals must override with text-slate-900 + colorScheme:light)
- Google Docs API uses replaceAllText (not replaceText)
- OAuth redirect URI must use production URL
- SK+Slip uses overwrite system (1 file per customer in Drive)
