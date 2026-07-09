// Test Phase D directly (bypass HTTP)
import { db } from '../src/lib/db'

async function main() {
  const project = await db.project.findFirst()
  if (!project) { console.error('No project'); return }

  console.log('=== Test: Add daily expenses ===')
  const listrik = await db.dailyExpense.create({
    data: {
      projectId: project.id,
      category: 'LISTRIK',
      description: 'Topup listrik Anjayo 16',
      amount: 200000,
      paymentMethod: 'TUNAI',
    },
  })
  console.log('✅ Listrik:', listrik.id)

  const bensin = await db.dailyExpense.create({
    data: {
      projectId: project.id,
      category: 'BENSIN',
      description: 'Bensin motor ke toko material',
      amount: 50000,
    },
  })
  console.log('✅ Bensin:', bensin.id)

  // List
  console.log('\n=== List daily expenses ===')
  const expenses = await db.dailyExpense.findMany({
    where: { projectId: project.id },
    orderBy: { paidAt: 'desc' },
  })
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  }
  console.log(`✅ ${expenses.length} expenses, total: Rp ${totalAmount.toLocaleString('id-ID')}`)
  console.log('By category:', byCategory)

  // Weekly report test
  console.log('\n=== Weekly Report (current week) ===')
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - dayOfWeek + 1)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  // POs paid this week
  const posThisWeek = await db.pO.findMany({
    where: {
      projectId: project.id,
      status: { in: ['PAID', 'PARTIAL_PAID'] },
    },
    include: { supplier: { select: { name: true } }, payments: true },
  })
  console.log(`POs paid: ${posThisWeek.length}`)

  const materialsBySupplier: Record<string, number> = {}
  let totalMaterial = 0
  for (const po of posThisWeek) {
    const paid = po.payments.reduce((s, p) => s + p.amount, 0)
    materialsBySupplier[po.supplier.name] = (materialsBySupplier[po.supplier.name] || 0) + paid
    totalMaterial += paid
  }

  // Upah
  const upahRequests = await db.fundRequest.findMany({
    where: { type: 'TUKANG_WAGE', status: 'PAID' },
  })
  let totalUpah = upahRequests.reduce((s, r) => s + r.amount, 0)

  // AddCost
  const addCostRequests = await db.fundRequest.findMany({
    where: { type: { not: 'TUKANG_WAGE' }, status: 'PAID' },
  })
  let totalAddCost = addCostRequests.reduce((s, r) => s + r.amount, 0)

  // Daily
  const dailyThisWeek = await db.dailyExpense.findMany({
    where: { projectId: project.id, paidAt: { gte: startDate, lte: endDate } },
  })
  const totalDaily = dailyThisWeek.reduce((s, e) => s + e.amount, 0)

  const grandTotal = totalMaterial + totalUpah + totalAddCost + totalDaily

  console.log(`Period: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`)
  console.log(`Material: Rp ${totalMaterial.toLocaleString('id-ID')} (${Object.keys(materialsBySupplier).length} suppliers)`)
  console.log(`Upah Tukang: Rp ${totalUpah.toLocaleString('id-ID')} (${upahRequests.length} requests)`)
  console.log(`Add Cost: Rp ${totalAddCost.toLocaleString('id-ID')} (${addCostRequests.length} items)`)
  console.log(`Daily Expenses: Rp ${totalDaily.toLocaleString('id-ID')} (${dailyThisWeek.length} items)`)
  console.log(`GRAND TOTAL: Rp ${grandTotal.toLocaleString('id-ID')}`)
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
