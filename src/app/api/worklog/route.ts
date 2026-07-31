// GET /api/worklog — return worklog.md content as JSON
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'worklog.md')
    const content = readFileSync(filePath, 'utf-8')
    return NextResponse.json({
      success: true,
      content,
      size: content.length,
      lines: content.split('\n').length,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message || err).substring(0, 500) },
      { status: 500 }
    )
  }
}
