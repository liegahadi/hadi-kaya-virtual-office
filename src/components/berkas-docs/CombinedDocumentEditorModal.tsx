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
import { X, Download, Save, ChevronLeft, Search, FileText, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Highlighter, Palette, Image as ImageIcon } from 'lucide-react'
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
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-100">
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
              <div className="max-w-[210mm] mx-auto bg-white shadow-lg min-h-[297mm]">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
