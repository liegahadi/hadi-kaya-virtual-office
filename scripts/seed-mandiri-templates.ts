// ============================================================
// SEED MANDIRI TEMPLATES - Register all 5 Mandiri documents
// ============================================================

import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🏦 Seeding Bank Mandiri templates...')

  const uploadDir = path.join(process.cwd(), 'uploads', 'bank-templates', 'MANDIRI')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  // Define all 5 Mandiri templates
  const templates = [
    {
      sourceFile: '7. - Bank Mandiri - Form Aplikasi (handwritten).pdf',
      destName: 'MANDIRI_FORM_APLIKASI.pdf',
      templateName: 'Form Aplikasi KPR Mandiri',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Formulir utama pengajuan KPR Mandiri. Perlu diisi manual (handwritten). Berisi data pribadi, pekerjaan, penghasilan, data pinjaman.',
      isRequired: true,
      sortOrder: 1,
    },
    {
      sourceFile: '7. - Bank Mandiri - SURAT PERNYATAAN TIDAK MEMILKI RUMAH.docx',
      destName: 'MANDIRI_SURAT_TIDAK_PUNYA_RUMAH.docx',
      templateName: 'Surat Pernyataan Tidak Memiliki Rumah',
      type: 'FORM',
      category: 'SURAT_RUMAH',
      description: 'Surat pernyataan bahwa pemohon belum memiliki rumah. Wajib untuk KPR Bersubsidi. Perlu diisi & ditandatangani.',
      isRequired: true,
      sortOrder: 2,
    },
    {
      sourceFile: '7. -Bank Mandiri - SURAT PENYATAAN PENGHASILAN.doc',
      destName: 'MANDIRI_SURAT_PENGHASILAN.doc',
      templateName: 'Surat Pernyataan Penghasilan',
      type: 'FORM',
      category: 'SURAT_KERJA',
      description: 'Surat pernyataan penghasilan pemohon. Dibutuhkan untuk verifikasi kemampuan bayar.',
      isRequired: true,
      sortOrder: 3,
    },
    {
      sourceFile: '7. -Bank Mandiri - SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI NEW 2025(1) (1).pdf',
      destName: 'MANDIRI_SURAT_PERNYATAAN_KPR_BERSUBSIDI.pdf',
      templateName: 'Surat Pernyataan Pemohon KPR Bersubsidi',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Surat pernyataan pemohon KPR Bersubsidi 2025. Berisi deklarasi: gaji, belum punya rumah, belum pernah terima subsidi, beli dari PT, akan ditempati sendiri.',
      isRequired: true,
      sortOrder: 4,
    },
    {
      sourceFile: '7. -Bank Mandiri- Surat pemesanan Rumah.docx',
      destName: 'MANDIRI_SURAT_PEMESANAN_RUMAH.docx',
      templateName: 'Surat Pemesanan Rumah',
      type: 'FORM',
      category: 'OTHER',
      description: 'Surat pemesanan rumah dari developer ke konsumen. Berisi detail unit, harga, DP.',
      isRequired: true,
      sortOrder: 5,
    },
  ]

  let created = 0
  for (const t of templates) {
    const srcPath = path.join(process.cwd(), 'upload', t.sourceFile)
    const destPath = path.join(uploadDir, t.destName)
    const fileUrl = `/uploads/bank-templates/MANDIRI/${t.destName}`

    if (!fs.existsSync(srcPath)) {
      console.log(`⚠️  Source not found: ${t.sourceFile}`)
      continue
    }

    // Copy file
    fs.copyFileSync(srcPath, destPath)
    const fileSize = fs.statSync(destPath).size

    // Check if template already exists
    const existing = await db.documentTemplate.findFirst({
      where: { bankName: 'MANDIRI', templateName: t.templateName },
    })

    if (existing) {
      // Update
      await db.documentTemplate.update({
        where: { id: existing.id },
        data: {
          templateUrl: fileUrl,
          fileSize,
          mimeType: t.destName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
      // Create
      await db.documentTemplate.create({
        data: {
          bankName: 'MANDIRI',
          templateName: t.templateName,
          templateUrl: fileUrl,
          fileSize,
          mimeType: t.destName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

  // Also add standard required documents (KTP, NPWP, KK, etc) as REFERENCE
  const standardDocs = [
    { name: 'KTP (Kartu Tanda Penduduk)', category: 'KTP', desc: 'Scan KTP pemohon & pasangan (jika menikah)' },
    { name: 'NPWP (Nomor Pokok Wajib Pajak)', category: 'NPWP', desc: 'Scan NPWP pemohon' },
    { name: 'Kartu Keluarga (KK)', category: 'KK', desc: 'Scan Kartu Keluarga' },
    { name: 'Akta Nikah / Akta Cerai / Surat Belum Menikah', category: 'AKTA_NIKAH', desc: 'Scan akta nikah/cerai atau surat belum menikah dari kelurahan' },
    { name: 'Slip Gaji 3 Bulan Terakhir', category: 'SLIP_GAJI', desc: 'Scan slip gaji 3 bulan terakhir (karyawan) atau laporan keuangan 6 bulan (wirausaha)' },
    { name: 'SK Kerja / Surat Keterangan Kerja', category: 'SK_KERJA', desc: 'Surat keterangan kerja dari perusahaan (karyawan)' },
    { name: 'NIB (Nomor Induk Berusaha) + Laporan Keuangan 6 Bulan', category: 'NIB', desc: 'Untuk wirausaha: NIB + laporan laba rugi 6 bulan terakhir' },
    { name: 'Rekening Koran 3 Bulan Terakhir', category: 'OTHER', desc: 'Scan rekening koran 3 bulan terakhir' },
    { name: 'Foto Rumah Tapera', category: 'OTHER', desc: 'Foto rumah untuk verifikasi Tapera' },
  ]

  for (let i = 0; i < standardDocs.length; i++) {
    const doc = standardDocs[i]
    const existing = await db.documentTemplate.findFirst({
      where: { bankName: 'MANDIRI', templateName: doc.name },
    })

    if (!existing) {
      await db.documentTemplate.create({
        data: {
          bankName: 'MANDIRI',
          templateName: doc.name,
          templateUrl: '', // no file — this is a checklist item, owner uploads scan
          type: 'REFERENCE',
          category: doc.category,
          description: doc.desc,
          isRequired: true,
          sortOrder: 10 + i,
          isActive: true,
        },
      })
      console.log(`  ✅ Created (reference): ${doc.name}`)
      created++
    }
  }

  // Summary
  const allTemplates = await db.documentTemplate.findMany({
    where: { bankName: 'MANDIRI', isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  console.log(`\n🎉 Mandiri templates seeded!`)
  console.log(`   Created: ${created} new`)
  console.log(`   Total Mandiri templates: ${allTemplates.length}`)
  console.log(`\n📋 Checklist untuk konsumen Mandiri:`)
  for (const t of allTemplates) {
    const icon = t.type === 'FORM' ? '📝' : '📎'
    console.log(`   ${icon} [${t.category}] ${t.templateName} ${t.isRequired ? '(wajib)' : '(opsional)'}`)
  }
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
