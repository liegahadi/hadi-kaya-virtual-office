'use client'

import { useState, useEffect } from 'react'
import {
  X, AlertCircle, CheckCircle2, Clock, FileText,
  MessageSquare, PenTool, History, Zap,
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
export interface Approval {
  id: string
  type: string
  status: string
  payload: string
  notes: string | null
  signatureUrl: string | null
  respondedAt: string | null
  createdAt: string
  agent: {
    id: string
    name: string
    role: string
  }
}

// ============================================================
// APPROVAL MODAL
// ============================================================
export function ApprovalModal({
  approval,
  onClose,
  onResolved,
}: {
  approval: Approval
  onClose: () => void
  onResolved: () => void
}) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Approval[]>([])

  // Parse payload
  let payload: {
    agentName?: string
    agentRole?: string
    response?: string
    conversationId?: string
    timestamp?: string
  } = {}
  try {
    payload = JSON.parse(approval.payload)
  } catch {
    payload = { response: approval.payload }
  }

  // Fetch history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/approvals?status=ALL&limit=10')
        const data = await res.json()
        if (data.success) {
          // Filter out current approval
          setHistory(data.data.filter((a: Approval) => a.id !== approval.id))
        }
      } catch (err) {
        console.error('Failed to fetch history:', err)
      }
    }
    fetchHistory()
  }, [approval.id])

  async function resolveApproval(status: 'APPROVED' | 'REJECTED') {
    setLoading(true)
    try {
      const res = await fetch(`/api/approvals/${approval.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: notes || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(
          status === 'APPROVED'
            ? `✅ Approval di-ACC: ${approval.agent.name}`
            : `❌ Approval ditolak: ${approval.agent.name}`
        )
        onResolved()
        onClose()
      } else {
        toast.error('Gagal update approval')
      }
    } catch (err) {
      console.error('Failed to resolve:', err)
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    FINANCE: 'Finance AI',
    MATERIAL: 'Material AI',
    DOCUMENT: 'Document AI',
    MARKETING: 'Marketing AI',
    CAO: 'Chief AI Officer',
  }

  const typeLabels: Record<string, string> = {
    PO: 'Purchase Order',
    FUND_REQUEST: 'Pengajuan Dana',
    PAYMENT: 'Pembayaran',
    DOCUMENT_SIGN: 'Tanda Tangan Dokumen',
    POST_PUBLISH: 'Publish Sosmed',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-950 to-rose-950 p-4 flex items-start gap-3 text-white border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">Approval Required</h3>
              <Badge variant="outline" className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/40">
                {typeLabels[approval.type] || approval.type}
              </Badge>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {approval.agent.name} ({roleLabels[approval.agent.role] || approval.agent.role}) meminta ACC
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 flex-shrink-0"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto dark-scrollbar p-4 space-y-4">
          {/* Agent Response */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Response dari Agent
            </h4>
            <div className="p-3 bg-accent/30 border border-border rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {payload.response || '(tidak ada response)'}
              </p>
              {payload.timestamp && (
                <p className="text-[9px] text-muted-foreground font-mono mt-2">
                  {new Date(payload.timestamp).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>

          {/* Approval Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-accent/20 border border-border rounded-lg">
              <div className="text-[9px] text-muted-foreground uppercase">Agent</div>
              <div className="text-sm font-semibold text-foreground mt-1">{approval.agent.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {roleLabels[approval.agent.role] || approval.agent.role}
              </div>
            </div>
            <div className="p-3 bg-accent/20 border border-border rounded-lg">
              <div className="text-[9px] text-muted-foreground uppercase">Diajukan</div>
              <div className="text-sm font-semibold text-foreground mt-1">
                {new Date(approval.createdAt).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {timeAgo(approval.createdAt)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <PenTool className="w-3 h-3" />
              Catatan (Optional)
            </h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk approval ini..."
              rows={2}
              className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <History className="w-3 h-3" />
                Riwayat Approval Terbaru
              </h4>
              <div className="space-y-1.5">
                {history.slice(0, 5).map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 bg-accent/20 rounded text-xs">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      h.status === 'APPROVED' ? 'bg-emerald-500' :
                      h.status === 'REJECTED' ? 'bg-rose-500' :
                      'bg-amber-500'
                    )} />
                    <span className="font-medium text-foreground">{h.agent.name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{typeLabels[h.type] || h.type}</span>
                    <span className="text-muted-foreground ml-auto text-[10px]">
                      {timeAgo(h.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-4 bg-slate-950/50 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => resolveApproval('REJECTED')}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            Tolak
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => resolveApproval('APPROVED')}
            disabled={loading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            ACC (Approve)
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// APPROVAL NOTIFICATION BELL (for header)
// ============================================================
export function ApprovalBell({
  pendingCount,
  onClick,
}: {
  pendingCount: number
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
      title={`${pendingCount} approval menunggu`}
    >
      <AlertCircle className="w-5 h-5" />
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </Button>
  )
}

// ============================================================
// APPROVAL LIST PANEL (for header dropdown)
// ============================================================
export function ApprovalListPanel({
  approvals,
  onApproveClick,
  onRefresh,
}: {
  approvals: Approval[]
  onApproveClick: (approval: Approval) => void
  onRefresh: () => void
}) {
  return (
    <Card className="absolute right-0 top-12 z-50 w-80 p-2 max-h-96 overflow-y-auto dark-scrollbar shadow-2xl border-border">
      <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-border">
        <h3 className="text-xs font-bold text-foreground">Approval Pending</h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-6 text-[10px]">
          Refresh
        </Button>
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
          <p className="text-xs text-muted-foreground">Tidak ada approval pending</p>
        </div>
      ) : (
        <div className="space-y-1">
          {approvals.map(a => (
            <button
              key={a.id}
              onClick={() => onApproveClick(a)}
              className="w-full text-left p-2 rounded hover:bg-accent/40 transition-colors border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[8px] h-3 px-1">
                  {a.type}
                </Badge>
                <span className="text-xs font-semibold text-foreground">{a.agent.name}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">
                  {timeAgo(a.createdAt)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {(() => {
                  try {
                    const p = JSON.parse(a.payload)
                    return p.response?.substring(0, 80) + '...'
                  } catch {
                    return a.payload.substring(0, 80) + '...'
                  }
                })()}
              </p>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

// ============================================================
// HELPERS
// ============================================================
function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return `${diff}d lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`
  return `${Math.floor(diff / 86400)}h lalu`
}
