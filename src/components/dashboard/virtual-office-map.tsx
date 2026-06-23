'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  X, Coffee, Trees, Briefcase, FileText, Megaphone, Crown,
  MessageSquare, Phone, Clock, CheckCircle2, AlertCircle,
  Sparkles, Zap, Activity, Send, ArrowRight, ChevronRight,
  TrendingUp, Package, Building2, Users, Map as MapIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================
interface AgentData {
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
  isActive: boolean
  isDevilsAdvocate: boolean
  whatsappNumber: string | null
  _count: {
    conversations: number
    assignedCustomers: number
    memories: number
  }
}

interface ChatMessage {
  id: string
  agentName: string
  agentRole: string
  content: string
  timestamp: string
  isEscalation?: boolean
  isEvent?: boolean
}

interface BubbleState {
  agentId: string
  text: string
  visible: boolean
}

interface AgentWithState extends AgentData {
  status: 'WORKING' | 'IDLE' | 'POSTING' | 'IN_MEETING' | 'OFFLINE' | 'CHATTING'
  position: { x: number; y: number }  // percentage on background
  facing: 'left' | 'right'
  sprite: string  // path to sprite image
  bubble?: BubbleState
}

interface StatsData {
  agents: {
    all: AgentData[]
    marketing: AgentData[]
    byRole: Record<string, number>
  }
  projects: Array<{
    id: string
    name: string
    location: string
    totalUnits: number
    status: string
    sitePlanUrl: string | null
  }>
  units: {
    total: number
    byStatus: Record<string, number>
  }
  customers: {
    total: number
    byStage: Record<string, number>
  }
  conversations: {
    recent: Array<{
      id: string
      lastMessageAt: string | null
      customer: { name: string }
      agent: { name: string; role: string }
      messages: Array<{ content: string }>
    }>
  }
  knowledgeBase: {
    byCategory: Array<{ category: string; _count: number }>
  }
  approvals: { pending: number }
  surveys: {
    upcoming: Array<{
      id: string
      scheduledAt: string
      status: string
      customer: { name: string }
    }>
  }
}

// ============================================================
// ROOM DEFINITIONS (isometric positions on Office image.png)
// Based on VLM analysis of office image
// ============================================================
interface Room {
  id: string
  label: string
  icon: React.ReactNode
  // Bounding box for clickable area (percentage)
  clickArea: { x: number; y: number; w: number; h: number }
  // Walkable spots inside the room (where agents stand)
  spots: Array<{ x: number; y: number }>
  // Corridor connections (paths to other rooms)
  corridors: string[]
  // Modal content type
  modalType: 'cao' | 'finance' | 'material' | 'document' | 'marketing' | 'lounge' | 'garden' | 'meeting'
}

const ROOMS: Room[] = [
  {
    id: 'HEAD_OFFICE',
    label: 'CEO Office (RATNA)',
    icon: <Crown className="w-3 h-3" />,
    // Head Office is top-left in isometric view
    clickArea: { x: 5, y: 5, w: 28, h: 30 },
    spots: [
      { x: 15, y: 22 },
      { x: 22, y: 18 },
    ],
    corridors: ['FINANCE', 'MARKETING'],
    modalType: 'cao',
  },
  {
    id: 'FINANCE',
    label: 'Finance (RINA)',
    icon: <Briefcase className="w-3 h-3" />,
    // Finance & Dokumen is top-center
    clickArea: { x: 35, y: 5, w: 28, h: 30 },
    spots: [
      { x: 42, y: 22 },
      { x: 50, y: 18 },
      { x: 58, y: 22 },
    ],
    corridors: ['HEAD_OFFICE', 'MATERIAL', 'MARKETING'],
    modalType: 'finance',
  },
  {
    id: 'DOCUMENT',
    label: 'Document (Dina)',
    icon: <FileText className="w-3 h-3" />,
    // Dokumen is also in finance area (per VLM: "Finance & Dokumen")
    clickArea: { x: 65, y: 5, w: 30, h: 30 },
    spots: [
      { x: 72, y: 22 },
      { x: 82, y: 18 },
    ],
    corridors: ['FINANCE', 'GARDEN'],
    modalType: 'document',
  },
  {
    id: 'MARKETING',
    label: 'Marketing Floor',
    icon: <Megaphone className="w-3 h-3" />,
    // Marketing is bottom-center (large room)
    clickArea: { x: 30, y: 40, w: 40, h: 35 },
    spots: [
      { x: 35, y: 55 },
      { x: 42, y: 60 },
      { x: 48, y: 55 },
      { x: 55, y: 60 },
      { x: 62, y: 55 },
      { x: 38, y: 65 },
      { x: 45, y: 68 },
      { x: 52, y: 65 },
      { x: 58, y: 68 },
      { x: 65, y: 65 },
    ],
    corridors: ['HEAD_OFFICE', 'FINANCE', 'LOUNGE', 'GARDEN', 'MEETING'],
    modalType: 'marketing',
  },
  {
    id: 'GUDANG',
    label: 'Gudang / Material',
    icon: <Package className="w-3 h-3" />,
    // Gudang is bottom-left
    clickArea: { x: 5, y: 40, w: 25, h: 35 },
    spots: [
      { x: 12, y: 55 },
      { x: 20, y: 60 },
    ],
    corridors: ['MARKETING', 'LOUNGE'],
    modalType: 'material',
  },
  {
    id: 'TAMAN',
    label: 'Taman Santai',
    icon: <Trees className="w-3 h-3" />,
    // Taman is right side
    clickArea: { x: 70, y: 40, w: 25, h: 55 },
    spots: [
      { x: 75, y: 55 },
      { x: 82, y: 60 },
      { x: 88, y: 65 },
      { x: 78, y: 70 },
    ],
    corridors: ['DOCUMENT', 'MARKETING', 'MEETING'],
    modalType: 'garden',
  },
  {
    id: 'LOUNGE',
    label: 'Lounge & Cafe',
    icon: <Coffee className="w-3 h-3" />,
    // Lounge overlaps with marketing area, treat as bottom-left
    clickArea: { x: 5, y: 75, w: 30, h: 20 },
    spots: [
      { x: 12, y: 85 },
      { x: 20, y: 88 },
      { x: 28, y: 85 },
    ],
    corridors: ['GUDANG', 'MARKETING'],
    modalType: 'lounge',
  },
]

// ============================================================
// ROLE → SPRITE PATH
// ============================================================
const roleToSprite: Record<string, string> = {
  RATNA: '/agents/ratna.png',
  RINA: '/agents/rina.png',
  Mitra: '/agents/mitra.png',
  Dina: '/agents/dina.png',
  Ayu: '/agents/ayu.png',
  Bima: '/agents/bima.png',
  Citra: '/agents/citra.png',
  Dian: '/agents/dian.png',
  Eka: '/agents/eka.png',
  Fajar: '/agents/fajar.png',
  Gita: '/agents/gita.png',
  Hadi: '/agents/hadi.png',
  Indah: '/agents/indah.png',
  Joko: '/agents/joko.png',
}

// ============================================================
// MOCK CHAT CONVERSATIONS
// ============================================================
const mockConversations: Array<Omit<ChatMessage, 'id' | 'timestamp'>> = [
  { agentName: 'RINA', agentRole: 'FINANCE', content: 'PO #2026-014 udah dibuat untuk material A1. ACC ya Pak.', isEvent: true },
  { agentName: 'Mitra', agentRole: 'MATERIAL', content: 'Stok semen 89 zak masuk dari PO tadi. Sudah saya catat.', isEvent: true },
  { agentName: 'Ayu', agentRole: 'MARKETING', content: 'Pak, ada lead baru dari FB. Minta survey besok.', isEvent: true },
  { agentName: 'RATNA', agentRole: 'CAO', content: 'Berdasarkan log minggu ini, approval PO rata-rata 6 jam. Suggest delegate sebagian.', isEvent: true },
  { agentName: 'Dina', agentRole: 'DOCUMENT', content: 'Berkas konsumen Andas (E4) kurang slip gaji 3 bulan. Mohon dibantu ya.', isEscalation: true },
  { agentName: 'RINA', agentRole: 'FINANCE', content: 'Harga semen naik ke 72k. Sudah saya update PO-nya.', isEvent: true },
  { agentName: 'Bima', agentRole: 'MARKETING', content: 'Konsumen tanya detail teknis KPR BTN. Sudah saya jelaskan tenor 20 thn.', isEvent: true },
  { agentName: 'Mitra', agentRole: 'MATERIAL', content: 'Unit E4 progress 40%. Foto progress sudah saya minta ke Desri.', isEvent: true },
  { agentName: 'RATNA', agentRole: 'CAO', content: 'Pak, 3 keputusan butuh ACC Anda hari ini. Lihat di room saya ya.', isEscalation: true },
  { agentName: 'Citra', agentRole: 'MARKETING', content: 'Konsumen Budi masih ragu. Mau saya push closing atau kasih waktu?', isEscalation: true },
  { agentName: 'RINA', agentRole: 'FINANCE', content: 'Hutang ke Toko Maju Jaya: 5jt. Bayar cicil 2jt, sisa 3jt.', isEvent: true },
  { agentName: 'Dina', agentRole: 'DOCUMENT', content: 'PDF gabungan berkas JENNI (E5) siap di-print. 8 dokumen.', isEvent: true },
  { agentName: 'Joko', agentRole: 'MARKETING', content: 'Cik, konsumen lokalnya lebih suka santai. Pakai bahasa Bangka dikit.', isEvent: true },
  { agentName: 'Mitra', agentRole: 'MATERIAL', content: 'Alert: stok keramik tinggal 8%, di bawah minimum 10%. Butuh PO urgent.', isEscalation: true },
  { agentName: 'Eka', agentRole: 'MARKETING', content: 'Caption IG hari ini udah saya bikin. Cek di folder konten ya.', isEvent: true },
  { agentName: 'RATNA', agentRole: 'CAO', content: 'Saran: Citra temperature 0.7→0.6, terlalu persuasif di konsumen ragu.', isEvent: true },
]

// ============================================================
// MAIN COMPONENT
// ============================================================
export function VirtualOfficeMap({ stats }: { stats: StatsData }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithState | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [bubbles, setBubbles] = useState<Record<string, BubbleState>>({})
  const [tick, setTick] = useState(0)
  const [showEscalationsOnly, setShowEscalationsOnly] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Tick: every 30 seconds, agents may change position (event-driven feel)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  // Chat: every 8 seconds new chat, every 5 chats one is LLM small talk
  useEffect(() => {
    const addChat = () => {
      const mock = mockConversations[Math.floor(Math.random() * mockConversations.length)]
      const now = new Date()
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        agentName: mock.agentName,
        agentRole: mock.agentRole,
        content: mock.content,
        timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        isEscalation: mock.isEscalation,
        isEvent: mock.isEvent,
      }
      setChatMessages(prev => [...prev.slice(-30), msg])

      // Show bubble above agent
      setBubbles(prev => ({
        ...prev,
        [mock.agentName]: {
          agentId: mock.agentName,
          text: mock.content,
          visible: true,
        },
      }))

      // Hide bubble after 8 seconds
      setTimeout(() => {
        setBubbles(prev => ({
          ...prev,
          [mock.agentName]: { ...prev[mock.agentName], visible: false },
        }))
      }, 8000)
    }

    // Initial chat after 2 seconds
    const initialTimer = setTimeout(addChat, 2000)
    const interval = setInterval(addChat, 12000)
    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Compute agent states
  const agentsWithState = useMemo<AgentWithState[]>(() => {
    return stats.agents.all.map((agent, idx) => {
      const state = computeAgentState(agent, idx, tick)
      const sprite = roleToSprite[agent.name] || '/agents/ayu.png'
      const bubble = bubbles[agent.name]
      return { ...agent, ...state, sprite, bubble }
    })
  }, [stats.agents.all, tick, bubbles])

  const filteredChat = showEscalationsOnly
    ? chatMessages.filter(m => m.isEscalation)
    : chatMessages

  const escalationCount = chatMessages.filter(m => m.isEscalation).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Virtual Office
          </h2>
          <p className="text-sm text-muted-foreground">
            Klik avatar untuk lihat detail · Klik ruangan untuk lihat data · Bubble muncul saat agent ngobrol
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusLegend label="Kerja" icon="💻" color="bg-emerald-500" />
          <StatusLegend label="Ngobrol" icon="💬" color="bg-blue-500" />
          <StatusLegend label="Posting" icon="📱" color="bg-violet-500" />
          <StatusLegend label="Nongkrong" icon="☕" color="bg-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Office Map */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden border border-border shadow-2xl glow-emerald">
            {/* Title bar */}
            <div className="bg-slate-950/80 backdrop-blur px-4 py-2 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground ml-2">
                  hadi-kaya-office.floor
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE · {agentsWithState.filter(a => a.status !== 'OFFLINE').length}/{agentsWithState.length} aktif
              </span>
            </div>

            {/* Office Floor with background image */}
            <div
              className="relative bg-slate-950 overflow-hidden"
              style={{ aspectRatio: '16/10' }}
            >
              {/* Background image */}
              <img
                src="/office-background.png"
                alt="Virtual Office"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ imageRendering: 'auto', zIndex: 0 }}
              />

              {/* Clickable room zones (transparent overlay) */}
              {ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className="absolute group hover:bg-emerald-500/10 transition-all rounded"
                  style={{
                    left: `${room.clickArea.x}%`,
                    top: `${room.clickArea.y}%`,
                    width: `${room.clickArea.w}%`,
                    height: `${room.clickArea.h}%`,
                    zIndex: 5,
                  }}
                  title={`Klik untuk lihat ${room.label}`}
                >
                  {/* Room label - appears on hover */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-slate-950/80 backdrop-blur rounded text-[9px] font-mono text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-emerald-500/30">
                    {room.label}
                  </div>
                </button>
              ))}

              {/* Agents on top */}
              {agentsWithState.map(agent => (
                <PixelAgent
                  key={agent.id}
                  agent={agent}
                  onClick={() => setSelectedAgent(agent)}
                />
              ))}
            </div>
          </Card>

          {/* Real Activity Feed */}
          <ActivityFeed agents={agentsWithState} />
        </div>

        {/* Side panel: Live chat */}
        <Card className="p-0 overflow-hidden border border-border flex flex-col h-[700px]">
          <div className="bg-slate-950/80 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-foreground">Office Chat</h3>
              {escalationCount > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                  {escalationCount} perlu Anda
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEscalationsOnly(!showEscalationsOnly)}
              className="text-[10px] h-6 px-2"
            >
              {showEscalationsOnly ? 'Semua' : 'Escalation'}
            </Button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto dark-scrollbar p-3 space-y-2"
          >
            {filteredChat.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Belum ada obrolan. Tunggu event baru...
              </div>
            ) : (
              filteredChat.map(msg => (
                <ChatBubble key={msg.id} message={msg} />
              ))
            )}
          </div>

          <div className="border-t border-border p-3 bg-slate-950/50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Chat ke agent (coming soon: WA bridge)..."
                disabled
                className="flex-1 bg-background/50 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 opacity-60"
              />
              <Button size="sm" disabled className="h-7 w-7 p-0 opacity-60">
                <Send className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5">
              💬 Event-based chat. LLM small talk tiap 10 menit. WA bridge soon.
            </p>
          </div>
        </Card>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          stats={stats}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// PIXEL AGENT (using AI-generated sprite)
// ============================================================
function PixelAgent({
  agent, onClick,
}: {
  agent: AgentWithState
  onClick: () => void
}) {
  const isWorking = agent.status === 'WORKING' || agent.status === 'POSTING' || agent.status === 'CHATTING'
  const isMoving = agent.status === 'IDLE' || agent.status === 'IN_MEETING'

  return (
    <div
      onClick={onClick}
      className="absolute z-20 cursor-pointer group"
      style={{
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: 'translate(-50%, -100%)',
        transition: 'left 4s cubic-bezier(0.4, 0, 0.2, 1), top 4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20,
      }}
    >
      {/* Speech bubble */}
      {agent.bubble?.visible && agent.bubble.text && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-30 chat-fade-in">
          <div className="relative max-w-[180px] bg-white border-2 border-slate-800 rounded-lg p-2 shadow-lg">
            <p className="text-[10px] text-slate-900 leading-snug">{agent.bubble.text}</p>
            {/* Bubble tail */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-slate-800 rotate-45" />
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
        <StatusBubble status={agent.status} />
      </div>

      {/* Name label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 bg-slate-950/90 backdrop-blur rounded text-[8px] font-bold text-white whitespace-nowrap border border-slate-700 shadow-md">
        {agent.name}
      </div>

      {/* Sprite image with animation */}
      <div
        className={cn(
          'relative w-12 h-12 sm:w-16 sm:h-16',
          isWorking && !isMoving && 'work-pulse',
          isMoving && 'walk-bob',
          agent.status === 'IDLE' && !isMoving && 'idle-breath',
        )}
        style={{
          transform: agent.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      >
        <img
          src={agent.sprite}
          alt={agent.name}
          className="w-full h-full object-contain"
          style={{
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    </div>
  )
}

// ============================================================
// STATUS BUBBLE
// ============================================================
function StatusBubble({ status }: { status: AgentWithState['status'] }) {
  const config: Record<string, { icon: string; bg: string }> = {
    WORKING: { icon: '💻', bg: 'bg-emerald-500' },
    CHATTING: { icon: '💬', bg: 'bg-blue-500' },
    POSTING: { icon: '📱', bg: 'bg-violet-500' },
    IDLE: { icon: '☕', bg: 'bg-amber-500' },
    IN_MEETING: { icon: '👥', bg: 'bg-pink-500' },
    OFFLINE: { icon: '💤', bg: 'bg-slate-500' },
  }
  const cfg = config[status]
  return (
    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[8px] border-2 border-slate-950 shadow-md', cfg.bg)}>
      {cfg.icon}
    </div>
  )
}

// ============================================================
// STATUS LEGEND
// ============================================================
function StatusLegend({
  label, icon, color,
}: {
  label: string
  icon: string
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-card border border-border rounded-lg">
      <span className={cn('w-2 h-2 rounded-full', color)} />
      <span className="text-[10px]">{icon}</span>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

// ============================================================
// CHAT BUBBLE (in side panel)
// ============================================================
function ChatBubble({ message }: { message: ChatMessage }) {
  const isEscalation = message.isEscalation
  const isEvent = message.isEvent

  return (
    <div className={cn(
      'chat-fade-in flex gap-2 p-2 rounded-md',
      isEscalation && 'bg-rose-950/30 border border-rose-500/40',
      isEvent && !isEscalation && 'bg-emerald-950/20',
      !isEvent && !isEscalation && 'bg-transparent',
    )}>
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-border bg-slate-800">
        <img
          src={roleToSprite[message.agentName] || '/agents/ayu.png'}
          alt={message.agentName}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-bold text-foreground">{message.agentName}</span>
          <span className="text-[9px] text-muted-foreground font-mono">{message.timestamp}</span>
          {isEscalation && (
            <Badge variant="destructive" className="text-[8px] h-3 px-1 ml-auto">
              <AlertCircle className="w-2 h-2 mr-0.5" />
              BUTUH ANDA
            </Badge>
          )}
          {isEvent && !isEscalation && (
            <Badge variant="outline" className="text-[8px] h-3 px-1 ml-auto bg-emerald-950/40 text-emerald-400 border-emerald-700/40">
              EVENT
            </Badge>
          )}
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}

// ============================================================
// ACTIVITY FEED
// ============================================================
function ActivityFeed({ agents }: { agents: AgentWithState[] }) {
  const allActivities = useMemo(() => {
    const items: Array<{
      agentName: string
      agentRole: string
      time: string
      action: string
      output?: string
      type: string
    }> = []

    for (const agent of agents) {
      // Generate 2 activities per agent
      const acts = generateActivitiesForAgent(agent)
      items.push(...acts)
    }

    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 15)
  }, [agents])

  return (
    <Card className="p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-foreground">Real Activity Feed</h3>
        <Badge variant="outline" className="text-[9px] h-4 ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
          LIVE
        </Badge>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto dark-scrollbar pr-1">
        {allActivities.map((item, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors">
            <ActivityIcon type={item.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">{item.time}</span>
                <Badge variant="outline" className="text-[9px] py-0 h-3.5">
                  {item.agentName}
                </Badge>
              </div>
              <p className="text-xs text-foreground/80 mt-0.5">{item.action}</p>
              {item.output && (
                <div className="mt-1 px-2 py-1 bg-emerald-950/30 border border-emerald-700/30 rounded text-[10px] text-emerald-300 font-mono">
                  → {item.output}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: React.ReactNode; color: string }> = {
    WORK: { icon: <Briefcase className="w-3 h-3" />, color: 'text-emerald-400' },
    CHAT: { icon: <MessageSquare className="w-3 h-3" />, color: 'text-blue-400' },
    POST: { icon: <Megaphone className="w-3 h-3" />, color: 'text-violet-400' },
    IDLE: { icon: <Coffee className="w-3 h-3" />, color: 'text-amber-400' },
    MEETING: { icon: <MessageSquare className="w-3 h-3" />, color: 'text-pink-400' },
    OFFLINE: { icon: <Clock className="w-3 h-3" />, color: 'text-slate-500' },
    APPROVAL: { icon: <AlertCircle className="w-3 h-3" />, color: 'text-rose-400' },
  }
  const c = config[type] || config.WORK
  return <span className={cn('mt-0.5 flex-shrink-0', c.color)}>{c.icon}</span>
}

// ============================================================
// AGENT DETAIL MODAL
// ============================================================
function AgentDetailModal({
  agent, onClose,
}: {
  agent: AgentWithState
  onClose: () => void
}) {
  const roleLabels: Record<string, string> = {
    FINANCE: 'Finance AI',
    MATERIAL: 'Material AI',
    DOCUMENT: 'Document AI',
    MARKETING: 'Marketing AI',
    CONTENT: 'Content Creator',
    CAO: 'Chief AI Officer',
  }
  const statusLabels: Record<string, string> = {
    WORKING: 'Sedang Kerja 💻',
    CHATTING: 'Ngobrol dengan konsumen 💬',
    POSTING: 'Posting di sosmed 📱',
    IDLE: 'Nongkrong ☕',
    IN_MEETING: 'Di meeting 👥',
    OFFLINE: 'Offline 💤',
  }
  const count = agent._count || { conversations: 0, assignedCustomers: 0, memories: 0 }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <Card className="max-w-md w-full p-0 overflow-hidden border border-border shadow-2xl max-h-[90vh] overflow-y-auto dark-scrollbar" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 flex items-start gap-3 text-white relative">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white/20 bg-white/10">
            <img
              src={agent.sprite}
              alt={agent.name}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated', mixBlendMode: 'multiply' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold">{agent.name}</h3>
              {agent.isDevilsAdvocate && (
                <Badge className="bg-amber-500 text-white text-[9px]">devil&apos;s advocate</Badge>
              )}
            </div>
            <p className="text-xs opacity-90">{roleLabels[agent.role]}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-white/15 rounded text-xs">
              <span className={cn('w-2 h-2 rounded-full', agent.status === 'OFFLINE' ? 'bg-slate-300' : 'bg-emerald-300 animate-pulse')} />
              {statusLabels[agent.status]}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 flex-shrink-0 absolute top-2 right-2" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Personality</p>
            <p className="text-sm text-foreground/90">{agent.personality}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-accent/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">{count.conversations}</div>
              <div className="text-[9px] text-muted-foreground">Conversations</div>
            </div>
            <div className="bg-accent/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">{count.assignedCustomers}</div>
              <div className="text-[9px] text-muted-foreground">Customers</div>
            </div>
            <div className="bg-accent/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-foreground">{count.memories}</div>
              <div className="text-[9px] text-muted-foreground">Memories</div>
            </div>
          </div>

          {/* LLM Config */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Konfigurasi LLM (Task-Based Routing)
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 bg-rose-950/30 border border-rose-700/30 rounded-md">
                <div className="text-xs">🔥</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground">Heavy task (analisa, keputusan, konten)</div>
                  <div className="text-xs font-mono text-foreground truncate">{agent.llmModel}</div>
                </div>
                <Badge variant="outline" className="text-[9px]">{agent.llmProvider}</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-950/30 border border-emerald-700/30 rounded-md">
                <div className="text-xs">⚡</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground">Light task (FAQ, status, chat receh)</div>
                  <div className="text-xs font-mono text-emerald-400 truncate">
                    {agent.lightLlmModel || 'gemini-2.0-flash'}
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-700">
                  {agent.lightLlmProvider || 'openrouter'}
                </Badge>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5">
              💡 Light task pake model murah (gemini-flash ~Rp 50/chat). Heavy task pake model kuat untuk kualitas.
            </p>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
            <Phone className="w-4 h-4 text-emerald-400" />
            <div className="flex-1">
              <div className="text-[10px] text-muted-foreground">WhatsApp Number</div>
              <div className="text-xs font-mono text-foreground">
                {agent.whatsappNumber || 'Belum diset (siapkan nomor HP)'}
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Activity History
            </p>
            <ScrollArea className="h-40 pr-2">
              <div className="space-y-1.5">
                {generateActivitiesForAgent(agent).map((act, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-accent/30 rounded-lg">
                    <ActivityIcon type={act.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/90">{act.action}</p>
                      {act.output && (
                        <div className="mt-1 px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-700/30 rounded text-[10px] text-emerald-300 font-mono">
                          → {act.output}
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" size="sm">
              <MessageSquare className="w-3 h-3 mr-1" />
              Chat via WA (soon)
            </Button>
            <Button variant="outline" size="sm">
              Lihat Detail
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// ROOM DETAIL MODAL (large modal per room)
// ============================================================
function RoomDetailModal({
  room, stats, onClose,
}: {
  room: Room
  stats: StatsData
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <Card
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto dark-scrollbar border border-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-4 flex items-center gap-3 text-white sticky top-0 z-10">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            {room.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{room.label}</h3>
            <p className="text-xs text-emerald-300/80">
              {getRoomSubtitle(room.modalType)}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content based on room type */}
        <div className="p-4">
          <RoomContent room={room} stats={stats} />
        </div>
      </Card>
    </div>
  )
}

function getRoomSubtitle(type: Room['modalType']): string {
  const subtitles: Record<string, string> = {
    cao: 'Sistem analisa & optimization suggestion',
    finance: 'Daftar PO, hutang supplier, laporan keuangan',
    material: 'Stok gudang, progress per unit, closing book',
    document: 'Checklist berkas per konsumen, status dokumen',
    marketing: 'Pipeline konsumen, siteplan, leads tracking',
    lounge: 'Area istirahat - agent yang lagi idle',
    garden: 'Taman - agent yang lagi santai',
    meeting: 'Meeting room - agent yang lagi diskusi',
  }
  return subtitles[type] || ''
}

function RoomContent({ room, stats }: { room: Room; stats: StatsData }) {
  switch (room.modalType) {
    case 'cao':
      return <CAORoomContent stats={stats} />
    case 'finance':
      return <FinanceRoomContent stats={stats} />
    case 'material':
      return <MaterialRoomContent stats={stats} />
    case 'document':
      return <DocumentRoomContent stats={stats} />
    case 'marketing':
      return <MarketingRoomContent stats={stats} />
    case 'lounge':
    case 'garden':
    case 'meeting':
      return <IdleRoomContent room={room} />
    default:
      return <p>Coming soon</p>
  }
}

// ============================================================
// ROOM CONTENT COMPONENTS
// ============================================================
function CAORoomContent({ stats }: { stats: StatsData }) {
  const analyses = [
    { title: 'Bottleneck: Approval PO', metric: '6 jam rata-rata', suggestion: 'Delegate approval < Rp 5jt ke Manager Finance', impact: 'Hemat 70% waktu Owner', priority: 'HIGH' },
    { title: 'Marketing AI Citra terlalu agresif', metric: 'Temperature 0.7', suggestion: 'Tune temperature 0.7 → 0.6 untuk konsumen ragu', impact: 'Tingkatkan closing rate 15%', priority: 'MEDIUM' },
    { title: 'Stok keramik kritis', metric: '8% (di bawah 10% min)', suggestion: 'Buat PO urgent keramik sebelum habis', impact: 'Cegah delay pembangunan', priority: 'HIGH' },
    { title: 'Ekspansi proyek B 2027', metric: 'Feasibility: 75%', suggestion: 'Butuh capital Rp 2M untuk lahan baru', impact: 'Revenue 2x dalam 2 tahun', priority: 'STRATEGIC' },
  ]

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Crown className="w-4 h-4 text-emerald-400" />
        Analisa & Rekomendasi Sistem
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {analyses.map((item, i) => (
          <Card key={i} className="p-3 bg-accent/20 border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h5 className="text-sm font-semibold text-foreground">{item.title}</h5>
              <Badge variant={item.priority === 'HIGH' ? 'destructive' : item.priority === 'STRATEGIC' ? 'default' : 'outline'} className="text-[9px]">
                {item.priority}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Metric:</span>
                <span className="font-mono text-foreground">{item.metric}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">Saran:</span>
                <span className="text-foreground">{item.suggestion}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">Impact:</span>
                <span className="text-emerald-400">{item.impact}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-lg">
        <p className="text-xs text-emerald-300">
          💡 <strong>RATNA (CAO) Insight:</strong> Berdasarkan audit log 7 hari terakhir, sistem sudah handle 124 task.
          Total token cost: ~Rp 18.500 (light task: Rp 8.200, heavy task: Rp 10.300). Efisiensi: 92%.
        </p>
      </div>
    </div>
  )
}

function FinanceRoomContent({ stats }: { stats: StatsData }) {
  const mockPOs = [
    { poNumber: 'PO-2026-014', supplier: 'Toko Maju Jaya', total: 4400000, status: 'PENDING_APPROVAL', unit: 'A1', workItem: 'Plasteran' },
    { poNumber: 'PO-2026-013', supplier: 'TB Sumber Rejeki', total: 8200000, status: 'PARTIAL_DELIVERED', unit: 'E4', workItem: 'Pondasi' },
    { poNumber: 'PO-2026-012', supplier: 'Toko Maju Jaya', total: 2150000, status: 'PAID', unit: 'A2', workItem: 'Atap' },
    { poNumber: 'PO-2026-011', supplier: 'Keramik Indah', total: 6800000, status: 'PARTIAL_PAID', unit: 'E5', workItem: 'Lantai' },
  ]

  const suppliers = [
    { name: 'Toko Maju Jaya', totalDebt: 3000000, lastPO: '2026-06-20' },
    { name: 'TB Sumber Rejeki', totalDebt: 0, lastPO: '2026-06-19' },
    { name: 'Keramik Indah', totalDebt: 4500000, lastPO: '2026-06-18' },
  ]

  const formatRupiah = (n: number) => `Rp ${(n / 1000000).toFixed(1)}jt`

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-accent/30 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground">Total Hutang</div>
          <div className="text-sm font-bold text-rose-400">Rp 7.5jt</div>
        </div>
        <div className="bg-accent/30 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground">PO Pending ACC</div>
          <div className="text-sm font-bold text-amber-400">1</div>
        </div>
        <div className="bg-accent/30 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground">PO Aktif</div>
          <div className="text-sm font-bold text-emerald-400">4</div>
        </div>
        <div className="bg-accent/30 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground">Pengeluaran Bulan Ini</div>
          <div className="text-sm font-bold text-foreground">Rp 21.5jt</div>
        </div>
      </div>

      {/* PO List */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          Purchase Order Aktif
        </h4>
        <div className="space-y-2">
          {mockPOs.map(po => (
            <div key={po.poNumber} className="p-3 bg-accent/20 border border-border rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{po.poNumber}</span>
                    <Badge variant="outline" className="text-[9px]">{po.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {po.supplier} · Unit {po.unit} · {po.workItem}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{formatRupiah(po.total)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Debt */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Hutang per Supplier
        </h4>
        <div className="space-y-2">
          {suppliers.map(s => (
            <div key={s.name} className="flex items-center justify-between p-2 bg-accent/20 border border-border rounded">
              <div>
                <div className="text-xs font-medium text-foreground">{s.name}</div>
                <div className="text-[10px] text-muted-foreground">Last PO: {s.lastPO}</div>
              </div>
              <div className={cn('text-sm font-bold', s.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                {s.totalDebt > 0 ? formatRupiah(s.totalDebt) : 'Lunas ✓'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MaterialRoomContent({ stats }: { stats: StatsData }) {
  const unitsInProgress = [
    { unit: 'E4', customer: 'Andas Saputra', progress: 40, workItem: 'Pondasi', status: 'ON_TRACK' },
    { unit: 'E5', customer: 'JENNI', progress: 15, workItem: 'Persiapan', status: 'ON_TRACK' },
  ]

  const stockAlerts = [
    { material: 'Semen', stock: 89, unit: 'zak', min: 10, status: 'OK' },
    { material: 'Keramik', stock: 8, unit: 'm²', min: 10, status: 'CRITICAL' },
    { material: 'Batu bata', stock: 1500, unit: 'bh', min: 200, status: 'OK' },
    { material: 'Pasir', stock: 12, unit: 'm³', min: 5, status: 'OK' },
  ]

  return (
    <div className="space-y-4">
      {/* Stock Alerts */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          Stok Gudang Real-time
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stockAlerts.map(s => (
            <Card key={s.material} className={cn(
              'p-3 border',
              s.status === 'CRITICAL' ? 'border-rose-500/50 bg-rose-950/20' : 'border-border bg-accent/20'
            )}>
              <div className="text-xs font-bold text-foreground">{s.material}</div>
              <div className="text-lg font-bold text-foreground mt-1">{s.stock} <span className="text-[10px] font-normal text-muted-foreground">{s.unit}</span></div>
              <div className="text-[9px] text-muted-foreground">Min: {s.min} {s.unit}</div>
              {s.status === 'CRITICAL' && (
                <Badge variant="destructive" className="text-[8px] mt-1 h-3 px-1">CRITICAL</Badge>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Units in Progress */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Unit Sedang Dibangun
        </h4>
        <div className="space-y-2">
          {unitsInProgress.map(u => (
            <Card key={u.unit} className="p-3 bg-accent/20 border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Unit {u.unit}</span>
                    <Badge variant="outline" className="text-[9px]">{u.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{u.customer} · {u.workItem}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">{u.progress}%</div>
                </div>
              </div>
              <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Friday Closing Book */}
      <div className="p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-lg">
        <h5 className="text-xs font-bold text-emerald-300 mb-1">📅 Closing Book Jumat</h5>
        <p className="text-[11px] text-muted-foreground">
          Setiap Jumat, Mitra akan tutup buku progress semua unit. Pembayaran tukang Sabtu.
          Output: laporan material terpakai per unit + foto progress + upah tukang.
        </p>
      </div>
    </div>
  )
}

function DocumentRoomContent({ stats }: { stats: StatsData }) {
  const customers = [
    {
      name: 'Andas Saputra',
      unit: 'E4',
      bank: 'BSB Syariah',
      stage: 'SP3K',
      docs: [
        { name: 'KTP', status: 'COMPLETE' },
        { name: 'NPWP', status: 'COMPLETE' },
        { name: 'KK', status: 'COMPLETE' },
        { name: 'Akta Nikah', status: 'COMPLETE' },
        { name: 'Slip Gaji 3 bln', status: 'MISSING' },
        { name: 'SK Kerja', status: 'COMPLETE' },
        { name: 'Surat belum punya rumah', status: 'COMPLETE' },
      ],
    },
    {
      name: 'JENNI',
      unit: 'E5',
      bank: 'BTN',
      stage: 'PEMBERKASAN',
      docs: [
        { name: 'KTP', status: 'COMPLETE' },
        { name: 'NPWP', status: 'MISSING' },
        { name: 'KK', status: 'COMPLETE' },
        { name: 'Akta Nikah', status: 'PENDING_REVIEW' },
        { name: 'Slip Gaji 3 bln', status: 'MISSING' },
        { name: 'SK Kerja', status: 'MISSING' },
        { name: 'Surat belum punya rumah', status: 'COMPLETE' },
      ],
    },
  ]

  const docStatus: Record<string, { label: string; color: string }> = {
    COMPLETE: { label: '✓ Ada', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-700/30' },
    MISSING: { label: '✗ Kurang', color: 'bg-rose-500/20 text-rose-400 border-rose-700/30' },
    PENDING_REVIEW: { label: '⏳ Review', color: 'bg-amber-500/20 text-amber-400 border-amber-700/30' },
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-400" />
        Checklist Berkas Per Konsumen
      </h4>
      <div className="space-y-3">
        {customers.map(c => {
          const completeCount = c.docs.filter(d => d.status === 'COMPLETE').length
          const totalCount = c.docs.length
          const percent = Math.round((completeCount / totalCount) * 100)
          return (
            <Card key={c.name} className="p-3 bg-accent/20 border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{c.name}</span>
                    <Badge variant="outline" className="text-[9px]">Unit {c.unit}</Badge>
                    <Badge variant="outline" className="text-[9px]">{c.bank}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Stage: {c.stage}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{percent}%</div>
                  <div className="text-[9px] text-muted-foreground">{completeCount}/{totalCount} berkas</div>
                </div>
              </div>
              <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {c.docs.map(d => {
                  const cfg = docStatus[d.status]
                  return (
                    <div key={d.name} className={cn('text-[10px] px-2 py-1 rounded border', cfg.color)}>
                      {d.name}: <strong>{cfg.label}</strong>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-lg">
        <p className="text-xs text-emerald-300">
          📋 <strong>Document AI (Dina) Info:</strong> Data yang perlu diisi per konsumen:
          pekerjaan, lokasi tempat kerja, no HP, status pernikahan, gaji.
        </p>
      </div>
    </div>
  )
}

function MarketingRoomContent({ stats }: { stats: StatsData }) {
  const pipelineStages = [
    { key: 'DM', label: 'DM', count: 0 },
    { key: 'SURVEY', label: 'Survey', count: 0 },
    { key: 'CLOSING', label: 'Closing', count: 0 },
    { key: 'BOOKING', label: 'Booking', count: 2 },
    { key: 'SLIK', label: 'SLIK', count: 0 },
    { key: 'PEMBERKASAN', label: 'Pemberkasan', count: 1 },
    { key: 'SP3K', label: 'SP3K', count: 1 },
    { key: 'AKAD', label: 'Akad', count: 0 },
  ]

  const mockCustomers = [
    { name: 'Andas Saputra', stage: 'SP3K', unit: 'E4', agent: 'Bima' },
    { name: 'JENNI', stage: 'PEMBERKASAN', unit: 'E5', agent: 'Gita' },
  ]

  return (
    <div className="space-y-4">
      {/* Siteplan Mini View */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-emerald-400" />
          Siteplan Status
        </h4>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.units.byStatus.AVAILABLE || 0}</div>
            <div className="text-[10px] text-muted-foreground">Tersedia</div>
          </div>
          <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.units.byStatus.BOOKED || 0}</div>
            <div className="text-[10px] text-muted-foreground">Booked</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-300">{stats.units.byStatus.SOLD || 0}</div>
            <div className="text-[10px] text-muted-foreground">Terjual</div>
          </div>
        </div>
        <img
          src="/siteplan-anjayo.png"
          alt="Siteplan"
          className="w-full rounded-lg border border-border max-h-48 object-contain bg-white/5"
        />
      </div>

      {/* Pipeline */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Pipeline Konsumen
        </h4>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
          {pipelineStages.map(stage => (
            <div key={stage.key} className="bg-accent/20 border border-border rounded p-2 text-center">
              <div className="text-lg font-bold text-foreground">{stage.count}</div>
              <div className="text-[9px] text-muted-foreground">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Customers */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2">Konsumen Aktif</h4>
        <div className="space-y-2">
          {mockCustomers.map(c => (
            <div key={c.name} className="flex items-center justify-between p-2 bg-accent/20 border border-border rounded">
              <div>
                <div className="text-sm font-medium text-foreground">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">Unit {c.unit} · Agent {c.agent}</div>
              </div>
              <Badge variant="outline" className="text-[9px]">{c.stage}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-lg">
        <p className="text-xs text-emerald-300">
          📣 <strong>Marketing Team:</strong> 10 Marketing AI aktif. Lead sources: FB, IG, walk-in.
          Selling point utama: DP 5jt all-in, lokasi strategis, no banjir.
        </p>
      </div>
    </div>
  )
}

function IdleRoomContent({ room }: { room: Room }) {
  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">
        {room.modalType === 'garden' ? '🌳' : room.modalType === 'lounge' ? '☕' : '👥'}
      </div>
      <h4 className="text-lg font-bold text-foreground mb-1">{room.label}</h4>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {room.modalType === 'garden' && 'Area taman untuk agent yang lagi santai. Mereka ngobrol santai, ngopi, atau sekedar refresh dari pekerjaan.'}
        {room.modalType === 'lounge' && 'Lounge & cafe untuk agent yang lagi break. Bisa ngobrol informal atau makan siang.'}
        {room.modalType === 'meeting' && 'Meeting room untuk diskusi antar agent. Multi-agent conversation terjadi di sini.'}
      </p>
    </div>
  )
}

// ============================================================
// STATE COMPUTATION
// ============================================================
function computeAgentState(
  agent: AgentData,
  index: number,
  tick: number
): Omit<AgentWithState, keyof AgentData | 'sprite' | 'bubble'> {
  const hash = (n: number) => {
    const x = Math.sin((index + 1) * 137 + tick * 13 + n * 7) * 10000
    return x - Math.floor(x)
  }

  // Determine status
  let status: AgentWithState['status']
  const r = hash(1)
  if (!agent.isActive) {
    status = 'OFFLINE'
  } else if (r < 0.55) {
    status = 'WORKING'
  } else if (r < 0.70) {
    status = agent.role === 'MARKETING' ? 'POSTING' : 'CHATTING'
  } else if (r < 0.85) {
    status = 'IDLE'
  } else if (r < 0.95) {
    status = 'IN_MEETING'
  } else {
    status = 'CHATTING'
  }

  // Determine which room agent is in based on status
  let targetRoom: Room
  if (status === 'OFFLINE' || status === 'WORKING' || status === 'POSTING' || status === 'CHATTING') {
    // Agent is at their desk
    targetRoom = getAgentRoom(agent.role)
  } else if (status === 'IDLE') {
    // Half lounge, half garden
    targetRoom = hash(2) > 0.5 ? ROOMS.find(r => r.id === 'LOUNGE')! : ROOMS.find(r => r.id === 'TAMAN')!
  } else {
    // Meeting room
    targetRoom = ROOMS.find(r => r.id === 'MARKETING')! // simplify: meeting in marketing area
  }

  // Pick a spot in the room (deterministic)
  const spotIdx = Math.floor(hash(3) * targetRoom.spots.length) % targetRoom.spots.length
  const spot = targetRoom.spots[spotIdx]

  const facing: 'left' | 'right' = hash(5) > 0.5 ? 'right' : 'left'

  return {
    status,
    position: { x: spot.x, y: spot.y },
    facing,
  }
}

function getAgentRoom(role: string): Room {
  switch (role) {
    case 'CAO': return ROOMS.find(r => r.id === 'HEAD_OFFICE')!
    case 'FINANCE': return ROOMS.find(r => r.id === 'FINANCE')!
    case 'MATERIAL': return ROOMS.find(r => r.id === 'GUDANG')!
    case 'DOCUMENT': return ROOMS.find(r => r.id === 'DOCUMENT')!
    case 'MARKETING': return ROOMS.find(r => r.id === 'MARKETING')!
    default: return ROOMS.find(r => r.id === 'MARKETING')!
  }
}

// ============================================================
// ACTIVITY GENERATION
// ============================================================
function generateActivitiesForAgent(agent: AgentWithState): Array<{
  time: string
  action: string
  output?: string
  type: string
}> {
  const hash = (n: number) => {
    const x = Math.sin(agent.id.length * 137 + n * 7) * 10000
    return x - Math.floor(x)
  }

  const activitiesByRole: Record<string, Array<{ action: string; output?: string; type: string }>> = {
    FINANCE: [
      { action: 'Buat PO material unit A1 (plasteran)', output: 'PO-2026-014 draft, 6 item, total Rp 4.2jt', type: 'WORK' },
      { action: 'Konfirmasi harga semen ke supplier', output: 'Toko Maju Jaya: Rp 72k/zak (naik dari 68k)', type: 'CHAT' },
      { action: 'Submit PO untuk ACC Owner', output: 'Menunggu tanda tangan Owner', type: 'APPROVAL' },
      { action: 'Update PO #2026-014: harga semen 68k→72k', output: 'Total PO revised: Rp 4.4jt (+Rp 200rb)', type: 'WORK' },
      { action: 'Catat pembayaran cicil supplier', output: 'Bayar Rp 2jt dari hutang Rp 5jt. Sisa: Rp 3jt', type: 'WORK' },
    ],
    MATERIAL: [
      { action: 'Catat stok masuk dari PO #2026-014', output: '89 zak semen (dari 100 pesanan, kurang 11)', type: 'WORK' },
      { action: 'Minta progress foto ke Desri (unit E4)', output: 'Follow up dijadwalkan tiap 30 menit', type: 'CHAT' },
      { action: 'Update pemakaian: 12 zak semen di E4', output: 'Sisa stok semen: 77 zak. Pemakaian E4: 40% budget', type: 'WORK' },
      { action: 'Alert: stok keramik 8% (< 10% min)', output: 'Perlu PO urgent keramik', type: 'APPROVAL' },
    ],
    DOCUMENT: [
      { action: 'Extract KTP konsumen Andas Saputra', output: 'Data tersimpan: nama, NIK, alamat, TTL', type: 'WORK' },
      { action: 'Isi template KPR BSB - Andas Saputra', output: '6 field terisi. PDF siap download', type: 'WORK' },
      { action: 'Cek kelengkapan berkas JENNI (E5)', output: 'Kurang: NPWP, slip gaji 3 bln, SK kerja', type: 'APPROVAL' },
      { action: 'Generate PDF gabungan berkas konsumen', output: '8 dokumen merge jadi 1 PDF (2.3MB)', type: 'WORK' },
    ],
    MARKETING: [
      { action: 'Balas DM: tanya DP & cicilan KPR', output: 'Reply: "DP 5jt all-in, cicilan KPR ±1.3jt/bln"', type: 'CHAT' },
      { action: 'Posting caption IG baru', output: 'Posted: "DP cuma 5jt, langsung punya rumah!" (12 likes)', type: 'POST' },
      { action: 'Follow up konsumen survey kemarin', output: 'Konsumen Budi: minat unit A1, mikir DP', type: 'CHAT' },
      { action: 'Handle objection "katanya banjir?"', output: 'Resolved: jelaskan tidak ada riwayat banjir', type: 'CHAT' },
    ],
    CAO: [
      { action: 'Analisa bottleneck approval PO', output: 'Rata-rata 6 jam, suggest delegate ke Manager', type: 'WORK' },
      { action: 'Tune Marketing AI Citra temperature', output: 'Recommendation: 0.7 → 0.6 (less aggressive)', type: 'WORK' },
      { action: 'Push back: diskon ke konsumen gaji non-transfer', output: 'Argument: slik belum cek, mending closing dulu', type: 'CHAT' },
      { action: 'Cross-query: total hutang supplier minggu ini', output: 'Total: Rp 7.5jt (3 supplier, 4 PO outstanding)', type: 'WORK' },
    ],
  }

  const pool = activitiesByRole[agent.role] || activitiesByRole.MARKETING
  const now = new Date()
  return pool.slice(0, 4).map((act, i) => {
    const minutesAgo = (i + 1) * 23 + Math.floor(hash(i + 2) * 30)
    const date = new Date(now.getTime() - minutesAgo * 60 * 1000)
    return {
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      ...act,
    }
  })
}
