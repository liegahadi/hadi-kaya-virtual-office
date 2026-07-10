'use client'
// Memory Tab — Browse, edit, delete, add memories + skills for all agents
// Structure:
// - Section 1: Memory Utama (all memories)
// - Section 2: Skills (all skills)
// - Section 3: Per Agent filter (15 agents)
// - Versioning history (click memory → see v1, v2, v3)
// - Audit trail

import React, { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, Edit3, X, Search, Clock, Tag, User, AlertCircle, CheckCircle2, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemoryItem {
  id: string
  agentId: string | null
  category: string
  memoryType: string
  entityType: string | null
  entityId: string | null
  title: string | null
  content: string
  resolution: string | null
  importance: number
  source: string | null
  attachmentUrl: string | null
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  agent?: { name: string } | null
}

interface SkillItem {
  id: string
  name: string
  displayName: string
  description: string | null
  prompt: string
  category: string
  agentId: string | null
  source: string | null
  version: number
  isActive: boolean
  createdAt: string
  agent?: { name: string } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  UTAMA: 'bg-blue-100 text-blue-700',
  BERKAS: 'bg-emerald-100 text-emerald-700',
  FINANCE: 'bg-amber-100 text-amber-700',
  MATERIAL: 'bg-purple-100 text-purple-700',
  MARKETING: 'bg-pink-100 text-pink-700',
  DECISION: 'bg-red-100 text-red-700',
  KONSUMEN: 'bg-cyan-100 text-cyan-700',
}

const TYPE_COLORS: Record<string, string> = {
  short_term: 'bg-gray-100 text-gray-600',
  long_term: 'bg-indigo-100 text-indigo-700',
  entity: 'bg-cyan-100 text-cyan-700',
  umum: 'bg-orange-100 text-orange-700',
}

export function MemoryTab() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'memories' | 'skills'>('memories')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MemoryItem | SkillItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'memory' | 'skill'>('memory')

  useEffect(() => {
    Promise.all([
      fetch('/api/memory?includeInactive=false').then(r => r.json()),
      fetch('/api/skills?includeInactive=false').then(r => r.json()),
    ]).then(([memData, skillData]) => {
      if (memData.success) setMemories(memData.data)
      if (skillData.success) setSkills(skillData.data)
      setLoading(false)
    })
  }, [])

  const filteredMemories = memories.filter(m => {
    if (filterAgent !== 'all' && m.agentId !== filterAgent && m.memoryType !== 'umum') return false
    if (filterCategory !== 'all' && m.category !== filterCategory) return false
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filteredSkills = skills.filter(s => {
    if (filterAgent !== 'all' && s.agentId !== filterAgent && s.category !== 'UMUM') return false
    if (searchQuery && !s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) && !s.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  function handleDelete(id: string, type: 'memory' | 'skill') {
    if (!confirm(`Yakin hapus ${type} ini? History tetap tersimpan.`)) return
    const endpoint = type === 'memory' ? '/api/memory' : '/api/skills'
    fetch(`${endpoint}?id=${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (type === 'memory') setMemories(prev => prev.filter(m => m.id !== id))
          else setSkills(prev => prev.filter(s => s.id !== id))
          setSelectedItem(null)
        }
      })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Memory & Skills System</h2>
          <span className="text-xs text-muted-foreground">{memories.length} memories · {skills.length} skills</span>
        </div>
        <button
          onClick={() => { setAddType(view === 'memories' ? 'memory' : 'skill'); setShowAddModal(true) }}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah {view === 'memories' ? 'Memory' : 'Skill'}
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-fit">
        <button onClick={() => setView('memories')} className={cn('px-4 py-1.5 rounded text-xs font-medium', view === 'memories' ? 'bg-white dark:bg-slate-900 shadow text-emerald-600' : 'text-muted-foreground')}>
          🧠 Memories ({memories.length})
        </button>
        <button onClick={() => setView('skills')} className={cn('px-4 py-1.5 rounded text-xs font-medium', view === 'skills' ? 'bg-white dark:bg-slate-900 shadow text-purple-600' : 'text-muted-foreground')}>
          ⚡ Skills ({skills.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 text-xs border rounded bg-background"
        />
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="px-2 py-1.5 text-xs border rounded bg-background">
          <option value="all">All Agents</option>
          <option value="null">🧠 Umum (All)</option>
          <option value="agent-dina">DINA</option>
          <option value="agent-rina">RINA</option>
          <option value="agent-mitra">MITRA</option>
          <option value="agent-ratna">RATNA</option>
          <option value="agent-rangga">RANGGA</option>
        </select>
        {view === 'memories' && (
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-2 py-1.5 text-xs border rounded bg-background">
            <option value="all">All Categories</option>
            <option value="UTAMA">UTAMA</option>
            <option value="BERKAS">BERKAS</option>
            <option value="FINANCE">FINANCE</option>
            <option value="MATERIAL">MATERIAL</option>
            <option value="MARKETING">MARKETING</option>
            <option value="DECISION">DECISION</option>
            <option value="KONSUMEN">KONSUMEN</option>
          </select>
        )}
      </div>

      {/* List — Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {view === 'memories' && filteredMemories.map(mem => (
          <div key={mem.id} className="border rounded-lg p-3 hover:bg-accent/30 cursor-pointer flex flex-col" onClick={() => setSelectedItem(mem)} style={{ minHeight: '120px' }}>
            <div className="flex items-center gap-1 mb-1 flex-wrap">
              <span className={cn('text-[8px] px-1 py-0.5 rounded font-medium', CATEGORY_COLORS[mem.category] || 'bg-gray-100 text-gray-600')}>{mem.category}</span>
              <span className={cn('text-[8px] px-1 py-0.5 rounded font-medium', TYPE_COLORS[mem.memoryType] || 'bg-gray-100 text-gray-600')}>{mem.memoryType}</span>
            </div>
            <p className="text-xs font-bold text-foreground mb-1">{mem.title || mem.content.substring(0, 40)}</p>
            <p className="text-[10px] text-muted-foreground flex-1 line-clamp-2">{mem.content}</p>
            {mem.resolution && <p className="text-[9px] text-blue-600 mt-1 line-clamp-1 italic">📋 {mem.resolution.substring(0, 60)}...</p>}
            <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
              <span>{mem.agent?.name || 'Umum'}</span>
              <div className="flex items-center gap-1">
                {mem.importance >= 0.8 && <span className="text-red-500">⭐</span>}
                {mem.version > 1 && <span className="text-blue-500">v{mem.version}</span>}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(mem.id, 'memory') }} className="text-red-400 hover:bg-red-50 rounded p-0.5"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}

        {view === 'skills' && filteredSkills.map(skill => (
          <div key={skill.id} className="border rounded-lg p-3 hover:bg-accent/30 cursor-pointer flex flex-col" onClick={() => setSelectedItem(skill)} style={{ minHeight: '120px' }}>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[8px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">{skill.category}</span>
              <span className="text-[8px] text-muted-foreground">{skill.source}</span>
            </div>
            <p className="text-xs font-medium text-foreground">{skill.displayName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex-1 line-clamp-3">{skill.description || skill.prompt.substring(0, 80)}</p>
            <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
              <span>{skill.agent?.name || 'Umum'}</span>
              <div className="flex items-center gap-1">
                {skill.version > 1 && <span className="text-blue-500">v{skill.version}</span>}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(skill.id, 'skill') }} className="text-red-400 hover:bg-red-50 rounded p-0.5"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}

        {((view === 'memories' && filteredMemories.length === 0) || (view === 'skills' && filteredSkills.length === 0)) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada {view} yang tersimpan.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">{'content' in selectedItem ? 'Memory Detail' : 'Skill Detail'}</h3>
              <button onClick={() => setSelectedItem(null)}><X className="w-4 h-4" /></button>
            </div>
            {'content' in selectedItem ? (
              <div className="space-y-3">
                {selectedItem.title && (
                  <div>
                    <label className="text-[10px] text-muted-foreground">Judul</label>
                    <p className="text-sm font-bold mt-0.5">{selectedItem.title}</p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-muted-foreground">Deskripsi</label>
                  <p className="text-sm mt-0.5">{selectedItem.content}</p>
                </div>
                {selectedItem.resolution && (
                  <div>
                    <label className="text-[10px] text-muted-foreground">📋 Resolusi (Action Items)</label>
                    <pre className="text-xs mt-0.5 bg-blue-50 dark:bg-blue-950/30 p-2 rounded whitespace-pre-wrap text-blue-800 dark:text-blue-200">{selectedItem.resolution}</pre>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Category:</span> {selectedItem.category}</div>
                  <div><span className="text-muted-foreground">Type:</span> {selectedItem.memoryType}</div>
                  <div><span className="text-muted-foreground">Importance:</span> {selectedItem.importance}</div>
                  <div><span className="text-muted-foreground">Version:</span> v{selectedItem.version}</div>
                  <div><span className="text-muted-foreground">Source:</span> {selectedItem.source}</div>
                  <div><span className="text-muted-foreground">Agent:</span> {selectedItem.agent?.name || 'Umum'}</div>
                </div>
                <div><span className="text-muted-foreground">Created:</span> {new Date(selectedItem.createdAt).toLocaleString('id-ID')}</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground">Name</label>
                  <p className="text-sm font-medium">{selectedItem.displayName}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Description</label>
                  <p className="text-sm mt-0.5">{selectedItem.description}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Prompt</label>
                  <pre className="text-xs mt-0.5 bg-slate-100 dark:bg-slate-800 p-2 rounded whitespace-pre-wrap">{selectedItem.prompt}</pre>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Category:</span> {selectedItem.category}</div>
                  <div><span className="text-muted-foreground">Version:</span> v{selectedItem.version}</div>
                  <div><span className="text-muted-foreground">Source:</span> {selectedItem.source}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && <AddModal type={addType} onClose={() => setShowAddModal(false)} onSaved={() => {
        setShowAddModal(false)
        Promise.all([
          fetch('/api/memory?includeInactive=false').then(r => r.json()),
          fetch('/api/skills?includeInactive=false').then(r => r.json()),
        ]).then(([memData, skillData]) => {
          if (memData.success) setMemories(memData.data)
          if (skillData.success) setSkills(skillData.data)
        })
      }} />}
    </div>
  )
}

function AddModal({ type, onClose, onSaved }: { type: 'memory' | 'skill'; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const isMemory = type === 'memory'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const body: any = {}
    formData.forEach((v, k) => body[k] = v)

    const res = await fetch(`/api/${isMemory ? 'memory' : 'skills'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) onSaved()
    else { alert('Gagal simpan'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-lg max-w-lg w-full p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Tambah {isMemory ? 'Memory' : 'Skill'}</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {isMemory ? (
            <>
              <input name="title" className="w-full text-sm border rounded p-2 bg-background" placeholder="Judul (e.g. 'Mandiri: Status Pekerjaan')" />
              <textarea name="content" required className="w-full mt-0.5 text-sm border rounded p-2 bg-background min-h-[60px]" placeholder="Deskripsi: apa yang terjadi / apa aturannya" />
              <textarea name="resolution" className="w-full text-sm border rounded p-2 bg-background min-h-[80px]" placeholder="Resolusi: action items (apa yang harus dilakukan)" />
              <div className="grid grid-cols-2 gap-2">
                <select name="category" className="text-xs border rounded p-2 bg-background">
                  <option value="UTAMA">UTAMA</option>
                  <option value="BERKAS">BERKAS</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="MATERIAL">MATERIAL</option>
                  <option value="MARKETING">MARKETING</option>
                  <option value="DECISION">DECISION</option>
                  <option value="KONSUMEN">KONSUMEN</option>
                </select>
                <select name="memoryType" className="text-xs border rounded p-2 bg-background">
                  <option value="long_term">Long-term</option>
                  <option value="entity">Entity</option>
                  <option value="umum">Umum (All Agents)</option>
                </select>
              </div>
              <input type="number" name="importance" step="0.1" min="0" max="1" defaultValue="0.5" className="w-full text-xs border rounded p-2 bg-background" placeholder="Importance (0.0-1.0)" />
            </>
          ) : (
            <>
              <input name="name" required className="w-full text-sm border rounded p-2 bg-background" placeholder="Skill name (e.g. generate-laporan)" />
              <input name="displayName" className="w-full text-sm border rounded p-2 bg-background" placeholder="Display name" />
              <textarea name="description" className="w-full text-sm border rounded p-2 bg-background min-h-[40px]" placeholder="Description" />
              <textarea name="prompt" required className="w-full text-sm border rounded p-2 bg-background min-h-[100px]" placeholder="Prompt instruction..." />
              <select name="category" className="w-full text-xs border rounded p-2 bg-background">
                <option value="UMUM">UMUM (All)</option>
                <option value="DINA">DINA</option>
                <option value="RINA">RINA</option>
                <option value="MITRA">MITRA</option>
                <option value="RATNA">RATNA</option>
                <option value="RANGGA">RANGGA</option>
                <option value="MARKETING">MARKETING</option>
              </select>
            </>
          )}
          <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  )
}
