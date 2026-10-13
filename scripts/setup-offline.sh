#!/bin/bash
# ============================================================
# SETUP-OFFLINE.SH — Setup local SQLite for offline development
# Run with: bash scripts/setup-offline.sh
# Or in PowerShell: bash scripts/setup-offline.sh (kalau Git Bash terinstall)
# ============================================================
# Akan:
#   1. Backup schema.prisma asli (postgresql) ke schema.prisma.pg
#   2. Switch schema.prisma ke SQLite
#   3. Bikin file .env.local-offline dengan DATABASE_URL=file:./dev.db
#   4. Run prisma db push (create local DB file)
#   5. Run seed.ts (isi data awal: project, units, suppliers, wage types, RAB)
# ============================================================

set -e  # exit on first error

echo "🔧 Setting up offline development environment (SQLite)..."
echo ""

cd /home/z/my-project

# ============================================================
# STEP 1: Backup schema.prisma asli
# ============================================================
if [ ! -f "prisma/schema.prisma.pg" ]; then
  echo "1. Backup schema.prisma → schema.prisma.pg"
  cp prisma/schema.prisma prisma/schema.prisma.pg
else
  echo "1. Backup schema.prisma.pg sudah ada, skip"
fi

# ============================================================
# STEP 2: Switch schema.prisma ke SQLite
# ============================================================
echo "2. Switch datasource ke SQLite"
sed -i 's|provider = "postgresql"|provider = "sqlite"|' prisma/schema.prisma
sed -i '/directUrl/d' prisma/schema.prisma

# ============================================================
# STEP 3: Bikin .env untuk offline
# ============================================================
echo "3. Update .env untuk offline"
cat > .env << 'EOF'
# Offline mode — local SQLite
DATABASE_URL="file:./dev.db"

# Optional — kalau mau test AI features (butuh internet)
# GEMINI_API_KEY=
# OPENROUTER_API_KEY=
EOF

# ============================================================
# STEP 4: Prisma generate + db push
# ============================================================
echo "4. Generate Prisma client + push schema ke SQLite"
bun run db:generate
bun run db:push

# ============================================================
# STEP 5: Seed data awal
# ============================================================
echo "5. Seed data awal (projects, units, suppliers, wage types, RAB)..."
bun run scripts/seed.ts || echo "Warning: seed.ts ada error, lanjut"
bun run scripts/seed-rab.ts || echo "Warning: seed-rab.ts ada error, lanjut"

# ============================================================
# STEP 6: Bikin script untuk switch balik ke PostgreSQL
# ============================================================
cat > scripts/restore-online.sh << 'EOF'
#!/bin/bash
# Switch balik ke PostgreSQL (Aiven online)
# NOTE: Aku ga hardcode password di sini krn GitHub push protection block.
# kamu set DATABASE_URL manual di .env (copy dari .env.production atau akun Aiven)
cd /home/z/my-project
cp prisma/schema.prisma.pg prisma/schema.prisma
echo ""
echo "============================================================"
echo "⚠ PENTING: Set DATABASE_URL di .env sebelum run app"
echo "============================================================"
echo ""
echo "Edit file .env di root project, isi dengan Aiven PostgreSQL URL:"
echo "  DATABASE_URL=postgres://avnadmin:<PASSWORD>@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb?sslmode=require"
echo ""
echo "(Password liat di akun Aiven kamu, atau file .env lama yang sebelumnya)"
echo ""
bun run db:generate
echo "✅ Schema restored to PostgreSQL. Set DATABASE_URL, lalu: npm run dev"
EOF
chmod +x scripts/restore-online.sh

echo ""
echo "============================================================"
echo "✅ OFFLINE SETUP DONE"
echo "============================================================"
echo ""
echo "Database file: $(pwd)/dev.db (local SQLite)"
echo ""
echo "Untuk run app:"
echo "  npm run dev"
echo "  → buka http://localhost:3000"
echo ""
echo "Untuk switch balik ke online (Aiven):"
echo "  bash scripts/restore-online.sh"
echo ""
