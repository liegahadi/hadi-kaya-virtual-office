# 🚀 Cara Deploy ke Vercel

## Step 1: Repo Sudah Ada

Repo URL: https://github.com/liegahadi/hadi-kaya-virtual-office

## Step 2: Deploy ke Vercel (Kamu yang kerjakan)

1. Buka https://vercel.com → Login pakai GitHub
2. Klik "New Project"
3. Import repo `hadi-kaya-virtual-office`
4. Di "Environment Variables", masukkan variabel dari file `.env.production` (saya sudah siapkan di repo)
5. Klik "Deploy"
6. Tunggu 2-3 menit → LIVE!

## Step 3: Setup Database (Setelah deploy)

Setelah Vercel live, jalankan:
```
npx prisma db push --accept-data-loss
```

Lalu seed data:
```
bun run scripts/seed.ts
bun run scripts/update-siteplan.ts
bun run scripts/fix-light-llm.ts
bun run scripts/seed-rab.ts
bun run scripts/seed-mandiri-templates.ts
bun run scripts/seed-bsb-templates.ts
bun run scripts/seed-btn-templates.ts
bun run scripts/seed-btn-post-acc.ts
```

## Environment Variables

Lihat file `.env.production` untuk daftar lengkap environment variables yang perlu di-set di Vercel.
