// AVCO (Average Cost) Calculator
// AVCO running price di Stock.avgPrice
// Saat Usage dibuat, MaterialUsageItem.price = AVCO saat itu, di-lock permanen (frozen)
//
// AVCO formula: newAvgPrice = (oldQty × oldAvg + incomingQty × incomingPrice) / (oldQty + incomingQty)

import { db } from '@/lib/db'

/**
 * Update AVCO saat material masuk gudang (PO RECEIVED)
 * Dipanggil dari StockAdjustment creation dengan type=PO_RECEIVED
 */
export async function updateAvcoOnReceive(
  materialId: string,
  incomingQty: number,
  incomingPrice: number,
): Promise<{ newQty: number; newAvgPrice: number }> {
  const stock = await db.stock.findUnique({ where: { materialId } })
  if (!stock) {
    // First stock entry
    const newStock = await db.stock.create({
      data: {
        materialId,
        quantity: incomingQty,
        avgPrice: incomingPrice,
      },
    })
    return { newQty: newStock.quantity, newAvgPrice: newStock.avgPrice }
  }

  const oldQty = stock.quantity
  const oldAvg = stock.avgPrice
  const totalQty = oldQty + incomingQty
  const newAvgPrice = totalQty > 0 ? (oldQty * oldAvg + incomingQty * incomingPrice) / totalQty : incomingPrice

  const updated = await db.stock.update({
    where: { materialId },
    data: { quantity: totalQty, avgPrice: newAvgPrice },
  })

  return { newQty: updated.quantity, newAvgPrice: updated.avgPrice }
}

/**
 * Get current AVCO price untuk material (snapshot pas Usage)
 * Dipanggil dari MaterialUsageItem creation
 */
export async function getCurrentAvcoPrice(materialId: string): Promise<number> {
  const stock = await db.stock.findUnique({ where: { materialId } })
  if (!stock || stock.quantity <= 0) {
    // Fallback: material.lastPrice
    const material = await db.material.findUnique({ where: { id: materialId } })
    return material?.lastPrice || 0
  }
  return stock.avgPrice
}

/**
 * Update AVCO saat material keluar gudang (USAGE_OUT)
 * AVCO price TIDAK berubah (cuma qty yang berkurang)
 */
export async function updateAvcoOnUsage(
  materialId: string,
  outgoingQty: number,
): Promise<{ newQty: number; avgPrice: number }> {
  const stock = await db.stock.findUnique({ where: { materialId } })
  if (!stock) {
    throw new Error(`Stock not found for material ${materialId}`)
  }

  const newQty = stock.quantity - outgoingQty
  if (newQty < 0) {
    throw new Error(`Insufficient stock for material ${materialId}. Current: ${stock.quantity}, requested: ${outgoingQty}`)
  }

  const updated = await db.stock.update({
    where: { materialId },
    data: { quantity: newQty },
  })

  return { newQty: updated.quantity, avgPrice: stock.avgPrice }
}
