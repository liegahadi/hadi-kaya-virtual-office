'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare, Send, X, Zap, Clock, Activity,
  ChevronDown, AlertCircle, Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================
interface Agent {
  id: string
  name: string
  role: string
  llmModel: string
  lightLlmModel: string | null
  isActive: boolean
  isDevilsAdvocate: boolean
  whatsappNumber: string | null
}

interface Message {
  id: string
  role: 'OWNER' | 'AGENT' | 'SYSTEM'
  content: string
  meta?: {
    taskType?: string
    model?: string
    provider?: string
    latencyMs?: number
    tokensUsed?: number
    cost?: number
    needsApproval?: boolean
  }
  createdAt: string
}

// ============================================================
// MAIN CHAT PANEL COMPONENT
// ============================================================
export function ChatPanel({ agents }: { agents: Agent[] }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAgentList, setShowAgentList] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll ke bottom saat ada message baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input saat agent dipilih
  useEffect(() => {
    if (selectedAgent && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedAgent])

  // Auto-pick first agent
  useEffect(() => {
    if (!selectedAgent && agents.length > 0) {
      const ratna = agents.find(a => a.role === 'CAO')
      setSelectedAgent(ratna || agents[0])
    }
  }, [agents, selectedAgent])

  async function sendMessage() {
    if (!input.trim() || !selectedAgent || loading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'OWNER',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          conversationId,
          channel: 'DASHBOARD',
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Set conversation ID if new
        if (!conversationId && data.data.conversationId) {
          setConversationId(data.data.conversationId)
        }

        const agentMsg: Message = {
          id: `agent-${Date.now()}`,
          role: 'AGENT',
          content: data.data.response,
          createdAt: new Date().toISOString(),
          meta: {
            taskType: data.data.meta?.taskType,
            model: data.data.meta?.model,
            provider: data.data.meta?.provider,
            latencyMs: data.data.meta?.latencyMs,
            tokensUsed: data.data.meta?.tokensUsed,
            cost: data.data.meta?.cost,
            needsApproval: data.data.needsApproval,
          },
        }
        setMessages(prev => [...prev, agentMsg])
      } else {
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'SYSTEM',
          content: `❌ Error: ${data.error || 'Unknown error'}`,
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errMsg])
      }
    } catch (err) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'SYSTEM',
        content: `❌ Network error: ${err instanceof Error ? err.message : 'unknown'}`,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
    setConversationId(null)
  }

  // Group agents by role
  const agentsByRole: Record<string, Agent[]> = {}
  for (const a of agents) {
    if (!agentsByRole[a.role]) agentsByRole[a.role] = []
    agentsByRole[a.role].push(a)
  }

  const roleOrder = ['CAO', 'FINANCE', 'MATERIAL', 'DOCUMENT', 'MARKETING']
  const roleLabels: Record<string, string> = {
    CAO: 'Chief AI Officer',
    FINANCE: 'Finance AI',
    MATERIAL: 'Material AI',
    DOCUMENT: 'Document AI',
    MARKETING: 'Marketing AI',
  }

  return (
    <Card className="flex flex-col h-[700px] border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950/80 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-border">
        <div className="flex-1 min-w-0">
          {selectedAgent ? (
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0',
                getRoleGradient(selectedAgent.role)
              )}>
                {selectedAgent.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground truncate">{selectedAgent.name}</h3>
                  {selectedAgent.isDevilsAdvocate && (
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {roleLabels[selectedAgent.role] || selectedAgent.role}
                  {selectedAgent.whatsappNumber && ` · WA: ${selectedAgent.whatsappNumber}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pilih agent untuk mulai chat</p>
          )}
        </div>

        {/* Agent selector dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAgentList(!showAgentList)}
            className="h-7 text-[10px]"
          >
            Ganti Agent
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>

          {showAgentList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAgentList(false)}
              />
              <Card className="absolute right-0 top-9 z-50 w-72 p-2 max-h-96 overflow-y-auto dark-scrollbar">
                {roleOrder.map(role => {
                  const roleAgents = agentsByRole[role]
                  if (!roleAgents || roleAgents.length === 0) return null
                  return (
                    <div key={role} className="mb-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide px-2 py-1">
                        {roleLabels[role]} ({roleAgents.length})
                      </p>
                      {roleAgents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgent(agent)
                            setMessages([])
                            setConversationId(null)
                            setShowAgentList(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-accent/40 transition-colors',
                            selectedAgent?.id === agent.id && 'bg-accent/60'
                          )}
                        >
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0',
                            getRoleGradient(agent.role)
                          )}>
                            {agent.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-foreground truncate">{agent.name}</span>
                              {!agent.isActive && (
                                <Badge variant="outline" className="text-[8px] h-3 px-1">OFFLINE</Badge>
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {agent.llmModel} / {agent.lightLlmModel || 'N/A'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </Card>
            </>
          )}
        </div>

        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="h-7 text-[10px]">
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto dark-scrollbar p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Mulai chat dengan {selectedAgent?.name || 'agent'}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                Sistem otomatis pilih model: Light task (FAQ) = {selectedAgent?.lightLlmModel || 'nemotron free'}, Heavy task = {selectedAgent?.llmModel || 'GLM-4.6'}
              </p>
              <div className="mt-4 flex flex-wrap gap-1 justify-center">
                {getQuickPrompts(selectedAgent?.role).map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-[10px] px-2 py-1 bg-accent/30 border border-border rounded hover:bg-accent/50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} agentName={selectedAgent?.name} />
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <span>{selectedAgent?.name} sedang mikir...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-slate-950/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Chat ke ${selectedAgent?.name || 'agent'}...`}
            disabled={loading || !selectedAgent}
            className="flex-1 bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !selectedAgent}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5">
          💡 Tekan Enter untuk kirim. Sistem auto-detect: FAQ = model murah, kompleks = model kuat. Cost: Rp 0 (free models).
        </p>
      </div>
    </Card>
  )
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================
function MessageBubble({ message, agentName }: { message: Message; agentName?: string }) {
  const isOwner = message.role === 'OWNER'
  const isSystem = message.role === 'SYSTEM'

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="text-[10px] text-rose-400 bg-rose-950/30 border border-rose-700/30 rounded px-2 py-1">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2', isOwner && 'flex-row-reverse')}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
        isOwner ? 'bg-emerald-600' : 'bg-slate-700'
      )}>
        {isOwner ? 'YOU' : (agentName || 'AI').substring(0, 2).toUpperCase()}
      </div>
      <div className={cn('flex-1 min-w-0 max-w-[80%]', isOwner && 'flex flex-col items-end')}>
        <div className={cn(
          'rounded-lg px-3 py-2 text-sm',
          isOwner
            ? 'bg-emerald-600 text-white'
            : 'bg-accent/40 text-foreground border border-border'
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Meta info for agent response */}
        {!isOwner && message.meta && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.meta.taskType && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                {message.meta.taskType}
              </Badge>
            )}
            {message.meta.model && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono">
                {message.meta.model}
              </Badge>
            )}
            {message.meta.latencyMs && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                <Clock className="w-2.5 h-2.5 mr-0.5" />
                {message.meta.latencyMs}ms
              </Badge>
            )}
            {message.meta.needsApproval && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                Butuh ACC
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================
function getRoleGradient(role: string): string {
  const gradients: Record<string, string> = {
    CAO: 'bg-gradient-to-br from-slate-600 to-slate-800',
    FINANCE: 'bg-gradient-to-br from-rose-500 to-pink-700',
    MATERIAL: 'bg-gradient-to-br from-amber-500 to-orange-700',
    DOCUMENT: 'bg-gradient-to-br from-violet-500 to-purple-700',
    MARKETING: 'bg-gradient-to-br from-emerald-500 to-teal-700',
  }
  return gradients[role] || gradients.MARKETING
}

function getQuickPrompts(role?: string): string[] {
  if (role === 'CAO') {
    return [
      'Analisa bottleneck minggu ini',
      'Saran optimasi sistem',
      'Berapa total hutang supplier?',
    ]
  }
  if (role === 'FINANCE') {
    return [
      'Berapa harga rumah tipe 36?',
      'Buat draft PO material unit A1',
      'Status PO terbaru?',
    ]
  }
  if (role === 'MATERIAL') {
    return [
      'Stok semen sekarang berapa?',
      'Unit mana yang sedang dibangun?',
      'Alert stok keramik?',
    ]
  }
  if (role === 'DOCUMENT') {
    return [
      'Checklist berkas Andas Saputra',
      'Berapa BPHTB rumah 173jt?',
      'Konsumen mana yang berkas kurang?',
    ]
  }
  if (role === 'MARKETING') {
    return [
      'Halo, rumah tipe 36 masih ada?',
      'Berapa DP-nya?',
      'Katanya bisa banjir?',
    ]
  }
  return ['Halo', 'Apa yang bisa kamu bantu?']
}
