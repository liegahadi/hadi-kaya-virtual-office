import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compilePDFsToSingle, generateBuktiKasKeluarPdf } from '@/lib/finance/pdf-generator'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================================
// POST /api/finance/po/[id]/compile-pdf - Compile all documents into 1 PDF
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const po = await db.pO.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        lines: true,
        documents: { orderBy: { uploadedAt: 'asc' } },
        payments: true,
      },
    })

    if (!po) {
      return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    }

    const outputDir = path.join(process.cwd(), 'public', 'po-pdfs')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const pdfPaths: string[] = []

    // 1. PO PDF (generate if not exists)
    const poPdfPath = path.join(outputDir, `${po.poNumber}.pdf`)
    if (!fs.existsSync(poPdfPath)) {
      // Generate PO PDF (call internal function)
      const { generatePOPdf } = await import('@/lib/finance/pdf-generator')
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
          no: i + 1, description: l.materialName, qty: l.quantity,
          unit: l.unitMeasure, unitPrice: l.unitPrice, discount: 0, total: l.totalPrice,
        })),
        discount: 0, tax: 0, subtotal: po.subtotal, totalAmount: po.totalAmount, notes: po.notes,
      }, poPdfPath)
    }
    pdfPaths.push(poPdfPath)

    // 2. All uploaded documents (nota, transfer, foto)
    for (const doc of po.documents) {
      if (doc.type === 'PO') continue // already added above
      const filePath = path.join(process.cwd(), doc.fileUrl)
      if (fs.existsSync(filePath)) {
        // If image, convert to PDF first (for simplicity, just include PDFs for now)
        if (doc.mimeType === 'application/pdf') {
          pdfPaths.push(filePath)
        } else {
          // For images, we'll create a simple PDF wrapper
          // TODO: convert image to PDF using sharp/pdf-lib
          // For now, skip non-PDF
          console.log(`Skipping non-PDF: ${doc.fileName}`)
        }
      }
    }

    // 3. Bukti Kas Keluar (generate if payment exists)
    if (po.payments.length > 0) {
      const buktiPath = path.join(outputDir, `${po.poNumber}_BuktiKasKeluar.pdf`)
      const totalPaid = po.payments.reduce((s, p) => s + p.amount, 0)
      await generateBuktiKasKeluarPdf({
        poNumber: po.poNumber,
        projectName: po.project.name,
        date: po.payments[0].paidAt,
        receivedBy: po.supplier.name,
        amount: totalPaid,
        paymentMethod: po.payments[0].method as 'TUNAI' | 'TRANSFER' | 'CEK',
        description: `Pembayaran ${po.poNumber}`,
        items: po.payments.map(p => ({
          poNumber: po.poNumber,
          notes: p.notes || 'Pembayaran',
          amount: p.amount,
        })),
      }, buktiPath)
      pdfPaths.push(buktiPath)
    }

    // 4. Compile all PDFs into one
    const compiledPath = path.join(outputDir, `${po.poNumber}_COMPILED.pdf`)
    await compilePDFsToSingle(pdfPaths, compiledPath)

    const compiledUrl = `/po-pdfs/${po.poNumber}_COMPILED.pdf`

    return NextResponse.json({
      success: true,
      data: {
        poNumber: po.poNumber,
        compiledPdfUrl: compiledUrl,
        documentCount: pdfPaths.length,
        documents: pdfPaths.map(p => path.basename(p)),
      },
    })
  } catch (error) {
    console.error('Compile PDF error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
