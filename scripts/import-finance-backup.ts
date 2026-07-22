// Import Finance & Material data dari backup JSON ke schema baru
// Source: docs/finance-reference/backup-18072026.json
// Target: schema baru (Phase A — lihat PRD section 25.11)
//
// Usage:
//   DATABASE_URL="postgres://avnadmin:[PASSWORD]@hadi-kaya-db-hadi-kaya-db.k.aivencloud.com:16163/defaultdb" \
//     npx tsx scripts/import-finance-backup.ts
//
// Atau untuk test lokal (SQLite):
//   npx tsx scripts/import-finance-backup.ts
//
// Safety:
// - Idempotent: upsert by name/unique key, jadi bisa di-run berulang
// - Log progress tiap section
// - Count-check di akhir (compare vs backup)
// - Skip Drive upload of base64 evidence (separate migration step)

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient({
  log: ['error', 'warn'],
})

interface BackupData {
  projects: any[]
  units: any[]
  suppliers: any[]
  materials: any[]
  categories: any[]
  wageTypes: any[]
  purchaseOrders: any[]
  wagePayments: any[]
  otherExpenses: any[]
  memos: any[]
  stock: any[]
  usages: any[]
  cloudConfig?: any
  materialRABs?: any[]
  rabExplanations?: any[]
  backupDate?: string
}

// Mapping project name → code (per PRD section 25.2)
const PROJECT_CODES: Record<string, string> = {
  'Anjayo 16': 'A16',
  'Permata Muntai': 'PM',
  'Toko Kopi': 'TK',
  'Kantor Anjayo': 'KA',
  'Rumah Pasir Putih': 'RP',
  'Anjayo 1': 'A01',
  'Rumah Stadion': 'RS',
  'Rumah Pojok': 'RPK',
}

// Stats counter
const stats: Record<string, { imported: number; skipped: number; errors: number }> = {}
const trackStat = (section: string, type: 'imported' | 'skipped' | 'errors') => {
  if (!stats[section]) stats[section] = { imported: 0, skipped: 0, errors: 0 }
  stats[section][type]++
}

async function main() {
  console.log('=== IMPORT FINANCE & MATERIAL BACKUP ===\n')

  const backupPath = path.join(process.cwd(), 'docs', 'finance-reference', 'backup-18072026.json')
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`)
    process.exit(1)
  }

  console.log(`📄 Loading backup: ${backupPath}`)
  const raw = fs.readFileSync(backupPath, 'utf-8')
  const data: BackupData = JSON.parse(raw)

  console.log(`   Backup date: ${data.backupDate || 'unknown'}\n`)
  console.log('=== BACKUP COUNTS ===')
  console.log(`  projects: ${data.projects.length}`)
  console.log(`  units: ${data.units.length}`)
  console.log(`  suppliers: ${data.suppliers.length}`)
  console.log(`  materials: ${data.materials.length}`)
  console.log(`  categories: ${data.categories.length}`)
  console.log(`  wageTypes: ${data.wageTypes.length}`)
  console.log(`  purchaseOrders: ${data.purchaseOrders.length}`)
  console.log(`  wagePayments: ${data.wagePayments.length}`)
  console.log(`  otherExpenses: ${data.otherExpenses.length}`)
  console.log(`  memos: ${data.memos.length}`)
  console.log(`  stock: ${data.stock.length}`)
  console.log(`  usages: ${data.usages.length}\n`)

  // Mapping tables (backup id → new id)
  const projectIdMap: Record<string, string> = {}
  const unitIdMap: Record<string, string> = {}
  const supplierIdMap: Record<string, string> = {}
  const materialIdMap: Record<string, string> = {}
  const categoryIdMap: Record<string, string> = {}
  const wageTypeIdMap: Record<string, string> = {}
  const workerIdMap: Record<string, string> = {}
  const poIdMap: Record<string, string> = {}
  const wagePaymentIdMap: Record<string, string> = {}
  const expenseIdMap: Record<string, string> = {}

  // === 1. PROJECTS ===
  console.log('--- 1. PROJECTS ---')
  for (const p of data.projects) {
    try {
      const code = PROJECT_CODES[p.name]
      if (!code) {
        console.warn(`  ⚠️  No code mapping for project: ${p.name}, skip`)
        trackStat('projects', 'skipped')
        continue
      }
      const created = await db.project.upsert({
        where: { name: p.name },
        update: { code, brandName: p.name.split(' ')[0] },
        create: {
          name: p.name,
          brandName: p.name.split(' ')[0],
          code,
          location: 'Pangkalpinang',
          status: 'ACTIVE',
        },
      })
      projectIdMap[p.id] = created.id
      trackStat('projects', 'imported')
      console.log(`  ✅ ${p.name} → code=${code} id=${created.id}`)
    } catch (e: any) {
      console.error(`  ❌ Project ${p.name}: ${e.message}`)
      trackStat('projects', 'errors')
    }
  }

  // === 2. UNITS ===
  console.log('\n--- 2. UNITS ---')
  for (const u of data.units) {
    try {
      const projectId = projectIdMap[u.projectId]
      if (!projectId) {
        console.warn(`  ⚠️  Unit ${u.id}: project not found, skip`)
        trackStat('units', 'skipped')
        continue
      }
      const blockNumber = `${u.block}${u.unitNumber}` // composite, e.g. "E1" or "D12"
      const created = await db.unit.upsert({
        where: { projectId_blockNumber: { projectId, blockNumber } },
        update: {},
        create: {
          projectId,
          blockNumber,
          unitType: '36',
          landSize: 84,
          buildingSize: 36,
        },
      })
      unitIdMap[u.id] = created.id
      trackStat('units', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Unit ${u.id}: ${e.message}`)
      trackStat('units', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.units?.imported || 0} units`)

  // === 3. SUPPLIERS ===
  console.log('\n--- 3. SUPPLIERS ---')
  for (const s of data.suppliers) {
    try {
      const created = await db.supplier.upsert({
        where: { name: s.name },
        update: {
          bankName: s.bankName || null,
          bankAccount: s.bankAccount || null,
        },
        create: {
          name: s.name,
          phone: s.phone || undefined,
          contactPerson: s.owner || undefined,
          bankName: s.bankName || null,
          bankAccount: s.bankAccount || null,
        },
      })
      supplierIdMap[s.id] = created.id
      trackStat('suppliers', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Supplier ${s.name}: ${e.message}`)
      trackStat('suppliers', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.suppliers?.imported || 0} suppliers`)

  // === 4. CATEGORIES ===
  console.log('\n--- 4. CATEGORIES ---')
  for (const c of data.categories) {
    try {
      const created = await db.category.upsert({
        where: { name: c.name },
        update: {},
        create: { name: c.name },
      })
      categoryIdMap[c.id] = created.id
      trackStat('categories', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Category ${c.name}: ${e.message}`)
      trackStat('categories', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.categories?.imported || 0} categories`)

  // === 5. MATERIALS ===
  console.log('\n--- 5. MATERIALS ---')
  for (const m of data.materials) {
    try {
      const categoryId = m.categoryId ? categoryIdMap[m.categoryId] : null
      const created = await db.material.upsert({
        where: { name: m.name },
        update: {},
        create: {
          name: m.name,
          categoryId: categoryId || null,
          unitMeasure: m.unit || 'Pcs',
          lastPrice: m.defaultPrice || null,
          isActive: true,
        },
      })
      materialIdMap[m.id] = created.id
      trackStat('materials', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Material ${m.name}: ${e.message}`)
      trackStat('materials', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.materials?.imported || 0} materials`)

  // === 6. WAGE TYPES ===
  console.log('\n--- 6. WAGE TYPES ---')
  for (const w of data.wageTypes) {
    try {
      const projectId = projectIdMap[w.projectId]
      if (!projectId) {
        trackStat('wageTypes', 'skipped')
        continue
      }
      const created = await db.wageType.upsert({
        where: { projectId_name: { projectId, name: w.name } },
        update: {},
        create: {
          projectId,
          name: w.name,
          price: w.price || 0,
        },
      })
      wageTypeIdMap[w.id] = created.id
      trackStat('wageTypes', 'imported')
    } catch (e: any) {
      console.error(`  ❌ WageType ${w.name}: ${e.message}`)
      trackStat('wageTypes', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.wageTypes?.imported || 0} wage types`)

  // === 7. WORKERS (auto-seed dari distinct workerNames di wagePayments) ===
  console.log('\n--- 7. WORKERS (auto-seed) ---')
  const distinctWorkers = new Set<string>()
  for (const w of data.wagePayments) {
    if (w.workerName) distinctWorkers.add(w.workerName)
  }
  console.log(`  Found ${distinctWorkers.size} distinct workers: ${Array.from(distinctWorkers).join(', ')}`)
  for (const name of Array.from(distinctWorkers)) {
    try {
      const created = await db.worker.upsert({
        where: { name },
        update: {},
        create: { name, isActive: true },
      })
      workerIdMap[name] = created.id
      trackStat('workers', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Worker ${name}: ${e.message}`)
      trackStat('workers', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.workers?.imported || 0} workers`)

  // === 8. PURCHASE ORDERS + PO ITEMS ===
  console.log('\n--- 8. PURCHASE ORDERS ---')
  // Counter per {projectCode|unitSegment|year} untuk generate seq
  const poSeqCounter: Record<string, number> = {}
  for (const po of data.purchaseOrders) {
    try {
      const supplierId = supplierIdMap[po.supplierId]
      if (!supplierId) {
        trackStat('purchaseOrders', 'skipped')
        continue
      }
      // Determine project + unit from first item (most POs have all items same project/unit)
      const firstItem = po.items?.[0]
      const projectId = firstItem?.projectId ? projectIdMap[firstItem.projectId] : null
      const unitId = firstItem?.unitId ? unitIdMap[firstItem.unitId] : null

      if (!projectId) {
        trackStat('purchaseOrders', 'skipped')
        continue
      }

      const project = await db.project.findUnique({ where: { id: projectId } })
      const projectCode = project?.code || 'XX'
      const poDate = new Date(po.date)
      const year = poDate.getFullYear()
      const monthYear = `${String(poDate.getMonth() + 1).padStart(2, '0')}${String(year).slice(-2)}`

      // Unit segment: blockNumber atau GDG
      let unitSegment = 'GDG'
      if (unitId) {
        const unit = await db.unit.findUnique({ where: { id: unitId } })
        if (unit?.blockNumber) unitSegment = unit.blockNumber
      }

      // Seq counter per {projectCode|unitSegment|year}
      const seqKey = `${projectCode}-${unitSegment}-${year}`
      poSeqCounter[seqKey] = (poSeqCounter[seqKey] || 0) + 1
      const seq = poSeqCounter[seqKey]

      const poNumber = `PO-${projectCode}-${unitSegment}-${String(seq).padStart(3, '0')}-${monthYear}`

      // Compute plannedTotal = sum of qty × price
      const plannedTotal = (po.items || []).reduce((sum: number, it: any) => sum + (it.qty || 0) * (it.price || 0), 0)

      const status = po.status === 'PAID' ? 'PAID' : 'DRAFT'
      const created = await db.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          projectId,
          unitId: unitId || null,
          status,
          plannedTotal,
          actualTotal: plannedTotal, // no notas in backup, so actual = planned
          locked: po.status === 'PAID', // lock PAID ones
          poDate,
          receivedAt: po.status === 'PAID' ? poDate : null,
          notes: po.notes || null,
        },
      })
      poIdMap[po.id] = created.id

      // Create POItems
      for (const it of (po.items || [])) {
        const materialId = materialIdMap[it.materialId]
        if (!materialId) {
          console.warn(`  ⚠️  PO ${po.poNumber}: material ${it.materialId} not found, skip item`)
          continue
        }
        await db.pOItem.create({
          data: {
            poId: created.id,
            materialId,
            qty: it.qty || 0,
            price: it.price || 0,
            totalPrice: (it.qty || 0) * (it.price || 0),
            block: it.block || null,
            directUse: false, // default false (B4: directUse belum di-flag di backup lama)
            deliveredQty: po.status === 'PAID' ? (it.qty || 0) : 0,
          },
        })
      }

      // If PAID, create Payment record for audit ledger
      if (po.status === 'PAID') {
        await db.payment.create({
          data: {
            poId: created.id,
            amount: plannedTotal,
            method: 'TRANSFER',
            supplierId,
            paidAt: poDate,
            notes: 'Migrated from backup (PAID)',
          },
        })
      }

      trackStat('purchaseOrders', 'imported')
    } catch (e: any) {
      console.error(`  ❌ PO ${po.poNumber}: ${e.message}`)
      trackStat('purchaseOrders', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.purchaseOrders?.imported || 0} POs`)

  // === 9. WAGE PAYMENTS ===
  console.log('\n--- 9. WAGE PAYMENTS ---')
  for (const w of data.wagePayments) {
    try {
      const projectId = projectIdMap[w.projectId]
      const workerId = w.workerName ? workerIdMap[w.workerName] : null
      const wageTypeId = w.wageTypeId ? wageTypeIdMap[w.wageTypeId] : null
      const unitId = w.unitId ? unitIdMap[w.unitId] : null

      if (!projectId || !workerId || !wageTypeId) {
        trackStat('wagePayments', 'skipped')
        continue
      }

      const wageDate = new Date(w.date)
      const created = await db.wagePayment.create({
        data: {
          projectId,
          unitId: unitId || null,
          workerId,
          wageTypeId,
          fullTaskBudget: w.fullTaskBudget || 0,
          amount: w.amount || 0,
          workDescription: w.workDescription || null,
          status: w.status === 'PAID' ? 'PAID' : 'UNPAID',
          weekClosing: null,
          wageDate,
          notes: null,
        },
      })
      wagePaymentIdMap[w.id] = created.id

      // If PAID, create Payment record
      if (w.status === 'PAID') {
        await db.payment.create({
          data: {
            wagePaymentId: created.id,
            amount: w.amount || 0,
            method: 'TRANSFER',
            workerId,
            paidAt: wageDate,
            notes: 'Migrated from backup (PAID)',
          },
        })
      }

      trackStat('wagePayments', 'imported')
    } catch (e: any) {
      console.error(`  ❌ WagePayment ${w.id}: ${e.message}`)
      trackStat('wagePayments', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.wagePayments?.imported || 0} wage payments`)

  // === 10. OTHER EXPENSES ===
  console.log('\n--- 10. OTHER EXPENSES ---')
  for (const e of data.otherExpenses) {
    try {
      const projectId = e.projectId ? projectIdMap[e.projectId] : null
      const expenseDate = new Date(e.date)
      const created = await db.otherExpense.create({
        data: {
          projectId: projectId || null,
          unitId: null, // backup doesn't have unitId for expenses
          category: e.category || 'OTHER',
          recipientName: e.description || 'Unknown',
          amount: e.amount || 0,
          description: e.description || '',
          paymentCycle: e.paymentCycle || null,
          isCash: false,
          status: e.status === 'PAID' ? 'PAID' : 'UNPAID',
          expenseDate,
          notes: null,
        },
      })
      expenseIdMap[e.id] = created.id

      // If PAID, create Payment record
      if (e.status === 'PAID') {
        await db.payment.create({
          data: {
            expenseId: created.id,
            amount: e.amount || 0,
            method: 'TRANSFER',
            paidAt: expenseDate,
            notes: 'Migrated from backup (PAID)',
          },
        })
      }

      trackStat('otherExpenses', 'imported')
    } catch (e: any) {
      console.error(`  ❌ OtherExpense ${e.id}: ${e.message}`)
      trackStat('otherExpenses', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.otherExpenses?.imported || 0} other expenses`)

  // === 11. STOCK (initial balance) ===
  console.log('\n--- 11. STOCK + STOCK ADJUSTMENT ---')
  for (const s of data.stock) {
    try {
      const materialId = materialIdMap[s.materialId]
      if (!materialId) {
        trackStat('stock', 'skipped')
        continue
      }
      const material = await db.material.findUnique({ where: { id: materialId } })
      if (!material) {
        trackStat('stock', 'skipped')
        continue
      }
      // Upsert stock
      await db.stock.upsert({
        where: { materialId },
        update: { quantity: s.quantity || 0 },
        create: {
          materialId,
          quantity: s.quantity || 0,
          avgPrice: material.lastPrice || 0,
        },
      })
      // Insert StockAdjustment for audit (type: INITIAL)
      await db.stockAdjustment.create({
        data: {
          materialId,
          deltaQty: s.quantity || 0,
          reason: 'Initial balance from backup import',
          type: 'INITIAL',
          prevQty: 0,
          newQty: s.quantity || 0,
          unitCost: material.lastPrice || null,
          refId: null,
          date: new Date(),
        },
      })
      trackStat('stock', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Stock ${s.materialId}: ${e.message}`)
      trackStat('stock', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.stock?.imported || 0} stock records`)

  // === 12. MATERIAL USAGES ===
  console.log('\n--- 12. MATERIAL USAGES ---')
  for (const u of data.usages) {
    try {
      const projectId = projectIdMap[u.projectId]
      const unitId = u.unitId ? unitIdMap[u.unitId] : null
      if (!projectId) {
        trackStat('usages', 'skipped')
        continue
      }
      const usedAt = new Date(u.date)
      const created = await db.materialUsage.create({
        data: {
          unitId: unitId || null,
          projectId,
          poId: null,
          source: 'WAREHOUSE_DISTRIBUTION',
          reportedBy: null,
          notes: null,
          usedAt,
        },
      })
      // Create MaterialUsageItem per item
      for (const it of (u.items || [])) {
        const materialId = materialIdMap[it.materialId]
        if (!materialId) {
          continue
        }
        const material = await db.material.findUnique({ where: { id: materialId } })
        await db.materialUsageItem.create({
          data: {
            usageId: created.id,
            materialId,
            qty: it.qty || 0,
            price: it.price || 0, // AVCO snapshot (frozen)
            unitMeasure: material?.unitMeasure || 'Pcs',
            workItem: null,
            subtotal: (it.qty || 0) * (it.price || 0),
          },
        })
      }
      trackStat('usages', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Usage ${u.id}: ${e.message}`)
      trackStat('usages', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.usages?.imported || 0} material usages`)

  // === 13. MEMOS + MEMO LINES ===
  console.log('\n--- 13. MEMOS ---')
  for (const m of data.memos) {
    try {
      const memoDate = new Date(m.date)
      const status = m.status === 'COMPLETED' ? 'COMPLETED' : 'PROPOSED'
      const created = await db.memo.create({
        data: {
          memoNumber: m.memoNumber,
          memoDate,
          status,
          notes: m.notes || null,
        },
      })

      // Explode poIds/wageIds/expenseIds into MemoLine rows
      for (const poId of (m.poIds || [])) {
        const newPoId = poIdMap[poId]
        if (!newPoId) continue
        await db.memoLine.create({
          data: {
            memoId: created.id,
            kind: 'PO',
            itemId: newPoId,
            proposedAmount: 0, // unknown, will recompute later
            status: status === 'COMPLETED' ? 'PAID' : 'PROPOSED',
            paidAt: status === 'COMPLETED' ? memoDate : null,
          },
        })
      }
      for (const wageId of (m.wageIds || [])) {
        const newWageId = wagePaymentIdMap[wageId]
        if (!newWageId) continue
        await db.memoLine.create({
          data: {
            memoId: created.id,
            kind: 'WAGE',
            itemId: newWageId,
            proposedAmount: 0,
            status: status === 'COMPLETED' ? 'PAID' : 'PROPOSED',
            paidAt: status === 'COMPLETED' ? memoDate : null,
          },
        })
      }
      for (const expId of (m.expenseIds || [])) {
        const newExpId = expenseIdMap[expId]
        if (!newExpId) continue
        await db.memoLine.create({
          data: {
            memoId: created.id,
            kind: 'EXPENSE',
            itemId: newExpId,
            proposedAmount: 0,
            status: status === 'COMPLETED' ? 'PAID' : 'PROPOSED',
            paidAt: status === 'COMPLETED' ? memoDate : null,
          },
        })
      }
      trackStat('memos', 'imported')
    } catch (e: any) {
      console.error(`  ❌ Memo ${m.memoNumber}: ${e.message}`)
      trackStat('memos', 'errors')
    }
  }
  console.log(`  ✅ Imported ${stats.memos?.imported || 0} memos`)

  // === FINAL SUMMARY ===
  console.log('\n=== IMPORT SUMMARY ===')
  console.log('Section          | Backup | Imported | Skipped | Errors')
  console.log('-----------------+--------+----------+---------+-------')
  const sections: Array<[string, number]> = [
    ['projects', data.projects.length],
    ['units', data.units.length],
    ['suppliers', data.suppliers.length],
    ['categories', data.categories.length],
    ['materials', data.materials.length],
    ['wageTypes', data.wageTypes.length],
    ['workers', distinctWorkers.size],
    ['purchaseOrders', data.purchaseOrders.length],
    ['wagePayments', data.wagePayments.length],
    ['otherExpenses', data.otherExpenses.length],
    ['stock', data.stock.length],
    ['usages', data.usages.length],
    ['memos', data.memos.length],
  ]
  for (const [name, backupCount] of sections) {
    const s = stats[name] || { imported: 0, skipped: 0, errors: 0 }
    console.log(`${name.padEnd(17)}| ${String(backupCount).padStart(6)} | ${String(s.imported).padStart(8)} | ${String(s.skipped).padStart(7)} | ${String(s.errors).padStart(6)}`)
  }

  console.log('\n✅ Import completed!')
  console.log('\n⚠️  DEFERRED (separate migration):')
  console.log('  - evidenceImage base64 → Google Drive FileRef (WagePayment)')
  console.log('  - recompute proposedAmount di MemoLine dari actual PO/Wage/Expense amounts')
  console.log('  - POItem.directUse flag (all set to false — owner re-flag manual via UI)')
  console.log('  - categoryId integrity fix (some materials have categoryId="Lainnya" text)')
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
