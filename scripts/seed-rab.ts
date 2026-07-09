// ============================================================
// SEED RAB FROM EXCEL + UPAH TUKANG FROM PDF
// ============================================================
// Source:
// - /upload/RAB 16.xlsx (Sheet1: TAHAPAN, NAMA MATERIAL, QTY)
// - /upload/4. RAB.pdf (with prices for default reference)
// - /upload/6. Upah tukang.pdf (13 items, total Rp 21jt/unit)
// ============================================================

import XLSX from 'xlsx'
import fs from 'fs'
import { db } from '../src/lib/db'

// Harga dari PDF RAB (4._RAB.pdf)
// Format: { MATERIAL_NAME: { UNIT: harga } }
// Catatan: ini harga DEFAULT, supplier bisa beda. Disimpan sebagai referensi awal.
const RAB_PRICES: Record<string, { unit: string; price: number }> = {
  'BESI 10': { unit: 'btg', price: 66000 },
  'BESI 8': { unit: 'btg', price: 43000 },
  'BESI 6': { unit: 'btg', price: 28000 },
  'PAKU 2': { unit: 'kg', price: 14000 },
  'PAKU 3': { unit: 'kg', price: 14000 },
  'SEMEN': { unit: 'zak', price: 64000 },
  'BENANG': { unit: 'bh', price: 5000 },
  'BATU COR': { unit: 'm3', price: 510000 },
  'EMBER': { unit: 'bh', price: 10000 },
  'BATA': { unit: 'bh', price: 1900 },
  'PAPAN COR': { unit: 'ls', price: 30000 },
  'KAYU STUT': { unit: 'btg', price: 5000 },
  'KAWAT IKAT': { unit: 'ls', price: 430000 },
  'KUSEN PINTU': { unit: 'bh', price: 450000 },
  'PINTU 90': { unit: 'bh', price: 500000 },
  'PINTU 80': { unit: 'bh', price: 450000 },
  'TRIPLEK': { unit: 'ls', price: 85000 },
  'TALI NYLON': { unit: 'ls', price: 0 },
  'LOBANG ANGIN': { unit: 'bh', price: 16000 },
  'TANAH TIMBUN': { unit: 'truck', price: 250000 },
  'PIPA 3"': { unit: 'btg', price: 90000 },
  'GYPSUM A+ (SUWARNO)': { unit: 'ls', price: 65000 },
  'HOLLOW 2X4 (3 MENARA)': { unit: 'btg', price: 16000 },
  'COMPOUND (ACIL)': { unit: 'sak', price: 70000 },
  'SKRUP HITAM (3 MENARA)': { unit: 'pack', price: 40000 },
  'KASA GYPSUM (ACIL)': { unit: 'roll', price: 15000 },
  'PAKU BETON (ACIL)': { unit: 'pack', price: 60000 },
  'LIST PLANK 3M': { unit: 'btg', price: 42000 },
  'BAUT SPANDEK 12X50': { unit: 'pack', price: 450 },
  'BAUT CANAL': { unit: 'pack', price: 155 },
  'CANAL 75/65': { unit: 'btg', price: 88000 },
  'SPANDEK KULIT JERUK 0.25/METER L 1M': { unit: 'btg', price: 180000 },
  'RABUNG': { unit: 'btg', price: 78000 },
  'RENG 28 35': { unit: 'btg', price: 32000 },
  'PASIR': { unit: 'm3', price: 450000 },
  'PIPA LISTRIK': { unit: 'btg', price: 10000 },
  'MANGKOK LISTRIK': { unit: 'bh', price: 5000 },
  'KABEL NYAA 1 X 1,5': { unit: 'roll', price: 205000 },
  'KABEL NYAA 1 X 2,5': { unit: 'roll', price: 360000 },
  'KABEL IB': { unit: 'm', price: 43000 },
  'GUNUNGAN COSMENT': { unit: 'bh', price: 158000 },
  'RAMBUNCIS 4 LOBANG': { unit: 'bh', price: 11000 },
  'LEM ASAM (ISI 24)': { unit: 'dus', price: 21000 },
  'ENGSEL CASMENT': { unit: 'bh', price: 26500 },
  'KACA RAYBENT': { unit: 'bh', price: 146500 },
  '1/2 GEPENG BANCI': { unit: 'bh', price: 43000 },
  'OPENBACK KUSEN FULL WH LUXAL': { unit: 'set', price: 265000 },
  'KERAMIK 40 X 40': { unit: 'dus', price: 54000 },
  'KERAMIK 25 X 40': { unit: 'dus', price: 65000 },
  'KERAMIK 25 X 25': { unit: 'dus', price: 62000 },
  'KERAMIK 40 X 40 (TAMPAK DEPAN)': { unit: 'dus', price: 72000 },
  'SKRAP PELAMIR': { unit: 'pack', price: 9000 },
  'PELAMIR': { unit: 'galon', price: 140000 },
  'AFDUNER': { unit: 'galon', price: 13000 },
  'CAT LUAR': { unit: 'galon', price: 400000 },
  'CAT DALAM': { unit: 'galon', price: 250000 },
  'CAT MINYAK': { unit: 'kaleng', price: 80000 },
  'ROLL CAT': { unit: 'bh', price: 30000 },
  'PINTU KAMAR MANDI': { unit: 'bh', price: 250000 },
  'KLOSET': { unit: 'bh', price: 160000 },
  'SARINGAN LANTAI': { unit: 'bh', price: 8000 },
  'ELBOW 2"': { unit: 'bh', price: 8000 },
  'ELBOW 1/2"': { unit: 'bh', price: 5000 },
  'T 1/2': { unit: 'bh', price: 5000 },
  'L DRAT': { unit: 'bh', price: 5000 },
  'KRAN AIR': { unit: 'bh', price: 15000 },
  'WASTAFEL': { unit: 'bh', price: 150000 },
  'PIPA 2"': { unit: 'btg', price: 60000 },
  'PIPA 1/2"': { unit: 'btg', price: 0 }, // not in PDF, will update
  'SOK DRAT': { unit: 'bh', price: 0 },
  'FITTING': { unit: 'bh', price: 0 },
  'SAKLAR SERI': { unit: 'bh', price: 0 },
  'STOP KONTAK': { unit: 'bh', price: 0 },
  'ENGKEL STOK': { unit: 'bh', price: 0 },
  'MCB': { unit: 'bh', price: 0 },
  'BOX MCB': { unit: 'bh', price: 0 },
  'PINTU 90 (PINTU)': { unit: 'bh', price: 500000 },
  'PINTU 80 (PINTU)': { unit: 'bh', price: 450000 },
  'ENGSEL PINTU': { unit: 'bh', price: 0 },
  'HANDLE PINTU': { unit: 'set', price: 0 },
}

// Upah tukang dari PDF 6
const UPAH_TUKANG = [
  { item: 'Pondasi + Cor Sloof + Pasang Bata 3 keping', price: 1200000 },
  { item: 'Subsitank (Gali Lobang+Cor), Pipa Subsitank & Urukan', price: 800000 },
  { item: 'Pasang Bata + Tebeng Layar. Cor Ring Balok, Cor Kolom, Pas kusen, Roster, Dak', price: 4500000 },
  { item: 'Rangka Atap + Penutup Atap + NOK + List Plank', price: 1500000 },
  { item: 'Plester Keliling + Instalasi Pipa Listrik + Openingan & Finishing + Finishing Dak', price: 4000000 },
  { item: 'Instalasi 11 Titik (Termasuk pasang mangkok listrik + Pemasangan saklar)', price: 350000 },
  { item: 'Pemasangan Plafon', price: 1100000 },
  { item: 'Pasang Keramik Lantai + Plint + Pas Keramik lantai kamar mandi + dinding', price: 1900000 },
  { item: 'Pasang Pintu kunci & daun pintu (Pintu Depan, Pintu Kamar, dan Pintu)', price: 350000 },
  { item: 'Pembuatan Meja Dapur dan rabat Belakang, Pembatas Belakang, Carpot', price: 1000000 },
  { item: 'Pengecatan', price: 1000000 },
  { item: 'Serah Terima kunci + Pembersihan awal & akhir 15%', price: 2100000 },
  { item: 'Retensi', price: 1200000 },
]

async function main() {
  console.log('🌱 Seeding RAB + Upah Tukang...')

  const project = await db.project.findUnique({ where: { name: 'Anjayo 16' } })
  if (!project) {
    console.error('❌ Project Anjayo 16 not found. Run main seed first.')
    process.exit(1)
  }

  // ============================================================
  // 1. SEED RAB FROM EXCEL
  // ============================================================
  console.log('\n📊 Reading RAB Excel...')
  const wb = XLSX.read(fs.readFileSync('/home/z/my-project/upload/RAB 16.xlsx'))
  const ws = wb.Sheets['Sheet1']
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Create RAB header
  const rab = await db.rAB.create({
    data: {
      projectId: project.id,
      name: 'RAB Anjayo 16 - Tipe 36 (1 unit)',
      version: 1,
      totalBudget: 0, // will compute
    },
  })

  let currentTahapan = 'LAIN-LAIN'
  let totalBudget = 0
  let lineCount = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const tahapan = row[0] ? String(row[0]).trim().toUpperCase() : null
    const materialName = row[1] ? String(row[1]).trim() : null
    const qty = row[2] ? parseFloat(row[2]) : null

    if (tahapan) currentTahapan = tahapan
    if (!materialName || qty === null) continue

    // Lookup price from PDF data
    const materialUpper = materialName.toUpperCase()
    const priceInfo = RAB_PRICES[materialUpper] || { unit: 'bh', price: 0 }
    const totalPrice = qty * priceInfo.price
    totalBudget += totalPrice

    await db.rABLine.create({
      data: {
        rabId: rab.id,
        projectId: project.id,
        workItem: currentTahapan,
        materialName,
        quantity: qty,
        unitMeasure: priceInfo.unit,
        unitPrice: priceInfo.price,
        totalPrice,
        supplierSuggestion: null, // owner akan set saat ada supplier
      },
    })
    lineCount++
  }

  // Update RAB total
  await db.rAB.update({
    where: { id: rab.id },
    data: { totalBudget },
  })

  console.log(`✅ RAB seeded: ${lineCount} items, total Rp ${totalBudget.toLocaleString('id-ID')}`)

  // ============================================================
  // 2. SEED UPAH TUKANG (save as KnowledgeItem for now)
  // ============================================================
  console.log('\n👷 Seeding Upah Tukang...')

  // Check if already exists
  const existing = await db.knowledgeItem.findFirst({
    where: { category: 'UPAH_TUKANG' },
  })
  if (existing) {
    await db.knowledgeItem.delete({ where: { id: existing.id } })
  }

  const upahContent = UPAH_TUKANG.map((u, i) =>
    `${i + 1}. ${u.item} = Rp ${u.price.toLocaleString('id-ID')}`
  ).join('\n')

  const totalUpah = UPAH_TUKANG.reduce((s, u) => s + u.price, 0)

  await db.knowledgeItem.create({
    data: {
      category: 'UPAH_TUKANG',
      content: `## Daftar Upah Tukang per Item Pekerjaan (Anjayo 16)\n\n${upahContent}\n\n**TOTAL: Rp ${totalUpah.toLocaleString('id-ID')} / unit**\n\n_Catatan: Harga dapat berubah sesuai kesepakatan. Update terakhir: ${new Date().toISOString().split('T')[0]}_`,
      tags: JSON.stringify(['upah', 'tukang', 'rab', 'biaya']),
      isActive: true,
    },
  })

  console.log(`✅ Upah Tukang: ${UPAH_TUKANG.length} items, total Rp ${totalUpah.toLocaleString('id-ID')}/unit`)

  // ============================================================
  // 3. SEED SUPPLIERS (sample, akan diupdate owner)
  // ============================================================
  console.log('\n🏪 Seeding sample suppliers...')

  const suppliers = [
    { name: 'Toko Maju Jaya', contactPerson: 'Haji Bambang', whatsappNumber: '+6281270011001' },
    { name: 'TB Sumber Rejeki', contactPerson: 'Iwan', whatsappNumber: '+6281270011002' },
    { name: 'Toko Acil', contactPerson: 'Acil', whatsappNumber: '+6281270011003' },
    { name: 'Bintang Baru', contactPerson: 'Sari', whatsappNumber: '+6281270011004' },
    { name: 'Karmin Kusen', contactPerson: 'Pak Karmin', whatsappNumber: '+6281270011005' },
    { name: 'Gatot Pasir', contactPerson: 'Gatot', whatsappNumber: '+6281270011006' },
    { name: 'Ibtia Batako', contactPerson: 'Ibtia', whatsappNumber: '+6281270011007' },
    { name: '3 Menara', contactPerson: 'Yusuf', whatsappNumber: '+6281270011008' },
    { name: 'Mulia Keramik', contactPerson: 'Mulia', whatsappNumber: '+6281270011009' },
    { name: 'Lestari Alm', contactPerson: 'Lestari', whatsappNumber: '+6281270011010' },
  ]

  for (const s of suppliers) {
    const existing = await db.supplier.findFirst({ where: { name: s.name } })
    if (!existing) {
      await db.supplier.create({ data: s })
    }
  }
  console.log(`✅ Suppliers: ${suppliers.length} sample suppliers seeded`)

  // ============================================================
  // 4. SUMMARY
  // ============================================================
  console.log('\n🎉 RAB + Upah Tukang + Suppliers seeded!')
  console.log('\n📊 Summary:')
  console.log(`   RAB: ${lineCount} line items, total Rp ${totalBudget.toLocaleString('id-ID')} / unit`)
  console.log(`   Upah Tukang: ${UPAH_TUKANG.length} items, total Rp ${totalUpah.toLocaleString('id-ID')} / unit`)
  console.log(`   Suppliers: ${suppliers.length} sample`)
  console.log(`   Grand total per unit: Rp ${(totalBudget + totalUpah).toLocaleString('id-ID')}`)
}

main()
  .then(async () => { await db.$disconnect() })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await db.$disconnect()
    process.exit(1)
  })
