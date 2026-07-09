// Test PO creation directly (bypass HTTP)
import { db } from '../src/lib/db'
import { createPO } from '../src/lib/finance/po-generator'

async function main() {
  const rina = await db.agent.findFirst({ where: { name: 'RINA' } })
  const project = await db.project.findFirst()
  const supplier = await db.supplier.findFirst({ where: { name: 'Toko Maju Jaya' } })

  if (!rina || !project || !supplier) {
    console.error('Missing required data')
    return
  }

  console.log('=== Create PO via direct call ===')
  const result = await createPO({
    projectId: project.id,
    supplierId: supplier.id,
    agentId: rina.id,
    unitBlocks: 'E3, E4',
    workItem: 'Pondasi',
    lines: [
      { materialName: 'SEMEN', quantity: 100, unitMeasure: 'zak', unitPrice: 72000 },
      { materialName: 'PASIR', quantity: 2, unitMeasure: 'm3', unitPrice: 450000 },
    ],
    notes: 'Untuk pondasi E3 dan E4',
  })

  if (result.success) {
    console.log('✅ PO Created!')
    console.log('  PO Number:', result.po!.poNumber)
    console.log('  Subtotal: Rp', result.po!.subtotal.toLocaleString('id-ID'))
    console.log('  Total: Rp', result.po!.totalAmount.toLocaleString('id-ID'))
    console.log('  Lines:', result.po!.lineCount)
    console.log('  Prices updated:', result.pricesUpdated)
  } else {
    console.log('❌', result.error)
  }

  // Verify supplier prices
  console.log('\n=== Supplier Prices ===')
  const prices = await db.supplierItemPrice.findMany({
    where: { supplierId: supplier.id },
  })
  console.log(`✅ ${prices.length} price records:`)
  for (const p of prices) {
    console.log(`  ${p.materialName} (${p.unitMeasure}): Rp ${p.price.toLocaleString('id-ID')} - ${p.source}`)
  }

  // List all POs
  console.log('\n=== All POs ===')
  const pos = await db.pO.findMany({
    include: { supplier: { select: { name: true } }, _count: { select: { lines: true } } },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`✅ ${pos.length} POs:`)
  for (const po of pos) {
    console.log(`  ${po.poNumber} - ${po.supplier.name} - Rp ${po.totalAmount.toLocaleString('id-ID')} - ${po.status} - ${po._count.lines} items`)
  }
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
