import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/document-templates/checklist?customerId=xxx&bankName=MANDIRI
// Generate or get checklist for a customer for a specific bank
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const customerId = url.searchParams.get('customerId')
    const bankName = url.searchParams.get('bankName')

    if (!customerId || !bankName) {
      return NextResponse.json(
        { success: false, error: 'customerId and bankName required' },
        { status: 400 }
      )
    }

    // Get all templates for this bank
    const templates = await db.documentTemplate.findMany({
      where: { bankName, isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
    })

    // Get existing checklist items
    const existingItems = await db.customerDocumentChecklist.findMany({
      where: { customerId, bankName },
    })

    // Build checklist: for each template, check if item exists
    const checklist = []
    for (const template of templates) {
      const existing = existingItems.find(
        item => item.templateId === template.id || item.documentName === template.templateName
      )

      if (existing) {
        checklist.push({
          ...existing,
          template: {
            id: template.id,
            templateName: template.templateName,
            templateUrl: template.templateUrl,
            type: template.type,
            category: template.category,
            description: template.description,
          },
        })
      } else {
        // Create new checklist item
        const newItem = await db.customerDocumentChecklist.create({
          data: {
            customerId,
            templateId: template.id,
            bankName,
            documentName: template.templateName,
            category: template.category,
            status: 'MISSING',
            isRequired: template.isRequired,
          },
        })
        checklist.push({
          ...newItem,
          template: {
            id: template.id,
            templateName: template.templateName,
            templateUrl: template.templateUrl,
            type: template.type,
            category: template.category,
            description: template.description,
          },
        })
      }
    }

    // Summary
    const summary = {
      total: checklist.length,
      missing: checklist.filter(c => c.status === 'MISSING').length,
      uploaded: checklist.filter(c => c.status === 'UPLOADED').length,
      filled: checklist.filter(c => c.status === 'FILLED').length,
      scanned: checklist.filter(c => c.status === 'SCANNED').length,
      verified: checklist.filter(c => c.status === 'VERIFIED').length,
      percent: checklist.length > 0
        ? Math.round((checklist.filter(c => c.status !== 'MISSING').length / checklist.length) * 100)
        : 0,
    }

    return NextResponse.json({
      success: true,
      data: checklist,
      meta: summary,
    })
  } catch (error) {
    console.error('Get checklist error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ============================================================
// PATCH /api/document-templates/checklist - Update checklist item
// Body: { id, status, notes? }
// ============================================================

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, notes } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (notes !== undefined) updateData.notes = notes
    if (status === 'UPLOADED' || status === 'SCANNED') {
      updateData.uploadedAt = new Date()
    }

    const updated = await db.customerDocumentChecklist.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update checklist error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
