'use client'

import { useState, useEffect } from 'react'
import {
  X, Plus, Edit2, Trash2, Save, AlertCircle, Zap, Sparkles,
  Bot, RefreshCw, ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ============================================================
// TYPES
// ============================================================
interface Agent {
  id: string
  name: string
  role: string
  description: string | null
  personality: string | null
  gender: string | null
  llmModel: string
  llmProvider: string
  lightLlmModel: string | null
  lightLlmProvider: string | null
  temperature: number
  maxTokens: number
  isActive: boolean
  isDevilsAdvocate: boolean
  whatsappNumber: string | null
  _count?: {
    conversations: number
    assignedCustomers: number
    memories: number
  }
}

// ============================================================
// AVAILABLE MODELS for dropdowns
// ============================================================
const HEAVY_MODELS = [
  { value: 'glm-4.6', label: 'GLM-4.6 (ZAI - free, built-in)' },
  { value: 'z-ai/glm-4.6', label: 'GLM-4.6 via OpenRouter (~Rp 2/req)' },
  { value: 'z-ai/glm-4.5', label: 'GLM-4.5 (ZAI)' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (premium ~Rp 50/req)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (premium ~Rp 40/req)' },
]

const LIGHT_MODELS = [
  { value: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'Nemotron Nano 30B (OpenRouter free)' },
  { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (OpenRouter free)' },
  { value: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 Next 80B (OpenRouter free)' },
  { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (OpenRouter free, paling cepat)' },
]

const ROLES = [
  { value: 'CAO', label: 'Chief AI Officer (RATNA)' },
  { value: 'FINANCE', label: 'Finance AI (RINA)' },
  { value: 'MATERIAL', label: 'Material AI (Mitra)' },
  { value: 'DOCUMENT', label: 'Document AI (Dina)' },
  { value: 'MARKETING', label: 'Marketing AI (multi-persona)' },
  { value: 'CONTENT', label: 'Content Creator' },
]

// ============================================================
// MAIN AGENT MANAGER COMPONENT
// ============================================================
export function AgentManager({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [showInactive])

  async function fetchAgents() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      if (data.success) {
        let list = data.data
        if (!showInactive) list = list.filter((a: Agent) => a.isActive)
        setAgents(list)
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      toast.error('Gagal memuat daftar agent')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    CAO: 'Chief AI Officer',
    FINANCE: 'Finance AI',
    MATERIAL: 'Material AI',
    DOCUMENT: 'Document AI',
    MARKETING: 'Marketing AI',
    CONTENT: 'Content Creator',
  }

  const roleGradients: Record<string, string> = {
    CAO: 'from-slate-600 to-slate-800',
    FINANCE: 'from-rose-500 to-pink-700',
    MATERIAL: 'from-amber-500 to-orange-700',
    DOCUMENT: 'from-violet-500 to-purple-700',
    MARKETING: 'from-emerald-500 to-teal-700',
    CONTENT: 'from-cyan-500 to-blue-700',
  }

  // Group by role
  const grouped: Record<string, Agent[]> = {}
  for (const a of agents) {
    if (!grouped[a.role]) grouped[a.role] = []
    grouped[a.role].push(a)
  }
  const roleOrder = ['CAO', 'FINANCE', 'MATERIAL', 'DOCUMENT', 'MARKETING', 'CONTENT']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Kelola Agent</h2>
          <p className="text-sm text-muted-foreground">
            {agents.length} agent terdaftar · Klik untuk edit · Tombol + untuk tambah baru
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="text-xs h-8"
          >
            {showInactive ? 'Sembunyikan Nonaktif' : 'Tampilkan Nonaktif'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgents}
            className="text-xs h-8"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            Tambah Agent
          </Button>
        </div>
      </div>

      {/* Agents grouped by role */}
      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Memuat daftar agent...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {roleOrder.map(role => {
            const roleAgents = grouped[role]
            if (!roleAgents || roleAgents.length === 0) return null

            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow',
                    roleGradients[role]
                  )}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {roleLabels[role]}
                  </h3>
                  <Badge variant="outline" className="text-[9px]">
                    {roleAgents.length} agent
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roleAgents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      roleGradient={roleGradients[agent.role]}
                      onEdit={() => setEditingAgent(agent)}
                      onToggleActive={async () => {
                        await fetch('/api/agents', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: agent.id, isActive: !agent.isActive }),
                        })
                        toast.success(`Agent ${agent.name} ${!agent.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
                        await fetchAgents()
                        await onRefresh()
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingAgent && (
        <AgentEditModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={async () => {
            await fetchAgents()
            await onRefresh()
            setEditingAgent(null)
          }}
        />
      )}

      {/* Create Modal */}
      {isCreating && (
        <AgentEditModal
          agent={null}
          onClose={() => setIsCreating(false)}
          onSave={async () => {
            await fetchAgents()
            await onRefresh()
            setIsCreating(false)
          }}
        />
      )}
    </div>
  )
}

// ============================================================
// AGENT CARD
// ============================================================
function AgentCard({
  agent, roleGradient, onEdit, onToggleActive,
}: {
  agent: Agent
  roleGradient: string
  onEdit: () => void
  onToggleActive: () => void
}) {
  return (
    <Card className={cn(
      'p-4 border border-border hover:shadow-md transition-all',
      !agent.isActive && 'opacity-60'
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
          roleGradient
        )}>
          {agent.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground truncate">{agent.name}</h4>
            {agent.isDevilsAdvocate && (
              <Sparkles className="w-3 h-3 text-amber-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {agent.gender === 'FEMALE' ? 'Perempuan' : agent.gender === 'MALE' ? 'Laki-laki' : '—'}
            {agent.whatsappNumber ? ` · WA: ${agent.whatsappNumber}` : ''}
          </p>
        </div>
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          agent.isActive ? 'bg-emerald-500' : 'bg-slate-400'
        )} />
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
        {agent.personality || agent.description || 'Tidak ada deskripsi'}
      </p>

      <div className="space-y-1 mb-3 text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-rose-400">🔥</span>
          <span className="font-mono truncate">{agent.llmModel}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-emerald-400">⚡</span>
          <span className="font-mono truncate">{agent.lightLlmModel || 'default'}</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 text-[10px] h-7"
        >
          <Edit2 className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleActive}
          className="text-[10px] h-7 px-2"
          title={agent.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {agent.isActive ? '⏸️' : '▶️'}
        </Button>
      </div>
    </Card>
  )
}

// ============================================================
// AGENT EDIT/CREATE MODAL
// ============================================================
function AgentEditModal({
  agent, onClose, onSave,
}: {
  agent: Agent | null
  onClose: () => void
  onSave: () => void
}) {
  const isCreating = !agent
  const [form, setForm] = useState({
    name: agent?.name || '',
    role: agent?.role || 'MARKETING',
    gender: agent?.gender || 'FEMALE',
    description: agent?.description || '',
    personality: agent?.personality || '',
    systemPrompt: '', // too long to load in form, edit separately if needed
    llmModel: agent?.llmModel || 'glm-4.6',
    llmProvider: agent?.llmProvider || 'zai',
    lightLlmModel: agent?.lightLlmModel || 'nvidia/nemotron-3-nano-30b-a3b:free',
    lightLlmProvider: agent?.lightLlmProvider || 'openrouter',
    temperature: agent?.temperature ?? 0.7,
    maxTokens: agent?.maxTokens ?? 2000,
    isActive: agent?.isActive ?? true,
    isDevilsAdvocate: agent?.isDevilsAdvocate ?? false,
    whatsappNumber: agent?.whatsappNumber || '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isCreating
        ? '/api/agents/create'
        : '/api/agents'
      const method = isCreating ? 'POST' : 'PATCH'
      const body = isCreating
        ? form
        : { id: agent!.id, ...form }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(isCreating ? `Agent ${form.name} dibuat` : `Agent ${form.name} diupdate`)
        onSave()
      } else {
        toast.error(data.error || 'Gagal menyimpan')
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!agent) return
    if (!confirm(`Hapus agent ${agent.name}? Tindakan ini tidak bisa dibatalkan.`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Agent ${agent.name} dihapus`)
        onSave()
      } else {
        toast.error(data.error || 'Gagal hapus')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto dark-scrollbar border border-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-4 flex items-center gap-3 text-white sticky top-0 z-10">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            {isCreating ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">
              {isCreating ? 'Tambah Agent Baru' : `Edit: ${agent!.name}`}
            </h3>
            <p className="text-xs text-emerald-300/80">
              {isCreating ? 'Buat AI agent baru dengan custom persona' : 'Ubah konfigurasi agent'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Nama Agent
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="misal: RINA, Ayu, Bima"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Role
              </label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                disabled={!isCreating}
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="FEMALE">Perempuan</option>
                <option value="MALE">Laki-laki</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={e => setForm({ ...form, whatsappNumber: e.target.value })}
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="+628xxx (opsional)"
              />
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
              Personality (singkat)
            </label>
            <textarea
              value={form.personality}
              onChange={e => setForm({ ...form, personality: e.target.value })}
              rows={2}
              className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="misal: Cheerful & friendly, hangat, banyak emoji secukupnya"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
              Deskripsi (tugas utama)
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="misal: Marketing AI untuk konsumen muda, first-time buyer"
            />
          </div>

          {/* LLM Config */}
          <div className="p-3 bg-accent/20 border border-border rounded-lg">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Konfigurasi LLM (Task-Based Routing)
            </h4>

            <div className="space-y-3">
              {/* Heavy */}
              <div>
                <label className="text-xs text-rose-400 font-semibold mb-1 block">
                  🔥 Heavy Task Model (analisa, konten, keputusan)
                </label>
                <select
                  value={form.llmModel}
                  onChange={e => {
                    const model = e.target.value
                    const isZai = model === 'glm-4.6'
                    setForm({
                      ...form,
                      llmModel: model,
                      llmProvider: isZai ? 'zai' : 'openrouter',
                    })
                  }}
                  className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {HEAVY_MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Light */}
              <div>
                <label className="text-xs text-emerald-400 font-semibold mb-1 block">
                  ⚡ Light Task Model (FAQ, status, chat receh)
                </label>
                <select
                  value={form.lightLlmModel}
                  onChange={e => setForm({ ...form, lightLlmModel: e.target.value })}
                  className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {LIGHT_MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    Temperature: {form.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={form.temperature}
                    onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Max Tokens</label>
                  <input
                    type="number"
                    value={form.maxTokens}
                    onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) || 2000 })}
                    className="w-full bg-background/50 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                    min="100"
                    max="8000"
                    step="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs text-foreground">Agent Aktif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDevilsAdvocate}
                onChange={e => setForm({ ...form, isDevilsAdvocate: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs text-foreground">Devil&apos;s Advocate (push back ke owner)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            {!isCreating && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={loading}
                className="text-rose-500 hover:bg-rose-950/30 hover:text-rose-400 border-rose-700/30"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Hapus
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="ml-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-1" />
              {isCreating ? 'Buat Agent' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
