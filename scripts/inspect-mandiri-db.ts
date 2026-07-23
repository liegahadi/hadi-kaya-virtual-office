// Inspect what's stored in DB for Mandiri bank config
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const banks = await prisma.bankConfig.findMany()
  console.log(`Found ${banks.length} banks\n`)

  for (const b of banks) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`Bank: ${b.bankName} (${b.bankCode})`)
    console.log(`  id: ${b.id}`)
    console.log(`  documents: ${b.documents ? '(has data)' : '(null)'}`)
    if (b.documents) {
      try {
        const docs = JSON.parse(b.documents)
        console.log(`  documents keys: ${Object.keys(docs).join(', ')}`)
        if (docs.templates) {
          console.log(`  templates count: ${docs.templates.length}`)
          docs.templates.forEach((t: any, i: number) => {
            console.log(`    [${i}] id=${t.id} name="${t.name}" v${t.version}`)
            console.log(`        storage=${t.storage || '?'} fileId=${t.fileId || 'null'} templatePath=${t.templatePath || 'null'}`)
            console.log(`        annotations count=${t.annotations?.length || 0}`)
          })
        }
      } catch (e) {
        console.log(`  documents parse error:`, (e as Error).message)
        console.log(`  documents raw (first 500 chars):`, b.documents.slice(0, 500))
      }
    }
  }

  // Also list what's actually on disk
  console.log(`\n\n${'='.repeat(70)}`)
  console.log('Files actually on disk in /public/templates/:')
  console.log('='.repeat(70))
  const dir = '/home/z/my-project/public/templates'
  const files = fs.readdirSync(dir, { withFileTypes: true })
  files.forEach(f => {
    const isDir = f.isDirectory()
    console.log(`  ${isDir ? '[DIR]' : '     '} ${f.name}`)
    if (isDir) {
      const sub = fs.readdirSync(`${dir}/${f.name}`)
      sub.forEach(s => console.log(`          ${s}`))
    }
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
