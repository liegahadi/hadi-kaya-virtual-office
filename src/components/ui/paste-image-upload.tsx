'use client'
// PasteImageUpload — universal paste image uploader
// Solves user pain: "bukti transfer dari WA susah didownload, nama file nomor, susah hafal"
// User bisa: buka WA web → right-click image → Copy Image → paste (Ctrl+V) ke sini
//
// Props:
//   onChange(files)  — dipanggil setiap kali list berubah (paste / hapus)
//   label?           — text label atas area
//   max?             — max file count (default 10)
//   accept?          — accept manual file picker (default: image/*)
//
// Fitur:
//   - Paste image via Ctrl+V (clipboard API)
//   - Klik area = buka file picker (fallback kalau paste ga jalan)
//   - Thumbnail preview dengan tombol hapus per item
//   - Support multiple paste (stack)
//   - Auto-convert clipboard item ke File object

import { useState, useRef, useCallback, type ChangeEvent, type ClipboardEvent } from 'react'
import { Upload, Trash2, Image as ImageIcon, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onChange: (files: File[]) => void
  label?: string
  max?: number
  hint?: string
}

interface PreviewItem {
  file: File
  url: string  // object URL untuk thumbnail
}

export function PasteImageUpload({ onChange, label, max = 10, hint }: Props) {
  const [items, setItems] = useState<PreviewItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // Cleanup object URLs on unmount
  // Note: we leak URLs on each add — small memory cost, acceptable for short-lived forms

  const pushFiles = useCallback((newFiles: File[]) => {
    setItems(prev => {
      const remaining = max - prev.length
      if (remaining <= 0) return prev
      const toAdd = newFiles.slice(0, remaining)
      const newItems = toAdd.map(file => ({
        file,
        url: URL.createObjectURL(file),
      }))
      const next = [...prev, ...newItems]
      // Notify parent
      onChange(next.map(i => i.file))
      return next
    })
  }, [max, onChange])

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const clipboardItems = e.clipboardData?.items
    if (!clipboardItems) return

    const imageFiles: File[] = []
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          // Generate filename jika nama kosong (WA paste sering kasih "image.png")
          const ext = file.type.split('/')[1] || 'png'
          const filename = file.name && file.name !== 'image.png'
            ? file.name
            : `paste-${Date.now()}-${i}.${ext}`
          const renamed = new File([file], filename, { type: file.type })
          imageFiles.push(renamed)
        }
      }
    }

    if (imageFiles.length === 0) {
      // Bukan image di clipboard — bisa text / file lain
      console.log('Paste detected but no image in clipboard')
      return
    }

    pushFiles(imageFiles)
  }, [pushFiles])

  const handleFilePicker = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      pushFiles(Array.from(e.target.files))
      // Reset input supaya bisa pilih file yang sama lagi kalau perlu
      e.target.value = ''
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) pushFiles(files)
  }, [pushFiles])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const removeItem = (idx: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx)
      // Revoke URL yang dihapus
      URL.revokeObjectURL(prev[idx].url)
      onChange(next.map(i => i.file))
      return next
    })
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}

      {/* Paste area */}
      <div
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-emerald-500 bg-emerald-950/30'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
        }`}
        tabIndex={0}  // Make focusable for paste event
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilePicker}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-2 text-slate-300">
            <Clipboard className="w-5 h-5" />
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-300 font-medium">
            Klik / Drop / <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+V</kbd> paste image
          </p>
          <p className="text-xs text-slate-500">
            {hint || 'Bisa paste multiple image. Cocok untuk bukti transfer / nota dari WhatsApp web.'}
          </p>
        </div>
      </div>

      {/* Thumbnails */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="relative group bg-slate-800 rounded-md overflow-hidden border border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.file.name}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeItem(idx)
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Hapus
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 truncate">
                {item.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{items.length} / {max} file</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              items.forEach(i => URL.revokeObjectURL(i.url))
              setItems([])
              onChange([])
            }}
            className="h-6 text-xs text-red-400 hover:bg-red-900/30"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Hapus Semua
          </Button>
        </div>
      )}
    </div>
  )
}
