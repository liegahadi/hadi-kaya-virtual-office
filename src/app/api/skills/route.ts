// Skills API — CRUD for agent skills
// GET  /api/skills — list skills (filter by agentId, category)
// POST /api/skills — create skill
// PUT  /api/skills — edit skill (creates version snapshot)
// DELETE /api/skills?id=X — soft delete skill

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET — list skills
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) where.isActive = true
    if (agentId) where.OR = [{ agentId }, { agentId: null }] // include umum skills
    if (category) where.category = category

    const skills = await db.skill.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    })

    return NextResponse.json({ success: true, data: skills })
  } catch (error) {
    console.error('GET skills error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// POST — create new skill
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, displayName, description, prompt, category, agentId, source, changedBy } = body

    if (!name || !prompt) return NextResponse.json({ success: false, error: 'name and prompt required' }, { status: 400 })

    const skill = await db.skill.create({
      data: {
        name,
        displayName: displayName || name,
        description: description || null,
        prompt,
        category: category || 'UMUM',
        agentId: agentId || null,
        source: source || 'MANUAL',
        version: 1,
        isActive: true,
      },
    })

    // Initial version
    await db.skillVersion.create({
      data: {
        skillId: skill.id,
        version: 1,
        prompt,
        changedBy: changedBy || 'owner',
        changeNote: 'Initial creation',
      },
    })

    // Audit
    await db.memoryAudit.create({
      data: {
        action: 'CREATE',
        entityType: 'SKILL',
        entityId: skill.id,
        agentId: agentId || null,
        changedBy: changedBy || 'owner',
        details: JSON.stringify({ name, displayName, category }),
      },
    })

    return NextResponse.json({ success: true, data: skill })
  } catch (error) {
    console.error('POST skills error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// PUT — edit skill (new version)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, prompt, description, displayName, changedBy, changeNote } = body

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const existing = await db.skill.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })

    const newVersion = existing.version + 1

    await db.skillVersion.create({
      data: {
        skillId: id,
        version: newVersion,
        prompt: prompt || existing.prompt,
        changedBy: changedBy || 'owner',
        changeNote: changeNote || 'Edited',
      },
    })

    const updated = await db.skill.update({
      where: { id },
      data: {
        prompt: prompt || existing.prompt,
        description: description ?? existing.description,
        displayName: displayName || existing.displayName,
        version: newVersion,
      },
    })

    await db.memoryAudit.create({
      data: {
        action: 'EDIT',
        entityType: 'SKILL',
        entityId: id,
        agentId: existing.agentId,
        changedBy: changedBy || 'owner',
        details: JSON.stringify({ oldPrompt: existing.prompt.substring(0, 200), newPrompt: (prompt || existing.prompt).substring(0, 200), version: newVersion }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT skills error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}

// DELETE — soft delete
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const changedBy = searchParams.get('changedBy') || 'owner'

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const existing = await db.skill.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })

    await db.skill.update({ where: { id }, data: { isActive: false } })

    await db.memoryAudit.create({
      data: {
        action: 'DELETE',
        entityType: 'SKILL',
        entityId: id,
        agentId: existing.agentId,
        changedBy,
        details: JSON.stringify({ name: existing.name, displayName: existing.displayName }),
      },
    })

    return NextResponse.json({ success: true, message: 'Skill dihapus (soft delete).' })
  } catch (error) {
    console.error('DELETE skills error:', error)
    return NextResponse.json({ success: false, error: String(error).substring(0, 500) }, { status: 500 })
  }
}
