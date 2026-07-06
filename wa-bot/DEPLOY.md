# 🚀 DEPLOY DINA WHATSAPP BOT — Step by Step

Panduan lengkap deploy DINA WhatsApp bot ke Railway (gratis 500 jam/bulan).

## 📋 PRASYARAT

Pastikan ini sudah siap sebelum mulai:

| Item | Status | Catatan |
|------|--------|---------|
| Akun Railway.app | ☐ | Daftar gratis di https://railway.app (login pakai GitHub) |
| Vercel project live | ☐ ✅ | https://hadi-kaya-virtual-office.vercel.app |
| Google Drive OAuth | ☐ | Owner sudah login Google di dashboard |
| Nomor WhatsApp khusus untuk DINA | ☐ | Jangan pakai nomor pribadi (lihat catatan di bawah) |
| Grup WhatsApp sudah dibuat | ☐ | DINA + kamu di grup ini |

### ⚠️ PENTING — Nomor WhatsApp untuk DINA

**JANGAN pakai nomor WA pribadi kamu** untuk DINA. Alasannya:

1. Kalau DINA login via nomor kamu, WA Web session di HP kamu akan **logout** (WA only allows 1 device link per number)
2. DINA butuh nomor sendiri supaya kamu tetap bisa chat di WA pribadi
3. Kalau nomor DINA diblokir WA, nomor pribadi kamu aman

**Opsi:**
- Beli SIM card baru (~Rp 10-25rb) khusus untuk DINA
- Atau pakai nomor lama yang gak dipakai lagi
- Atau pakai nomor virtual (Virtual Number) — tapi fiturnya terbatas

---

## 🎯 STEP 1: Setup Railway Project

### 1.1 Login ke Railway
1. Buka https://railway.app
2. Klik **Login** → Login pakai GitHub (`liegahadi`)
3. Authorize Railway untuk akses GitHub

### 1.2 Deploy wa-bot dari GitHub
**Option A — Deploy dari GitHub repo (RECOMMENDED):**

1. Di Railway dashboard, klik **New Project**
2. Pilih **Deploy from GitHub repo**
3. Pilih repo: `liegahadi/hadi-kaya-virtual-office`
4. Di **Settings**:
   - **Root Directory**: `wa-bot` ← PENTING! Hanya deploy folder wa-bot, bukan seluruh project
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Klik **Deploy**

**Option B — Deploy via Railway CLI:**

```bash
# Install Railway CLI (one-time)
npm install -g @railway/cli

# Login
railway login

# Clone repo + cd ke wa-bot
git clone https://github.com/liegahadi/hadi-kaya-virtual-office.git
cd hadiya-kaya-virtual-office/wa-bot

# Init Railway project di folder ini
railway init

# Deploy
railway up
```

---

## ⚙️ STEP 2: Set Environment Variables

Di Railway dashboard → klik project kamu → tab **Variables**, klik **New Variable** dan tambahkan:

| Variable Name | Value | Wajib? |
|---------------|-------|--------|
| `VERCEL_API_URL` | `https://hadi-kaya-virtual-office.vercel.app` | ✅ WAJIB |
| `OWNER_WHATSAPP` | `628117176687` (nomor kamu, tanpa + atau 0 di depan) | ✅ WAJIB |
| `BOT_NAME` | `DINA` | Optional (default: DINA) |
| `WORK_START` | `9` (jam mulai kerja, 24-hour format) | Optional (default: 9) |
| `WORK_END` | `17` (jam selesai kerja) | Optional (default: 17) |
| `GROUP_JID` | *(kosong dulu — isi setelah Step 4)* | Optional awal, WAJIB setelah join grup |

### Format Nomor WhatsApp
- ❌ SALAH: `+628117176687`, `08117176687`, `628117176687@s.whatsapp.net`
- ✅ BENAR: `628117176687` (hanya angka, kode negara tanpa +)

---

## 📱 STEP 3: Scan QR Code WhatsApp

1. Di Railway dashboard → klik deployment terbaru (yang statusnya **Deployed**)
2. Buka tab **Logs**
3. Tunggu sampai muncul QR code di logs (ASCII art, kira-kira 1-2 menit setelah deploy)
4. **Scan QR code** pakai HP:
   - Buka WhatsApp di HP (nomor yang kamu khususkan untuk DINA)
   - Menu → **Linked Devices** → **Link a Device**
   - Scan QR code yang muncul di Railway logs
5. Setelah berhasil scan, log akan muncul:
   ```
   ✅ DINA berhasil terhubung ke WhatsApp!
      Owner: 628117176687
      Group JID: (belum diset)
      Work hours: 9:00 - 17:00 (Mon-Sat)
      Bot Number: 6281xxxxxxx@s.whatsapp.net
   ```

**Catatan:**
- QR code expired setelah ~60 detik. Kalau expired, redeploy atau restart service di Railway
- Kalau gagal scan berkali-kali, hapus folder `auth_state` (di Railway volume) lalu redeploy

---

## 👥 STEP 4: Tambahkan DINA ke Grup + Dapatkan GROUP_JID

### 4.1 Buat Grup WhatsApp
1. Di HP, buka WhatsApp (nomor pribadi kamu, BUKAN nomor DINA)
2. Buat grup baru, contoh: "Anjayo 16 — Virtual Office"
3. Tambahkan nomor DINA ke grup (sebagai participant)

### 4.2 Dapatkan GROUP_JID
**Cara 1 — Lewat Railway logs (paling gampang):**

1. Setelah DINA join grup, kirim pesan apa saja di grup (contoh: "test")
2. Buka Railway dashboard → Logs
3. Cari log yang menyebut `group-participants.update` atau message dari grup
4. GROUP_JID format-nya: `120363xxxxxxxxx@g.us` (panjang, angka+@g.us)
5. Copy JID tersebut

**Cara 2 — Lewat WA Web:**

1. Buka https://web.whatsapp.com di browser (login pakai nomor kamu)
2. Buka grup yang sudah DINA join
3. Lihat URL di browser: `https://web.whatsapp.com/send?phone=...` atau copy link grup
4. GROUP_JID ada di akhir URL (format: `XXXXXXXX@g.us`)

### 4.3 Set GROUP_JID di Railway
1. Railway dashboard → tab **Variables**
2. Edit `GROUP_JID`, isi dengan JID yang kamu dapat (contoh: `120363123456789@g.us`)
3. Save → Railway akan auto-redeploy

---

## 🧪 STEP 5: Test DINA di WhatsApp

Setelah deploy + scan QR + set GROUP_JID, test scenarios berikut:

### 5.1 Test di Grup (REQUIRES @tag)

| Test | Pesan | Expected Response |
|------|-------|-------------------|
| Tag DINA | `@Dina berapa konsumen kita?` | DINA jawab jumlah konsumen |
| Tanpa tag | `berapa konsumen kita?` | DINA diam (no response) |
| Tag + minta berkas | `@Dina minta berkas Hadi` | DINA list file dari Drive |
| Tag + kirim berkas | `@Dina kirim yang nomor 1` | DINA kirim PDF ke grup |

### 5.2 Test Private Chat (DM)

| Test | Pengirim | Expected Response |
|------|----------|-------------------|
| DM dari nomor kamu (owner) | Owner | DINA respon normal |
| DM dari nomor random (non-owner) | Random | DINA diam total (silent ignore) |
| DM dari nomor yang sudah di grup | Non-owner anggota grup | DINA balas "hanya melayani di grup" |

### 5.3 Test Permission Matrix

| Aksi | Owner DM | Owner Grup | Anggota Grup Lain |
|------|----------|------------|-------------------|
| "berapa konsumen?" | ✅ | ✅ (tag) | ✅ (tag) |
| "ubah NIK Jenni jadi 123" | ✅ | ✅ (tag) | ✅ (tag) |
| "tambah konsumen Budi F7" | ✅ | ✅ (tag) | ✅ (tag) |
| "hapus konsumen Jenni" | ✅ (confirm) | ✅ (confirm) | ❌ "hanya owner" |
| "ya" (konfirmasi hapus) | ✅ eksekusi | ✅ eksekusi | ❌ reject |

---

## 🔧 STEP 6: Monitor & Maintain

### 6.1 Cek Status Bot
- Railway dashboard → Deployments → status harus **Active** / **Deployed**
- Logs tab → pastikan tidak ada error berulang
- Setiap kali HP restart / WA logout, QR code baru akan muncul di logs → scan lagi

### 6.2 Auto-Restart Kalau Crash
Railway otomatis restart service kalau crash. Tapi kalau sering crash:
- Cek logs → identifikasi error
- Kalau `auth_state` corrupt → hapus volume, redeploy, scan QR baru

### 6.3 Update Code
Setiap kali kamu push code ke GitHub `main` branch:
- Vercel auto-deploy (web app)
- **Railway TIDAK auto-deploy** by default

Untuk update wa-bot di Railway:
1. Railway dashboard → project wa-bot
2. Klik **Deploy** → **Deploy Latest Commit**
3. Atau via CLI: `railway up` (dari folder wa-bot)

### 6.4 Cek Penggunaan Jam Gratis
- Railway free tier: 500 jam/bulan (~21 hari aktif terus)
- DINA work hours: 9-17 (8 jam/hari) × 26 hari = 208 jam/bulan ✅ Aman
- Kalau excess, bisa upgrade ke Developer Plan ($5/bulan, unlimited)

---

## 🚨 TROUBLESHOOTING

### Problem: QR Code tidak muncul di logs
**Solusi:**
1. Cek logs — pastikan service start berhasil (no npm install error)
2. Tunggu 1-2 menit (QR generate butuh waktu)
3. Kalau gak muncul juga, **Redeploy**:
   - Railway dashboard → Settings → **Redeploy**
4. Setelah redeploy, cek logs lagi

### Problem: Scan QR berhasil tapi DINA gak respon
**Solusi:**
1. Cek `VERCEL_API_URL` — harus `https://hadi-kaya-virtual-office.vercel.app` (tanpa `/` di akhir)
2. Cek `OWNER_WHATSAPP` — format harus `628117176687` (tanpa + atau 0 di depan)
3. Test Vercel endpoint manual:
   ```bash
   curl -X POST https://hadi-kaya-virtual-office.vercel.app/api/dina/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```
   Kalau response `{success: true, ...}` → Vercel OK, masalah di Railway
4. Cek Railway logs — pastikan tidak ada fetch error ke Vercel

### Problem: DINA respon di grup walau gak di-tag
**Solusi:**
1. Pastikan code terbaru sudah ter-deploy (v8.1+)
2. Cek `GROUP_JID` di Railway variables — kalau kosong, DINA gak bisa validasi grup
3. Redeploy setelah set GROUP_JID

### Problem: DINA bilang "Google Drive belum terhubung"
**Solusi:**
1. Login ke dashboard: https://hadi-kaya-virtual-office.vercel.app
2. Buka Settings → Google Integration → Login dengan Google
3. Setelah login, test lagi di WA

### Problem: File PDF gak terkirim di WA
**Solusi:**
1. Cek UKURAN file — WA membatasi document max ~100MB. Untuk KTP/slip gaji seharusnya kecil (< 5MB)
2. Cek logs di Railway — cari "Send file error"
3. Kalau file dari Google Drive, pastikan docId valid (gak dihapus di Drive)

### Problem: Bot logout sendiri / WA session expired
**Solusi:**
1. Cek HP — pastikan HP terhubung internet
2. Buka WhatsApp → Linked Devices → cek apakah "DINA" masih linked
3. Kalau sudah disconnect, scan QR baru (lihat Step 3)

---

## 📞 SUPPORT

Kalau masalah masih persist setelah ikuti panduan ini:

1. **Cek Railway logs** lengkap (last 24 hours)
2. **Cek Vercel function logs** di Vercel dashboard → Functions → `/api/dina/chat`
3. **Cek database state** — jalankan `npx tsx scripts/check-db.ts` di local
4. **Cek AuditLog** — `npx tsx scripts/check-pending.ts` (lihat log semua operasi DINA)

---

## 📚 APPENDIX

### A. Arsitektur DINA WA Bot

```
[HP Kamu (Grup)] ↔ [WhatsApp Server] ↔ [Railway: wa-bot (Baileys)]
                                                  ↓ HTTP POST
                                          [Vercel: /api/dina/chat]
                                                  ↓
                                          [DINA AI (Gemini/Nemotron)]
                                                  ↓
                                          [Neon DB + Google Drive]
                                                  ↓
                                          [Response + files[]]
                                                  ↓
                                          [Railway: wa-bot sends WA message + files]
```

### B. Code Structure wa-bot/

```
wa-bot/
├── package.json          # Dependencies (@whiskeysockets/baileys, pino, qrcode-terminal)
├── README.md             # Quick start (this file's summary)
├── DEPLOY.md             # This file — comprehensive deploy guide
└── src/
    └── index.js          # Main bot logic (350+ lines)
        ├── Group participant cache (5-min TTL)
        ├── Strict @tag detection in groups
        ├── DM permission check (owner vs group member vs stranger)
        ├── sendFile() — supports image/PDF/Word/generic via mimeType
        ├── Auto-reject calls
        ├── Work hours schedule (9-17 Mon-Sat, configurable)
        └── Multi-agent ready (DINA, RINA, MITRA in 1 service)
```

### C. Environment Variables Reference

```env
# Required
VERCEL_API_URL=https://hadi-kaya-virtual-office.vercel.app
OWNER_WHATSAPP=628117176687

# Required after joining group
GROUP_JID=120363xxxxxxxxx@g.us

# Optional
BOT_NAME=DINA
WORK_START=9
WORK_END=17
```

### D. Railway Free Tier Limits

| Resource | Limit | DINA Usage |
|----------|-------|------------|
| Hours | 500 hours/month | ~208 hours (8h × 26 days) ✅ |
| RAM | 512MB | ~100-200MB ✅ |
| Storage | 1GB | < 100MB ✅ |
| CPU | Shared | Low ✅ |

### E. Multi-Agent Setup (Future)

Untuk jalanin DINA + RINA + MITRA di 1 Railway service:

1. Copy `src/index.js` → `src/dina.js`, `src/rina.js`, `src/mitra.js`
2. Set env vars berbeda per agent:
   - `DINA_OWNER_WHATSAPP=628117176687`
   - `RINA_OWNER_WHATSAPP=628117176687` (sama, owner 1 orang)
   - `DINA_GROUP_JID=...`, `RINA_GROUP_JID=...` (grup berbeda atau sama)
3. Buat `src/main.js` yang import dan jalankan semua agent sekaligus
4. **1 Railway service = 1 hitungan jam** (berapa pun AI di dalamnya, hemat!)
