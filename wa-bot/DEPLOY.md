# 🚀 DEPLOY MULTI-AGENT WA BOT — Oracle Cloud (FREE FOREVER)

Panduan lengkap deploy **15 AI agents** (DINA, RINA, MITRA, RATNA, RANGGA, + 10 Marketing AI) ke Oracle Cloud Always Free.

## 🎯 WHY ORACLE CLOUD ALWAYS FREE?

| Platform | RAM | Always-On? | Cost | For 15 Agents? |
|----------|-----|------------|------|-----------------|
| Railway free trial | ~512MB | ✅ | $5 credit/30 hari lalu $5/bln | ❌ |
| Render free | 512MB | ❌ Sleeps | Free | ❌ Sleeps + low RAM |
| Fly.io free | 256MB × 3 | ✅ | Free (3 VMs) | ⚠️ Split across VMs |
| Koyeb free | 512MB | ✅ | Free | ❌ < 3GB needed |
| **Oracle Cloud Always Free** | **24GB** | **✅ 24/7** | **FREE FOREVER** | **✅ PERFECT** |

**Oracle Cloud Always Free** = 1 VM ARM 4 cores + 24GB RAM + 200GB storage. Bisa handle 15+ WA agents tanpa biaya apa pun selamanya.

---

## 📋 PRASYARAT

| Item | Status | Notes |
|------|--------|-------|
| Akun Oracle Cloud | ☐ | Daftar di https://cloud.oracle.com (butuh kartu kredit verifikasi, **TIDAK akan ditarik**) |
| 15 SIM cards untuk AI agents | ☐ | Beli bertahap, mulai dari 3 (DINA, RINA, MITRA) |
| HP untuk scan QR (boleh 1 HP untuk beberapa nomor via WhatsApp Multi-Device) | ☐ | Setiap nomor butuh WhatsApp terinstall |
| Vercel project live | ☐ ✅ | https://hadi-kaya-virtual-office.vercel.app |
| Google Drive OAuth | ☐ ✅ | Owner sudah login Google di dashboard |

### ⚠️ PENTING — Nomor WhatsApp untuk AI Agents

**JANGAN pakai nomor WA pribadi kamu** untuk AI agents. Alasannya:
1. Baileys (WA Web session) akan **logout** WA pribadi kamu
2. Setiap agent butuh nomor sendiri (gak bisa share nomor)
3. Kalau agent diblokir WA, nomor pribadi kamu aman

**Opsi SIM card:**
- Beli SIM card murah (~Rp 10-25rb per SIM) di minimarket (Telkomsel perdan, XL, Indosat)
- Untuk 15 agents: ~Rp 150-375rb total
- Bisa mulai dari 3 dulu (DINA, RINA, MITRA), tambah sisanya bertahap

---

## 🎯 STEP 1: Daftar Oracle Cloud Always Free

### 1.1 Buat Akun
1. Buka https://cloud.oracle.com → klik **Start for free**
2. Daftar pakai email + buat password
3. Pilih **Home Region: Singapore** (terdekat dengan Indonesia, latency rendah)
4. Verifikasi kartu kredit (TIDAK akan ditarik, cuma verifikasi)
5. Tunggu email konfirmasi (~5-10 menit)

### 1.2 Buat Always Free VM (ARM, 4 cores, 24GB RAM)
1. Login ke Oracle Cloud Console
2. Menu ≡ → **Compute** → **Instances** → **Create Instance**
3. Konfigurasi:
   - **Name**: `hadi-kaya-wa-bot`
   - **Image**: Canonical Ubuntu 22.04
   - **Shape**: `VM.Standard.A1.Flex` (Always Free eligible)
   - **Shape config**: 
     - OCPUs: **4** (max for free tier)
     - Memory: **24 GB** (max for free tier)
   - **Networking**: 
     - Public IPv4 address: **Assign a public IPv4 address** ✅
     -Tambahkan **Ingress Rules** di Security List:
       - Port `22` (SSH) — Source `0.0.0.0/0`
       - Port `3000` (health check) — Source `0.0.0.0/0`
   - **SSH keys**: 
     - Pilih **Save private key** + **Save public key**
     - Simpan kedua file di komputer kamu (penting!)

4. Klik **Create** — tunggu 2-5 menit hingga status = **Running**
5. Catat **Public IP** VM (contoh: `152.70.xxx.xxx`)

---

## 🎯 STEP 2: SSH ke VM + Run Setup Script

### 2.1 SSH ke VM
```bash
# Dari komputer kamu (Linux/Mac)
chmod 400 ssh-key-*.key
ssh -i ssh-key-*.key ubuntu@<VM_PUBLIC_IP>

# Windows: pakai PuTTY atau Git Bash
```

### 2.2 Download + Run Setup Script
```bash
# Di VM (sudah SSH)
wget https://raw.githubusercontent.com/liegahadi/hadi-kaya-virtual-office/main/wa-bot/setup-oracle-cloud.sh
chmod +x setup-oracle-cloud.sh
sudo ./setup-oracle-cloud.sh
```

Script otomatis akan:
- ✅ Update system packages
- ✅ Install Node.js 20 LTS
- ✅ Install git, PM2 (process manager)
- ✅ Clone repo ke `/home/ubuntu/hadi-kaya-virtual-office`
- ✅ Install wa-bot dependencies
- ✅ Create `.env` dari template
- ✅ Setup PM2 + systemd (auto-start on boot)
- ✅ Open firewall port 3000

### 2.3 Edit .env file
```bash
nano /home/ubuntu/hadi-kaya-virtual-office/wa-bot/.env
```

Isi minimal 3 agent dulu (DINA, RINA, MITRA):
```env
# Common
OWNER_WHATSAPP=628117176687
VERCEL_API_URL=https://hadi-kaya-virtual-office.vercel.app
WORK_START=9
WORK_END=17
PORT=3000

# === STAFF AGENTS (mulai dari 3 dulu) ===
DINA_WHATSAPP=6281xxxxxxxx
DINA_GROUP_JID=120363xxx@g.us

RINA_WHATSAPP=6282xxxxxxxx
RINA_GROUP_JID=120363xxx@g.us

MITRA_WHATSAPP=6283xxxxxxxx
MITRA_GROUP_JID=120363xxx@g.us
```

Save: `Ctrl+X` → `Y` → `Enter`

### 2.4 Restart bot + scan QR
```bash
# Restart bot dengan .env baru
sudo -u ubuntu pm2 restart hadi-kaya-wa-bot

# Watch logs (QR code akan muncul di sini)
sudo -u ubuntu pm2 logs hadi-kaya-wa-bot
```

---

## 🎯 STEP 3: Scan QR Code per Agent

Setelah restart, di logs akan muncul QR code untuk **setiap enabled agent**:

```
============================================================
📱 [DINA] Scan QR Code dengan nomor WA DINA:
============================================================
[ASCII QR code here]
============================================================

============================================================
📱 [RINA] Scan QR Code dengan nomor WA RINA:
============================================================
[ASCII QR code here]
============================================================

============================================================
📱 [MITRA] Scan QR Code dengan nomor WA MITRA:
============================================================
[ASCII QR code here]
============================================================
```

**Scan tiap QR dengan HP yang sesuai:**
1. Buka WhatsApp di HP DINA → Menu → Linked Devices → Link a Device → Scan DINA's QR
2. Ulangi untuk RINA (HP RINA), MITRA (HP MITRA)

Setelah semua scan berhasil, log akan muncul:
```
[DINA] ✅ Connected! Bot: 6281xxx@s.whatsapp.net
[RINA] ✅ Connected! Bot: 6282xxx@s.whatsapp.net
[MITRA] ✅ Connected! Bot: 6283xxx@s.whatsapp.net
```

---

## 🎯 STEP 4: Buat Grup WhatsApp + Dapatkan GROUP_JID

### 4.1 Buat grup per agent (atau 1 grup bersama)

**Option A — 1 grup bersama** (recommended, simpel):
1. Buat 1 grup: "Anjayo 16 — Virtual Office"
2. Tambahkan DINA, RINA, MITRA ke grup ini
3. Semua agent pakai GROUP_JID yang sama

**Option B — Grup per agent** (kalau mau separate channel):
- Grup "DINA — Document" (DINA + kamu)
- Grup "RINA — Finance" (RINA + kamu)
- Grup "MITRA — Material" (MITRA + kamu)

### 4.2 Dapatkan GROUP_JID
1. Kirim pesan test di grup (apa saja, contoh: "test")
2. SSH ke VM → cek log:
   ```bash
   sudo -u ubuntu pm2 logs hadi-kaya-wa-bot --lines 50
   ```
3. Cari log yang menyebut `group-participants.update` atau pesan masuk
4. GROUP_JID format: `120363xxxxxxxxx@g.us`

### 4.3 Update .env dengan GROUP_JID
```bash
nano /home/ubuntu/hadi-kaya-virtual-office/wa-bot/.env

# Update setiap GROUP_JID:
DINA_GROUP_JID=120363xxx@g.us
RINA_GROUP_JID=120363xxx@g.us
MITRA_GROUP_JID=120363xxx@g.us

# Save & restart
sudo -u ubuntu pm2 restart hadi-kaya-wa-bot
```

---

## 🎯 STEP 5: Test Multi-Agent di WhatsApp

### 5.1 Test tag agent di grup

| Test | Pesan | Expected |
|------|-------|----------|
| Tag DINA | `@Dina berapa konsumen?` | DINA jawab |
| Tag RINA | `@Rina berapa budget tersisa?` | RINA jawab |
| Tag MITRA | `@Mitra stok semen?` | MITRA jawab |
| Tanpa tag | `berapa konsumen?` | Semua diam |
| Tag 2 agents | `@Dina @Rina laporan` | Keduanya jawab |

### 5.2 Test private chat per agent

| Test | Expected |
|------|----------|
| DM DINA dari owner | DINA respon normal |
| DM RINA dari owner | RINA respon normal |
| DM MITRA dari owner | MITRA respon normal |
| DM random stranger | Semua agent silent ignore |

---

## 🎯 STEP 6: Add More Agents (Bertahap)

Kalau kamu sudah beli SIM card untuk agent lain, tinggal:

### 6.1 Edit .env
```bash
nano /home/ubuntu/hadi-kaya-virtual-office/wa-bot/.env

# Tambahkan:
RATNA_WHATSAPP=6284xxxxxxxx
RATNA_GROUP_JID=120363xxx@g.us

RANGGA_WHATSAPP=6285xxxxxxxx
RANGGA_GROUP_JID=120363xxx@g.us

# Save & restart
sudo -u ubuntu pm2 restart hadi-kaya-wa-bot
```

### 6.2 Scan QR untuk agent baru
```bash
sudo -u ubuntu pm2 logs hadi-kaya-wa-bot
# Akan muncul QR baru untuk RATNA, RANGGA, dst.
# Scan dengan HP masing-masing
```

### 6.3 Ulangi untuk 10 Marketing AI
Beli 10 SIM card lagi (untuk Ayu, Bima, Citra, Dian, Eka, Fajar, Gita, Hadi, Indah, Joko), tambahkan ke .env, scan QR.

**Target final:** 15 agents online 24/7 di Oracle Cloud Always Free.

---

## 🎯 STEP 7: Maintenance & Monitoring

### 7.1 Cek status bot
```bash
# PM2 status
sudo -u ubuntu pm2 status

# Health check API
curl http://localhost:3000/health | jq

# Text status
curl http://localhost:3000/status
```

### 7.2 Restart bot
```bash
sudo -u ubuntu pm2 restart hadi-kaya-wa-bot
```

### 7.3 Update code (kalau ada update di GitHub)
```bash
cd /home/ubuntu/hadi-kaya-virtual-office
sudo -u ubuntu git pull
cd wa-bot
sudo -u ubuntu npm install --omit=dev
sudo -u ubuntu pm2 restart hadi-kaya-wa-bot
```

### 7.4 Cek log real-time
```bash
# All agents
sudo -u ubuntu pm2 logs hadi-kaya-wa-bot

# Last 100 lines only
sudo -u ubuntu pm2 logs hadi-kaya-wa-bot --lines 100

# Filter by agent name
sudo -u ubuntu pm2 logs hadi-kaya-wa-bot | grep "\[DINA\]"
```

### 7.5 Auto-restart kalau crash
PM2 otomatis restart kalau process crash. systemd otomatis start PM2 on boot. **Zero-touch recovery.**

### 7.6 Backup auth_state (WA session)
```bash
# Kalau mau pindah VM, backup dulu auth_state-nya
cd /home/ubuntu/hadi-kaya-virtual-office/wa-bot
tar -czf /tmp/wa-auth-backup.tar.gz auth_state_*

# Download ke komputer
scp -i ssh-key-*.key ubuntu@<VM_IP>:/tmp/wa-auth-backup.tar.gz .
```

---

## 🚨 TROUBLESHOOTING

### Problem: VM tidak bisa di-SSH
**Solusi:**
1. Cek Ingress Rules di Oracle Cloud → VCN → Security List → port 22 open untuk `0.0.0.0/0`
2. Cek SSH key file permission: `chmod 400 ssh-key-*.key`
3. Cek public IP VM benar di Oracle Console

### Problem: Bot crash loop
**Solusi:**
```bash
sudo -u ubuntu pm2 logs hadi-kaya-wa-bot --lines 200
# Cek error message
```
Kalau `auth_state_*` corrupt:
```bash
cd /home/ubuntu/hadi-kaya-virtual-office/wa-bot
rm -rf auth_state_*
sudo -u ubuntu pm2 restart hadi-kaya-wa-bot
# Scan QR baru untuk semua agent
```

### Problem: QR Code gak muncul
**Solusi:**
1. Cek `.env` — agent harus `*_WHATSAPP` diisi
2. Restart PM2: `sudo -u ubuntu pm2 restart hadi-kaya-wa-bot`
3. Tunggu 30 detik, lihat logs lagi

### Problem: Agent tidak respon di grup
**Solusi:**
1. Cek `GROUP_JID` di .env — harus persis sama dengan di WA
2. Cek agent sudah join grup
3. Cek tag — pakai `@Dina` (case insensitive), bukan `Dina`
4. Test health check: `curl http://localhost:3000/health`

### Problem: Vercel API error
**Solusi:**
```bash
# Test API dari VM
curl -X POST https://hadi-kaya-virtual-office.vercel.app/api/dina/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```
Kalau response `{success: true}` → Vercel OK, masalah di VM
Kalau error → cek Vercel function logs

### Problem: WA session expired (agent logout sendiri)
**Solusi:**
1. Cek HP — pastikan internet aktif
2. WhatsApp → Linked Devices → cek agent masih linked
3. Kalau sudah disconnect, scan QR baru

---

## 📞 MULTI-AGENT ARCHITECTURE

```
[HP Kamu (Grup Anjayo 16)] 
       ↓ WA messages
[WhatsApp Server]
       ↓
[Oracle Cloud VM (free forever, 24GB RAM)]
   ├── PM2 process manager (auto-restart)
   │   └── Node.js process
   │       ├── DINA agent (auth_state_dina/)
   │       ├── RINA agent (auth_state_rina/)
   │       ├── MITRA agent (auth_state_mitra/)
   │       ├── RATNA agent (auth_state_ratna/)
   │       ├── RANGGA agent (auth_state_rangga/)
   │       └── 10 Marketing AI agents (auth_state_ayu/, etc.)
   └── Health check server (port 3000)
       ↓ HTTP POST per agent
[Vercel API]
   ├── /api/dina/chat (DINA)
   ├── /api/rina/chat (RINA)
   ├── /api/mitra/chat (MITRA)
   ├── /api/ratna/chat (RATNA)
   ├── /api/rangga/chat (RANGGA - Leader Marketing)
   └── /api/marketing/chat (10 Marketing AI)
       ↓
   [Neon DB + Google Drive]
       ↓
   [Response + files[]]
       ↓
   [VM: agent sends WA message + files to group/DM]
```

### RAM Usage Estimate
| Component | RAM |
|-----------|-----|
| Node.js base | ~50MB |
| Per Baileys connection | ~150-200MB |
| 15 agents × 200MB | 3GB |
| PM2 + OS overhead | 200MB |
| **Total** | **~3.3GB** (well within 24GB) ✅ |

---

## 📚 APPENDIX

### A. Code Structure wa-bot/

```
wa-bot/
├── package.json              # Multi-agent scripts (start, start:dina, status)
├── .env.example              # Template for env vars (15 agents)
├── setup-oracle-cloud.sh     # 1-command auto-setup script
├── railway.json              # Legacy Railway config (fallback option)
├── DEPLOY.md                 # This file
├── README.md                 # Quick start
└── src/
    ├── main.js               # Orchestrator: loads all enabled agents, starts each
    ├── agent.js              # Single agent runner (config-driven, ~280 lines)
    └── agents/
        └── index.js          # All 15 agent configs (DINA, RINA, ..., JOKO)
```

### B. Per-Agent env vars
```env
# Common (shared)
OWNER_WHATSAPP=628117176687
VERCEL_API_URL=https://hadi-kaya-virtual-office.vercel.app
WORK_START=9
WORK_END=17
PORT=3000

# Per agent (4 staff + 1 leader + 10 marketing = 15 total)
DINA_WHATSAPP=6281xxxxxxxx
DINA_GROUP_JID=120363xxx@g.us
DINA_AGENT_ID=agent-dina

RINA_WHATSAPP=6282xxxxxxxx
RINA_GROUP_JID=120363xxx@g.us
RINA_AGENT_ID=agent-rina

# ... (see .env.example for full list)
```

### C. Oracle Cloud Always Free Limits
| Resource | Free Tier Limit | DINA Bot Usage |
|----------|-----------------|----------------|
| AMD VMs | 2 × 1/8 OCPU | Not used (ARM only) |
| ARM VMs | 4 cores, 24GB RAM | **1 VM: 4 cores, 24GB** ✅ |
| Block storage | 200GB total | ~5GB (OS + repo + auth_state) ✅ |
| Bandwidth | 10TB/month outbound | ~1GB/month (WA text) ✅ |
| Cost | **FREE FOREVER** | $0 |

### D. Upgrade Path (kalau butuh lebih)
Kalau 15 agents berkembang jadi 30+ agents atau butuh fitur lebih:
- Upgrade ke **Oracle Cloud Paid** ($30-50/bulan, lebih banyak resource)
- Atau pindah ke **VPS Contabo** (~$5/bulan, 8GB RAM)
- Atau **DigitalOcean droplet** ($12/bulan, 2GB RAM)

### E. Backup Strategy
1. **auth_state_***: WA session (penting — kalau hilang, harus scan QR lagi)
   ```bash
   # Cron job: backup harian ke /home/ubuntu/backups
   echo "0 3 * * * tar -czf /home/ubuntu/backups/wa-auth-$(date +\%Y\%m\%d).tar.gz /home/ubuntu/hadi-kaya-virtual-office/wa-bot/auth_state_*" | sudo crontab -
   ```
2. **.env**: konfigurasi agent
3. **PM2 config**: `pm2 save` (auto, simpan di /home/ubuntu/.pm2)

### F. Multi-Agent Mode vs Single-Agent Mode

**Multi-agent (recommended):**
```bash
node src/main.js                    # Start ALL enabled agents
node src/main.js DINA RINA MITRA    # Start specific agents
```
- Semua agent di 1 Node process
- Hemat RAM (~50MB base vs 15 × 50MB = 750MB untuk 15 Node processes)
- Kalau 1 agent crash, auto-restart hanya agent itu

**Single-agent (legacy/fallback):**
```bash
node src/main.js DINA  # Hanya DINA saja
```
- Berguna kalau mau debug 1 agent tertentu
- Atau kalau mau deploy agent ke VM berbeda (1 VM per agent)
