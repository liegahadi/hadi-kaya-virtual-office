// Seed RAB Anjayo 16 dari format fisik owner
// Source: docs/finance-reference/04-rab-material.pdf + 06-rab-upah-tukang.pdf
//
// Usage (di laptop atau sandbox dengan DATABASE_URL=Aiven):
//   npx tsx scripts/seed-rab-anjayo-16.ts
//
// Idempotent: upsert by {projectId, name} utk RAB, by {rabId, workItem, materialName} utk RABLine

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient({ log: ['error', 'warn'] })

// RAB Upah Tukang — 13 pekerjaan standard Anjayo 16 (dari 06-rab-upah-tukang.pdf)
const RAB_UPAH_TUKANG = [
  { name: 'Pondasi + Cor Sloof + Pasang Bata 3 keping', price: 1200000 },
  { name: 'Subsitank (Gali Lobang+Cor), Pipa Subsitank & Urukan', price: 800000 },
  { name: 'Pasang Bata + Tebeng Layar. Cor Ring Balok, Cor Kolom, Pas kusen, Roster, Dak', price: 4500000 },
  { name: 'Rangka Atap + Penutup Atap + NOK + List Plank', price: 1500000 },
  { name: 'Plester Keliling + Instalasi Pipa Listrik + Openingan & Finishing + Finishing Dak', price: 4000000 },
  { name: 'Instalasi 11 Titik (Termasuk pasang mangkok listrik + Pemasangan saklar)', price: 350000 },
  { name: 'Pemasangan Plafon', price: 1100000 },
  { name: 'Pasang Keramik Lantai + Plint + Pas Keramik lantai kamar mandi + dinding', price: 1900000 },
  { name: 'Pasang Pintu kunci & daun pintu (Pintu Depan, Pintu Kamar, dan Pintu)', price: 350000 },
  { name: 'Pembuatan Meja Dapur dan rabat Belakang, Pembatas Belakang, Carpot', price: 1000000 },
  { name: 'Pengecatan', price: 1000000 },
  { name: 'Serah Terima kunci + Pembersihan awal & akhir 15%', price: 2100000 },
  { name: 'Retensi', price: 1200000 },
]
// Total: Rp 21,000,000 per rumah (Anjayo 16 standard)

// RAB Material per tahapan (dari 04-rab-material.pdf — Pondasi/Pemasangan Bata/Subsitank/Plafon)
// Aku extract dari PDF: kolom NAMA MATERIAL / QTY / HARGA / PCS / TOTAL
// Benchmark per rumah: 59-63 zak semen, 9 mobil pasir
const RAB_MATERIAL_LINES: Array<{ workItem: string; materialName: string; quantity: number; unitMeasure: string; unitPrice: number }> = [
  // PONDASI
  { workItem: 'Pondasi', materialName: 'Besi 10', quantity: 45, unitMeasure: 'btg', unitPrice: 66000 },
  { workItem: 'Pondasi', materialName: 'Besi 8', quantity: 15, unitMeasure: 'btg', unitPrice: 43000 },
  { workItem: 'Pondasi', materialName: 'Besi 6', quantity: 24, unitMeasure: 'btg', unitPrice: 28000 },
  { workItem: 'Pondasi', materialName: 'Paku 2', quantity: 30, unitMeasure: 'kg', unitPrice: 14000 },
  { workItem: 'Pondasi', materialName: 'Paku 3', quantity: 30, unitMeasure: 'kg', unitPrice: 14000 },
  { workItem: 'Pondasi', materialName: 'Semen', quantity: 7, unitMeasure: 'zak', unitPrice: 64000 },
  { workItem: 'Pondasi', materialName: 'Benang', quantity: 3, unitMeasure: 'rol', unitPrice: 5000 },
  { workItem: 'Pondasi', materialName: 'Batu Cor', quantity: 1, unitMeasure: 'm3', unitPrice: 510000 },
  { workItem: 'Pondasi', materialName: 'Bata', quantity: 3200, unitMeasure: 'keping', unitPrice: 1900 },
  // Note: pondasi butuh semen 7 zak (dari RAB) — total rumah 59-63 zak (termasuk tahapan lain)

  // PEMASANGAN BATA (sample — full list di PDF)
  { workItem: 'Pemasangan Bata', materialName: 'Semen', quantity: 25, unitMeasure: 'zak', unitPrice: 64000 },
  { workItem: 'Pemasangan Bata', materialName: 'Pasir', quantity: 3, unitMeasure: 'mobil', unitPrice: 450000 },
  { workItem: 'Pemasangan Bata', materialName: 'Bata', quantity: 8000, unitMeasure: 'keping', unitPrice: 1900 },

  // SUBSITANK
  { workItem: 'Subsitank', materialName: 'Pipa Subsitank', quantity: 4, unitMeasure: 'btg', unitPrice: 90000 },
  { workItem: 'Subsitank', materialName: 'Semen', quantity: 5, unitMeasure: 'zak', unitPrice: 64000 },

  // PLAFON
  { workItem: 'Plafon', materialName: 'Gypsum', quantity: 30, unitMeasure: 'lembar', unitPrice: 63000 },
  { workItem: 'Plafon', materialName: 'Holo 2x4', quantity: 20, unitMeasure: 'btg', unitPrice: 14000 },

  // ATAP
  { workItem: 'Atap', materialName: 'Rangka Atap', quantity: 1, unitMeasure: 'set', unitPrice: 7000000 },
  { workItem: 'Atap', materialName: 'Genteng', quantity: 30, unitMeasure: 'm2', unitPrice: 50000 },

  // KERAMIK
  { workItem: 'Keramik', materialName: 'Keramik 40x40', quantity: 60, unitMeasure: 'm2', unitPrice: 45000 },
  { workItem: 'Keramik', materialName: 'Keramik Dinding', quantity: 30, unitMeasure: 'm2', unitPrice: 40000 },

  // LISTRIK
  { workItem: 'Listrik', materialName: 'Kabel 1x1.5', quantity: 100, unitMeasure: 'm', unitPrice: 8500 },
  { workItem: 'Listrik', materialName: 'Saklar + Stop', quantity: 11, unitMeasure: 'set', unitPrice: 50000 },

  // PINTU
  { workItem: 'Pintu', materialName: 'Pintu Depan', quantity: 1, unitMeasure: 'bh', unitPrice: 1500000 },
  { workItem: 'Pintu', materialName: 'Pintu Kamar', quantity: 2, unitMeasure: 'bh', unitPrice: 800000 },

  // Pengecatan
  { workItem: 'Pengecatan', materialName: 'Cat Tembok', quantity: 6, unitMeasure: 'galon', unitPrice: 350000 },

  // Pipa Air
  { workItem: 'Pipa Air', materialName: 'Pipa 3/4', quantity: 20, unitMeasure: 'btg', unitPrice: 35000 },
]

async function main() {
  console.log('=== SEED RAB ANJAYO 16 ===\n')

  // Find Anjayo 16 project
  const project = await db.project.findFirst({ where: { name: 'Anjayo 16' } })
  if (!project) {
    console.error('❌ Project "Anjayo 16" not found. Run import-finance-backup.ts first.')
    process.exit(1)
  }
  console.log(`✅ Project: ${project.name} (${project.code})`)

  // === 1. RAB Upah Tukang (WageType benchmark) ===
  console.log('\n--- RAB Upah Tukang (WageType) ---')
  for (const w of RAB_UPAH_TUKANG) {
    const created = await db.wageType.upsert({
      where: { projectId_name: { projectId: project.id, name: w.name } },
      update: { price: w.price },
      create: {
        projectId: project.id,
        name: w.name,
        price: w.price,
        unitMeasure: 'termin',
      },
    })
    console.log(`  ✅ ${w.name.substring(0, 50)}... → Rp ${w.price.toLocaleString('id-ID')}`)
  }

  // === 2. RAB Material (RAB + RABLine) ===
  console.log('\n--- RAB Material ---')

  // Upsert RAB record
  const rab = await db.rAB.upsert({
    where: { id: `${project.id}-rab-material-v1` },
    update: { name: 'RAB Material Anjayo 16', version: 1 },
    create: {
      id: `${project.id}-rab-material-v1`,
      projectId: project.id,
      name: 'RAB Material Anjayo 16',
      version: 1,
      totalBudget: RAB_MATERIAL_LINES.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    },
  })
  console.log(`✅ RAB: ${rab.name} (total: Rp ${rab.totalBudget.toLocaleString('id-ID')})`)

  // Delete existing lines (will re-create)
  await db.rABLine.deleteMany({ where: { rabId: rab.id } })

  // Create RABLines
  for (const line of RAB_MATERIAL_LINES) {
    await db.rABLine.create({
      data: {
        rabId: rab.id,
        projectId: project.id,
        workItem: line.workItem,
        materialName: line.materialName,
        quantity: line.quantity,
        unitMeasure: line.unitMeasure,
        unitPrice: line.unitPrice,
        totalPrice: line.quantity * line.unitPrice,
      },
    })
  }
  console.log(`✅ ${RAB_MATERIAL_LINES.length} RAB lines created`)

  // === 3. Update Material.minStock utk low-stock alert (benchmark per rumah) ===
  console.log('\n--- Update Material.minStock (benchmark) ---')
  const minStockUpdates = [
    { name: 'Semen', minStock: 60 }, // 59-63 zak per rumah
    { name: 'Bata', minStock: 3000 }, // ~3200 keping per tahap pondasi
    { name: 'Pasir', minStock: 5 }, // 9 mobil per rumah
    { name: 'Batu Cor', minStock: 1 },
    { name: 'Gypsum', minStock: 20 },
  ]
  for (const u of minStockUpdates) {
    const updated = await db.material.updateMany({
      where: { name: { contains: u.name, mode: 'insensitive' } },
      data: { minStock: u.minStock },
    })
    if (updated.count > 0) console.log(`  ✅ ${u.name}: minStock=${u.minStock} (${updated.count} material updated)`)
  }

  // === SUMMARY ===
  console.log('\n=== SEED SUMMARY ===')
  const wageCount = await db.wageType.count({ where: { projectId: project.id } })
  const rabLineCount = await db.rABLine.count({ where: { projectId: project.id } })
  console.log(`  WageTypes (Anjayo 16): ${wageCount}`)
  console.log(`  RABLines (Anjayo 16): ${rabLineCount}`)
  console.log('\n✅ RAB Anjayo 16 seeded!')
}

main()
  .catch((e) => {
    console.error('Fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
