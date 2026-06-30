'use client'
// DOCUMENT EDITOR MODAL - Inline Word/Google Docs-like editor
// Features:
// - Template picker (20 templates)
// - Tiptap rich text editor (font family, font size, bold/italic/underline, alignment, color)
// - Auto-fills form data into template
// - Save edits to state
// - Download as .docx
import React, { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Underline } from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { X, Download, Save, ChevronLeft, Search, FileText, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Highlighter, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BerkasState } from '@/lib/berkas/types'
import { SK_KERJA_TEMPLATES, SK_KERJA_CATEGORIES, SkKerjaTemplate } from '@/lib/berkas/templates/sk-kerja-templates'
import { SLIP_GAJI_TEMPLATES, SLIP_GAJI_CATEGORIES, SlipGajiTemplate } from '@/lib/berkas/templates/slip-gaji-templates'
import { fillSkKerjaTemplate, fillSlipGajiTemplate, wrapSkKerjaHtml } from '@/lib/berkas/templates/engine'

interface DocumentEditorModalProps {
  open: boolean
  onClose: () => void
  docType: 'sk-kerja' | 'slip-gaji'
  state: BerkasState
  savedHtml: string | null  // previously saved edited HTML
  onSave: (html: string) => void  // callback when user saves
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

export function DocumentEditorModal({ open, onClose, docType, state, savedHtml, onSave }: DocumentEditorModalProps) {
  const [view, setView] = useState<'templates' | 'editor'>(savedHtml ? 'editor' : 'templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [fontSize, setFontSize] = useState('11pt')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const isSkKerja = docType === 'sk-kerja'
  const templates = isSkKerja ? SK_KERJA_TEMPLATES : SLIP_GAJI_TEMPLATES
  const categories = isSkKerja ? SK_KERJA_CATEGORIES : SLIP_GAJI_CATEGORIES
  const docLabel = isSkKerja ? 'SK Kerja' : 'Slip Gaji'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading if not needed
      }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-8 bg-white',
        style: 'font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.5;',
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

  // Cleanup editor on close
  useEffect(() => {
    if (!open && editor) {
      // Don't destroy — just leave it
    }
  }, [open, editor])

  const handleSelectTemplate = useCallback((templateId: string) => {
    if (!editor) return
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    let filledHtml: string
    if (isSkKerja) {
      // SK Kerja: template.html is the full inner content
      filledHtml = fillSkKerjaTemplate((template as SkKerjaTemplate).html, state)
    } else {
      // Slip Gaji: generates 7 pages, each with template.body
      const slipTemplate = template as SlipGajiTemplate
      // For the editor, we want all 7 pages visible — separated by horizontal rule
      // Use the engine but render as 7 sections separated by <hr>
      filledHtml = fillSlipGajiTemplateForEditor(slipTemplate, state)
    }

    editor.commands.setContent(filledHtml)
    setSelectedTemplate(templateId)
    setView('editor')
    toast.success(`Template "${template.name}" dimuat. Silakan edit di editor.`)
  }, [editor, templates, isSkKerja, state])

  // Generate 7 sheets for slip gaji but as one continuous HTML (for editor)
  function fillSlipGajiTemplateForEditor(template: SlipGajiTemplate, state: BerkasState): string {
    // Use the engine to generate 7 pages
    const fullHtml = fillSlipGajiTemplate(template.body, template.css, state)
    // Extract the body content (between <body> and </body>)
    const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<\/body>/)
    return bodyMatch ? bodyMatch[1].trim() : fullHtml
  }

  // Editor toolbar handlers
  const setFontFamily = (font: string) => {
    if (!editor) return
    editor.chain().focus().setFontFamily(font).run()
  }

  const applyFontSize = (size: string) => {
    if (!editor) return
    setFontSize(size)
    // Apply via inline style on selection
    editor.chain().focus().setMark('textStyle', { attrs: { fontSize: size } }).run()
    // Alternative: use CSS via execCommand
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0)
      const span = document.createElement('span')
      span.style.fontSize = size
      try {
        range.surroundContents(span)
      } catch {
        // Fallback: extract and surround
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

  const handleSave = () => {
    if (!editor) return
    setSaving(true)
    try {
      const html = editor.getHTML()
      onSave(html)
      toast.success(`${docLabel} berhasil disimpan!`)
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
      // Wrap with inline CSS for proper rendering in Word
      const wrappedHtml = isSkKerja
        ? `<div style="font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5;">${html}</div>`
        : html  // slip gaji already has styling

      const fileName = `${docLabel.replace(/\s/g, '_')}_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}`

      const res = await fetch('/api/documents/html-to-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: wrappedHtml,
          fileName,
          orientation: 'portrait',
        }),
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
      toast.success(`${docLabel} berhasil di-download (.docx)!`)
    } catch (err) {
      toast.error('Gagal download: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setDownloading(false)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(t => {
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
      <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">
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
                {docLabel} Editor
                {selectedTemplate && view === 'editor' && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    · {templates.find(t => t.id === selectedTemplate)?.name}
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
            {/* Search & Filter */}
            <div className="p-4 border-b bg-white">
              <div className="flex gap-3 items-center mb-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Cari template ${docLabel.toLowerCase()}...`}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  {filteredTemplates.length} dari {templates.length} template
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
                {categories.map(cat => (
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

            {/* Templates Grid */}
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
                  <p className="text-sm">Tidak ada template yang cocok dengan pencarian.</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-white text-[11px] text-slate-500 text-center">
              💡 Pilih template → data form akan otomatis terisi → edit sesuka hati (font, ukuran, layout) → simpan & download .docx
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
                className="text-xs px-2 py-1 border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:border-cyan-500"
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
                className="text-xs px-2 py-1 border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:border-cyan-500 w-16"
                title="Font Size"
              >
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

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

              <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
                <span className="hidden md:inline">Klik di editor untuk mengedit • Drag untuk pilih text</span>
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
