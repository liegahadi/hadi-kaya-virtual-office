// Re-seed RAB Material Anjayo 16 dengan data lengkap dari PDF
// Source: docs/finance-reference/04-rab-material.pdf
// Total 1 rumah: Rp 23.511.214

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ log: ['error'] })

const RAB_MATERIAL: Array<{ workItem: string; materialName: string; quantity: number; unitMeasure: string; unitPrice: number }> = [
  // PONDASI
  { workItem: 'Pondasi', materialName: 'Besi 10', quantity: 45, unitMeasure: 'btg', unitPrice: 66000 },
  { workItem: 'Pondasi', materialName: 'Besi 8', quantity: 15, unitMeasure: 'btg', unitPrice: 43000 },
  { workItem: 'Pondasi', materialName: 'Besi 6', quantity: 24, unitMeasure: 'btg', unitPrice: 28000 },
  { workItem: 'Pondasi', materialName: 'Paku 2', quantity: 30, unitMeasure: 'kg', unitPrice: 14000 },
  { workItem: 'Pondasi', materialName: 'Paku 3', quantity: 30, unitMeasure: 'kg', unitPrice: 14000 },
  { workItem: 'Pondasi', materialName: 'Semen', quantity: 7, unitMeasure: 'zak', unitPrice: 64000 },
  { workItem: 'Pondasi', materialName: 'Benang', quantity: 3, unitMeasure: 'rol', unitPrice: 5000 },
  { workItem: 'Pondasi', materialName: 'Batu Cor', quantity: 1, unitMeasure: 'm3', unitPrice: 510000 },
  { workItem: 'Pondasi', materialName: 'Ember', quantity: 4, unitMeasure: 'bh', unitPrice: 10000 },
  { workItem: 'Pondasi', materialName: 'Bata', quantity: 3200, unitMeasure: 'keping', unitPrice: 1900 },
  // PEMASANGAN BATA
  { workItem: 'Pemasangan Bata', materialName: 'Papan Cor', quantity: 10, unitMeasure: 'btg', unitPrice: 30000 },
  { workItem: 'Pemasangan Bata', materialName: 'Kayu Stut', quantity: 10, unitMeasure: 'btg', unitPrice: 5000 },
  { workItem: 'Pemasangan Bata', materialName: 'Kawat Ikat', quantity: 1, unitMeasure: 'kg', unitPrice: 43000 },
  { workItem: 'Pemasangan Bata', materialName: 'Semen', quantity: 18, unitMeasure: 'zak', unitPrice: 64000 },
  { workItem: 'Pemasangan Bata', materialName: 'Kusen Pintu', quantity: 4, unitMeasure: 'bh', unitPrice: 450000 },
  { workItem: 'Pemasangan Bata', materialName: 'Pintu 90', quantity: 1, unitMeasure: 'bh', unitPrice: 500000 },
  { workItem: 'Pemasangan Bata', materialName: 'Pintu 80', quantity: 3, unitMeasure: 'bh', unitPrice: 450000 },
  // SUBSITANK
  { workItem: 'Subsitank', materialName: 'Kayu Stut', quantity: 30, unitMeasure: 'btg', unitPrice: 5000 },
  { workItem: 'Subsitank', materialName: 'Triplek', quantity: 1.5, unitMeasure: 'lembar', unitPrice: 85000 },
  { workItem: 'Subsitank', materialName: 'Tali Nylon', quantity: 1, unitMeasure: 'rol', unitPrice: 16000 },
  { workItem: 'Subsitank', materialName: 'Lobang Angin', quantity: 6, unitMeasure: 'bh', unitPrice: 68000 },
  { workItem: 'Subsitank', materialName: 'Semen', quantity: 2, unitMeasure: 'zak', unitPrice: 64000 },
  { workItem: 'Subsitank', materialName: 'Tanah Timbun', quantity: 3, unitMeasure: 'm3', unitPrice: 250000 },
  { workItem: 'Subsitank', materialName: 'Pipa 3', quantity: 1.5, unitMeasure: 'btg', unitPrice: 90000 },
  // PLAFON
  { workItem: 'Plafon', materialName: 'Gypsum A+', quantity: 17, unitMeasure: 'lembar', unitPrice: 65000 },
  { workItem: 'Plafon', materialName: 'Hollow 2x4', quantity: 44, unitMeasure: 'btg', unitPrice: 16000 },
  { workItem: 'Plafon', materialName: 'Compound', quantity: 2, unitMeasure: 'sak', unitPrice: 70000 },
  { workItem: 'Plafon', materialName: 'Skrup Hitam', quantity: 1, unitMeasure: 'box', unitPrice: 70000 },
  { workItem: 'Plafon', materialName: 'Kasa Gypsum', quantity: 2, unitMeasure: 'rol', unitPrice: 40000 },
  { workItem: 'Plafon', materialName: 'Paku Beton', quantity: 2, unitMeasure: 'kg', unitPrice: 15000 },
  { workItem: 'Plafon', materialName: 'List Plank 3M', quantity: 8, unitMeasure: 'btg', unitPrice: 42000 },
  // PEMASANGAN ATAP
  { workItem: 'Pemasangan Atap', materialName: 'Baut Spandek 12x50', quantity: 200, unitMeasure: 'bh', unitPrice: 1000 },
  { workItem: 'Pemasangan Atap', materialName: 'Baut Canal', quantity: 700, unitMeasure: 'bh', unitPrice: 500 },
  { workItem: 'Pemasangan Atap', materialName: 'Canal 75/65', quantity: 20, unitMeasure: 'lembar', unitPrice: 88000 },
  { workItem: 'Pemasangan Atap', materialName: 'Spandek Kulit Jeruk 0.25', quantity: 16, unitMeasure: 'm', unitPrice: 180000 },
  { workItem: 'Pemasangan Atap', materialName: 'Rabung', quantity: 8, unitMeasure: 'btg', unitPrice: 78000 },
  { workItem: 'Pemasangan Atap', materialName: 'Reng 28 35', quantity: 17, unitMeasure: 'btg', unitPrice: 32000 },
  { workItem: 'Pemasangan Atap', materialName: 'Semen', quantity: 20, unitMeasure: 'zak', unitPrice: 68000 },
  { workItem: 'Pemasangan Atap', materialName: 'Pasir', quantity: 2, unitMeasure: 'mobil', unitPrice: 450000 },
  // PEMASANGAN LISTRIK
  { workItem: 'Pemasangan Listrik', materialName: 'Pipa Listrik', quantity: 9, unitMeasure: 'btg', unitPrice: 10000 },
  { workItem: 'Pemasangan Listrik', materialName: 'Mangkok Listrik', quantity: 6, unitMeasure: 'bh', unitPrice: 5000 },
  { workItem: 'Pemasangan Listrik', materialName: 'Kabel NYAA 1x1.5', quantity: 1, unitMeasure: 'rol', unitPrice: 205000 },
  { workItem: 'Pemasangan Listrik', materialName: 'Kabel NYAA 1x2.5', quantity: 1, unitMeasure: 'rol', unitPrice: 360000 },
  { workItem: 'Pemasangan Listrik', materialName: 'Kabel IB', quantity: 0.71429, unitMeasure: 'rol', unitPrice: 43000 },
  // PEMASANGAN JENDELA
  { workItem: 'Pemasangan Jendela', materialName: 'Gunungan Cosment', quantity: 450, unitMeasure: 'bh', unitPrice: 200 },
  { workItem: 'Pemasangan Jendela', materialName: 'Rambuncis 4', quantity: 155, unitMeasure: 'bh', unitPrice: 700 },
  { workItem: 'Pemasangan Jendela', materialName: 'Lobang', quantity: 2, unitMeasure: 'bh', unitPrice: 158000 },
  { workItem: 'Pemasangan Jendela', materialName: 'Lem Asam (Isi 24)', quantity: 3, unitMeasure: 'tube', unitPrice: 11000 },
  { workItem: 'Pemasangan Jendela', materialName: 'Engsel Casment', quantity: 4, unitMeasure: 'pasang', unitPrice: 21000 },
  { workItem: 'Pemasangan Jendela', materialName: 'Kaca Raybent', quantity: 3, unitMeasure: 'bh', unitPrice: 26500 },
  { workItem: 'Pemasangan Jendela', materialName: '1/2 Gepeng Banci', quantity: 1, unitMeasure: 'bh', unitPrice: 146500 },
  { workItem: 'Pemasangan Jendela', materialName: 'Openback Kusen', quantity: 2, unitMeasure: 'bh', unitPrice: 43000 },
  { workItem: 'Pemasangan Jendela', materialName: 'Full Wh Luxal', quantity: 2, unitMeasure: 'set', unitPrice: 72000 },
  // PEMASANGAN KERAMIK
  { workItem: 'Pemasangan Keramik', materialName: 'Semen', quantity: 10, unitMeasure: 'zak', unitPrice: 265000 },
  { workItem: 'Pemasangan Keramik', materialName: 'Pasir', quantity: 1, unitMeasure: 'mobil', unitPrice: 680000 },
  { workItem: 'Pemasangan Keramik', materialName: 'Keramik 40x40', quantity: 40, unitMeasure: 'm2', unitPrice: 54000 },
  { workItem: 'Pemasangan Keramik', materialName: 'Keramik 25x40', quantity: 7, unitMeasure: 'm2', unitPrice: 65000 },
  { workItem: 'Pemasangan Keramik', materialName: 'Keramik 25x25', quantity: 4, unitMeasure: 'm2', unitPrice: 62000 },
  { workItem: 'Pemasangan Keramik', materialName: 'Keramik 40x40 Tampak Depan', quantity: 3, unitMeasure: 'm2', unitPrice: 72000 },
  { workItem: 'Pemasangan Keramik', materialName: 'Skrap Pelamir', quantity: 2, unitMeasure: 'bh', unitPrice: 9000 },
  // PLASTER
  { workItem: 'Plaster', materialName: 'Semen', quantity: 2, unitMeasure: 'zak', unitPrice: 140000 },
  { workItem: 'Plaster', materialName: 'Pasir', quantity: 2, unitMeasure: 'mobil', unitPrice: 400000 },
  // PENGECATAN
  { workItem: 'Pengecatan', materialName: 'Pelamir', quantity: 2, unitMeasure: 'galon', unitPrice: 140000 },
  { workItem: 'Pengecatan', materialName: 'Afduner', quantity: 2, unitMeasure: 'galon', unitPrice: 13000 },
  { workItem: 'Pengecatan', materialName: 'Cat Luar', quantity: 1, unitMeasure: 'galon', unitPrice: 400000 },
  { workItem: 'Pengecatan', materialName: 'Cat Dalam', quantity: 3, unitMeasure: 'galon', unitPrice: 250000 },
  { workItem: 'Pengecatan', materialName: 'Cat Minyak', quantity: 4, unitMeasure: 'kaleng', unitPrice: 80000 },
  { workItem: 'Pengecatan', materialName: 'Roll Cat', quantity: 2, unitMeasure: 'bh', unitPrice: 30000 },
  // KAMAR MANDI
  { workItem: 'Kamar Mandi', materialName: 'Pintu Kamar Mandi', quantity: 1, unitMeasure: 'bh', unitPrice: 250000 },
  { workItem: 'Kamar Mandi', materialName: 'Kloset', quantity: 1, unitMeasure: 'bh', unitPrice: 160000 },
  { workItem: 'Kamar Mandi', materialName: 'Saringan Lantai', quantity: 1, unitMeasure: 'bh', unitPrice: 8000 },
  { workItem: 'Kamar Mandi', materialName: 'Elbow 2', quantity: 2, unitMeasure: 'bh', unitPrice: 8000 },
  { workItem: 'Kamar Mandi', materialName: 'Elbow 1/2', quantity: 3, unitMeasure: 'bh', unitPrice: 5000 },
  { workItem: 'Kamar Mandi', materialName: 'T 1/2', quantity: 1, unitMeasure: 'bh', unitPrice: 5000 },
  { workItem: 'Kamar Mandi', materialName: 'L Drat', quantity: 1, unitMeasure: 'bh', unitPrice: 15000 },
  { workItem: 'Kamar Mandi', materialName: 'Kran Air', quantity: 2, unitMeasure: 'bh', unitPrice: 64000 },
  { workItem: 'Kamar Mandi', materialName: 'Semen', quantity: 1, unitMeasure: 'zak', unitPrice: 150000 },
  { workItem: 'Kamar Mandi', materialName: 'Wastafel', quantity: 1, unitMeasure: 'bh', unitPrice: 60000 },
  { workItem: 'Kamar Mandi', materialName: 'Pipa 2', quantity: 1, unitMeasure: 'btg', unitPrice: 15000 },
  // CARPOT DAN MEJA DAPUR
  { workItem: 'Carpot dan Meja Dapur', materialName: 'Kran Air', quantity: 1, unitMeasure: 'bh', unitPrice: 500000 },
  { workItem: 'Carpot dan Meja Dapur', materialName: 'Pintu 90', quantity: 3, unitMeasure: 'bh', unitPrice: 450000 },
  { workItem: 'Carpot dan Meja Dapur', materialName: 'Pintu 80', quantity: 12, unitMeasure: 'bh', unitPrice: 25000 },
  { workItem: 'Carpot dan Meja Dapur', materialName: 'Engsel Pintu', quantity: 4, unitMeasure: 'pasang', unitPrice: 100000 },
  { workItem: 'Carpot dan Meja Dapur', materialName: 'Handle Pintu', quantity: 8, unitMeasure: 'bh', unitPrice: 20000 },
  // PEMASANGAN PINTU
  { workItem: 'Pemasangan Pintu', materialName: 'Pipa 1/2', quantity: 1, unitMeasure: 'btg', unitPrice: 5000 },
  { workItem: 'Pemasangan Pintu', materialName: 'LDrat', quantity: 1, unitMeasure: 'bh', unitPrice: 4000 },
  { workItem: 'Pemasangan Pintu', materialName: 'Sok Drat', quantity: 8, unitMeasure: 'bh', unitPrice: 4000 },
  { workItem: 'Pemasangan Pintu', materialName: 'Elbow 1/2', quantity: 1, unitMeasure: 'bh', unitPrice: 5000 },
  { workItem: 'Pemasangan Pintu', materialName: 'T 1/2', quantity: 1, unitMeasure: 'bh', unitPrice: 5000 },
  { workItem: 'Pemasangan Pintu', materialName: 'Stok Kran', quantity: 6, unitMeasure: 'bh', unitPrice: 15000 },
  { workItem: 'Pemasangan Pintu', materialName: 'Kran Air', quantity: 2, unitMeasure: 'bh', unitPrice: 15000 },
  // PEMASANGAN LISTRIK (TITIK)
  { workItem: 'Pemasangan Listrik Titik', materialName: 'Fitting', quantity: 2, unitMeasure: 'bh', unitPrice: 10000 },
  { workItem: 'Pemasangan Listrik Titik', materialName: 'Saklar Seri', quantity: 2, unitMeasure: 'bh', unitPrice: 65000 },
  { workItem: 'Pemasangan Listrik Titik', materialName: 'Stop Kontak', quantity: 1, unitMeasure: 'bh', unitPrice: 7000 },
  { workItem: 'Pemasangan Listrik Titik', materialName: 'Engkel Stok', quantity: 1, unitMeasure: 'bh', unitPrice: 65000 },
  { workItem: 'Pemasangan Listrik Titik', materialName: 'MCB', quantity: 1, unitMeasure: 'bh', unitPrice: 7000 },
]

async function main() {
  console.log('=== RE-SEED RAB MATERIAL ANJAYO 16 ===\n')
  const project = await db.project.findFirst({ where: { name: 'Anjayo 16' } })
  if (!project) { console.error('Project not found'); process.exit(1) }

  // Delete old RAB + RABLine
  const oldRabs = await db.rAB.findMany({ where: { projectId: project.id } })
  for (const rab of oldRabs) { await db.rABLine.deleteMany({ where: { rabId: rab.id } }); await db.rAB.delete({ where: { id: rab.id } }) }
  console.log(`✅ Deleted ${oldRabs.length} old RAB(s)`)

  // Create new RAB
  const rab = await db.rAB.create({ data: { projectId: project.id, name: 'RAB Material Anjayo 16 (Lengkap)', version: 2, totalBudget: RAB_MATERIAL.reduce((s, l) => s + l.quantity * l.unitPrice, 0) } })
  console.log(`✅ Created RAB: ${rab.name} (Total: Rp ${rab.totalBudget.toLocaleString('id-ID')})`)

  // Create RABLines
  for (const line of RAB_MATERIAL) {
    await db.rABLine.create({ data: { rabId: rab.id, projectId: project.id, workItem: line.workItem, materialName: line.materialName, quantity: line.quantity, unitMeasure: line.unitMeasure, unitPrice: line.unitPrice, totalPrice: line.quantity * line.unitPrice } })
  }
  console.log(`✅ Created ${RAB_MATERIAL.length} RABLines`)

  // Summary per workItem
  const workItems = [...new Set(RAB_MATERIAL.map(l => l.workItem))]
  console.log(`\nWorkItems (${workItems.length}):`)
  for (const wi of workItems) {
    const items = RAB_MATERIAL.filter(l => l.workItem === wi)
    const total = items.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
    console.log(`  ${wi}: ${items.length} items, Rp ${total.toLocaleString('id-ID')}`)
  }
  console.log(`\nTotal: Rp ${RAB_MATERIAL.reduce((s, l) => s + l.quantity * l.unitPrice, 0).toLocaleString('id-ID')}`)
}
main().catch(console.error).finally(() => db.$disconnect())
