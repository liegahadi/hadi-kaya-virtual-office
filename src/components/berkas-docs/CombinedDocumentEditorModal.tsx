'use client'
// COMBINED DOCUMENT EDITOR MODAL
// 1 modal = 1 file containing: Kop Surat + SK Kerja + page break + 7 Slip Gaji sheets
// Features:
// - Template picker (10 styles, each with consistent kop surat for SK & Slip)
// - Tiptap rich text editor (font family, size, bold/italic/underline, alignment, color, lists)
// - Image upload + paste support (for logo / kop surat)
// - Save edits to state (uploadedFiles['combined-doc-html'])
// - Download as 1 .docx file
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Underline } from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { X, Download, Save, ChevronLeft, Search, FileText, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Highlighter, Palette, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BerkasState, JobType } from '@/lib/berkas/types'
import { COMBINED_TEMPLATES, COMBINED_CATEGORIES } from '@/lib/berkas/templates/combined-templates'
import { LAPORAN_KEUANGAN_TEMPLATES, LAPORAN_KEUANGAN_CATEGORIES } from '@/lib/berkas/templates/laporan-keuangan-templates'
import { buildDocumentByJobType } from '@/lib/berkas/templates/engine'

interface CombinedDocumentEditorModalProps {
  open: boolean
  onClose: () => void
  state: BerkasState
  savedHtml: string | null
  onSave: (html: string) => void
}

const FONT_FAMILIES = [
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Arial', value: "Arial, sans-serif" },
  { label: 'Calibri', value: "Calibri, sans-serif" },
  { label: 'Cambria', value: "Cambria, serif" },
  { label: 'Georgia', value: "Georgia, serif" },
  { label: 'Tahoma', value: "Tahoma, sans-serif" },
  { label: 'Verdana', value: "Verdana, sans-serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
]

const FONT_SIZES = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt']

const COLORS = ['#000000', '#dc2626', '#ea580c', '#d97706', '#059669', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#4b5563', '#1e293b', '#fbbf24']

export function CombinedDocumentEditorModal({ open, onClose, state, savedHtml, onSave }: CombinedDocumentEditorModalProps) {
  const [view, setView] = useState<'templates' | 'editor'>(savedHtml ? 'editor' : 'templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [fontSize, setFontSize] = useState('11pt')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      // Table support — for Slip Gaji & Laporan Keuangan
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'tiptap-table' },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: { class: 'tiptap-cell' },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor max-w-none focus:outline-none min-h-[500px] p-8 bg-white',
        style: 'font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.6; color: #000;',
      },
      // Handle paste of images
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              const reader = new FileReader()
              reader.onload = () => {
                const dataUrl = reader.result as string
                editor?.chain().focus().setImage({ src: dataUrl }).run()
              }
              reader.readAsDataURL(file)
              return true
            }
          }
        }
        return false
      },
      // Handle drop of images
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              editor?.chain().focus().setImage({ src: dataUrl }).run()
            }
            reader.readAsDataURL(file)
            return true
          }
        }
        return false
      },
    },
  })

  // Load saved HTML when modal opens
  useEffect(() => {
    if (open && editor && savedHtml) {
      editor.commands.setContent(savedHtml)
      setView('editor')
    } else if (open && !savedHtml) {
      setView('templates')
    }
  }, [open, editor, savedHtml])

  // Auto-detect jobType: karyawan → SK+Slip, wirausaha → Laporan Keuangan
  const isWirausaha = state.applicant.jobType === JobType.ENTREPRENEUR || state.applicant.jobType === 'Wirausaha' as any
  const activeTemplates = isWirausaha ? LAPORAN_KEUANGAN_TEMPLATES : COMBINED_TEMPLATES
  const activeCategories = isWirausaha ? LAPORAN_KEUANGAN_CATEGORIES : COMBINED_CATEGORIES
  const docTypeLabel = isWirausaha ? 'Laporan Keuangan 6 Bulan' : 'SK Kerja + 7 Slip Gaji'

  const handleSelectTemplate = useCallback((templateId: string) => {
    if (!editor) return
    try {
      // Auto-switch: wirausaha → Laporan Keuangan, karyawan → SK+Slip
      const combinedHtml = buildDocumentByJobType(templateId, state)
      editor.commands.setContent(combinedHtml)
      setSelectedTemplate(templateId)
      setView('editor')
      const tplName = activeTemplates.find(t => t.id === templateId)?.name || templateId
      toast.success(`Template "${tplName}" dimuat. ${docTypeLabel} siap diedit.`)
    } catch (err) {
      toast.error('Gagal load template: ' + (err instanceof Error ? err.message : 'unknown'))
    }
  }, [editor, state, activeTemplates, docTypeLabel])

  // Toolbar handlers
  const setFontFamily = (font: string) => {
    if (!editor) return
    editor.chain().focus().setFontFamily(font).run()
  }

  const applyFontSize = (size: string) => {
    if (!editor) return
    setFontSize(size)
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0)
      const span = document.createElement('span')
      span.style.fontSize = size
      try {
        range.surroundContents(span)
      } catch {
        const contents = range.extractContents()
        span.appendChild(contents)
        range.insertNode(span)
      }
    }
  }

  const setColor = (color: string) => {
    if (!editor) return
    editor.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }

  const setHighlight = (color: string) => {
    if (!editor) return
    editor.chain().focus().toggleHighlight({ color }).run()
    setShowHighlightPicker(false)
  }

  // Image upload (for logo)
  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Ukuran gambar max 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      editor?.chain().focus().setImage({ src: dataUrl }).run()
      toast.success('Logo/gambar berhasil ditambahkan!')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = () => {
    if (!editor) return
    setSaving(true)
    try {
      const html = editor.getHTML()
      onSave(html)
      toast.success('Dokumen (SK + Slip Gaji) berhasil disimpan!')
    } catch (err) {
      toast.error('Gagal simpan: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!editor) return
    setDownloading(true)
    try {
      const html = editor.getHTML()
      // Wrap with print CSS for proper page breaks in Word
      const wrappedHtml = `<div style="font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #000;">
<style>
  @page { size: A4; margin: 1.5cm 2cm; }
  table { border-collapse: collapse; }
  .editor-image { max-width: 100%; }
  p[style*="page-break-after"] { page-break-after: always; }
  hr[style*="page-break-after"] { page-break-after: always; border: none; }
</style>
${html}
</div>`

      const fileName = `SK_Slip_Gaji_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}`

      const res = await fetch('/api/documents/html-to-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: wrappedHtml, fileName, orientation: 'portrait' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}.docx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Dokumen berhasil di-download (.docx) - berisi SK Kerja + 7 Slip Gaji!')
    } catch (err) {
      toast.error('Gagal download: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setDownloading(false)
    }
  }

  // Filter templates — pakai activeTemplates (auto-switch berdasarkan jobType)
  // Reset activeCategory kalau jobType berubah (category list beda)
  useEffect(() => {
    setActiveCategory('all')
    setSearchQuery('')
    setView(savedHtml ? 'editor' : 'templates')
  }, [isWirausaha])
  const filteredTemplates = activeTemplates.filter(t => {
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white text-slate-900 w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden" style={{ colorScheme: 'light' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            {view === 'editor' && (
              <button
                onClick={() => setView('templates')}
                className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                title="Kembali ke pilihan template"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-800">
                Editor Dokumen (SK Kerja + Slip Gaji)
                {selectedTemplate && view === 'editor' && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    · {activeTemplates.find(t => t.id === selectedTemplate)?.name}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'editor' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> {downloading ? 'Downloading...' : 'Download .docx'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Tutup">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Picker View */}
        {view === 'templates' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {/* AI Generate Tab — khusus wirausaha */}
            {isWirausaha && <AiGeneratePanel state={state} onGenerate={(html) => { editor?.commands.setContent(html); setView('editor') }} />}

            <div className="p-4 border-b bg-white">
              <div className="flex gap-3 items-center mb-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari template..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-cyan-500 text-slate-900"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  {filteredTemplates.length} dari {activeTemplates.length} template ({isWirausaha ? 'Wirausaha' : 'Karyawan'})
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border',
                    activeCategory === 'all'
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500'
                  )}
                >
                  Semua
                </button>
                {activeCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full border',
                      activeCategory === cat
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-500'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="group bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-cyan-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-cyan-600">{template.name}</h3>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{template.category}</span>
                      </div>
                      <FileText className="w-4 h-4 text-slate-300 group-hover:text-cyan-500" />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{template.description}</p>
                    <div className="mt-3 text-[10px] text-cyan-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Klik untuk pakai →
                    </div>
                  </button>
                ))}
              </div>
              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">Tidak ada template yang cocok.</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-white text-[11px] text-slate-600 space-y-1">
              <p>📄 <strong>1 file = SK Kerja + 7 Slip Gaji</strong> (kop surat sama, langsung rapi)</p>
              <p>🎨 Pilih template → data form otomatis terisi → edit bebas (font, ukuran, layout, <strong>paste logo</strong>) → simpan & download .docx</p>
            </div>
          </div>
        )}

        {/* Editor View */}
        {view === 'editor' && editor && (
          <div className="flex-1 overflow-hidden flex bg-slate-100">
            {/* Sidebar Form (kiri) — untuk SK + Slip Gaji (karyawan) */}
            {!isWirausaha && (
              <SlipGajiSidebar state={state} onUpdate={(field, val) => {
                // Update state via onUpdate prop (dipass dari BerkasViewV2)
                // Karena modal ga punya onUpdate, kita update via editor content regenerate
                // Untuk simplicity, user edit langsung di Tiptap editor
              }} />
            )}

            {/* Editor + Toolbar (kanan) */}
            <div className="flex-1 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="bg-white border-b p-2 flex flex-wrap items-center gap-1 shrink-0">
              {/* Font family */}
              <select
                onChange={e => setFontFamily(e.target.value)}
                className="text-xs px-2 py-1 border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:border-cyan-500 text-slate-700"
                title="Font Family"
              >
                {FONT_FAMILIES.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>

              {/* Font size */}
              <select
                value={fontSize}
                onChange={e => applyFontSize(e.target.value)}
                className="text-xs px-2 py-1 border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:border-cyan-500 w-16 text-slate-700"
                title="Font Size"
              >
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Image upload (logo) - NEW */}
              <button
                onClick={handleImageUpload}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 flex items-center gap-1"
                title="Upload / Sisipkan gambar (logo, kop surat)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Bold, Italic, Underline */}
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn('p-1.5 rounded hover:bg-slate-100', editor.isActive('bold') ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn('p-1.5 rounded hover:bg-slate-100', editor.isActive('italic') ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn('p-1.5 rounded hover:bg-slate-100', editor.isActive('underline') ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Alignment */}
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={cn('p-1.5 rounded hover:bg-slate-100', editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={cn('p-1.5 rounded hover:bg-slate-100', editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={cn('p-1.5 rounded hover:bg-slate-100', editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Lists */}
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn('p-1.5 rounded hover:bg-slate-100 text-xs font-bold', editor.isActive('bulletList') ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Bullet List"
              >
                •
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn('p-1.5 rounded hover:bg-slate-100 text-xs font-bold', editor.isActive('orderedList') ? 'bg-slate-200 text-cyan-600' : 'text-slate-600')}
                title="Numbered List"
              >
                1.
              </button>

              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Color */}
              <div className="relative">
                <button
                  onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false) }}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                  title="Text Color"
                >
                  <Palette className="w-4 h-4" />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-slate-300 rounded-md shadow-lg p-2 grid grid-cols-6 gap-1">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Highlight */}
              <div className="relative">
                <button
                  onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false) }}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                  title="Highlight"
                >
                  <Highlighter className="w-4 h-4" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-slate-300 rounded-md shadow-lg p-2 grid grid-cols-6 gap-1">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setHighlight(c)}
                        className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-1 rounded border border-cyan-200">
                  <ImageIcon className="w-3 h-3" />
                  Paste logo langsung / klik tombol gambar
                </span>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Page Break Preview + Table styling — inject global CSS */}
              <style dangerouslySetInnerHTML={{ __html: `
                /* PAGE BREAK PREVIEW — visual garis pemisah antar halaman */
                .tiptap-editor div[style*="page-break-after:always"],
                .tiptap-editor div[style*="page-break-after: always"],
                .tiptap-editor p[style*="page-break-after:always"],
                .tiptap-editor p[style*="page-break-after: always"] {
                  position: relative;
                  border-bottom: 2px dashed #dc2626 !important;
                  margin: 20px 0 !important;
                  padding: 8px 0 !important;
                  background: linear-gradient(to right, transparent 0%, #fee2e2 50%, transparent 100%);
                }
                .tiptap-editor div[style*="page-break-after:always"]::after,
                .tiptap-editor div[style*="page-break-after: always"]::after,
                .tiptap-editor p[style*="page-break-after:always"]::after,
                .tiptap-editor p[style*="page-break-after: always"]::after {
                  content: "──── Page Break ────";
                  position: absolute;
                  left: 50%;
                  bottom: -12px;
                  transform: translateX(-50%);
                  background: #dc2626;
                  color: white;
                  padding: 2px 12px;
                  border-radius: 10px;
                  font-size: 9pt;
                  font-weight: bold;
                  letter-spacing: 0.5px;
                }

                /* TABLE STYLING — Slip Gaji & Laporan Keuangan */
                .tiptap-table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                  margin: 10px 0 !important;
                  border: 1.5px solid #000 !important;
                }
                .tiptap-table td, .tiptap-table th {
                  border: 1px solid #999 !important;
                  padding: 6px 10px !important;
                  vertical-align: top !important;
                }
                .tiptap-table th {
                  background: #e8e8e8 !important;
                  font-weight: bold !important;
                  text-align: center !important;
                }
                .tiptap-table .tiptap-cell {
                  min-width: 60px;
                }
                /* Selected cell highlight */
                .tiptap-table .selectedCell::after {
                  content: "";
                  position: absolute;
                  top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(35, 165, 213, 0.2);
                  pointer-events: none;
                  z-index: 100;
                }

                /* Kop surat styling */
                .tiptap-editor img {
                  max-width: 100% !important;
                  height: auto !important;
                }

                /* Make sure font + size persistent */
                .tiptap-editor p {
                  margin: 6px 0 !important;
                }
              `}} />
              <div className="max-w-[210mm] mx-auto bg-white shadow-lg min-h-[297mm]">
                <EditorContent editor={editor} />
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =========================================================
// Slip Gaji Sidebar — form global untuk SK + Slip Gaji (karyawan)
// User input: tanggal terima, gaji pokok, tunjangan (multiple), potongan (multiple), bonus (multiple)
// Auto-calc total = (gaji pokok + tunjangan + bonus) - potongan
// User edit detail tiap bulan langsung di Tiptap editor
// =========================================================
function SlipGajiSidebar({ state, onUpdate }: { state: BerkasState; onUpdate: (field: string, val: any) => void }) {
  const a = state.applicant as any
  const [tanggalTerima, setTanggalTerima] = useState(a.tanggalTerimaGaji || '25')
  const [gajiPokok, setGajiPokok] = useState(String(a.gajiPokok || a.monthlyIncome || 0))
  const [tunjangan, setTunjangan] = useState<Array<{ label: string; amount: number }>>(a.tunjanganTetap || [])
  const [potongan, setPotongan] = useState<Array<{ label: string; amount: number }>>(a.potongan || [])
  const [bonus, setBonus] = useState<Array<{ label: string; amount: number }>>(a.tunjanganVariabel || [])

  // Auto-calc total
  const totalTunjangan = tunjangan.reduce((s, t) => s + (t.amount || 0), 0)
  const totalPotongan = potongan.reduce((s, p) => s + (p.amount || 0), 0)
  const totalBonus = bonus.reduce((s, b) => s + (b.amount || 0), 0)
  const gajiKotor = parseInt(gajiPokok || '0') + totalTunjangan + totalBonus
  const gajiBersih = gajiKotor - totalPotongan

  const fmt = (n: number) => 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'

  // Add/remove/update items
  const addItem = (type: 'tunjangan' | 'potongan' | 'bonus') => {
    const setter = type === 'tunjangan' ? setTunjangan : type === 'potongan' ? setPotongan : setBonus
    const current = type === 'tunjangan' ? tunjangan : type === 'potongan' ? potongan : bonus
    setter([...current, { label: '', amount: 0 }])
  }
  const updateItem = (type: 'tunjangan' | 'potongan' | 'bonus', idx: number, key: 'label' | 'amount', val: any) => {
    const setter = type === 'tunjangan' ? setTunjangan : type === 'potongan' ? setPotongan : setBonus
    const current = type === 'tunjangan' ? tunjangan : type === 'potongan' ? potongan : bonus
    const updated = [...current]
    updated[idx] = { ...updated[idx], [key]: key === 'amount' ? parseInt(val) || 0 : val }
    setter(updated)
  }
  const removeItem = (type: 'tunjangan' | 'potongan' | 'bonus', idx: number) => {
    const setter = type === 'tunjangan' ? setTunjangan : type === 'potongan' ? setPotongan : setBonus
    const current = type === 'tunjangan' ? tunjangan : type === 'potongan' ? potongan : bonus
    setter(current.filter((_, i) => i !== idx))
  }

  // Sync ke state (untuk auto-calc di engine saat generate ulang)
  useEffect(() => {
    onUpdate('tanggalTerimaGaji', tanggalTerima)
    onUpdate('gajiPokok', parseInt(gajiPokok) || 0)
    onUpdate('tunjanganTetap', tunjangan)
    onUpdate('tunjanganVariabel', bonus)
    onUpdate('potongan', potongan)
  }, [tanggalTerima, gajiPokok, tunjangan, bonus, potongan])

  return (
    <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto p-3 shrink-0">
      <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1">
        <FileText className="w-3 h-3" /> Form Slip Gaji
      </h3>
      <p className="text-[10px] text-slate-500 mb-3">
        Isi sekali untuk semua bulan. Untuk variasi per bulan, edit langsung di editor.
      </p>

      {/* Tanggal Terima */}
      <div className="mb-3">
        <label className="text-[10px] font-medium text-slate-600 uppercase">Tanggal Terima Gaji</label>
        <input
          type="number"
          value={tanggalTerima}
          onChange={e => setTanggalTerima(e.target.value)}
          min="1" max="31"
          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Gaji Pokok */}
      <div className="mb-3">
        <label className="text-[10px] font-medium text-slate-600 uppercase">Gaji Pokok (Rp)</label>
        <input
          type="number"
          value={gajiPokok}
          onChange={e => setGajiPokok(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Tunjangan */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium text-slate-600 uppercase">Tunjangan</label>
          <button onClick={() => addItem('tunjangan')} className="text-[10px] text-cyan-600 hover:text-cyan-700">+ Tambah</button>
        </div>
        {tunjangan.map((item, idx) => (
          <div key={idx} className="flex gap-1 mb-1">
            <input
              type="text"
              value={item.label}
              onChange={e => updateItem('tunjangan', idx, 'label', e.target.value)}
              placeholder="Nama tunjangan"
              className="flex-1 px-1.5 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              value={item.amount || ''}
              onChange={e => updateItem('tunjangan', idx, 'amount', e.target.value)}
              placeholder="Nominal"
              className="w-20 px-1.5 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
            />
            <button onClick={() => removeItem('tunjangan', idx)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
          </div>
        ))}
        {tunjangan.length === 0 && <p className="text-[9px] text-slate-400 italic">Belum ada tunjangan</p>}
      </div>

      {/* Bonus */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium text-slate-600 uppercase">Bonus</label>
          <button onClick={() => addItem('bonus')} className="text-[10px] text-cyan-600 hover:text-cyan-700">+ Tambah</button>
        </div>
        {bonus.map((item, idx) => (
          <div key={idx} className="flex gap-1 mb-1">
            <input
              type="text"
              value={item.label}
              onChange={e => updateItem('bonus', idx, 'label', e.target.value)}
              placeholder="Nama bonus"
              className="flex-1 px-1.5 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              value={item.amount || ''}
              onChange={e => updateItem('bonus', idx, 'amount', e.target.value)}
              placeholder="Nominal"
              className="w-20 px-1.5 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
            />
            <button onClick={() => removeItem('bonus', idx)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
          </div>
        ))}
        {bonus.length === 0 && <p className="text-[9px] text-slate-400 italic">Belum ada bonus</p>}
      </div>

      {/* Potongan */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium text-slate-600 uppercase">Potongan</label>
          <button onClick={() => addItem('potongan')} className="text-[10px] text-cyan-600 hover:text-cyan-700">+ Tambah</button>
        </div>
        {potongan.map((item, idx) => (
          <div key={idx} className="flex gap-1 mb-1">
            <input
              type="text"
              value={item.label}
              onChange={e => updateItem('potongan', idx, 'label', e.target.value)}
              placeholder="Nama potongan"
              className="flex-1 px-1.5 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              value={item.amount || ''}
              onChange={e => updateItem('potongan', idx, 'amount', e.target.value)}
              placeholder="Nominal"
              className="w-20 px-1.5 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-cyan-500"
            />
            <button onClick={() => removeItem('potongan', idx)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
          </div>
        ))}
        {potongan.length === 0 && <p className="text-[9px] text-slate-400 italic">Belum ada potongan</p>}
      </div>

      {/* Total Calculation */}
      <div className="mt-4 p-2 bg-cyan-50 border border-cyan-200 rounded">
        <p className="text-[10px] font-bold text-cyan-900 mb-1">Auto-Calculation</p>
        <div className="space-y-0.5 text-[10px] text-slate-700">
          <div className="flex justify-between"><span>Gaji Pokok:</span><span>{fmt(parseInt(gajiPokok) || 0)}</span></div>
          <div className="flex justify-between"><span>+ Tunjangan:</span><span>{fmt(totalTunjangan)}</span></div>
          <div className="flex justify-between"><span>+ Bonus:</span><span>{fmt(totalBonus)}</span></div>
          <div className="flex justify-between"><span>- Potongan:</span><span>{fmt(totalPotongan)}</span></div>
          <div className="border-t border-cyan-300 my-1"></div>
          <div className="flex justify-between font-bold text-cyan-900"><span>Gaji Kotor:</span><span>{fmt(gajiKotor)}</span></div>
          <div className="flex justify-between font-bold text-emerald-700 text-[11px]"><span>Gaji Bersih:</span><span>{fmt(gajiBersih)}</span></div>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 mt-2 italic">
        Total dihitung otomatis. Untuk variasi per bulan, edit langsung di editor Tiptap.
      </p>
    </div>
  )
}

// =========================================================
// AI Generate Panel — khusus wirausaha
// Form input + call /api/documents/generate-laporan-keuangan
// Output HTML langsung ke Tiptap editor
// =========================================================
function AiGeneratePanel({ state, onGenerate }: { state: BerkasState; onGenerate: (html: string) => void }) {
  const [jenisUsaha, setJenisUsaha] = useState(state.applicant.jobTitle || '')
  const [targetMode, setTargetMode] = useState<'range' | 'perBulan'>('range')
  const [labaMin, setLabaMin] = useState('5000000')
  const [labaMax, setLabaMax] = useState('6000000')
  const [periodeCount, setPeriodeCount] = useState<6 | 7>(6)
  const [biayaKhusus, setBiayaKhusus] = useState('')
  const [namaUsaha, setNamaUsaha] = useState(state.applicant.companyName || '')
  const [alamatUsaha, setAlamatUsaha] = useState(state.applicant.companyAddress || '')
  const [ig, setIg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate periode list untuk perBulan mode
  const now = new Date()
  const bulanList: string[] = []
  for (let i = periodeCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
    bulanList.push(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))
  }
  const [labaPerBulan, setLabaPerBulan] = useState<Record<string, string>>(
    Object.fromEntries(bulanList.map(b => [b, '5000000']))
  )

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: any = {
        jenisUsaha: jenisUsaha || 'Usaha UMKM',
        targetLabaMode: targetMode,
        periodeCount,
        biayaKhusus,
        kopSurat: {
          namaUsaha: namaUsaha || 'Nama Usaha',
          alamat: alamatUsaha || 'Alamat Usaha',
          ig,
        },
      }

      if (targetMode === 'range') {
        payload.targetLabaMin = parseInt(labaMin) || 0
        payload.targetLabaMax = parseInt(labaMax) || 0
      } else {
        payload.labaPerBulan = bulanList.map(bulan => ({
          bulan,
          laba: parseInt(labaPerBulan[bulan] || '0') || 0,
        }))
      }

      const res = await fetch('/api/documents/generate-laporan-keuangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        onGenerate(data.html)
      } else {
        setError(data.error || 'Gagal generate. Coba lagi.')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 border-b border-violet-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold text-violet-900">AI Generate Laporan Keuangan</h3>
          <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full">NEW</span>
        </div>
        <p className="text-xs text-violet-700 mb-3">
          AI akan generate rincian pendapatan, HPP, dan biaya operasional otomatis berdasarkan target laba bersih yang Anda input. Hasil bisa diedit di Tiptap editor.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Jenis Usaha</label>
            <input
              type="text"
              value={jenisUsaha}
              onChange={e => setJenisUsaha(e.target.value)}
              placeholder="e.g., Laundry, Softlens, Camping, Kusen Kayu"
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Nama Usaha (Kop Surat)</label>
            <input
              type="text"
              value={namaUsaha}
              onChange={e => setNamaUsaha(e.target.value)}
              placeholder="e.g., ZEELALENS, Toko Haji Ambon"
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Alamat Usaha</label>
            <input
              type="text"
              value={alamatUsaha}
              onChange={e => setAlamatUsaha(e.target.value)}
              placeholder="Alamat lengkap usaha"
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Instagram (optional)</label>
            <input
              type="text"
              value={ig}
              onChange={e => setIg(e.target.value)}
              placeholder="e.g., zeelalens (tanpa @)"
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Periode</label>
            <select
              value={periodeCount}
              onChange={e => setPeriodeCount(parseInt(e.target.value) as 6 | 7)}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
            >
              <option value={6}>6 Bulan Terakhir</option>
              <option value={7}>7 Bulan Terakhir</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-600 uppercase">Mode Target Laba</label>
            <select
              value={targetMode}
              onChange={e => setTargetMode(e.target.value as 'range' | 'perBulan')}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
            >
              <option value="range">Range (Min - Max)</option>
              <option value="perBulan">Per Bulan (Nominal Pasti)</option>
            </select>
          </div>
          {targetMode === 'range' && (
            <div className="col-span-1">
              <label className="text-[10px] font-medium text-slate-600 uppercase">Target Laba/Bulan (Rp)</label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  value={labaMin}
                  onChange={e => setLabaMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
                />
                <span className="text-xs text-slate-400">-</span>
                <input
                  type="number"
                  value={labaMax}
                  onChange={e => setLabaMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}
        </div>

        {targetMode === 'perBulan' && (
          <div className="mb-3 bg-white/60 rounded p-2 border border-violet-200">
            <label className="text-[10px] font-medium text-slate-600 uppercase mb-1 block">Laba Bersih Per Bulan (Rp)</label>
            <div className="grid grid-cols-2 gap-2">
              {bulanList.map(bulan => (
                <div key={bulan} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 w-32 truncate">{bulan}</span>
                  <input
                    type="number"
                    value={labaPerBulan[bulan] || ''}
                    onChange={e => setLabaPerBulan(prev => ({ ...prev, [bulan]: e.target.value }))}
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="text-[10px] font-medium text-slate-600 uppercase">Biaya Khusus (optional)</label>
          <textarea
            value={biayaKhusus}
            onChange={e => setBiayaKhusus(e.target.value)}
            placeholder="e.g., gaji karyawan 1.3jt/bulan, listrik 500rb, no sewa, transportasi 200rb"
            rows={2}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-violet-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Kalau diisi, AI akan pakai biaya ini. Kalau kosong, AI decide sendiri berdasarkan jenis usaha.
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !jenisUsaha || !namaUsaha}
          className="w-full py-2 px-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-bold rounded hover:from-violet-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI sedang generate... (30-60 detik)
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate dengan AI
            </>
          )}
        </button>
      </div>
    </div>
  )
}
