'use client'
// Global Search — search across PO + Wage + Expense + Memo
import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Users, Receipt, ClipboardList } from 'lucide-react'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const typeIcon: Record<string, React.ReactNode> = {
  PO: <FileText className="w-3 h-3 text-blue-400" />,
  Wage: <Users className="w-3 h-3 text-purple-400" />,
  Expense: <Receipt className="w-3 h-3 text-amber-400" />,
  Memo: <ClipboardList className="w-3 h-3 text-emerald-400" />,
}

export function GlobalSearch({ onResultClick }: { onResultClick?: (type: string, id: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(query)}`)
        const d = await res.json()
        if (d.success) { setResults(d.data); setOpen(true) }
      } catch {} finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Cari PO, upah, biaya, memo..."
        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
      />
      {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">...</div>}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded shadow-lg z-50 max-h-80 overflow-y-auto dark-scrollbar">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onResultClick?.(r.type, r.id); setOpen(false); setQuery('') }}
              className="w-full flex items-center gap-2 p-2 hover:bg-slate-800 text-left border-b border-slate-800 last:border-0"
            >
              {typeIcon[r.type]}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 truncate">{r.title}</p>
                <p className="text-[9px] text-slate-500 truncate">{r.subtitle}</p>
              </div>
              <div className="text-right shrink-0">
                {r.amount > 0 && <p className="text-[10px] font-mono text-slate-300">{fmt(r.amount)}</p>}
                <p className="text-[8px] text-slate-500">{r.status}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded shadow-lg z-50 p-3 text-center text-xs text-slate-500">
          Tidak ada hasil untuk "{query}"
        </div>
      )}
    </div>
  )
}
