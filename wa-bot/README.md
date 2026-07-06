# DINA WhatsApp Bot (Baileys)

Deploy ke Railway.app untuk connect DINA ke WhatsApp.

## Setup

### 1. Deploy ke Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd wa-bot
railway init
railway up
```

### 2. Set Environment Variables di Railway
```
VERCEL_API_URL=https://hadi-kaya-virtual-office.vercel.app
OWNER_WHATSAPP=628117176687
GROUP_JID= (isi setelah join grup)
BOT_NAME=DINA
WORK_START=9
WORK_END=17
```

### 3. Scan QR Code
- Buka Railway dashboard → Deployments → klik deployment terbaru
- Lihat logs → QR code muncul
- Scan dengan WhatsApp di HP

### 4. Test
- Chat DINA di WhatsApp (private chat)
- Atau mention DINA di grup

## Features
- ✅ Private chat: hanya owner yang dibalas
- ✅ Grup chat: semua orang dibalas (mention @DINA atau ketik "Dina ...")
- ✅ Work hours: 9-17 Senin-Sabtu (configurable)
- ✅ Auto-reject calls
- ✅ Send files (KTP, KK, dll) via WA
- ✅ Multi-channel sync (chat di WA ↔ chat di sistem)
- ✅ Queue messages saat offline → auto-reply saat online

## Work Hours Schedule
DINA aktif: 9:00 - 17:00 (Senin-Sabtu)
DINA offline: Minggu & di luar jam kerja
Pesan masuk saat offline → dijawab otomatis saat online kembali

## Multiple AI Agents
Untuk menjalankan DINA, RINA, MITRA di 1 Railway service:
1. Copy `src/index.js` → `src/dina.js`, `src/rina.js`, dll
2. Set env vars berbeda per agent (BOT_NAME, OWNER_WHATSAPP, WORK_START/END)
3. Buat `src/main.js` yang import dan jalankan semua agent sekaligus
4. 1 Railway service = 1 hitungan jam (berapa pun AI di dalamnya)
