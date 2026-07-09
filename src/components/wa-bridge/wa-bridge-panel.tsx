'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare, QrCode, RefreshCw, Phone, CheckCircle2,
  AlertCircle, Loader2, Send, Wifi, WifiOff,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Agent {
  id: string
  name: string
  role: string
  whatsappNumber: string | null
}

interface WAStatus {
  state: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'WAITING_QR'
  agentId: string | null
  phoneNumber: string | null
  lastError: string | null
}

export function WABridgePanel({ agents }: { agents: Agent[] }) {
  const [status, setStatus] = useState<WAStatus | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sending, setSending] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Default to RINA
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      const rina = agents.find(a => a.name === 'RINA')
      setSelectedAgentId(rina?.id || agents[0].id)
    }
  }, [agents, selectedAgentId])

  // Poll status
  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Fetch QR when waiting
  useEffect(() => {
    if (status?.state === 'WAITING_QR') {
      fetchQR()
    } else {
      setQrCode(null)
    }
  }, [status?.state])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/wa/status')
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
      } else {
        setStatus({ state: 'DISCONNECTED', agentId: null, phoneNumber: null, lastError: data.error })
      }
    } catch {
      setStatus({ state: 'DISCONNECTED', agentId: null, phoneNumber: null, lastError: 'Bridge not running' })
    }
  }

  async function fetchQR() {
    try {
      const res = await fetch('/api/wa/qr')
      const data = await res.json()
      if (data.success && data.data?.qr) {
        setQrCode(data.data.qr)
      }
    } catch {
      // ignore
    }
  }

  async function connectWA() {
    if (!selectedAgentId) return
    setLoading(true)
    try {
      const res = await fetch('/api/wa/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Connecting to WhatsApp...')
        setTimeout(fetchStatus, 1000)
      } else {
        toast.error(data.error || 'Failed to connect')
      }
    } catch {
      toast.error('WA Bridge not running')
    } finally {
      setLoading(false)
    }
  }

  async function disconnectWA() {
    setLoading(true)
    try {
      await fetch('http://localhost:3001/disconnect', { method: 'POST' })
      toast.success('Disconnected')
      setTimeout(fetchStatus, 1000)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  async function sendTestMessage() {
    if (!testNumber || !testMessage) return
    setSending(true)
    try {
      const res = await fetch('/api/wa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testNumber, message: testMessage }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Message sent!')
        setTestMessage('')
      } else {
        toast.error(data.error || 'Failed to send')
      }
    } catch {
      toast.error('WA Bridge not running')
    } finally {
      setSending(false)
    }
  }

  const stateConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DISCONNECTED: { label: 'Disconnected', color: 'text-slate-400', icon: <WifiOff className="w-4 h-4" /> },
    CONNECTING: { label: 'Connecting...', color: 'text-amber-400', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    WAITING_QR: { label: 'Waiting QR Scan', color: 'text-blue-400', icon: <QrCode className="w-4 h-4" /> },
    CONNECTED: { label: 'Connected', color: 'text-emerald-400', icon: <Wifi className="w-4 h-4" /> },
  }

  const stateInfo = status ? stateConfig[status.state] : stateConfig.DISCONNECTED

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">WhatsApp Bridge</h2>
        <p className="text-sm text-muted-foreground">
          Hubungkan AI agent ke WhatsApp. 1 nomor WA = 1 agent. Scan QR sekali, aktif selamanya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection Panel */}
        <Card className="p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Connection Status</h3>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-accent/20 rounded-lg">
            <span className={stateInfo.color}>{stateInfo.icon}</span>
            <span className={cn('text-sm font-semibold', stateInfo.color)}>{stateInfo.label}</span>
            {status?.agentId && (
              <Badge variant="outline" className="text-[9px] ml-auto">
                Agent: {agents.find(a => a.id === status.agentId)?.name || 'Unknown'}
              </Badge>
            )}
          </div>

          {/* Error message */}
          {status?.lastError && status.state === 'DISCONNECTED' && (
            <div className="mb-4 p-3 bg-rose-950/30 border border-rose-700/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300">{status.lastError}</p>
            </div>
          )}

          {/* Agent selector */}
          <div className="mb-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
              Pilih Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              disabled={status?.state === 'CONNECTED' || loading}
              className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {status?.state !== 'CONNECTED' ? (
              <Button
                onClick={connectWA}
                disabled={loading || !selectedAgentId}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wifi className="w-4 h-4 mr-1" />}
                Connect WA
              </Button>
            ) : (
              <Button
                onClick={disconnectWA}
                disabled={loading}
                variant="outline"
                className="flex-1 text-rose-400 hover:bg-rose-950/30 border-rose-700/30"
              >
                <WifiOff className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              className="px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* QR Code */}
          {status?.state === 'WAITING_QR' && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Scan QR ini pakai WhatsApp di HP kamu:
              </p>
              {qrCode ? (
                <div className="inline-block p-3 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-48 h-48 bg-accent/20 rounded-lg">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Cara scan: WhatsApp → Settings → Linked Devices → Link a Device → Scan QR
              </p>
            </div>
          )}

          {/* Connected info */}
          {status?.state === 'CONNECTED' && (
            <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">WhatsApp Connected!</p>
                <p className="text-xs text-muted-foreground">
                  {agents.find(a => a.id === status.agentId)?.name} sekarang aktif di WA.
                  Chat ke nomor AI ini akan auto-reply.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Test Send Panel */}
        <Card className="p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Test Send Message</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Nomor Tujuan
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={testNumber}
                  onChange={e => setTestNumber(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-background/50 border border-border rounded-md pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Pesan
              </label>
              <textarea
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                placeholder="Halo, ini test pesan dari sistem..."
                rows={3}
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            <Button
              onClick={sendTestMessage}
              disabled={sending || !testNumber || !testMessage || status?.state !== 'CONNECTED'}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Send Test Message
            </Button>

            {status?.state !== 'CONNECTED' && (
              <p className="text-[10px] text-amber-400 text-center">
                ⚠️ Connect WA dulu sebelum kirim pesan
              </p>
            )}
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-950/20 border border-blue-700/30 rounded-lg">
            <p className="text-[10px] text-blue-300">
              💡 <strong>Cara kerja:</strong>
              <br />
              1. Connect WA (scan QR pakai HP)
              <br />
              2. Nomor AI sekarang aktif menerima & membalas chat
              <br />
              3. Owner chat ke nomor AI → AI auto-reply
              <br />
              4. Owner bisa juga kirim pesan keluar via form ini
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
