// ============================================================
// PO GENERATOR - RINA's main function
// ============================================================
// Format PO Number: [projectCode]-[seqNumber]-[ddmmyy]
// e.g. A16-0001-230626
// seqNumber resets every 1 January
// ============================================================

import { db } from '@/lib/db'

export interface CreatePOInput {
  projectId: string
  supplierId: string
  agentId: string // RINA's ID
  unitBlocks?: string // e.g. "E3, E4"
  workItem?: string // e.g. "Pondasi", "Plasteran"
  lines: Array<{
    materialName: string
    quantity: number
    unitMeasure: string
    unitPrice: number
    notes?: string
  }>
  notes?: string
  discount?: number
  tax?: number
}

export interface CreatePOOutput {
  success: boolean
  po?: {
    id: string
    poNumber: string
    subtotal: number
    discount: number
    tax: number
    totalAmount: number
    lineCount: number
  }
  error?: string
  // Also update supplier prices if not exist
  pricesUpdated?: number
}

/**
 * Generate next PO number for project
 * Format: [projectCode]-[seqNumber]-[ddmmyy]
 * seqNumber resets every 1 January
 */
export async function generatePONumber(projectId: string): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { code: true },
  })
  if (!project) throw new Error('Project not found')

  const now = new Date()
  const year = now.getFullYear()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(year).slice(-2)

  // Find max seqNumber for this project this year
  const lastPO = await db.pO.findFirst({
    where: {
      projectId,
      createdAt: {
        gte: new Date(year, 0, 1), // 1 Januari tahun ini
        lt: new Date(year + 1, 0, 1), // 1 Januari tahun depan
      },
    },
    orderBy: { seqNumber: 'desc' },
    select: { seqNumber: true },
  })

  const nextSeq = (lastPO?.seqNumber || 0) + 1
  const seqStr = String(nextSeq).padStart(4, '0')

  return `${project.code}-${seqStr}-${dd}${mm}${yy}`
}

/**
 * Create new PO with multiple line items
 * - Auto-generate PO number
 * - Calculate subtotal, tax, total
 * - Update supplier item prices (don't average, separate per supplier)
 */
export async function createPO(input: CreatePOInput): Promise<CreatePOOutput> {
  try {
    // 1. Generate PO number
    const poNumber = await generatePONumber(input.projectId)
    const now = new Date()
    const year = now.getFullYear()

    // Get seq number from PO number (last part after second dash)
    const seqMatch = poNumber.match(/^.+?-(\d+)-/)
    const seqNumber = seqMatch ? parseInt(seqMatch[1]) : 1

    // 2. Calculate amounts
    const linesWithTotals = input.lines.map(line => ({
      ...line,
      totalPrice: line.quantity * line.unitPrice,
    }))
    const subtotal = linesWithTotals.reduce((sum, l) => sum + l.totalPrice, 0)
    const discount = input.discount || 0
    const tax = input.tax || 0
    const totalAmount = subtotal - discount + tax

    // 3. Create PO
    const po = await db.pO.create({
      data: {
        poNumber,
        seqNumber,
        agentId: input.agentId,
        supplierId: input.supplierId,
        projectId: input.projectId,
        unitBlocks: input.unitBlocks || null,
        workItem: input.workItem || null,
        status: 'PENDING_APPROVAL', // butuh ACC owner
        subtotal,
        totalAmount,
        notes: input.notes || null,
        lines: {
          create: linesWithTotals.map(l => ({
            materialName: l.materialName,
            quantity: l.quantity,
            unitMeasure: l.unitMeasure,
            unitPrice: l.unitPrice,
            totalPrice: l.totalPrice,
            notes: l.notes || null,
          })),
        },
      },
      include: {
        lines: true,
        supplier: true,
      },
    })

    // 4. Update supplier item prices (separate per supplier, don't average)
    let pricesUpdated = 0
    for (const line of input.lines) {
      const existing = await db.supplierItemPrice.findUnique({
        where: {
          supplierId_materialName_unitMeasure: {
            supplierId: input.supplierId,
            materialName: line.materialName.toUpperCase(),
            unitMeasure: line.unitMeasure,
          },
        },
      })

      if (existing) {
        // Update if price changed
        if (existing.price !== line.unitPrice) {
          await db.supplierItemPrice.update({
            where: { id: existing.id },
            data: {
              price: line.unitPrice,
              quotedAt: now,
              source: 'PO',
              notes: `Updated via PO ${poNumber}`,
            },
          })
          pricesUpdated++
        }
      } else {
        // Create new price record
        await db.supplierItemPrice.create({
          data: {
            supplierId: input.supplierId,
            materialName: line.materialName.toUpperCase(),
            unitMeasure: line.unitMeasure,
            price: line.unitPrice,
            quotedAt: now,
            source: 'PO',
            notes: `First price from PO ${poNumber}`,
          },
        })
        pricesUpdated++
      }
    }

    // 5. Create approval record
    await db.approval.create({
      data: {
        requesterAgentId: input.agentId,
        type: 'PO',
        referenceId: po.id,
        payload: JSON.stringify({
          poNumber: po.poNumber,
          supplier: po.supplier.name,
          unitBlocks: input.unitBlocks,
          workItem: input.workItem,
          subtotal,
          discount,
          tax,
          totalAmount,
          lineCount: linesWithTotals.length,
          timestamp: now.toISOString(),
        }),
        status: 'PENDING',
      },
    })

    return {
      success: true,
      po: {
        id: po.id,
        poNumber: po.poNumber,
        subtotal,
        discount,
        tax,
        totalAmount,
        lineCount: linesWithTotals.length,
      },
      pricesUpdated,
    }
  } catch (error) {
    console.error('Create PO error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get PO with all details (lines, supplier, documents, approvals)
 */
export async function getPOWithDetails(poId: string) {
  return db.pO.findUnique({
    where: { id: poId },
    include: {
      agent: { select: { name: true, role: true } },
      supplier: true,
      project: { select: { name: true, code: true, logoUrl: true } },
      lines: true,
      documents: { orderBy: { uploadedAt: 'asc' } },
      payments: true,
      approvalRecords: {
        include: {
          approver: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

/**
 * List POs with filters
 */
export async function listPOs(filters: {
  projectId?: string
  supplierId?: string
  status?: string
  limit?: number
}) {
  const where: Record<string, unknown> = {}
  if (filters.projectId) where.projectId = filters.projectId
  if (filters.supplierId) where.supplierId = filters.supplierId
  if (filters.status) where.status = filters.status

  return db.pO.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
    include: {
      supplier: { select: { name: true } },
      _count: { select: { lines: true, documents: true } },
    },
  })
}
