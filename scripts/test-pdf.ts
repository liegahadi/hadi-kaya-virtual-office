// Test PDF generation directly (bypass HTTP)
import { db } from '../src/lib/db'
import { generatePOPdf } from '../src/lib/finance/pdf-generator'
import path from 'path'
import fs from 'fs'

async function main() {
  const po = await db.pO.findFirst({
    include: {
      supplier: true,
      project: true,
      lines: { orderBy: { id: 'asc' } },
    },
  })

  if (!po) {
    console.error('No PO found')
    return
  }

  console.log('=== Generate PO PDF ===')
  console.log('PO:', po.poNumber)
  console.log('Supplier:', po.supplier.name)
  console.log('Lines:', po.lines.length)

  const outputDir = path.join(process.cwd(), 'public', 'po-pdfs')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const outputPath = path.join(outputDir, `${po.poNumber}.pdf`)

  await generatePOPdf({
    poNumber: po.poNumber,
    projectName: po.project.name,
    projectCode: po.project.code,
    logoUrl: po.project.logoUrl,
    supplierName: po.supplier.name,
    supplierAddress: po.supplier.address,
    supplierContact: po.supplier.contactPerson,
    supplierPhone: po.supplier.phone,
    unitBlocks: po.unitBlocks,
    workItem: po.workItem,
    date: po.createdAt,
    lines: po.lines.map((l, i) => ({
      no: i + 1,
      description: l.materialName,
      qty: l.quantity,
      unit: l.unitMeasure,
      unitPrice: l.unitPrice,
      discount: 0,
      total: l.totalPrice,
    })),
    discount: 0,
    tax: 0,
    subtotal: po.subtotal,
    totalAmount: po.totalAmount,
    notes: po.notes,
  }, outputPath)

  console.log('✅ PDF Generated!')
  console.log('  Path:', outputPath)
  console.log('  Size:', (fs.statSync(outputPath).size / 1024).toFixed(1), 'KB')

  // Save to DB
  const existingDoc = await db.pODocument.findFirst({
    where: { poId: po.id, type: 'PO' },
  })
  if (existingDoc) {
    await db.pODocument.update({
      where: { id: existingDoc.id },
      data: { fileUrl: `/po-pdfs/${po.poNumber}.pdf` },
    })
  } else {
    await db.pODocument.create({
      data: {
        poId: po.id,
        type: 'PO',
        fileName: `${po.poNumber}.pdf`,
        fileUrl: `/po-pdfs/${po.poNumber}.pdf`,
        mimeType: 'application/pdf',
        uploadedBy: 'RINA',
      },
    })
  }
  console.log('✅ Saved to DB')
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
