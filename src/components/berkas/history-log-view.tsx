'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, Plus, RefreshCw, ChevronDown, ChevronRight, Clock, User, FileText, Banknote, MessageSquare, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface HistoryLog {
  id: string
  customerId: string
  eventType: string
  title: string
  description: string
  oldValue?: string | null
  newValue?: string | null
  metadata?: string | null
  createdBy?: string | null
  source: string
  createdAt: string
}

const EVENT_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string; dotColor: string }> = {
  FIELD_UPDATE: { icon: User, color: 'text-blue-400', label: 'Field Update', dotColor: 'bg-blue-500' },
  STAGE_CHANGE: { icon: ChevronRight, color: 'text-purple-400', label: 'Stage Change', dotColor: 'bg-purple-500' },
  DOC_UPLOADED: { icon: FileText, color: 'text-green-400', label: 'Doc Uploaded', dotColor: 'bg-green-500' },
  DOC_GENERATED: { icon: FileText, color: 'text-cyan-400', label: 'Doc Generated', dotColor: 'bg-cyan-500' },
  BANK_CHANGE: { icon: Banknote, color: 'text-yellow-400', label: 'Bank Change', dotColor: 'bg-yellow-500' },
  NOTE_ADDED: { icon: MessageSquare, color: 'text-gray-400', label: 'Note Added', dotColor: 'bg-gray-500' },
  STATUS_CHANGE: { icon: AlertCircle, color: 'text-orange-400', label: 'Status Change', dotColor: 'bg-orange-500' },
  INTERACTION: { icon: MessageSquare, color: 'text-indigo-400', label: 'Interaction', dotColor: 'bg-indigo-500' },
}

export function HistoryLogView({ customerId }: { customerId: string }) {
  const [logs, setLogs] = useState<HistoryLog[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [eventType, setEventType] = useState('NOTE_ADDED')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customer-history?customerId=${customerId}`)
      const data = await res.json()
      if (data.success) setLogs(data.data)
      else toast.error(data.error || 'Gagal memuat history')
    } catch (err) {
      console.error('Load history error:', err)
      toast.error('Gagal memuat history')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { loadLogs() }, [loadLogs])

  async function handleAdd() {
    if (!title.trim() || !description.trim()) {
      toast.error('Title dan description wajib diisi')
      return
    }
    try {
      const res = await fetch('/api/customer-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          eventType,
          title: title.trim(),
          description: description.trim(),
          source: 'MANUAL',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('History log ditambahkan')
        setShowAdd(false)
        setTitle('')
        setDescription('')
        setEventType('NOTE_ADDED')
        loadLogs()
      } else {
        toast.error(data.error || 'Gagal menambah history')
      }
    } catch (err) {
      toast.error('Gagal menambah history')
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">History Log</h3>
          <Badge variant="outline" className="text-xs">{logs.length} events</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" className="h-7" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Belum ada history log
          </div>
        ) : (
          <div className="relative pl-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

            {logs.map((log) => {
              const config = EVENT_TYPE_CONFIG[log.eventType] || EVENT_TYPE_CONFIG.INTERACTION
              const Icon = config.icon
              const isExpanded = expandedId === log.id
              return (
                <div key={log.id} className="relative mb-3">
                  <div className={cn(
                    'absolute -left-[13px] top-2 w-3 h-3 rounded-full border-2 border-background',
                    config.dotColor
                  )} />

                  <Card
                    className="p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{log.title}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{config.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                          {log.source && log.source !== 'MANUAL' && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">{log.source}</Badge>
                          )}
                        </div>

                        {isExpanded && (log.oldValue || log.newValue || log.metadata) && (
                          <div className="mt-2 space-y-1 text-xs border-t border-border pt-2">
                            {log.oldValue && (
                              <div><span className="text-muted-foreground">Old:</span> <span className="font-mono">{log.oldValue}</span></div>
                            )}
                            {log.newValue && (
                              <div><span className="text-muted-foreground">New:</span> <span className="font-mono">{log.newValue}</span></div>
                            )}
                            {log.metadata && (
                              <div className="text-muted-foreground font-mono text-[10px] break-all">{log.metadata}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah History Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title (singkat)</label>
              <Input
                placeholder="contoh: Gaji naik ke 5jt"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description (detail)</label>
              <Textarea
                placeholder="contoh: Diubah dari 4.5jt ke 5jt pada Mar 2026 setelah konfirmasi HR"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button onClick={handleAdd}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
