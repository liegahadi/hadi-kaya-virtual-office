// Migrate BNI (and any bank) from legacy single-template to multi-template format
// Run: DATABASE_URL="..." npx tsx scripts/migrate-templates.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const banks = await prisma.bankConfig.findMany()
  
  for (const bank of banks) {
    if (!bank.documents) {
      console.log(`[${bank.bankCode}] No documents — skip`)
      continue
    }
    
    let docs: any
    try {
      docs = JSON.parse(bank.documents)
    } catch {
      console.log(`[${bank.bankCode}] documents parse error — skip`)
      continue
    }
    
    // Check if already has templates array
    if (docs.templates && docs.templates.length > 0) {
      console.log(`[${bank.bankCode}] Already has ${docs.templates.length} templates — skip`)
      continue
    }
    
    // Check if has legacy single-template
    if (docs.fileId) {
      console.log(`[${bank.bankCode}] Migrating legacy template to multi-template format...`)
      
      // Create templates array from legacy data
      docs.templates = [{
        id: 'tpl-migrated-' + Date.now(),
        name: 'Template',  // Will be replaced when user renames
        stage: 'entry',
        fileId: docs.fileId,
        fileName: docs.fileName || `Template ${bank.bankCode} v${docs.version || 1}.pdf`,
        webViewLink: bank.templatePath || null,
        version: docs.version || 1,
        uploadedAt: docs.uploadedAt || new Date().toISOString(),
        fileHash: docs.fileHash || null,
        fileSize: docs.fileSize || null,
        annotations: docs.annotations || [],
      }]
      
      await prisma.bankConfig.update({
        where: { id: bank.id },
        data: { documents: JSON.stringify(docs) },
      })
      
      console.log(`[${bank.bankCode}] ✅ Migrated: 1 template, ${docs.annotations?.length || 0} annotations`)
    } else {
      console.log(`[${bank.bankCode}] No legacy template — skip`)
    }
  }
  
  console.log('\n✅ Migration complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
