// ============================================================
// DINA v2: UPLOAD HELPER — Anti-overwrite + Anti-duplicate
// ============================================================
// Rules:
// 1. NEVER overwrite existing file in Drive (auto-rename with timestamp suffix)
// 2. NEVER duplicate identical file (SHA-256 hash check, skip if exists)
// 3. Always set permission: anyone with link = VIEWER (not editor)
// ============================================================

import crypto from 'crypto'

/**
 * Compute SHA-256 hash of a file buffer.
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Generate unique filename if name already exists.
 * Pattern: "filename.ext" → "filename (1).ext" → "filename (2).ext" ...
 *
 * For RAW- prefixed files with versioning:
 * "RAW - Jenni - SK Kerja v1.docx" → "RAW - Jenni - SK Kerja v2.docx" → v3 ...
 */
export function generateUniqueFilename(
  originalName: string,
  existingNames: string[]
): string {
  // Check if name follows versioning pattern (RAW - X - Y vN.ext)
  const versionMatch = originalName.match(/^(.+?)\s+v(\d+)(\.[^.]+)$/)
  if (versionMatch) {
    const [, prefix, versionStr, ext] = versionMatch
    let version = parseInt(versionStr, 10)
    let candidate = originalName
    while (existingNames.includes(candidate)) {
      version++
      candidate = `${prefix} v${version}${ext}`
    }
    return candidate
  }

  // Standard pattern: filename.ext → filename (1).ext
  const lastDot = originalName.lastIndexOf('.')
  const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName
  const ext = lastDot > 0 ? originalName.substring(lastDot) : ''

  let counter = 1
  let candidate = originalName
  while (existingNames.includes(candidate)) {
    candidate = `${baseName} (${counter})${ext}`
    counter++
  }
  return candidate
}

/**
 * Check if a file with the same hash already exists for this customer.
 * Returns the existing GoogleDoc record if found, null otherwise.
 */
export async function checkDuplicateFile(
  prisma: any,
  customerId: string | null,
  fileHash: string
): Promise<any | null> {
  if (!customerId || !fileHash) return null
  try {
    const existing = await prisma.googleDoc.findFirst({
      where: { customerId, fileHash },
    })
    return existing || null
  } catch (err) {
    console.error('[checkDuplicateFile] error:', err)
    return null
  }
}

/**
 * Build the standard RAW naming convention.
 * Format: "RAW - [Nama] - [Jenis] - v[N].ext"
 */
export function buildRawFilename(
  customerName: string,
  docType: string,
  version: number,
  extension: string = '.docx'
): string {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  return `RAW - ${customerName} - ${docType} v${version}${ext}`
}

/**
 * Build the standard SIGNED naming convention (user uploads signed version).
 * Format: "SIGNED - [Nama] - [Jenis].pdf"
 */
export function buildSignedFilename(
  customerName: string,
  docType: string,
  extension: string = '.pdf'
): string {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  return `SIGNED - ${customerName} - ${docType}${ext}`
}

/**
 * Calculate next version number for a customer + docType.
 */
export async function getNextVersion(
  prisma: any,
  customerId: string,
  docType: string
): Promise<number> {
  try {
    const latest = await prisma.googleDoc.findFirst({
      where: { customerId, docType },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    return (latest?.version || 0) + 1
  } catch (err) {
    console.error('[getNextVersion] error:', err)
    return 1
  }
}
