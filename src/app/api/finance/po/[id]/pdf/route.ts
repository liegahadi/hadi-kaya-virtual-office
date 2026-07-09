import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePOPdf } from '@/lib/finance/pdf-generator'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================
// GET /api/finance/po/[id]/pdf - Generate & download PO PDF
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get PO with all details
    const po = await db.pO.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        lines: { orderBy: { id: 'asc' } },
      },
    })

    if (!po) {
      return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    }

    // Generate PDF
    const outputDir = path.join(process.cwd(), 'public', 'po-pdfs')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const fileName = `${po.poNumber}.pdf`
    const outputPath = path.join(outputDir, fileName)

    await generatePOPdf({
      poNumber: po.poNumber,
      projectName: po.project.name,
      projectCode: po.project.code,
      logoUrl: po.project.logoUrl,
      supplierName: po.supplier.name,
      supplierAddress: po.supplier.address,
      supplierContact: po.supplier.contactPerson,
      supplierPhone: po.supplier.phone || po.supplier.whatsappNumber,
      unitBlocks: po.unitBlocks,
      workItem: po.workItem,
      date: po.createdAt,
      lines: po.lines.map((line, idx) => ({
        no: idx + 1,
        description: line.materialName,
        qty: line.quantity,
        unit: line.unitMeasure,
        unitPrice: line.unitPrice,
        discount: 0,
        total: line.totalPrice,
      })),
      discount: 0,
      tax: 0,
      subtotal: po.subtotal,
      totalAmount: po.totalAmount,
      notes: po.notes,
    }, outputPath)

    // Save as PO document in DB (type: PO)
    const existingDoc = await db.pODocument.findFirst({
      where: { poId: po.id, type: 'PO' },
    })
    if (existingDoc) {
      await db.pODocument.update({
        where: { id: existingDoc.id },
        data: { fileUrl: `/po-pdfs/${fileName}`, uploadedAt: new Date() },
      })
    } else {
      await db.pODocument.create({
        data: {
          poId: po.id,
          type: 'PO',
          fileName,
          fileUrl: `/po-pdfs/${fileName}`,
          mimeType: 'application/pdf',
          uploadedBy: 'RINA',
        },
      })
    }

    // Return file URL
    return NextResponse.json({
      success: true,
      data: {
        poNumber: po.poNumber,
        pdfUrl: `/po-pdfs/${fileName}`,
        fileName,
      },
    })
  } catch (error) {
    console.error('Generate PO PDF error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
