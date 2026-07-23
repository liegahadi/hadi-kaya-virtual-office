// PO Number Generator
// Format: PO/{projectCode}/{blockNumber|GDG}/{seq}/{MMYY}
// Dash di DB/filename: PO-A16-A12-001-0726
// Slash di display: PO/A16/A12/001/0726

import { db } from '@/lib/db'

/**
 * Generate next PO number untuk {projectCode, unitSegment, year}
 * Seq reset per tahun per unit
 */
export async function generatePoNumber(
  projectId: string,
  unitId: string | null,
  poDate: Date = new Date(),
): Promise<string> {
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project?.code) {
    throw new Error(`Project ${projectId} has no code — set project.code first`)
  }
  const projectCode = project.code

  // Determine unit segment
  let unitSegment = 'GDG'
  if (unitId) {
    const unit = await db.unit.findUnique({ where: { id: unitId } })
    if (unit?.blockNumber) unitSegment = unit.blockNumber
  }

  // Year + month-year
  const year = poDate.getFullYear()
  const monthYear = `${String(poDate.getMonth() + 1).padStart(2, '0')}${String(year).slice(-2)}`

  // Find max seq for this {projectCode, unitSegment, year} from existing PO numbers
  // PO number pattern: PO-{projectCode}-{unitSegment}-{seq}-{MMYY}
  const prefix = `PO-${projectCode}-${unitSegment}-`
  const suffix = `-${monthYear}`

  // Get all PO numbers matching this prefix+suffix
  const existingPOs = await db.purchaseOrder.findMany({
    where: {
      poNumber: { startsWith: prefix },
      poDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    select: { poNumber: true },
  })

  let maxSeq = 0
  for (const po of existingPOs) {
    // po.poNumber format: PO-A16-A12-001-0726
    const match = po.poNumber.match(new RegExp(`^${prefix}(\\d+)${suffix}$`))
    if (match) {
      const seq = parseInt(match[1], 10)
      if (seq > maxSeq) maxSeq = seq
    }
  }

  const nextSeq = maxSeq + 1
  const seqPadded = String(nextSeq).padStart(3, '0')
  return `${prefix}${seqPadded}${suffix}`
}

/**
 * Convert dash format (DB) to slash format (display)
 * PO-A16-A12-001-0726 → PO/A16/A12/001/0726
 */
export function toDisplayFormat(poNumber: string): string {
  return poNumber.replace(/-/g, '/')
}

/**
 * Convert slash format (display) to dash format (DB)
 * PO/A16/A12/001/0726 → PO-A16-A12-001-0726
 */
export function toDbFormat(poNumber: string): string {
  return poNumber.replace(/\//g, '-')
}
