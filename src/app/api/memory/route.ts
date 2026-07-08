// Memory API — CRUD for agent memories
// GET  /api/memory — list memories (filter by agentId, category, memoryType, entityType)
// POST /api/memory — create memory
// PUT  /api/memory — edit memory (creates version snapshot)
// DELETE /api/memory?id=X — soft delete memory (isActive=false)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET — list memories with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')
    const category = searchParams.get('category')
    const memoryType = searchParams.get('memoryType') // short_term | long_term | entity | umum
    const entityType = searchParams.get('entityType') // CUSTOMER | BANK | OWNER | PROJECT
    const entityId = searchParams.get('entityId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) where.isActive = true
    if (agentId) where.agentId = agentId
    if (category) where.category = category
    if (memoryType) where.memoryType = memoryType
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    const memories = await db.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    })

    return NextResponse.json({ success: true, data: memories })
  } catch (error) {
    console.error('GET memory error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// POST — create new memory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, customerId, category, memoryType, entityType, entityId, title, content, resolution, importance, source, attachmentUrl, changedBy } = body

    if (!content) return NextResponse.json({ success: false, error: 'content required' }, { status: 400 })

    const memory = await db.memory.create({
      data: {
        agentId: agentId || null,
        customerId: customerId || null,
        category: category || 'UTAMA',
        memoryType: memoryType || 'long_term',
        entityType: entityType || null,
        entityId: entityId || null,
        title: title || null,
        content,
        resolution: resolution || null,
        importance: importance ?? 0.5,
        source: source || 'MANUAL',
        attachmentUrl: attachmentUrl || null,
        version: 1,
        isActive: true,
      },
    })

    // Create initial version snapshot
    await db.memoryVersion.create({
      data: {
        memoryId: memory.id,
        version: 1,
        content,
        changedBy: changedBy || 'owner',
        changeNote: 'Initial creation',
      },
    })

    // Audit trail
    await db.memoryAudit.create({
      data: {
        action: 'CREATE',
        entityType: 'MEMORY',
        entityId: memory.id,
        agentId: agentId || null,
        changedBy: changedBy || 'owner',
        details: JSON.stringify({ content: content.substring(0, 200), category, memoryType }),
      },
    })

    return NextResponse.json({ success: true, data: memory })
  } catch (error) {
    console.error('POST memory error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// PUT — edit memory (creates new version)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, content, importance, changedBy, changeNote } = body

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const existing = await db.memory.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: 'Memory not found' }, { status: 404 })

    const newVersion = existing.version + 1

    // Save old version snapshot
    await db.memoryVersion.create({
      data: {
        memoryId: id,
        version: newVersion,
        content: content || existing.content,
        changedBy: changedBy || 'owner',
        changeNote: changeNote || 'Edited',
      },
    })

    // Update memory
    const updated = await db.memory.update({
      where: { id },
      data: {
        content: content || existing.content,
        importance: importance ?? existing.importance,
        version: newVersion,
      },
    })

    // Audit trail
    await db.memoryAudit.create({
      data: {
        action: 'EDIT',
        entityType: 'MEMORY',
        entityId: id,
        agentId: existing.agentId,
        changedBy: changedBy || 'owner',
        details: JSON.stringify({
          oldContent: existing.content.substring(0, 200),
          newContent: (content || existing.content).substring(0, 200),
          version: newVersion,
        }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT memory error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// DELETE — soft delete memory (isActive=false) + audit
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const changedBy = searchParams.get('changedBy') || 'owner'

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const existing = await db.memory.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: 'Memory not found' }, { status: 404 })

    await db.memory.update({ where: { id }, data: { isActive: false } })

    // Audit trail
    await db.memoryAudit.create({
      data: {
        action: 'DELETE',
        entityType: 'MEMORY',
        entityId: id,
        agentId: existing.agentId,
        changedBy,
        details: JSON.stringify({ content: existing.content.substring(0, 200) }),
      },
    })

    return NextResponse.json({ success: true, message: 'Memory dihapus (soft delete). History tetap tersimpan.' })
  } catch (error) {
    console.error('DELETE memory error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}
