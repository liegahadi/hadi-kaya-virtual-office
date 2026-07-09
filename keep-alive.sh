#!/bin/bash
# Keep sandbox alive by pinging server every 3 minutes
while true; do
  # Check if Next.js is running, restart if not
  if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 5 | grep -q "200"; then
    echo "[$(date)] Server down, restarting..."
    pkill -f "next" 2>/dev/null
    sleep 2
    cd /home/z/my-project && setsid bun run dev > /tmp/dev.log 2>&1 &
    disown
    sleep 10
  fi
  # Ping to keep alive
  curl -s -o /dev/null http://localhost:3000 --max-time 5
  echo "[$(date)] Ping OK"
  sleep 180
done
