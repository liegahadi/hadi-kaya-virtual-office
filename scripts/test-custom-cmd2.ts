import { matchCustomCommand } from '../src/lib/agents/custom-commands'
async function main() {
  const result = await matchCustomCommand('kirim invoice Jenni', undefined)
  console.log(`Result: ${result || '(null — no match)'}`)
}
main().then(() => process.exit(0))
