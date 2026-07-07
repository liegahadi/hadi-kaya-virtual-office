'use client'
// LogoGenerator — Generate company logo via AI (free z-ai-web-dev-sdk)
// Two modes:
// 1. Text-based logo (SVG from company name, no API needed)
// 2. AI image generation (z-ai-web-dev-sdk, free)
//
// After generation, user can insert logo into Kop Surat textarea

import React, { useState } from 'react'
import { Sparkles, Image as ImageIcon, Loader2, Plus, RefreshCw, Type } from 'lucide-react'
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
  const [mode, setMode] = useState<'text' | 'image'>('image')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [generating, setGenerating] = useState(false)
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null)
  const [textColor, setTextColor] = useState('#1a56db')
  const [textBg, setTextBg] = useState('#ffffff')

  // Generate AI image logo
  async function handleGenerateImage() {
    if (!companyName?.trim()) {
      toast.error('Isi "Nama Perusahaan" dulu di form Pekerjaan')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/documents/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          style: LOGO_STYLES.find(s => s.id === selectedStyle)?.desc || 'modern professional',
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

  // Generate text-based SVG logo (no API needed)
  function handleGenerateText() {
    if (!companyName?.trim()) {
      toast.error('Isi "Nama Perusahaan" dulu di form Pekerjaan')
      return
    }
    const initials = companyName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()
    const svg = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="80" fill="${textBg}" rx="8"/>
      <circle cx="40" cy="40" r="25" fill="${textColor}" opacity="0.15"/>
      <text x="40" y="48" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${textColor}" text-anchor="middle">${initials}</text>
      <text x="75" y="35" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${textColor}">${companyName.substring(0, 20)}</text>
      <text x="75" y="50" font-family="Arial, sans-serif" font-size="8" fill="#666">Perumahan • Properti</text>
    </svg>`
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`
    setGeneratedLogo(dataUrl)
    toast.success('Logo text berhasil dibuat! Klik "Insert ke Kop Surat"')
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
          onClick={() => setMode('image')}
          className={`flex-1 px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-center gap-1 ${
            mode === 'image' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300'
          }`}
        >
          <ImageIcon className="w-3 h-3" /> AI Image
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex-1 px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-center gap-1 ${
            mode === 'text' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300'
          }`}
        >
          <Type className="w-3 h-3" /> Text SVG
        </button>
      </div>

      {/* Image mode */}
      {mode === 'image' && (
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
          <button
            onClick={handleGenerateImage}
            disabled={generating}
            className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-[10px] font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generating ? 'Generating...' : 'Generate Logo (AI)'}
          </button>
          <p className="text-[8px] text-slate-500">Free via z-ai SDK. ~10-20 detik per generate.</p>
        </>
      )}

      {/* Text mode */}
      {mode === 'text' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-600">Warna Text</label>
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                className="w-full mt-0.5 h-7 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="text-[9px] text-slate-600">Background</label>
              <input type="color" value={textBg} onChange={e => setTextBg(e.target.value)}
                className="w-full mt-0.5 h-7 border border-slate-300 rounded" />
            </div>
          </div>
          <button
            onClick={handleGenerateText}
            className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-[10px] font-medium hover:bg-purple-700 flex items-center justify-center gap-1.5"
          >
            <Type className="w-3 h-3" /> Generate Logo (Text)
          </button>
          <p className="text-[8px] text-slate-500">Logo SVG dari nama perusahaan. Instant, no API.</p>
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
              onClick={() => setGeneratedLogo(null)}
              className="px-2 py-1 bg-white text-slate-600 border border-slate-300 rounded text-[10px] hover:bg-slate-50 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Ulang
            </button>
          </div>
        </div>
      )}

      {!companyName?.trim() && (
        <p className="text-[9px] text-amber-600 italic">⚠️ Isi "Nama Perusahaan" di form Pekerjaan dulu</p>
      )}
    </div>
  )
}
