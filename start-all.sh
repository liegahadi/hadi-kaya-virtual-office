#!/bin/bash
# Start all services for Hadi Kaya Virtual Office
# Usage: bash start-all.sh

echo "🚀 Starting Hadi Kaya Virtual Office..."

# Kill existing
pkill -f "next dev" 2>/dev/null
pkill -f "wa-bridge" 2>/dev/null
sleep 2

cd /home/z/my-project

# Start Next.js (port 3000)
echo "  → Starting Next.js dashboard (port 3000)..."
setsid bun run dev > /tmp/dev.log 2>&1 &
disown
NEXT_PID=$!
sleep 5

# Start WA Bridge (port 3001)
echo "  → Starting WA Bridge (port 3001)..."
setsid bun run mini-services/wa-bridge/start.ts > /tmp/wa-bridge.log 2>&1 &
disown
WA_PID=$!
sleep 3

# Check status
echo ""
echo "📊 Status:"
curl -s -o /dev/null -w "  Next.js:    HTTP %{http_code}\n" http://localhost:3000 --max-time 10
curl -s http://localhost:3001/status --max-time 5 | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(f'  WA Bridge:  {d[\"data\"][\"state\"]}')
except:
    print('  WA Bridge:  NOT RUNNING')
" 2>/dev/null

echo ""
echo "✅ All services started!"
echo "   Dashboard: http://localhost:3000"
echo "   WA Bridge: http://localhost:3001"
echo ""
echo "   Next steps:"
echo "   1. Buka dashboard → tab 'WhatsApp'"
echo "   2. Klik 'Connect WA' (pilih RINA)"
echo "   3. Scan QR pakai HP"
echo "   4. Chat ke nomor AI → auto-reply!"
