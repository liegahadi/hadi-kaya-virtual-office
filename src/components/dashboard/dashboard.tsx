'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Users, Map, BookOpen, Settings, Bot, MessageSquare,
  Bell, CheckCircle2, AlertCircle, Sparkles, Zap, ShieldCheck,
  TrendingUp, Clock, MapPin, Calendar, FileText, Brain, Database, Landmark, RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { VirtualOfficeMapWrapper } from '@/components/dashboard/virtual-office-map-wrapper'
import { BerkasViewV2 } from '@/components/berkas-view-v2'
import { MemoryTab } from '@/components/dashboard/memory-tab'
import { DatabaseTab } from '@/components/dashboard/database-tab'
import { BankBuilder } from '@/components/bank-builder/bank-builder'
import { ChatPanel } from '@/components/chat/chat-panel'

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
// MAIN DASHBOARD
// ============================================================
export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'office' | 'chat' | 'pipeline' | 'siteplan' | 'knowledge' | 'berkas' | 'memory' | 'database' | 'bank' | 'settings'
  >('office')

  // OPTIMIZATION: Polling 5 menit (was 30s) — saves ~90% dashboard bandwidth
  // User can manually refresh via RefreshCw button in header
  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 300000) // 5 minutes
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DashboardSkeleton />
  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Gagal memuat dashboard. Cek koneksi database.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Header stats={stats} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <nav className="sticky top-[72px] z-30 bg-card/80 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            <TabButton
              active={activeTab === 'office'}
              onClick={() => setActiveTab('office')}
              icon={<Bot className="w-4 h-4" />}
              label="Virtual Office"
              badge={stats.agents.all.length}
            />
            <TabButton
              active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              icon={<MessageSquare className="w-4 h-4" />}
              label="Chat"
              badge={stats.approvals.pending > 0 ? stats.approvals.pending : undefined}
              badgeVariant="destructive"
            />
            <TabButton
              active={activeTab === 'pipeline'}
              onClick={() => setActiveTab('pipeline')}
              icon={<Users className="w-4 h-4" />}
              label="Pipeline Konsumen"
              badge={stats.customers.total}
            />
            <TabButton
              active={activeTab === 'siteplan'}
              onClick={() => setActiveTab('siteplan')}
              icon={<Map className="w-4 h-4" />}
              label="Site Plan"
              badge={stats.units.total}
            />
            <TabButton
              active={activeTab === 'knowledge'}
              onClick={() => setActiveTab('knowledge')}
              icon={<BookOpen className="w-4 h-4" />}
              label="Knowledge Base"
              badge={stats.knowledgeBase.byCategory.reduce((s, c) => s + c._count, 0)}
            />
            <TabButton
              active={activeTab === 'berkas'}
              onClick={() => setActiveTab('berkas')}
              icon={<FileText className="w-4 h-4" />}
              label="Berkas"
              badge={stats.customers.total}
            />
            <TabButton
              active={activeTab === 'memory'}
              onClick={() => setActiveTab('memory')}
              icon={<Brain className="w-4 h-4" />}
              label="Memory"
            />
            <TabButton
              active={activeTab === 'database'}
              onClick={() => setActiveTab('database')}
              icon={<Database className="w-4 h-4" />}
              label="Database"
            />
            <TabButton
              active={activeTab === 'bank'}
              onClick={() => setActiveTab('bank')}
              icon={<Landmark className="w-4 h-4" />}
              label="Bank Builder"
            />
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="w-4 h-4" />}
              label="Pengaturan"
              badge={stats.approvals.pending > 0 ? stats.approvals.pending : undefined}
              badgeVariant="destructive"
            />
          </div>
        </nav>

        <div key={activeTab}>
          {activeTab === 'office' && <AgentsView stats={stats} />}
          {activeTab === 'chat' && <ChatView stats={stats} />}
          {activeTab === 'pipeline' && <PipelineView stats={stats} />}
          {activeTab === 'siteplan' && <SitePlanView stats={stats} />}
          {activeTab === 'knowledge' && <KnowledgeView stats={stats} />}
          {activeTab === 'berkas' && <BerkasViewV2 projectId={stats.projects[0]?.id || ''} />}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'bank' && <BankBuilder />}
          {activeTab === 'settings' && <SettingsView stats={stats} onRefresh={fetchStats} />}
        </div>
      </main>
    </div>
  )
}

// ============================================================
// HEADER
// ============================================================
function Header({ stats }: { stats: StatsData }) {
  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                Menuju Hadi Kaya
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Virtual Office · Multi-Agent System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              className="hidden sm:flex"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Sparkles className="w-3 h-3 mr-1" />
                {stats.agents.all.length} AI Agent
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <MapPin className="w-3 h-3 mr-1" />
                {stats.projects.length} Proyek
              </Badge>
              {stats.approvals.pending > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {stats.approvals.pending} Approval
                </Badge>
              )}
            </div>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {stats.approvals.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {stats.approvals.pending}
                </span>
              )}
            </Button>

            <Avatar>
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                OW
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================================
// TAB BUTTON
// ============================================================
function TabButton({
  active, onClick, icon, label, badge, badgeVariant = 'secondary',
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
  badgeVariant?: 'secondary' | 'destructive'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-muted-foreground hover:bg-accent/40'
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant={active ? 'secondary' : badgeVariant} className="ml-1 text-[10px]">
          {badge}
        </Badge>
      )}
    </button>
  )
}

// ============================================================
// AGENTS VIEW (Virtual Office) - Now uses pixelated office map!
// ============================================================
function AgentsView({ stats }: { stats: StatsData }) {
  return <VirtualOfficeMapWrapper stats={stats} />
}

// ============================================================
// CHAT VIEW - Owner bisa chat ke agent mana saja
// ============================================================
function ChatView({ stats }: { stats: StatsData }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Chat dengan Agent</h2>
        <p className="text-sm text-muted-foreground">
          Chat ke AI agent mana saja langsung dari dashboard. Sistem auto-pilih model: FAQ = model murah, kompleks = model kuat.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChatPanel agents={stats.agents.all} />
        </div>
        <div className="space-y-3">
          <Card className="p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Info LLM Routing
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-emerald-950/30 border border-emerald-700/30 rounded">
                <p className="text-emerald-400 font-semibold">⚡ Light Task (FAQ, status)</p>
                <p className="text-muted-foreground mt-0.5">Model: nemotron-3-nano:free</p>
                <p className="text-muted-foreground">Latency: ~2-3 detik</p>
                <p className="text-emerald-400 font-mono">Cost: Rp 0</p>
              </div>
              <div className="p-2 bg-rose-950/30 border border-rose-700/30 rounded">
                <p className="text-rose-400 font-semibold">🔥 Heavy Task (PO, analisa)</p>
                <p className="text-muted-foreground mt-0.5">Model: GLM-4.6 (ZAI SDK)</p>
                <p className="text-muted-foreground">Latency: ~15-40 detik</p>
                <p className="text-emerald-400 font-mono">Cost: Rp 0</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Sistem otomatis klasifikasi pesan kamu. Light task = hemat token, heavy task = kualitas.
              </p>
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">Tips Chat</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• <span className="text-foreground">RINA</span> — handle PO, finance, supplier</li>
              <li>• <span className="text-foreground">Mitra</span> — stok material, progress unit</li>
              <li>• <span className="text-foreground">Dina</span> — dokumen, berkas bank</li>
              <li>• <span className="text-foreground">RATNA</span> — strategis, optimasi sistem</li>
              <li>• <span className="text-foreground">Ayu-Bima-dll</span> — marketing, customer</li>
            </ul>
          </Card>

          <Card className="p-4 border border-border bg-amber-950/20 border-amber-700/30">
            <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Coming Soon
            </h3>
            <p className="text-xs text-muted-foreground">
              • WhatsApp bridge (besok, butuh HP kantor)<br/>
              • Approval workflow UI<br/>
              • Inter-agent chat (RINA ↔ Mitra)
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PIPELINE VIEW
// ============================================================
function PipelineView({ stats }: { stats: StatsData }) {
  const stages = [
    { key: 'DM', label: 'DM Masuk', color: 'text-foreground/80' },
    { key: 'SURVEY', label: 'Survey', color: 'text-blue-700' },
    { key: 'CLOSING', label: 'Closing', color: 'text-violet-700' },
    { key: 'BOOKING', label: 'Booking Fee', color: 'text-amber-700' },
    { key: 'SLIK', label: 'Proses SLIK', color: 'text-orange-700' },
    { key: 'PEMBERKASAN', label: 'Pemberkasan', color: 'text-cyan-700' },
    { key: 'SP3K', label: 'SP3K', color: 'text-teal-700' },
    { key: 'AKAD', label: 'Akad', color: 'text-emerald-700' },
    { key: 'SERAH_TERIMA', label: 'Serah Terima', color: 'text-green-700' },
    { key: 'LOST', label: 'Lost', color: 'text-red-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Pipeline Konsumen</h2>
        <p className="text-sm text-muted-foreground">
          Tracking konsumen dari DM pertama sampai serah terima kunci
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {stages.map(stage => (
          <Card key={stage.key} className="p-3 text-center hover:shadow-md transition-shadow">
            <div className={cn('text-2xl font-bold mb-1', stage.color)}>
              {stats.customers.byStage[stage.key] || 0}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium leading-tight">
              {stage.label}
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold text-foreground mb-3">Konversasi Terbaru</h3>
        {stats.conversations.recent.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-muted-foreground">
              Belum ada konversasi. Aktifkan WhatsApp bridge untuk mulai menerima DM.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {stats.conversations.recent.map(conv => (
              <Card key={conv.id} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                      {conv.agent.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate">
                        {conv.customer.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '-'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.messages[0]?.content || 'Belum ada pesan'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {conv.agent.name}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-foreground mb-3">Jadwal Survey Mendatang</h3>
        {stats.surveys.upcoming.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada jadwal survey</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.surveys.upcoming.map(survey => (
              <Card key={survey.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {survey.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(survey.scheduledAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {survey.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SITE PLAN VIEW
// ============================================================
function SitePlanView({ stats }: { stats: StatsData }) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [units, setUnits] = useState<Array<{
    id: string
    blockNumber: string
    unitType: string
    landSize: number
    status: string
    price: number
    dpAmount: number
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnits()
  }, [])

  async function fetchUnits() {
    try {
      const res = await fetch('/api/units')
      const data = await res.json()
      if (data.success) setUnits(data.data)
    } catch (err) {
      console.error('Failed to fetch units:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    AVAILABLE: { label: 'Tersedia', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
    BOOKED: { label: 'Booked', color: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
    SOLD: { label: 'Terjual', color: 'bg-accent/50 text-muted-foreground border-border', dot: 'bg-slate-400' },
    RESERVED: { label: 'Reserved', color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
  }

  const filteredUnits = filterStatus === 'ALL'
    ? units
    : units.filter(u => u.status === filterStatus)

  const grouped: Record<string, typeof units> = {}
  for (const unit of filteredUnits) {
    const prefix = unit.blockNumber.charAt(0)
    if (!grouped[prefix]) grouped[prefix] = []
    grouped[prefix].push(unit)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Site Plan</h2>
          <p className="text-sm text-muted-foreground">
            {stats.projects[0]?.name} · {stats.projects[0]?.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-card text-muted-foreground border-border hover:bg-accent/30'
            )}
          >
            Semua ({units.length})
          </button>
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const count = units.filter(u => u.status === key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5',
                  filterStatus === key ? cfg.color : 'bg-card text-muted-foreground border-border hover:bg-accent/30'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                {cfg.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-background to-background border-dashed">
        <div className="text-center py-8">
          <Map className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-foreground/80 mb-1">
            Site Plan Image Belum Diupload
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
            Upload gambar site plan (jpg/png/pdf) di tab Pengaturan. AI Marketing akan otomatis
            mengenali unit yang tersedia saat konsumen bertanya.
          </p>
          <Button variant="outline" size="sm">
            Upload Site Plan
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort().map(([prefix, blockUnits]) => (
            <div key={prefix}>
              <h3 className="text-sm font-bold text-foreground/80 mb-2">Blok {prefix}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {blockUnits.sort((a, b) => a.blockNumber.localeCompare(b.blockNumber)).map(unit => {
                  const cfg = statusConfig[unit.status] || statusConfig.AVAILABLE
                  return (
                    <div
                      key={unit.id}
                      className={cn(
                        'aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all hover:scale-105 cursor-pointer',
                        cfg.color
                      )}
                      title={`Unit ${unit.blockNumber} · ${cfg.label} · Luas ${unit.landSize}m² · Rp ${(unit.price / 1000000).toFixed(0)}jt`}
                    >
                      <span className="text-xs font-bold">{unit.blockNumber}</span>
                      <span className="text-[9px] opacity-80">{unit.landSize}m²</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Unit</div>
          <div className="text-2xl font-bold text-foreground">{units.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Tersedia</div>
          <div className="text-2xl font-bold text-emerald-600">
            {units.filter(u => u.status === 'AVAILABLE').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Booked</div>
          <div className="text-2xl font-bold text-amber-600">
            {units.filter(u => u.status === 'BOOKED').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Terjual</div>
          <div className="text-2xl font-bold text-muted-foreground">
            {units.filter(u => u.status === 'SOLD').length}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// KNOWLEDGE BASE VIEW
// ============================================================
function KnowledgeView({ stats }: { stats: StatsData }) {
  const [items, setItems] = useState<Array<{
    id: string
    category: string
    question: string | null
    answer: string | null
    content: string | null
    tags: string | null
  }>>([])
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKnowledge()
  }, [])

  async function fetchKnowledge() {
    try {
      const res = await fetch('/api/knowledge')
      const data = await res.json()
      if (data.success) setItems(data.data)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['ALL', 'FAQ', 'OBJECTION', 'PRODUCT_INFO', 'SELLING_POINT', 'COMPANY_POLICY', 'BANK_REQUIREMENT']
  const categoryLabels: Record<string, string> = {
    ALL: 'Semua',
    FAQ: 'FAQ',
    OBJECTION: 'Objection Handling',
    PRODUCT_INFO: 'Info Produk',
    SELLING_POINT: 'Selling Point',
    COMPANY_POLICY: 'Kebijakan',
    BANK_REQUIREMENT: 'Syarat Bank',
  }

  const filtered = activeCategory === 'ALL'
    ? items
    : items.filter(i => i.category === activeCategory)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground">
          &quot;Otak&quot; bersama yang diakses semua AI agent. {items.length} item pengetahuan.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {stats.knowledgeBase.byCategory.map(cat => (
          <Card key={cat.category} className="p-3 text-center">
            <div className="text-xl font-bold text-foreground">{cat._count}</div>
            <div className="text-[10px] text-muted-foreground">{categoryLabels[cat.category] || cat.category}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-card text-muted-foreground border-border hover:bg-accent/30'
            )}
          >
            {categoryLabels[cat]}
            <span className="ml-1.5 opacity-70">
              ({cat === 'ALL' ? items.length : items.filter(i => i.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada item di kategori ini</p>
            </Card>
          ) : (
            filtered.map(item => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                {item.question ? (
                  <>
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                      <p className="text-sm font-semibold text-foreground">
                        Q: {item.question}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-1">
                      A: {item.answer}
                    </p>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="text-[10px] mb-2">
                      {categoryLabels[item.category] || item.category}
                    </Badge>
                    <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {item.content}
                    </div>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================================
// SETTINGS VIEW
// ============================================================
function SettingsView({ stats, onRefresh }: { stats: StatsData; onRefresh: () => Promise<void> }) {
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateAgent(agentId: string, updates: Record<string, unknown>) {
    setUpdating(agentId)
    try {
      const res = await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, ...updates }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Konfigurasi agent berhasil diupdate')
        await onRefresh()
      } else {
        toast.error('Gagal update agent')
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal update agent')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Pengaturan</h2>
        <p className="text-sm text-muted-foreground">
          Kelola konfigurasi AI agent, model LLM, dan koneksi WhatsApp
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Status Integrasi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <IntegrationStatus
            label="WhatsApp Bridge"
            status="DISCONNECTED"
            description="Setup nomor WA per agent"
          />
          <IntegrationStatus
            label="OpenRouter (Multi-LLM)"
            status="NOT_CONFIGURED"
            description="Set OPENROUTER_API_KEY untuk GLM/Grok/Perplexity"
          />
          <IntegrationStatus
            label="Supabase (Database)"
            status="LOCAL_ONLY"
            description="Sedang pakai SQLite. Deploy ke Supabase untuk production."
          />
          <IntegrationStatus
            label="Vercel (Hosting)"
            status="NOT_DEPLOYED"
            description="Deploy ke Vercel untuk akses dari mana saja"
          />
          <IntegrationStatus
            label="Instagram API"
            status="NOT_CONNECTED"
            description="Connect untuk auto-post & DM"
          />
          <IntegrationStatus
            label="Facebook API"
            status="NOT_CONNECTED"
            description="Connect untuk auto-post & DM"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-bold text-foreground mb-4">
          Konfigurasi Agent ({stats.agents.all.length})
        </h3>
        <div className="space-y-3">
          {stats.agents.all.map(agent => (
            <div
              key={agent.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {agent.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    {agent.name}
                    <span className="ml-2 text-xs text-muted-foreground">{agent.role}</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {agent.llmModel} · {agent.llmProvider} · WA: {agent.whatsappNumber || 'belum set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={agent.llmModel}
                  onChange={(e) => updateAgent(agent.id, { llmModel: e.target.value })}
                  disabled={updating === agent.id}
                  className="text-xs px-2 py-1 rounded border border-border bg-card"
                >
                  <option value="glm-4.6">GLM-4.6 (Free)</option>
                  <option value="glm-4.5">GLM-4.5</option>
                  <option value="grok-2">Grok-2</option>
                  <option value="perplexity-sonar">Perplexity Sonar</option>
                  <option value="claude-sonnet-4">Claude Sonnet 4</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
                <Button
                  variant={agent.isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAgent(agent.id, { isActive: !agent.isActive })}
                  disabled={updating === agent.id}
                  className="text-xs h-8"
                >
                  {agent.isActive ? 'Aktif' : 'Nonaktif'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Progress Implementasi</h3>
        <div className="space-y-3">
          <PhaseProgress phase="Phase 0-1" label="Foundation: Schema, Agent Framework, Memory, LLM Router" status="DONE" />
          <PhaseProgress phase="Phase 2" label="Marketing AI #1 (Ayu) - WhatsApp live" status="PENDING_INPUT" inputNeeded="Nomor WA + API keys" />
          <PhaseProgress phase="Phase 3" label="Dashboard basic" status="DONE" />
          <PhaseProgress phase="Phase 4" label="10 Marketing AI + WA Community" status="PENDING" />
          <PhaseProgress phase="Phase 5" label="Sosmed API (IG/FB/TikTok)" status="PENDING" />
          <PhaseProgress phase="Phase 6" label="RINA (Finance AI)" status="PENDING_INPUT" inputNeeded="RAB Excel + template PO + supplier list" />
          <PhaseProgress phase="Phase 7" label="Material AI" status="PENDING" />
          <PhaseProgress phase="Phase 8" label="Document AI" status="PENDING_INPUT" inputNeeded="Template bank + sample berkas" />
          <PhaseProgress phase="Phase 9" label="RATNA (CAO)" status="PENDING" />
        </div>
      </Card>
    </div>
  )
}

function IntegrationStatus({
  label, status, description,
}: {
  label: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'LOCAL_ONLY' | 'NOT_DEPLOYED' | 'NOT_CONNECTED'
  description: string
}) {
  const cfg: Record<string, { color: string; dot: string; label: string }> = {
    CONNECTED: { color: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Terhubung' },
    DISCONNECTED: { color: 'text-amber-600', dot: 'bg-amber-500', label: 'Terputus' },
    NOT_CONFIGURED: { color: 'text-muted-foreground', dot: 'bg-slate-400', label: 'Belum dikonfigurasi' },
    LOCAL_ONLY: { color: 'text-blue-600', dot: 'bg-blue-500', label: 'Lokal saja' },
    NOT_DEPLOYED: { color: 'text-muted-foreground', dot: 'bg-slate-400', label: 'Belum deploy' },
    NOT_CONNECTED: { color: 'text-muted-foreground', dot: 'bg-slate-400', label: 'Belum connect' },
  }
  const c = cfg[status]
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('w-2 h-2 rounded-full', c.dot)} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <p className={cn('text-xs font-medium mb-1', c.color)}>{c.label}</p>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  )
}

function PhaseProgress({
  phase, label, status, inputNeeded,
}: {
  phase: string
  label: string
  status: 'DONE' | 'PENDING' | 'PENDING_INPUT' | 'IN_PROGRESS'
  inputNeeded?: string
}) {
  const cfg: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    DONE: { color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Selesai' },
    IN_PROGRESS: { color: 'text-blue-600', icon: <Clock className="w-4 h-4 animate-pulse" />, label: 'Sedang dikerjakan' },
    PENDING: { color: 'text-muted-foreground/70', icon: <Clock className="w-4 h-4" />, label: 'Menunggu' },
    PENDING_INPUT: { color: 'text-amber-600', icon: <AlertCircle className="w-4 h-4" />, label: 'Butuh input' },
  }
  const c = cfg[status]
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
      <span className={c.color}>{c.icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{phase}</span>
          <span className="text-sm text-foreground">{label}</span>
        </div>
        {inputNeeded && (
          <p className="text-xs text-amber-600 mt-0.5">Butuh: {inputNeeded}</p>
        )}
      </div>
      <Badge variant="outline" className={cn('text-[10px]', c.color)}>
        {c.label}
      </Badge>
    </div>
  )
}

// ============================================================
// SKELETON
// ============================================================
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-accent/30">
      <div className="h-[72px] bg-card border-b border-border" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-32 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
