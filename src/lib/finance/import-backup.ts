// Import Finance & Material data dari backup JSON ke schema baru
// Source: docs/finance-reference/backup-18072026.json
// Target: schema baru (Phase A — lihat PRD section 25.11)
//
// Shared lib — dipakai oleh:
// - scripts/import-finance-backup.ts (CLI, untuk run lokal)
// - /api/admin/import-backup/route.ts (Vercel API route, untuk run dari browser)

import * as fs from 'fs'
import * as path from 'path'

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
  'Rumah Stadium': 'RS',
  'Rumah Pojok': 'RPK',
}

export interface ImportResult {
  success: boolean
  stats: Record<string, { imported: number; skipped: number; errors: number }>
  totalImported: number
  totalErrors: number
  distinctWorkers: string[]
  backupDate?: string
  error?: string
}

export async function importFinanceBackup(db: any): Promise<ImportResult> {
  const stats: Record<string, { imported: number; skipped: number; errors: number }> = {}
  const trackStat = (section: string, type: 'imported' | 'skipped' | 'errors') => {
    if (!stats[section]) stats[section] = { imported: 0, skipped: 0, errors: 0 }
    stats[section][type]++
  }

  const backupPath = path.join(process.cwd(), 'docs', 'finance-reference', 'backup-18072026.json')
  if (!fs.existsSync(backupPath)) {
    return { success: false, stats, totalImported: 0, totalErrors: 0, distinctWorkers: [], error: `Backup file not found: ${backupPath}` }
  }

  const raw = fs.readFileSync(backupPath, 'utf-8')
  const data: BackupData = JSON.parse(raw)

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
  for (const p of data.projects) {
    try {
      const code = PROJECT_CODES[p.name]
      if (!code) {
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
    } catch (e: any) {
      trackStat('projects', 'errors')
    }
  }

  // === 2. UNITS ===
  for (const u of data.units) {
    try {
      const projectId = projectIdMap[u.projectId]
      if (!projectId) {
        trackStat('units', 'skipped')
        continue
      }
      const blockNumber = `${u.block}${u.unitNumber}`
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
      trackStat('units', 'errors')
    }
  }

  // === 3. SUPPLIERS ===
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
      trackStat('suppliers', 'errors')
    }
  }

  // === 4. CATEGORIES ===
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
      trackStat('categories', 'errors')
    }
  }

  // === 5. MATERIALS ===
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
      trackStat('materials', 'errors')
    }
  }

  // === 6. WAGE TYPES ===
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
      trackStat('wageTypes', 'errors')
    }
  }

  // === 7. WORKERS (auto-seed dari distinct workerNames) ===
  const distinctWorkers = new Set<string>()
  for (const w of data.wagePayments) {
    if (w.workerName) distinctWorkers.add(w.workerName)
  }
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
      trackStat('workers', 'errors')
    }
  }

  // === 8. PURCHASE ORDERS + PO ITEMS ===
  const poSeqCounter: Record<string, number> = {}
  for (const po of data.purchaseOrders) {
    try {
      const supplierId = supplierIdMap[po.supplierId]
      if (!supplierId) {
        trackStat('purchaseOrders', 'skipped')
        continue
      }
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

      let unitSegment = 'GDG'
      if (unitId) {
        const unit = await db.unit.findUnique({ where: { id: unitId } })
        if (unit?.blockNumber) unitSegment = unit.blockNumber
      }

      const seqKey = `${projectCode}-${unitSegment}-${year}`
      poSeqCounter[seqKey] = (poSeqCounter[seqKey] || 0) + 1
      const seq = poSeqCounter[seqKey]

      const poNumber = `PO-${projectCode}-${unitSegment}-${String(seq).padStart(3, '0')}-${monthYear}`

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
          actualTotal: plannedTotal,
          locked: po.status === 'PAID',
          poDate,
          receivedAt: po.status === 'PAID' ? poDate : null,
          notes: po.notes || null,
        },
      })
      poIdMap[po.id] = created.id

      for (const it of (po.items || [])) {
        const materialId = materialIdMap[it.materialId]
        if (!materialId) continue
        await db.pOItem.create({
          data: {
            poId: created.id,
            materialId,
            qty: it.qty || 0,
            price: it.price || 0,
            totalPrice: (it.qty || 0) * (it.price || 0),
            block: it.block || null,
            directUse: false,
            deliveredQty: po.status === 'PAID' ? (it.qty || 0) : 0,
          },
        })
      }

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
      trackStat('purchaseOrders', 'errors')
    }
  }

  // === 9. WAGE PAYMENTS ===
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
          wageDate,
        },
      })
      wagePaymentIdMap[w.id] = created.id

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
      trackStat('wagePayments', 'errors')
    }
  }

  // === 10. OTHER EXPENSES ===
  for (const e of data.otherExpenses) {
    try {
      const projectId = e.projectId ? projectIdMap[e.projectId] : null
      const expenseDate = new Date(e.date)
      const created = await db.otherExpense.create({
        data: {
          projectId: projectId || null,
          category: e.category || 'OTHER',
          recipientName: e.description || 'Unknown',
          amount: e.amount || 0,
          description: e.description || '',
          paymentCycle: e.paymentCycle || null,
          isCash: false,
          status: e.status === 'PAID' ? 'PAID' : 'UNPAID',
          expenseDate,
        },
      })
      expenseIdMap[e.id] = created.id

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
      trackStat('otherExpenses', 'errors')
    }
  }

  // === 11. STOCK ===
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
      await db.stock.upsert({
        where: { materialId },
        update: { quantity: s.quantity || 0 },
        create: {
          materialId,
          quantity: s.quantity || 0,
          avgPrice: material.lastPrice || 0,
        },
      })
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
      trackStat('stock', 'errors')
    }
  }

  // === 12. MATERIAL USAGES ===
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
          usedAt,
        },
      })
      for (const it of (u.items || [])) {
        const materialId = materialIdMap[it.materialId]
        if (!materialId) continue
        const material = await db.material.findUnique({ where: { id: materialId } })
        await db.materialUsageItem.create({
          data: {
            usageId: created.id,
            materialId,
            qty: it.qty || 0,
            price: it.price || 0,
            unitMeasure: material?.unitMeasure || 'Pcs',
            subtotal: (it.qty || 0) * (it.price || 0),
          },
        })
      }
      trackStat('usages', 'imported')
    } catch (e: any) {
      trackStat('usages', 'errors')
    }
  }

  // === 13. MEMOS + MEMO LINES ===
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

      for (const poId of (m.poIds || [])) {
        const newPoId = poIdMap[poId]
        if (!newPoId) continue
        await db.memoLine.create({
          data: {
            memoId: created.id,
            kind: 'PO',
            itemId: newPoId,
            proposedAmount: 0,
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
      trackStat('memos', 'errors')
    }
  }

  const totalImported = Object.values(stats).reduce((s, v) => s + v.imported, 0)
  const totalErrors = Object.values(stats).reduce((s, v) => s + v.errors, 0)

  return {
    success: true,
    stats,
    totalImported,
    totalErrors,
    distinctWorkers: Array.from(distinctWorkers),
    backupDate: data.backupDate,
  }
}
