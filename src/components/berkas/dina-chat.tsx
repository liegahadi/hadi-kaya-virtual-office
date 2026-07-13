'use client'

// ============================================================
// DINA CHAT — WhatsApp-style chat interface
// Fitur:
// 1. Upload foto/PDF (paperclip button + drag-and-drop)
// 2. Reply message (swipe atau click reply icon)
// 3. Upload history panel (collapsible)
// 4. File preview di message bubble (thumbnail image / PDF icon)
// 5. Emoji reactions (future)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Paperclip, X, Image as ImageIcon, FileText, Loader2,
  Reply, ChevronDown, ChevronUp, History, Trash2, Download,
  Smile,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DinaMessage {
  id?: string
  role: 'user' | 'agent'
  content: string
  ts: number
  contentType?: 'TEXT' | 'IMAGE' | 'PDF' | 'FILE'
  attachments?: Array<{
    type: 'IMAGE' | 'PDF'
    fileName: string
    dataUrl: string
    fileSize: number
    mimeType: string
    driveLink?: string
    driveFileName?: string
  }>
  replyTo?: {
    id: string
    content: string
    role: 'user' | 'agent'
  }
}

interface UploadHistoryItem {
  id: string
  docId: string
  fileName: string
  docType: string
  fileSize: number
  createdAt: string
  customerId: string | null
}

interface DinaChatProps {
  customer: any
  onDbUpdate?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export function DinaChat({ customer, onDbUpdate }: DinaChatProps) {
  const [messages, setMessages] = useState<DinaMessage[]>([
    {
      role: 'agent',
      content: 'Halo! Saya DINA, Document AI Assistant untuk PT. Marlindo Bangun Persada. Saya bisa bantu soal berkas KPR, proses bank, dokumen yang dibutuhkan, status konsumen, dan update data langsung dari database.\n\nKamu bisa upload KTP/KK/berkas lain langsung ke chat ini (drag & drop atau klik paperclip). 😊',
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<DinaMessage['attachments']>([])
  const [replyTo, setReplyTo] = useState<DinaMessage | null>(null)
  const [showUploadHistory, setShowUploadHistory] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, pendingAttachments])

  // Load chat history
  useEffect(() => {
    const url = customer?.id ? `/api/dina/history?customerId=${customer.id}` : '/api/dina/history'
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.messages && d.messages.length > 0) {
          // Parse messages dari DB (format lama → format baru)
          const parsed: DinaMessage[] = d.messages.map((m: any) => {
            let attachments: DinaMessage['attachments'] = undefined
            let replyTo: DinaMessage['replyTo'] = undefined
            let contentType: DinaMessage['contentType'] = 'TEXT'

            if (m.metadata) {
              try {
                const meta = JSON.parse(m.metadata)
                if (meta.attachments) attachments = meta.attachments
                if (meta.replyTo) replyTo = meta.replyTo
                if (meta.contentType) contentType = meta.contentType
              } catch {}
            }
            if (m.contentType && m.contentType !== 'TEXT') contentType = m.contentType

            return {
              id: m.id,
              role: m.role === 'user' || m.role === 'OWNER' ? 'user' : 'agent',
              content: m.content,
              ts: new Date(m.createdAt).getTime(),
              contentType,
              attachments,
              replyTo,
            }
          })
          setMessages(parsed)
        }
        setHistoryLoaded(true)
      })
      .catch(() => setHistoryLoaded(true))
  }, [customer?.id])

  // Load upload history
  const loadUploadHistory = useCallback(async () => {
    if (!customer?.id) return
    try {
      const res = await fetch(`/api/dina/uploads?customerId=${customer.id}`)
      const d = await res.json()
      if (d.success) setUploadHistory(d.data)
    } catch (err) {
      console.error('Load upload history error:', err)
    }
  }, [customer?.id])

  useEffect(() => {
    if (showUploadHistory) loadUploadHistory()
  }, [showUploadHistory, loadUploadHistory])

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files)
    for (const file of fileArr) {
      if (!ALLOWED_MIME.includes(file.type)) {
        toast.error(`${file.name}: tipe tidak diizinkan (hanya image/PDF)`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: terlalu besar (max 5MB)`)
        continue
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const attachment = {
          type: file.type.startsWith('image/') ? 'IMAGE' as const : 'PDF' as const,
          fileName: file.name,
          dataUrl,
          fileSize: file.size,
          mimeType: file.type,
        }
        setPendingAttachments(prev => [...(prev || []), attachment])

        // Upload ke Google Drive (jika ada customer context)
        if (customer?.id) {
          toast.loading(`Mengupload ${file.name} ke Google Drive...`, { id: `upload-${file.name}` })
          try {
            const uploadRes = await fetch('/api/dina/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dataUrl,
                fileName: file.name,
                customerId: customer.id,
                customerName: customer.name,
                customerBlock: (customer.blockLetter || '') + (customer.houseNumber || ''),
              }),
            })
            const uploadData = await uploadRes.json()
            if (uploadData.success && uploadData.data?.driveUploaded) {
              toast.success(`${file.name} → ${uploadData.data.driveFileName} (Drive)`, { id: `upload-${file.name}` })
              // Update attachment dengan Drive info
              setPendingAttachments(prev => (prev || []).map(a =>
                a.fileName === file.name
                  ? { ...a, driveLink: uploadData.data.driveLink, driveFileName: uploadData.data.driveFileName }
                  : a
              ))
            } else {
              toast.success(`${file.name} siap dikirim (chat only)`, { id: `upload-${file.name}` })
            }
          } catch (err) {
            toast.error(`Gagal upload ${file.name} ke Drive`, { id: `upload-${file.name}` })
          }
        } else {
          toast.success(`${file.name} siap dikirim (tidak ada konsumen aktif)`)
        }
      }
      reader.onerror = () => toast.error(`Gagal baca ${file.name}`)
      reader.readAsDataURL(file)
    }
  }, [])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  // Send message
  async function send() {
    if ((!input.trim() && (!pendingAttachments || pendingAttachments.length === 0)) || loading) return

    const msg = input.trim()
    const attachments = pendingAttachments || []
    const reply = replyTo

    const userMsg: DinaMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg || (attachments.length > 0 ? '(file upload)' : ''),
      ts: Date.now(),
      contentType: attachments.length > 0 ? attachments[0].type : 'TEXT',
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: reply ? {
        id: reply.id || `msg-${reply.ts}`,
        content: reply.content.substring(0, 100),
        role: reply.role,
      } : undefined,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setPendingAttachments([])
    setReplyTo(null)
    setLoading(true)

    try {
      const res = await fetch('/api/dina/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg || `(Upload ${attachments.length} file: ${attachments.map(a => a.fileName).join(', ')})`,
          customerId: customer?.id,
          attachments: attachments.map(a => ({
            type: a.type,
            fileName: a.fileName,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          })),
          replyTo: reply ? {
            content: reply.content.substring(0, 200),
            role: reply.role,
          } : undefined,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setMessages(prev => [...prev, {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: d.response,
          ts: Date.now(),
        }])
        if (d.dbUpdated && onDbUpdate) {
          onDbUpdate()
          toast.success('🔄 Data diperbarui oleh DINA')
        }
        // Refresh upload history kalau ada attachment
        if (attachments.length > 0 && customer?.id) {
          setTimeout(loadUploadHistory, 1000)
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'agent',
          content: 'Maaf, saya lagi ada gangguan teknis. Coba lagi ya. 😅',
          ts: Date.now(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Koneksi bermasalah. Coba lagi ya. 😅',
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function removeAttachment(idx: number) {
    setPendingAttachments(prev => (prev || []).filter((_, i) => i !== idx))
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div
      className="w-96 shrink-0 flex flex-col rounded-lg overflow-hidden border border-violet-700/40 shadow-2xl relative"
      style={{ background: 'linear-gradient(180deg, #1e1b2e 0%, #14121f 100%)', maxHeight: 'calc(100vh - 100px)' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-violet-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Paperclip className="w-12 h-12 mx-auto text-violet-300 mb-2" />
            <p className="text-violet-100 font-semibold">Drop file di sini</p>
            <p className="text-violet-300/70 text-xs mt-1">Image atau PDF, max 5MB</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-violet-900/40 flex items-center gap-2 bg-violet-950/60">
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">DI</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-violet-100">DINA</div>
          <div className="text-[10px] text-violet-300/70 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Gemini 2.0 Flash · online
          </div>
        </div>
        <button
          onClick={() => setShowUploadHistory(!showUploadHistory)}
          className={cn(
            'p-1.5 rounded hover:bg-violet-800/50 transition-colors',
            showUploadHistory && 'bg-violet-800/70'
          )}
          title="Upload History"
        >
          <History className="w-4 h-4 text-violet-300" />
        </button>
      </div>

      {/* Customer context */}
      {customer && (
        <div className="px-3 py-1.5 bg-violet-900/30 border-b border-violet-900/40">
          <div className="text-[9px] text-violet-300/70 uppercase tracking-wider">Konteks Aktif</div>
          <div className="text-[11px] font-semibold text-violet-100 truncate">
            {customer.name} · Blok {customer.units?.[0]?.blockNumber || (customer.blockLetter || '') + (customer.houseNumber || '') || '—'}
          </div>
        </div>
      )}

      {/* Upload History Panel (collapsible) */}
      {showUploadHistory && (
        <div className="border-b border-violet-900/40 bg-slate-950/60 max-h-48 overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur">
            <span className="text-[10px] font-semibold text-violet-300 uppercase">Upload History</span>
            <span className="text-[9px] text-slate-500">{uploadHistory.length} files</span>
          </div>
          {uploadHistory.length === 0 ? (
            <p className="text-[10px] text-slate-500 px-3 py-3 text-center">Belum ada upload</p>
          ) : (
            <div className="space-y-1 pb-2">
              {uploadHistory.map(item => (
                <div key={item.id} className="px-3 py-1.5 hover:bg-violet-900/20 flex items-center gap-2">
                  {item.docType === 'chat-image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-200 truncate">{item.fileName}</div>
                    <div className="text-[9px] text-slate-500">
                      {formatFileSize(item.fileSize)} · {new Date(item.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: '#0f0d1a' }}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            message={msg}
            onReply={() => setReplyTo(msg)}
            formatTime={formatTime}
            formatFileSize={formatFileSize}
          />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-lg rounded-bl-sm px-3 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
            </div>
          </div>
        )}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-3 py-2 bg-violet-900/40 border-t border-violet-800 flex items-start gap-2">
          <Reply className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-violet-400 font-semibold uppercase">
              Reply to {replyTo.role === 'user' ? 'yourself' : 'DINA'}
            </div>
            <div className="text-[10px] text-slate-300 truncate">{replyTo.content}</div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-0.5 rounded hover:bg-violet-800/50"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      )}

      {/* Pending attachments preview */}
      {pendingAttachments && pendingAttachments.length > 0 && (
        <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 flex flex-wrap gap-2">
          {pendingAttachments.map((att, idx) => (
            <div key={idx} className="relative bg-slate-800 border border-slate-700 rounded p-1.5 flex items-center gap-2 max-w-[150px]">
              {att.type === 'IMAGE' ? (
                <img src={att.dataUrl} alt={att.fileName} className="w-8 h-8 object-cover rounded" />
              ) : (
                <FileText className="w-8 h-8 text-red-400" />
              )}
              <div className="min-w-0">
                <div className="text-[9px] text-slate-200 truncate">{att.fileName}</div>
                <div className="text-[8px] text-slate-500">{formatFileSize(att.fileSize)}</div>
              </div>
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 bg-rose-600 rounded-full p-0.5 hover:bg-rose-500"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-slate-800 bg-slate-900">
        <div className="flex gap-1 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            title="Attach file (image/PDF)"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya DINA atau drag file ke sini..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-600 resize-none max-h-24"
            style={{ minHeight: '32px' }}
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && (!pendingAttachments || pendingAttachments.length === 0))}
            className="p-1.5 rounded bg-violet-600 text-white disabled:opacity-40 hover:bg-violet-500"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[8px] text-slate-500 mt-1 px-1">
          📎 Klik paperclip atau drag file untuk upload (max 5MB) · ↩️ Enter kirim, Shift+Enter baris baru
        </p>
      </div>
    </div>
  )
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================
function MessageBubble({
  message,
  onReply,
  formatTime,
  formatFileSize,
}: {
  message: DinaMessage
  onReply: () => void
  formatTime: (ts: number) => string
  formatFileSize: (bytes: number) => string
}) {
  const isUser = message.role === 'user'
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={cn('flex group', isUser ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn('max-w-[88%] relative', isUser && 'flex flex-col items-end')}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn(
            'mb-1 px-2 py-1 rounded text-[9px] border-l-2',
            message.replyTo.role === 'user'
              ? 'bg-violet-900/40 border-violet-500'
              : 'bg-slate-800 border-slate-600'
          )}>
            <div className="text-violet-400 font-semibold">
              {message.replyTo.role === 'user' ? 'You' : 'DINA'}
            </div>
            <div className="text-slate-300 truncate">{message.replyTo.content}</div>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.map((att, idx) => (
          <AttachmentView key={idx} att={att} isUser={isUser} formatFileSize={formatFileSize} />
        ))}

        {/* Text content */}
        {message.content && (
          <div className={cn(
            'rounded-lg px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-violet-700 text-white rounded-br-sm'
              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm'
          )}>
            {message.content}
          </div>
        )}

        {/* Time + actions */}
        <div className={cn(
          'flex items-center gap-1 mt-0.5',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="text-[8px] text-slate-500">{formatTime(message.ts)}</span>
          {showActions && (
            <button
              onClick={onReply}
              className="p-0.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-violet-400"
              title="Reply"
            >
              <Reply className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AttachmentView({
  att,
  isUser,
  formatFileSize,
}: {
  att: NonNullable<DinaMessage['attachments']>[0]
  isUser: boolean
  formatFileSize: (bytes: number) => string
}) {
  const containerClass = `mb-1 rounded overflow-hidden border ${isUser ? 'border-violet-400/30' : 'border-slate-700'}`

  if (att.type === 'IMAGE') {
    return (
      <div className={containerClass}>
        <a href={att.dataUrl} download={att.fileName} target="_blank" rel="noopener noreferrer">
          <img
            src={att.dataUrl}
            alt={att.fileName}
            className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90"
          />
        </a>
        {att.driveLink && (
          <a
            href={att.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-1 bg-emerald-900/30 text-[9px] text-emerald-300 hover:bg-emerald-900/50"
          >
            📁 {att.driveFileName || att.fileName} — tersimpan di Google Drive
          </a>
        )}
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <a
        href={att.dataUrl}
        download={att.fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <FileText className="w-8 h-8 text-red-400 shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] text-slate-200 truncate">{att.fileName}</div>
          <div className="text-[9px] text-slate-500">{formatFileSize(att.fileSize)}</div>
        </div>
        <Download className="w-3 h-3 text-slate-400 ml-1" />
      </a>
      {att.driveLink && (
        <a
          href={att.driveLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-2 py-1 bg-emerald-900/30 text-[9px] text-emerald-300 hover:bg-emerald-900/50"
        >
          📁 {att.driveFileName || att.fileName} — tersimpan di Google Drive
        </a>
      )}
    </div>
  )
}

