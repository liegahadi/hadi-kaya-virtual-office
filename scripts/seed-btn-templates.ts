// ============================================================
// SEED BTN TEMPLATES + Generate Blank "Surat Pasangan Tidak Bekerja"
// ============================================================
// BTN = kebutuhan berkas AWALAN (initial requirements)
// Setelah ACC/SP3K, BTN akan minta berkas tambahan lainnya
// ============================================================

import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

// ============================================================
// GENERATE BLANK "SURAT PERNYATAAN TIDAK BEKERJA"
// ============================================================
function generateBlankSuratTidakBekerja(outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const stream = fs.createWriteStream(outputPath)
    doc.pipe(stream)

    // Header
    doc.fontSize(14).font('Helvetica-Bold').text('SURAT PERNYATAAN TIDAK BEKERJA', 60, 60, { align: 'center', width: 475 })

    // Body
    let y = 110
    doc.fontSize(11).font('Helvetica').text('Yang bertandatangan di bawah ini:', 60, y)
    y += 30

    // Fields (kosong)
    const fields = [
      'Nama',
      'Tempat/tgl lahir',
      'Pekerjaan',
      'No. KTP/Passport',
      'Alamat',
    ]

    for (const field of fields) {
      doc.font('Helvetica-Bold').text(`${field}`, 60, y)
      doc.font('Helvetica').text(`: ${'.'.repeat(50)}`, 180, y)
      y += 25
    }

    y += 15
    doc.font('Helvetica').text('menyatakan dengan sebenarnya bahwa saya tidak memiliki pekerjaan dan saat ini sedang mengurus rumah tangga.', 60, y, { width: 475, align: 'justify' })

    y += 35
    doc.text('Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.', 60, y, { width: 475, align: 'justify' })

    // Signature
    y += 50
    doc.text('Pangkalpinang, ...................... 20....', 60, y, { width: 475, align: 'right' })

    y += 15
    // Two columns: Mengetahui & Yang membuat pernyataan
    doc.font('Helvetica').text('Mengetahui,', 80, y)
    doc.text('Kepala Desa/Lurah,', 80, y + 15)
    doc.text('Yang membuat pernyataan,', 300, y)

    y += 70
    doc.text('(...........................)', 80, y, { width: 150, align: 'center' })
    doc.text('Materai 10.000', 300, y - 20, { width: 150, align: 'center' })
    doc.text('(...........................)', 300, y + 20, { width: 150, align: 'center' })

    y += 20
    doc.fontSize(9).font('Helvetica-Oblique').text('Nama lengkap dan jabatan', 80, y, { width: 150, align: 'center' })
    doc.text('Nama lengkap', 300, y + 20, { width: 150, align: 'center' })

    doc.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🏦 Seeding BTN templates...')

  const uploadDir = path.join(process.cwd(), 'uploads', 'bank-templates', 'BTN')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  // 1. Generate BLANK Surat Pasangan Tidak Bekerja
  console.log('\n📝 Generating blank "Surat Pernyataan Tidak Bekerja"...')
  const blankPath = path.join(uploadDir, 'BTN_SURAT_TIDAK_BEKERJA_BLANK.pdf')
  await generateBlankSuratTidakBekerja(blankPath)
  console.log(`  ✅ Blank version generated (${(fs.statSync(blankPath).size / 1024).toFixed(1)}KB)`)

  // 2. Define all BTN templates
  const templates = [
    {
      sourceFile: '9. -BTN- Kebutuhan Berkas awalan.docx',
      destName: 'BTN_KEBUTUHAN_BERKAS_AWALAN.docx',
      templateName: 'Kebutuhan Berkas Awalan BTN (Lampiran III, IV, VI)',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Kumpulan lampiran kebutuhan berkas awalan BTN: Lampiran III (Surat Pernyataan Persetujuan Penyaluran KPR FLPP), Lampiran IV (Surat Pernyataan Developer), Lampiran VI (Surat Pernyataan Pemohon KPR Bersubsidi). INI BERKAS AWALAN — setelah SP3K, BTN akan minta berkas tambahan.',
      isRequired: true,
      sortOrder: 1,
    },
    {
      sourceFile: '9. -BTN- SPR.pdf',
      destName: 'BTN_SPR.pdf',
      templateName: 'SPR (Surat Pemesanan Rumah) Anjayo 16',
      type: 'FORM',
      category: 'FORMULIR',
      description: 'Surat Pemesanan Rumah (SPR) Anjayo 16 untuk BTN. Berisi data pemohon + data rumah (harga 173jt, DP, SBUM, plafon KPR). PERLU DIISI — jangan ubah layout halaman.',
      isRequired: true,
      sortOrder: 2,
    },
    {
      sourceFile: null, // Generated blank version
      destName: 'BTN_SURAT_TIDAK_BEKERJA_BLANK.pdf',
      templateName: 'Surat Pernyataan Tidak Bekerja (Blank)',
      type: 'FORM',
      category: 'SURAT_KERJA',
      description: 'Surat pernyataan pasangan tidak bekerja untuk KPR BTN. VERSI KOSONG (data lama sudah dihapus). Perlu diisi: nama, tempat/tgl lahir, pekerjaan, KTP, alamat. Ditandatangani + materai 10.000 + stempel Lurah.',
      isRequired: true,
      sortOrder: 3,
    },
    {
      sourceFile: '9. -BTN- SURAT PERNYATAAN TIDAK MEMILIKI RUMAH.pdf',
      destName: 'BTN_SURAT_TIDAK_PUNYA_RUMAH.pdf',
      templateName: 'Surat Pernyataan Tidak Memiliki Rumah (BTN)',
      type: 'FORM',
      category: 'SURAT_RUMAH',
      description: 'Surat pernyataan tidak memiliki rumah untuk KPR BTN. Sudah kosong (field titik-titik). Perlu diisi + ditandatangani + materai 10.000 + stempel Lurah.',
      isRequired: true,
      sortOrder: 4,
    },
  ]

  let created = 0
  for (const t of templates) {
    const destPath = path.join(uploadDir, t.destName)
    const fileUrl = `/uploads/bank-templates/BTN/${t.destName}`

    // Copy or use generated file
    if (t.sourceFile) {
      const srcPath = path.join(process.cwd(), 'upload', t.sourceFile)
      if (!fs.existsSync(srcPath)) {
        console.log(`⚠️  Source not found: ${t.sourceFile}`)
        continue
      }
      fs.copyFileSync(srcPath, destPath)
    }
    // For blank version, file already generated above

    const fileSize = fs.statSync(destPath).size
    const mimeType = t.destName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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

  // 3. Add standard reference documents (same as Mandiri/BSB)
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
      where: { bankName: 'BTN', templateName: doc.name },
    })
    if (!existing) {
      await db.documentTemplate.create({
        data: {
          bankName: 'BTN', templateName: doc.name, templateUrl: '',
          type: 'REFERENCE', category: doc.category, description: doc.desc,
          isRequired: true, sortOrder: 20 + i, isActive: true,
        },
      })
      console.log(`  ✅ Created (reference): ${doc.name}`)
      created++
    }
  }

  // 4. Generate checklist for JENNI (E5 - proses BTN)
  const jenni = await db.customer.findFirst({ where: { name: 'JENNI' } })
  if (jenni) {
    const btnTemplates = await db.documentTemplate.findMany({
      where: { bankName: 'BTN', isActive: true },
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

    const checklist = await db.customerDocumentChecklist.findMany({
      where: { customerId: jenni.id, bankName: 'BTN' },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`\n📋 Checklist for JENNI (BTN):`)
    console.log(`   Total: ${checklist.length} items (AWALAN — post-SP3K BTN akan minta tambahan)`)
    for (const c of checklist) {
      console.log(`   ❌ ${c.documentName} (${c.category})`)
    }
  }

  // Summary all banks
  const allBanks = await db.documentTemplate.groupBy({
    by: ['bankName'], _count: true, where: { isActive: true },
  })

  console.log(`\n🎉 BTN templates seeded!`)
  console.log(`   Created: ${created} new`)
  console.log(`\n📊 All bank templates:`)
  for (const b of allBanks) {
    console.log(`   ${b.bankName}: ${b._count} templates`)
  }
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => { console.error('❌', e); await db.$disconnect(); process.exit(1) })
