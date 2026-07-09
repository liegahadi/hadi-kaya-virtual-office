// Keep-alive wrapper for WA Bridge
// Run: bun run mini-services/wa-bridge/start.ts

// Suppress WebSocket warnings (Bun doesn't fully implement ws)
process.on('warning', () => {})

// Auto-restart on crash
let bridgeProcess: any = null
let restartCount = 0
const MAX_RESTARTS = 10

function startBridge() {
  if (restartCount >= MAX_RESTARTS) {
    console.error('[Keep-Alive] Max restarts reached. Giving up.')
    return
  }

  console.log(`[Keep-Alive] Starting WA Bridge (attempt ${restartCount + 1})...`)
  
  const proc = Bun.spawn({
    cmd: ['bun', 'run', 'mini-services/wa-bridge/src/index.ts'],
    stdout: 'pipe',
    stderr: 'pipe',
  })

  bridgeProcess = proc

  // Pipe output
  const stdout = new Response(proc.stdout).text().then(text => {
    if (text) console.log(text.trim())
  })
  const stderr = new Response(proc.stderr).text().then(text => {
    if (text) console.error(text.trim())
  })

  proc.exited.then((code) => {
    console.log(`[Keep-Alive] Bridge exited with code ${code}`)
    restartCount++
    // Restart after 2 seconds
    setTimeout(startBridge, 2000)
  })
}

startBridge()

// Keep process alive
setInterval(() => {}, 1000)
