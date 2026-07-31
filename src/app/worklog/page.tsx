'use client'
// /worklog — render worklog.md with basic styling
// Read-only, opens in new tab from dashboard Header
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function WorklogPage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/worklog')
      .then(r => r.json())
      .then(d => {
        if (d.success) setContent(d.content)
        else setError(d.error || 'Failed')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Very basic markdown rendering — just preserve formatting
  // We don't need full markdown lib; <pre> with whitespace-pre-wrap is enough
  const renderLine = (line: string, i: number) => {
    // H1 (# )
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold text-emerald-300 mt-6 mb-3">{line.slice(2)}</h1>
    }
    // H2 (## )
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-slate-100 mt-5 mb-2">{line.slice(3)}</h2>
    }
    // H3 (### )
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold text-slate-200 mt-4 mb-2">{line.slice(4)}</h3>
    }
    // Horizontal rule (---)
    if (line.trim() === '---') {
      return <hr key={i} className="border-slate-700 my-4" />
    }
    // Bullet (- )
    if (line.startsWith('- ')) {
      return <div key={i} className="ml-4 text-slate-300 text-sm">• {line.slice(2)}</div>
    }
    // Empty line
    if (!line.trim()) {
      return <div key={i} className="h-2" />
    }
    // Plain text
    return <div key={i} className="text-slate-300 text-sm whitespace-pre-wrap">{line}</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Worklog</h1>
            <p className="text-sm text-slate-400 mt-1">
              Catatan lengkap development — verbatim dari user + AI actions
            </p>
          </div>
          <a
            href="https://github.com/liegahadi/hadi-kaya-virtual-office/blob/main/worklog.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-emerald-400 underline"
          >
            Buka di GitHub ↗
          </a>
        </div>

        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : error ? (
          <div className="text-red-400">Error: {error}</div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            {content.split('\n').map(renderLine)}
          </div>
        )}
      </div>
    </div>
  )
}
