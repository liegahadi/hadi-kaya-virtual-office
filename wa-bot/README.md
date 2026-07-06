# DINA WhatsApp Bot (Baileys)

Deploy ke Railway.app untuk connect DINA ke WhatsApp.

## ⚠️ ATURAN PERILAKU DINA (WAJIB BACA)

### 1. Di Grup: HANYA Respon Jika Di-Tag
- DINA **HANYA** merespon pesan yang **explicitly tag** DINA: `@Dina` atau `@[nomor HP DINA]`
- Pesan yang hanya menyebut nama "Dina" (tanpa @tag) → **DINA diam, tidak respon**
- Pesan yang mengandung kata "dina" di awal → **DINA diam, tidak respon** (kecuali ada @tag)
- Reason: Hindari DINA merespon setiap obrolan di grup. Cukup respons saat dipanggil.

### 2. Private Chat (DM): Berdasarkan Keanggotaan Grup
- **Owner (Hadi — 628117176687)** → respon normal (semua fitur aktif)
- **Non-owner yang SUDAH ada di grup** → DINA balas:
  > "Maaf, saya DINA hanya melayani di grup. Silakan ajukan pertanyaan di grup ya. 🙏"
  - **TIDAK menyebutkan link grup**
- **Non-owner yang BELUM ada di grup** → **DINA diam total, tidak respon sama sekali**
  - Tidak ada pesan auto-reply
  - Tidak ada penolakan
  - Seakan-akan DINA tidak pernah menerima pesan tersebut
- Reason: Prevent random orang yang dapat nomor DINA dari mendapatkan info apapun.

### 3. JANGAN PERNAH Share Link Grup
- DINA **TIDAK PERNAH** membagikan link grup WhatsApp ke siapapun
- Walau owner yang minta, walau non-owner yang minta, walau pihak ketiga
- Jika ditanya "boleh kasih link grup?":
  > "Maaf, untuk privasi grup, link tidak bisa saya share. Mohon hubungi owner (Hadi) untuk diundang ke grup."
- Reason: Hanya owner yang berhak mengundang orang ke grup secara manual.

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
GROUP_JID=120363xxx@g.us   # WAJIB — ambil dari group info di WA
BOT_NAME=DINA
WORK_START=9
WORK_END=17
```

**Cara dapat GROUP_JID:**
1. Tambahkan DINA ke grup WhatsApp
2. Buka WhatsApp Web → grup → lihat URL
3. Atau jalankan di Railway console: lihat log saat pesan grup masuk, format `XYZ@g.us`

### 3. Scan QR Code
- Buka Railway dashboard → Deployments → klik deployment terbaru
- Lihat logs → QR code muncul
- Scan dengan WhatsApp di HP

### 4. Test
- **Di grup**: tag DINA dengan `@Dina [pesan]` → DINA respon
- **Di grup**: ketik "Dina tolong cek berkas" (TANPA @) → DINA **tidak respon**
- **DM dari nomor non-owner yang sudah di grup**: DINA balas "hanya melayani di grup"
- **DM dari nomor random (tidak di grup)**: DINA **tidak respon sama sekali**

## Permission Matrix (di level grup — saat DINA respon karena di-tag)

| Aksi | Owner di DM | Owner di Grup | Anggota Grup Lain |
|------|-------------|---------------|-------------------|
| READ (lihat data, minta berkas) | ✅ | ✅ | ✅ |
| UPDATE (ubah NIK, alamat, dll) | ✅ | ✅ | ✅ |
| CREATE (tambah konsumen baru) | ✅ | ✅ | ✅ |
| DELETE (hapus konsumen) | ✅ (dengan konfirmasi) | ✅ (dengan konfirmasi) | ❌ "hanya owner" |

## Work Hours Schedule
- DINA aktif: 9:00 - 17:00 (Senin-Sabtu, configurable via `WORK_START`/`WORK_END`)
- DINA offline: Minggu & di luar jam kerja
- Pesan masuk saat offline → dijawab "sedang offline" (untuk owner DM)
- Untuk non-owner DM saat offline → silent ignore (sesuai rule #2)

## Features
- ✅ Grup: hanya respon jika di-tag (@Dina)
- ✅ DM non-owner yang di grup: balas "hanya melayani di grup" (tanpa link)
- ✅ DM non-owner yang tidak di grup: silent ignore (diam total)
- ✅ Tidak pernah share link grup ke siapapun
- ✅ Owner DM: semua fitur (READ, UPDATE, CREATE, DELETE dengan konfirmasi)
- ✅ Auto-reject calls
- ✅ Send files (KTP, KK, dll) via WA
- ✅ Multi-channel sync (chat di WA ↔ chat di sistem)
- ✅ Group participant cache (refresh setiap 5 menit + saat ada join/leave)
- ✅ Multi-agent ready (1 Railway service = banyak AI agents)

## Group Participant Cache
Bot menyimpan cache nomor HP anggota grup untuk efisiensi:
- Auto-refresh setiap 5 menit
- Auto-refresh saat ada event `group-participants.update` (orang join/leave)
- Cache empty? → semua non-owner DM dianggap "tidak di grup" (silent ignore, safe default)

## Multiple AI Agents
Untuk menjalankan DINA, RINA, MITRA di 1 Railway service:
1. Copy `src/index.js` → `src/dina.js`, `src/rina.js`, dll
2. Set env vars berbeda per agent (BOT_NAME, OWNER_WHATSAPP, WORK_START/END)
3. Buat `src/main.js` yang import dan jalankan semua agent sekaligus
4. 1 Railway service = 1 hitungan jam (berapa pun AI di dalamnya)
