// ============================================================
// SEED BSB SYARIAH TEMPLATES
// ============================================================
// PENTING: Format halaman setiap dokumen SUDAH DISESUAIKAN.
// Dina HANYA mengisi data, TIDAK boleh mengubah/mengganti layout halaman.
// Ini berlaku untuk SEMUA bank (Mandiri, BSB, BTN).
// ============================================================

import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🏦 Seeding Bank Sumselbabel Syariah (BSB) templates...')

  const uploadDir = path.join(process.cwd(), 'uploads', 'bank-templates', 'BSB_SYARIAH')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const templates = [
    {
      sourceFile: '8. - BSB Syariah -  CHECK LIST kelengkapan dokumen flpp.docx',
      destName: 'BSB_CHECKLIST_FLPP.docx',
      templateName: 'Checklist Kelengkapan Dokumen FLPP',
      type: 'REFERENCE',
      category: 'FORMULIR',
      description: 'Checklist kelengkapan dokumen FLPP (Fasilitas Liquidity Pembiayaan Perumahan). Daftar semua berkas yang dibutuhkan.',
      isRequired: true,
      sortOrder: 1,
    },
    {
      sourceFile: '8. - BSB Syariah -  FORM APLIKASI PEMBIAYAAN SPP (SUMSEL SYARIAH).docx',
      destName: 'BSB_FORM_APLIKASI_SPP.docx',
      templateName: 'Form Aplikasi Pembiayaan SPP',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Form aplikasi pembiayaan SPP (Sertifikat Partisipasi Pembiayaan) Bank Sumselbabel Syariah. Form utama pengajuan. PERLU DIISI MANUAL — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 2,
    },
    {
      sourceFile: '8. - BSB Syariah -  Form Permohonan Fasilitas Pembiayaan.docx',
      destName: 'BSB_FORM_PERMOHONAN.docx',
      templateName: 'Form Permohonan Fasilitas Pembiayaan',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Form permohonan fasilitas pembiayaan BSB Syariah. PERLU DIISI MANUAL — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 3,
    },
    {
      sourceFile: '8. - BSB Syariah -  SBUM (SUMSEL).docx',
      destName: 'BSB_SBUM.docx',
      templateName: 'SBUM (Surat Bukti Urus Mandiri)',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'SBUM Bank Sumselbabel Syariah. PERLU DIISI — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 4,
    },
    {
      sourceFile: '8. - BSB Syariah -  SURAT KUASA KEPADA BENDAHARAWAN.docx',
      destName: 'BSB_SURAT_KUASA.docx',
      templateName: 'Surat Kuasa Kepada Bendaharawan',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat kuasa kepada bendaharawan BSB Syariah. PERLU DIISI & ditandatangani — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 5,
    },
    {
      sourceFile: '8. - BSB Syariah -  SURAT PERNYATAAN TIDAK MEMILIKI RUMAH.docx',
      destName: 'BSB_SURAT_TIDAK_PUNYA_RUMAH.docx',
      templateName: 'Surat Pernyataan Tidak Memiliki Rumah',
      type: 'FORM',
      category: 'SURAT_RUMAH',
      description: 'Surat pernyataan tidak memiliki rumah untuk BSB Syariah. PERLU DIISI & ditandatangani — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 6,
    },
    {
      sourceFile: '8. - BSB Syariah -  Surat Keterangan Developer Mengenai Rumah.docx',
      destName: 'BSB_SURAT_KETERANGAN_DEVELOPER.docx',
      templateName: 'Surat Keterangan Developer Mengenai Rumah',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat keterangan dari developer (Menuju Hadi Kaya) mengenai rumah yang dibeli. PERLU DIISI oleh developer — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 7,
    },
    {
      sourceFile: '8. - BSB Syariah -  surat penawaran rumah (SUMSEL).docx',
      destName: 'BSB_SURAT_PENAWARAN.docx',
      templateName: 'Surat Penawaran Rumah',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat penawaran rumah dari developer ke konsumen untuk BSB Syariah. PERLU DIISI — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 8,
    },
    {
      sourceFile: '8. - BSB Syariah - Surat Pernyataan.docx',
      destName: 'BSB_SURAT_PERNYATAAN.docx',
      templateName: 'Surat Pernyataan (Umum)',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat pernyataan umum BSB Syariah. PERLU DIISI & ditandatangani — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 9,
    },
  ]

  let created = 0
  for (const t of templates) {
    const srcPath = path.join(process.cwd(), 'upload', t.sourceFile)
    const destPath = path.join(uploadDir, t.destName)
    const fileUrl = `/uploads/bank-templates/BSB_SYARIAH/${t.destName}`

    if (!fs.existsSync(srcPath)) {
      console.log(`⚠️  Source not found: ${t.sourceFile}`)
      continue
    }

    // Copy file
    fs.copyFileSync(srcPath, destPath)
    const fileSize = fs.statSync(destPath).size

    // Check if exists
    const existing = await db.documentTemplate.findFirst({
      where: { bankName: 'BSB_SYARIAH', templateName: t.templateName },
    })

    if (existing) {
      await db.documentTemplate.update({
        where: { id: existing.id },
        data: {
          templateUrl: fileUrl,
          fileSize,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          type: t.type,
          category: t.category,
          description: t.description,
          isRequired: t.isRequired,
          sortOrder: t.sortOrder,
          isActive: true,
        },
      })
      console.log(`  🔄 Updated: ${t.templateName}`)
    } else {
      await db.documentTemplate.create({
        data: {
          bankName: 'BSB_SYARIAH',
          templateName: t.templateName,
          templateUrl: fileUrl,
          fileSize,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          type: t.type,
          category: t.category,
          description: t.description,
          isRequired: t.isRequired,
          sortOrder: t.sortOrder,
          isActive: true,
        },
      })
      console.log(`  ✅ Created: ${t.templateName}`)
      created++
    }
  }

  // Add standard reference documents (same as Mandiri, but for BSB)
  const standardDocs = [
    { name: 'KTP (Kartu Tanda Penduduk)', category: 'KTP', desc: 'Scan KTP pemohon & pasangan (jika menikah)' },
    { name: 'NPWP (Nomor Pokok Wajib Pajak)', category: 'NPWP', desc: 'Scan NPWP pemohon' },
    { name: 'Kartu Keluarga (KK)', category: 'KK', desc: 'Scan Kartu Keluarga' },
    { name: 'Akta Nikah / Akta Cerai / Surat Belum Menikah', category: 'AKTA_NIKAH', desc: 'Scan akta nikah/cerai atau surat belum menikah' },
    { name: 'Slip Gaji 3 Bulan Terakhir', category: 'SLIP_GAJI', desc: 'Scan slip gaji 3 bulan terakhir (karyawan)' },
    { name: 'SK Kerja / Surat Keterangan Kerja', category: 'SK_KERJA', desc: 'Surat keterangan kerja dari perusahaan' },
    { name: 'NIB + Laporan Keuangan 6 Bulan (Wirausaha)', category: 'NIB', desc: 'Untuk wirausaha: NIB + laporan laba rugi 6 bulan' },
  ]

  for (let i = 0; i < standardDocs.length; i++) {
    const doc = standardDocs[i]
    const existing = await db.documentTemplate.findFirst({
      where: { bankName: 'BSB_SYARIAH', templateName: doc.name },
    })

    if (!existing) {
      await db.documentTemplate.create({
        data: {
          bankName: 'BSB_SYARIAH',
          templateName: doc.name,
          templateUrl: '',
          type: 'REFERENCE',
          category: doc.category,
          description: doc.desc,
          isRequired: true,
          sortOrder: 20 + i,
          isActive: true,
        },
      })
      console.log(`  ✅ Created (reference): ${doc.name}`)
      created++
    }
  }

  // Generate checklist for JENNI (E5 - proses BSB Syariah? Actually JENNI is BTN, Andas is BSB)
  // Andas Saputra (E4) = SP3K di Bank Sumselbabel Syariah
  const andas = await db.customer.findFirst({ where: { name: 'Andas Saputra' } })
  if (andas) {
    const bsbTemplates = await db.documentTemplate.findMany({
      where: { bankName: 'BSB_SYARIAH', isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    for (const t of bsbTemplates) {
      const existing = await db.customerDocumentChecklist.findFirst({
        where: { customerId: andas.id, templateId: t.id }
      })
      if (!existing) {
        await db.customerDocumentChecklist.create({
          data: {
            customerId: andas.id,
            templateId: t.id,
            bankName: 'BSB_SYARIAH',
            documentName: t.templateName,
            category: t.category,
            status: 'MISSING',
            isRequired: t.isRequired,
          }
        })
      }
    }

    const checklist = await db.customerDocumentChecklist.findMany({
      where: { customerId: andas.id, bankName: 'BSB_SYARIAH' },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`\n📋 Checklist for Andas Saputra (BSB Syariah):`)
    console.log(`   Total: ${checklist.length} items, 0% complete`)
    for (const c of checklist) {
      console.log(`   ❌ ${c.documentName} (${c.category})`)
    }
  }

  // Summary
  const allBsb = await db.documentTemplate.findMany({
    where: { bankName: 'BSB_SYARIAH', isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Also count all banks
  const allBanks = await db.documentTemplate.groupBy({
    by: ['bankName'],
    _count: true,
    where: { isActive: true },
  })

  console.log(`\n🎉 BSB Syariah templates seeded!`)
  console.log(`   Created: ${created} new`)
  console.log(`   Total BSB templates: ${allBsb.length}`)
  console.log(`\n📊 All bank templates:`)
  for (const b of allBanks) {
    console.log(`   ${b.bankName}: ${b._count} templates`)
  }
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
