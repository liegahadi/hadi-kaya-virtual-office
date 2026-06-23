// ============================================================
// UPDATE SITEPLAN DATA - Based on user's confirmation
// A1-E3 SOLD, E4 BOOKED (Andas Saputra), E5 BOOKED (JENNI)
// ============================================================

import { db } from '../src/lib/db'

async function main() {
  console.log('🗺️  Updating siteplan data...')

  const project = await db.project.findUnique({ where: { name: 'Anjayo 16' } })
  if (!project) {
    console.error('❌ Project Anjayo 16 not found. Run seed first.')
    process.exit(1)
  }

  // Get all current units
  const units = await db.unit.findMany({
    where: { projectId: project.id },
    orderBy: { blockNumber: 'asc' },
  })
  console.log(`📋 Found ${units.length} units`)

  // Reset all to AVAILABLE first
  await db.unit.updateMany({
    where: { projectId: project.id },
    data: {
      status: 'AVAILABLE',
      soldAt: null,
      bookedAt: null,
      customerId: null,
    },
  })
  console.log('🔄 Reset all units to AVAILABLE')

  // Parse block letter + number
  const getBlockLetter = (blockNumber: string) => blockNumber.charAt(0).toUpperCase()
  const getBlockNum = (blockNumber: string) => parseInt(blockNumber.slice(1))

  // Mark A1-E3 as SOLD
  // A1, A2, A3, ... A15, A16, B1, B2, B3, ... E3
  // Approach: any unit with block letter A-D, OR block letter E with number 1-3
  let soldCount = 0
  for (const unit of units) {
    const letter = getBlockLetter(unit.blockNumber)
    const num = getBlockNum(unit.blockNumber)

    // A1-A16, B1-B16, C1-C16, D1-D16, E1-E3 = SOLD
    if (['A', 'B', 'C', 'D'].includes(letter) || (letter === 'E' && num <= 3)) {
      await db.unit.update({
        where: { id: unit.id },
        data: {
          status: 'SOLD',
          soldAt: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        },
      })
      soldCount++
    }
  }
  console.log(`✅ Marked ${soldCount} units as SOLD (A1-E3)`)

  // Mark E4 as BOOKED (Andas Saputra - SP3K BSB Syariah)
  // Mark E5 as BOOKED (JENNI - proses BTN)

  // First, create the 2 customers
  const andas = await db.customer.upsert({
    where: { id: 'customer-andas-e4' },
    update: {
      name: 'Andas Saputra',
      whatsappNumber: null,
      phone: null,
      occupation: null,
      maritalStatus: null,
      monthlyIncome: null,
      stage: 'SP3K',
      stageUpdatedAt: new Date(),
      notes: 'SP3K Bank Sumselbabel Syariah. Unit E4 sedang dalam proses pembangunan. Document AI perlu: pekerjaan, lokasi kerja, no HP, status pernikahan, gaji.',
      isExistingMigration: true,
    },
    create: {
      id: 'customer-andas-e4',
      projectId: project.id,
      name: 'Andas Saputra',
      stage: 'SP3K',
      stageUpdatedAt: new Date(),
      notes: 'SP3K Bank Sumselbabel Syariah. Unit E4 sedang dalam proses pembangunan. Document AI perlu: pekerjaan, lokasi kerja, no HP, status pernikahan, gaji.',
      isExistingMigration: true,
    },
  })
  console.log(`✅ Customer: ${andas.name} (SP3K BSB Syariah)`)

  const jenni = await db.customer.upsert({
    where: { id: 'customer-jenni-e5' },
    update: {
      name: 'JENNI',
      whatsappNumber: null,
      phone: null,
      occupation: null,
      maritalStatus: null,
      monthlyIncome: null,
      stage: 'PEMBERKASAN',
      stageUpdatedAt: new Date(),
      notes: 'Sedang proses di Bank BTN. Document AI perlu: pekerjaan, lokasi kerja, no HP, status pernikahan, gaji.',
      isExistingMigration: true,
    },
    create: {
      id: 'customer-jenni-e5',
      projectId: project.id,
      name: 'JENNI',
      stage: 'PEMBERKASAN',
      stageUpdatedAt: new Date(),
      notes: 'Sedang proses di Bank BTN. Document AI perlu: pekerjaan, lokasi kerja, no HP, status pernikahan, gaji.',
      isExistingMigration: true,
    },
  })
  console.log(`✅ Customer: ${jenni.name} (Proses BTN)`)

  // Assign E4 to Andas, E5 to JENNI
  const e4 = await db.unit.findFirst({
    where: { projectId: project.id, blockNumber: 'E4' },
  })
  const e5 = await db.unit.findFirst({
    where: { projectId: project.id, blockNumber: 'E5' },
  })

  if (e4) {
    await db.unit.update({
      where: { id: e4.id },
      data: {
        status: 'BOOKED',
        bookedAt: new Date(),
        customerId: andas.id,
      },
    })
    console.log(`✅ Unit E4 → BOOKED by Andas Saputra`)
  } else {
    console.log('⚠️  Unit E4 not found in database')
  }

  if (e5) {
    await db.unit.update({
      where: { id: e5.id },
      data: {
        status: 'BOOKED',
        bookedAt: new Date(),
        customerId: jenni.id,
      },
    })
    console.log(`✅ Unit E5 → BOOKED by JENNI`)
  } else {
    console.log('⚠️  Unit E5 not found in database')
  }

  // Update project sitePlanUrl
  await db.project.update({
    where: { id: project.id },
    data: { sitePlanUrl: '/siteplan-anjayo.png' },
  })
  console.log('✅ Site plan image URL updated')

  // Final count
  const finalUnits = await db.unit.findMany({
    where: { projectId: project.id },
  })
  const byStatus = finalUnits.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n📊 Final unit status:')
  console.log(`   SOLD: ${byStatus.SOLD || 0}`)
  console.log(`   BOOKED: ${byStatus.BOOKED || 0}`)
  console.log(`   AVAILABLE: ${byStatus.AVAILABLE || 0}`)
  console.log(`   TOTAL: ${finalUnits.length}`)

  console.log('\n🎉 Siteplan data updated successfully!')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await db.$disconnect()
    process.exit(1)
  })
