// ============================================================
// SEED BTN POST-ACC TEMPLATES (Berkas Sisa setelah ACC/SP3K)
// ============================================================

import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🏦 Seeding BTN Post-ACC templates (berkas sisa)...')

  const uploadDir = path.join(process.cwd(), 'uploads', 'bank-templates', 'BTN')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const templates = [
    {
      sourceFile: '10.-BTN-  SURAT PERNYATAAN DEBITUR Terbaru.pdf',
      destName: 'BTN_POST_SURAT_PERNYATAAN_DEBITUR.pdf',
      templateName: 'Surat Pernyataan Debitur (Terbaru)',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Surat pernyataan debitur BTN (versi terbaru). POST-ACC — diisi setelah BTN ACC pengajuan.',
      isRequired: true,
      sortOrder: 30,
    },
    {
      sourceFile: '10.-BTN- BERITA ACARA PENYERAHAN SERTIFIKAT TANAH.docx',
      destName: 'BTN_POST_BA_SERAH_SERTIFIKAT.docx',
      templateName: 'Berita Acara Penyerahan Sertifikat Tanah',
      type: 'FORM',
      category: 'OTHER',
      description: 'Berita acara penyerahan sertifikat tanah. POST-ACC — diisi developer & debitur.',
      isRequired: true,
      sortOrder: 31,
    },
    {
      sourceFile: '10.-BTN- Checklist Kelengkapan.xlsx',
      destName: 'BTN_POST_CHECKLIST_LENGKAP.xlsx',
      templateName: 'Checklist Kelengkapan Dokumen BTN (Post-ACC)',
      type: 'REFERENCE',
      category: 'FORMULIR',
      description: 'Checklist kelengkapan dokumen BTN versi Excel. Reference untuk cek kelengkapan berkas post-ACC.',
      isRequired: true,
      sortOrder: 32,
    },
    {
      sourceFile: '10.-BTN- PSU JALAN DAN LISTRIK.pdf',
      destName: 'BTN_POST_PSU_JALAN_LISTRIK.pdf',
      templateName: 'PSU Jalan dan Listrik',
      type: 'FORM',
      category: 'OTHER',
      description: 'Pernyataan Standar Umum (PSU) jalan dan listrik. POST-ACC — diisi developer.',
      isRequired: true,
      sortOrder: 33,
    },
    {
      sourceFile: '10.-BTN- STANDING INSTRUCTION LPA.docx',
      destName: 'BTN_POST_SI_LPA.docx',
      templateName: 'Standing Instruction LPA',
      type: 'FORM',
      category: 'OTHER',
      description: 'Standing Instruction LPA (Lembaga Pengelola Aset). POST-ACC — diisi debitur.',
      isRequired: true,
      sortOrder: 34,
    },
    {
      sourceFile: '10.-BTN- STANDING INSTRUCTION PENCAIRAN KREDIT - 5 April 2024.docx',
      destName: 'BTN_POST_SI_PENCAIRAN.docx',
      templateName: 'Standing Instruction Pencairan Kredit',
      type: 'FORM',
      category: 'OTHER',
      description: 'Standing Instruction Pencairan Kredit BTN. POST-ACC — diisi debitur untuk auto-debet.',
      isRequired: true,
      sortOrder: 35,
    },
    {
      sourceFile: '10.-BTN- SURAT KUASA DEBITUR.docx',
      destName: 'BTN_POST_SURAT_KUASA_DEBITUR.docx',
      templateName: 'Surat Kuasa Debitur',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat kuasa debitur BTN. POST-ACC — diisi & ditandatangani debitur.',
      isRequired: true,
      sortOrder: 36,
    },
    {
      sourceFile: '10.-BTN- SURAT PERNYATAAN DAN KUASA PEMBLOKIRAN (1).pdf',
      destName: 'BTN_POST_SURAT_PEMBLOKIRAN.pdf',
      templateName: 'Surat Pernyataan dan Kuasa Pemblokiran',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat pernyataan dan kuasa pemblokiran dana. POST-ACC — diisi debitur.',
      isRequired: true,
      sortOrder: 37,
    },
    {
      sourceFile: '10.-BTN- SURAT PERNYATAAN DEBITUR - PBG.pdf',
      destName: 'BTN_POST_SURAT_PERNYATAAN_PBG.pdf',
      templateName: 'Surat Pernyataan Debitur - PBG',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat pernyataan debitur terkait PBG (Persetujuan Bangunan Gedung). POST-ACC — diisi debitur.',
      isRequired: true,
      sortOrder: 38,
    },
  ]

  let created = 0
  for (const t of templates) {
    const srcPath = path.join(process.cwd(), 'upload', t.sourceFile)
    const destPath = path.join(uploadDir, t.destName)
    const fileUrl = `/uploads/bank-templates/BTN/${t.destName}`

    if (!fs.existsSync(srcPath)) {
      console.log(`⚠️  Source not found: ${t.sourceFile}`)
      continue
    }

    fs.copyFileSync(srcPath, destPath)
    const fileSize = fs.statSync(destPath).size
    const ext = t.destName.split('.').pop()
    const mimeType = ext === 'pdf' ? 'application/pdf'
      : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream'

    const existing = await db.documentTemplate.findFirst({
      where: { bankName: 'BTN', templateName: t.templateName },
    })

    if (existing) {
      await db.documentTemplate.update({
        where: { id: existing.id },
        data: {
          templateUrl: fileUrl, fileSize, mimeType,
          type: t.type, category: t.category, description: t.description,
          isRequired: t.isRequired, sortOrder: t.sortOrder, isActive: true,
        },
      })
      console.log(`  🔄 Updated: ${t.templateName}`)
    } else {
      await db.documentTemplate.create({
        data: {
          bankName: 'BTN', templateName: t.templateName,
          templateUrl: fileUrl, fileSize, mimeType,
          type: t.type, category: t.category, description: t.description,
          isRequired: t.isRequired, sortOrder: t.sortOrder, isActive: true,
        },
      })
      console.log(`  ✅ Created: ${t.templateName}`)
      created++
    }
  }

  // Generate checklist for JENNI (post-ACC items)
  const jenni = await db.customer.findFirst({ where: { name: 'JENNI' } })
  if (jenni) {
    const btnTemplates = await db.documentTemplate.findMany({
      where: { bankName: 'BTN', isActive: true, sortOrder: { gte: 30 } },
      orderBy: { sortOrder: 'asc' },
    })

    for (const t of btnTemplates) {
      const existing = await db.customerDocumentChecklist.findFirst({
        where: { customerId: jenni.id, templateId: t.id }
      })
      if (!existing) {
        await db.customerDocumentChecklist.create({
          data: {
            customerId: jenni.id, templateId: t.id,
            bankName: 'BTN', documentName: t.templateName,
            category: t.category, status: 'MISSING', isRequired: t.isRequired,
          }
        })
      }
    }

    // Get full checklist (awalan + post-ACC)
    const fullChecklist = await db.customerDocumentChecklist.findMany({
      where: { customerId: jenni.id, bankName: 'BTN' },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`\n📋 Checklist for JENNI (BTN — Awalan + Post-ACC):`)
    console.log(`   Total: ${fullChecklist.length} items`)
    console.log(`\n   --- AWALAN (pre-ACC) ---`)
    for (const c of fullChecklist.slice(0, 11)) {
      console.log(`   ❌ ${c.documentName}`)
    }
    console.log(`\n   --- POST-ACC (sisa berkas) ---`)
    for (const c of fullChecklist.slice(11)) {
      console.log(`   ❌ ${c.documentName}`)
    }
  }

  // Summary
  const allBanks = await db.documentTemplate.groupBy({
    by: ['bankName'], _count: true, where: { isActive: true },
  })

  console.log(`\n🎉 BTN Post-ACC templates seeded!`)
  console.log(`   Created: ${created} new`)
  console.log(`\n📊 All bank templates:`)
  for (const b of allBanks) {
    console.log(`   ${b.bankName}: ${b._count} templates`)
  }
  console.log(`   TOTAL: ${allBanks.reduce((s, b) => s + b._count, 0)} templates`)
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
