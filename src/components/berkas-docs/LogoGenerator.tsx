'use client'
// LogoGenerator — 2 modes:
// 1. AI Image by Upload: User uploads foto logo → AI recreate clean with white bg
// 2. AI Image by Prompt: User prompts by text → AI creates new logo from scratch
//
// After generation, user can insert logo into Kop Surat textarea

import React, { useState, useRef } from 'react'
import { Sparkles, Image as ImageIcon, Loader2, Plus, RefreshCw, Upload, Type } from 'lucide-react'
import { toast } from 'sonner'

interface LogoGeneratorProps {
  companyName: string
  onInsertLogo: (logoHtml: string) => void
}

const LOGO_STYLES = [
  { id: 'modern', label: 'Modern', desc: 'Clean, minimalis, geometric' },
  { id: 'classic', label: 'Klasik', desc: 'Formal, elegan, traditional' },
  { id: 'minimalist', label: 'Minimalis', desc: 'Sederhana, flat design' },
  { id: 'creative', label: 'Kreatif', desc: 'Colorful, playful, unique' },
  { id: 'corporate', label: 'Korporat', desc: 'Professional, trustworthy, blue tones' },
  { id: 'tech', label: 'Tech', desc: 'Modern, futuristic, gradient' },
]

export function LogoGenerator({ companyName, onInsertLogo }: LogoGeneratorProps) {
  const [mode, setMode] = useState<'upload' | 'prompt'>('prompt')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [promptText, setPromptText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus gambar (JPG/PNG)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage(reader.result as string)
      toast.success('Foto logo di-upload. Klik "Recreate Logo" untuk bersihkan.')
    }
    reader.readAsDataURL(file)
  }

  // Mode 1: Recreate logo from uploaded image
  async function handleRecreateLogo() {
    if (!uploadedImage) {
      toast.error('Upload foto logo dulu')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/documents/edit-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: 'Recreate this company logo as a clean, professional version. White background. High contrast. Remove any noise, shadows, blur, or distractions. Keep the original design, shape, and colors as close as possible. Make it look like a high-quality vector logo suitable for letterhead/kop surat.',
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      setGeneratedLogo(data.dataUrl)
      toast.success('Logo berhasil di-recreate! Klik "Insert ke Kop Surat"')
    } catch (err) {
      toast.error('Gagal recreate logo: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setGenerating(false)
    }
  }

  // Mode 2: Generate logo from prompt
  async function handleGenerateFromPrompt() {
    if (!companyName?.trim()) {
      toast.error('Isi "Nama Perusahaan" dulu di form Pekerjaan')
      return
    }
    setGenerating(true)
    try {
      const styleDesc = LOGO_STYLES.find(s => s.id === selectedStyle)?.desc || 'modern professional'
      const fullPrompt = promptText
        ? `${promptText} Style: ${styleDesc}. White background. No text in the image.`
        : `Generate a clean, professional company logo for "${companyName}". Style: ${styleDesc}. Simple, high-contrast, suitable for letterhead. White background. No text in the image (just the logo symbol/icon).`

      const res = await fetch('/api/documents/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          style: styleDesc,
          description: promptText,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      setGeneratedLogo(data.dataUrl)
      toast.success('Logo berhasil di-generate! Klik "Insert ke Kop Surat"')
    } catch (err) {
      toast.error('Gagal generate logo: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setGenerating(false)
    }
  }

  // Insert logo into Kop Surat
  function handleInsert() {
    if (!generatedLogo) return
    const html = `<img src="${generatedLogo}" alt="Logo ${companyName}" style="width: 150px; height: auto; float: left; margin-right: 15px;" />`
    onInsertLogo(html)
    toast.success('Logo di-insert ke Kop Surat!')
  }

  return (
    <div className="border border-purple-300 bg-purple-50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-[10px] font-bold text-purple-800">Generator Logo Perusahaan</span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode('prompt')}
          className={`flex-1 px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-center gap-1 ${
            mode === 'prompt' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300'
          }`}
        >
          <Sparkles className="w-3 h-3" /> Buat Baru (Prompt)
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-center gap-1 ${
            mode === 'upload' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300'
          }`}
        >
          <Upload className="w-3 h-3" /> Recreate (Upload)
        </button>
      </div>

      {/* Mode 1: Prompt-based generation */}
      {mode === 'prompt' && (
        <>
          <div>
            <label className="text-[9px] text-slate-600">Style Logo</label>
            <select
              value={selectedStyle}
              onChange={e => setSelectedStyle(e.target.value)}
              className="w-full mt-0.5 border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-900"
            >
              {LOGO_STYLES.map(s => (
                <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-slate-600">Prompt (opsional — kosongkan untuk auto dari nama perusahaan)</label>
            <textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="contoh: Logo warung makan dengan gambar mangkuk dan sendok, warna merah kuning"
              className="w-full mt-0.5 border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-900 min-h-[40px]"
            />
          </div>
          <button
            onClick={handleGenerateFromPrompt}
            disabled={generating}
            className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-[10px] font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generating ? 'Generating...' : 'Generate Logo dari Prompt'}
          </button>
          <p className="text-[8px] text-slate-500">AI buat logo baru dari prompt. ~10-20 detik.</p>
        </>
      )}

      {/* Mode 2: Upload-based recreation */}
      {mode === 'upload' && (
        <>
          <div>
            <label className="text-[9px] text-slate-600">Upload Foto Logo (dari HP/kamera)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 border-2 border-dashed border-purple-300 rounded-lg p-3 text-center cursor-pointer hover:bg-purple-100"
            >
              {uploadedImage ? (
                <img src={uploadedImage} alt="Uploaded logo" className="max-h-20 mx-auto rounded" />
              ) : (
                <div className="text-[10px] text-slate-500 py-3">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                  Klik untuk upload foto logo
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          {uploadedImage && (
            <button
              onClick={handleRecreateLogo}
              disabled={generating}
              className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-[10px] font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {generating ? 'Recreating...' : 'Recreate Logo (Clean)'}
            </button>
          )}
          <p className="text-[8px] text-slate-500">Upload foto logo yang ada → AI recreate versi bersih (white bg, no noise). ~10-20 detik.</p>
        </>
      )}

      {/* Preview + Insert */}
      {generatedLogo && (
        <div className="border border-purple-300 bg-white rounded p-2 space-y-2">
          <div className="flex items-center justify-center bg-slate-50 rounded p-2 min-h-[60px]">
            <img src={generatedLogo} alt="Logo preview" className="max-h-16 w-auto" />
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleInsert}
              className="flex-1 px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-medium hover:bg-emerald-700 flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Insert ke Kop Surat
            </button>
            <button
              onClick={() => { setGeneratedLogo(null); setUploadedImage(null) }}
              className="px-2 py-1 bg-white text-slate-600 border border-slate-300 rounded text-[10px] hover:bg-slate-50 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Ulang
            </button>
          </div>
        </div>
      )}

      {!companyName?.trim() && mode === 'prompt' && (
        <p className="text-[9px] text-amber-600 italic">⚠️ Isi "Nama Perusahaan" di form Pekerjaan dulu</p>
      )}
    </div>
  )
}
