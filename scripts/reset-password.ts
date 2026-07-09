// Reset owner password to known value
import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function main() {
  const newPassword = 'hadi-kaya-2026'
  const hash = await bcrypt.hash(newPassword, 10)

  const updated = await db.appUser.update({
    where: { email: 'owner@hadi-kaya.id' },
    data: { passwordHash: hash },
  })

  console.log('✅ Password reset successfully')
  console.log('   Email:', updated.email)
  console.log('   New password:', newPassword)
  console.log('   Hash preview:', hash.substring(0, 30) + '...')

  // Verify the hash works
  const valid = await bcrypt.compare(newPassword, hash)
  console.log('   Verification:', valid ? '✅ Valid' : '❌ Invalid')
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
