#!/bin/bash
# ============================================================
# Oracle Cloud Always Free — Auto-setup for Hadi Kaya WA Bot
# ============================================================
# Run this script ON the Oracle Cloud VM (after SSH-ing in).
# It will:
#   1. Update system packages
#   2. Install Node.js 20 LTS
#   3. Install git, pm2 (process manager)
#   4. Clone the repo
#   5. Install wa-bot dependencies
#   6. Setup systemd service for auto-start on boot
#   7. Configure firewall for health check port
#
# Prerequisites:
#   - Oracle Cloud Always Free VM (ARM, Ubuntu 22.04)
#   - SSH'd in as `ubuntu` user
#   - sudo access
#
# Usage:
#   wget https://raw.githubusercontent.com/liegahadi/hadi-kaya-virtual-office/main/wa-bot/setup-oracle-cloud.sh
#   chmod +x setup-oracle-cloud.sh
#   sudo ./setup-oracle-cloud.sh
# ============================================================

set -e  # exit on any error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Hadi Kaya WA Bot — Oracle Cloud Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Check we're on Ubuntu
if ! command -v apt &> /dev/null; then
  echo -e "${RED}❌ This script requires Ubuntu/Debian. Found: $(uname -a)${NC}"
  exit 1
fi

# Check we have sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Please run with sudo: sudo ./setup-oracle-cloud.sh${NC}"
  exit 1
fi

# Get the actual user (not root)
REAL_USER=${SUDO_USER:-ubuntu}
echo -e "${GREEN}Real user: ${REAL_USER}${NC}"

# === Step 1: Update system ===
echo -e "\n${GREEN}[1/8] Updating system packages...${NC}"
apt update -y
apt upgrade -y

# === Step 2: Install Node.js 20 LTS ===
echo -e "\n${GREEN}[2/8] Installing Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo -e "Node version: $(node --version)"
echo -e "npm version: $(npm --version)"

# === Step 3: Install supporting tools ===
echo -e "\n${GREEN}[3/8] Installing git, curl, build-essential...${NC}"
apt install -y git curl build-essential

# === Step 4: Install PM2 (process manager) ===
echo -e "\n${GREEN}[4/8] Installing PM2 globally...${NC}"
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi
echo -e "PM2 version: $(pm2 --version)"

# === Step 5: Clone the repo ===
REPO_DIR="/home/${REAL_USER}/hadi-kaya-virtual-office"
echo -e "\n${GREEN}[5/8] Cloning repo to ${REPO_DIR}...${NC}"
if [ -d "$REPO_DIR" ]; then
  echo -e "${YELLOW}Repo already exists. Pulling latest...${NC}"
  cd "$REPO_DIR"
  sudo -u "$REAL_USER" git pull
else
  sudo -u "$REAL_USER" git clone https://github.com/liegahadi/hadi-kaya-virtual-office.git "$REPO_DIR"
  cd "$REPO_DIR"
fi

# === Step 6: Install wa-bot dependencies ===
echo -e "\n${GREEN}[6/8] Installing wa-bot dependencies...${NC}"
cd "$REPO_DIR/wa-bot"
sudo -u "$REAL_USER" npm install --omit=dev

# === Step 7: Create .env from template ===
ENV_FILE="$REPO_DIR/wa-bot/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "\n${GREEN}[7/8] Creating .env from .env.example...${NC}"
  sudo -u "$REAL_USER" cp .env.example .env
  echo -e "${YELLOW}⚠️  Edit .env file at: $ENV_FILE${NC}"
  echo -e "${YELLOW}   Set DINA_WHATSAPP, RINA_WHATSAPP, MITRA_WHATSAPP, etc.${NC}"
  echo -e "${YELLOW}   Set GROUP_JID for each agent after they join groups${NC}"
else
  echo -e "\n${GREEN}[7/8] .env already exists, skipping...${NC}"
fi

# === Step 8: Setup PM2 + systemd for auto-start ===
echo -e "\n${GREEN}[8/8] Setting up PM2 + systemd auto-start...${NC}"

# Start the bot with PM2 (resurrect if already exists)
cd "$REPO_DIR/wa-bot"
sudo -u "$REAL_USER" pm2 delete hadi-kaya-wa-bot 2>/dev/null || true
sudo -u "$REAL_USER" pm2 start src/main.js --name hadi-kaya-wa-bot
sudo -u "$REAL_USER" pm2 save

# Setup PM2 to auto-start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$REAL_USER" --hp "/home/${REAL_USER}"
sudo -u "$REAL_USER" pm2 save

# === Open firewall for health check port ===
echo -e "\n${GREEN}Opening firewall for port 3000...${NC}"
if command -v ufw &> /dev/null; then
  ufw allow 3000/tcp || true
  ufw allow ssh || true
  echo -e "${YELLOW}⚠️  UFW is active. Make sure Oracle Cloud security list also allows port 3000.${NC}"
fi

# === Done ===
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit .env: ${YELLOW}nano $REPO_DIR/wa-bot/.env${NC}"
echo -e "     Set DINA_WHATSAPP=6281xxxxxxxx (your DINA SIM number)"
echo -e "     Set DINA_GROUP_JID=120363xxx@g.us (after DINA joins group)"
echo ""
echo -e "  2. Restart bot: ${YELLOW}sudo -u $REAL_USER pm2 restart hadi-kaya-wa-bot${NC}"
echo ""
echo -e "  3. Watch logs to scan QR: ${YELLOW}sudo -u $REAL_USER pm2 logs hadi-kaya-wa-bot${NC}"
echo -e "     Each agent will print its own QR code."
echo -e "     Scan DINA's QR with DINA's phone, RINA's QR with RINA's phone, etc."
echo ""
echo -e "  4. Health check: ${YELLOW}curl http://localhost:3000/health${NC}"
echo ""
echo -e "  5. PM2 commands:"
echo -e "     - Status:    ${YELLOW}sudo -u $REAL_USER pm2 status${NC}"
echo -e "     - Logs:      ${YELLOW}sudo -u $REAL_USER pm2 logs hadi-kaya-wa-bot${NC}"
echo -e "     - Restart:   ${YELLOW}sudo -u $REAL_USER pm2 restart hadi-kaya-wa-bot${NC}"
echo -e "     - Stop:      ${YELLOW}sudo -u $REAL_USER pm2 stop hadi-kaya-wa-bot${NC}"
echo ""
echo -e "${GREEN}Bot is now running 24/7 on Oracle Cloud Always Free! 🚀${NC}"
