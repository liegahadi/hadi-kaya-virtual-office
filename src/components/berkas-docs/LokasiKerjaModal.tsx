'use client'
// LOKASI KERJA MODAL - Google Maps form + embed
// Features:
// - Form: alamat, link Google Maps (full), short link maps.app.goo.gl (string only for bank),
//   nama atasan, no HP, jam operasional, waktu hubungi
// - Live Google Maps embed (from full link)
// - Photo uploads: tampak depan + tampak dalam
import React, { useState, useEffect } from 'react'
import { X, MapPin, Upload, ImageIcon, Link as LinkIcon, ExternalLink, User } from 'lucide-react'
import { toast } from 'sonner'
import { BerkasState, JobType } from '@/lib/berkas/types'

interface LokasiKerjaModalProps {
  open: boolean
  onClose: () => void
  state: BerkasState
  onUpdate: (field: string, val: any) => void
}

// Generate Google Maps embed URL from a link
// Uses the embed format that doesn't show "Some custom on-map content could not be displayed" warning
function getMapsEmbed(link: string): string {
  if (!link) return ''
  // Try coords pattern: @-2.1234,106.4567
  const coordsMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coordsMatch) {
    return `https://maps.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}&z=16&output=embed`
  }
  // Try place pattern: /place/City+Name/
  const placeMatch = link.match(/place\/([^\/\?]+)/)
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ')
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=16&output=embed`
  }
  // For short links (maps.app.goo.gl/...) - try to use as query
  // Note: short links may show warning, suggest user to use full link with coordinates
  if (link.includes('maps.app.goo.gl')) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(link)}&z=16&output=embed`
  }
  // General URL — use as search query
  return `https://maps.google.com/maps?q=${encodeURIComponent(link)}&z=16&output=embed`
}

export function LokasiKerjaModal({ open, onClose, state, onUpdate }: LokasiKerjaModalProps) {
  const a = state.applicant as any
  const isWirausaha = state.applicant.jobType === JobType.ENTREPRENEUR
  const mapsEmbed = a.workplaceMapsLink ? getMapsEmbed(a.workplaceMapsLink) : ''
  // Check if the link is a short link (may show warning)
  const isShortLink = a.workplaceMapsLink?.includes('maps.app.goo.gl')
  // Check if Google Maps API key is configured (for auto-generate static map)
  const [hasMapsKey, setHasMapsKey] = useState(false)
  useEffect(() => {
    if (open) {
      fetch('/api/documents/google-docs/status')
        .then(r => r.json())
        .then(d => setHasMapsKey(!!d.debug?.mapsApiKey || false))
        .catch(() => {})
    }
  }, [open])

  async function handlePhotoUpload(field: string, file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file max 5MB')
      return
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read'))
        reader.readAsDataURL(file)
      })
      onUpdate(field, dataUrl)
      toast.success('Foto berhasil diupload!')
    } catch {
      toast.error('Gagal upload foto')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white text-slate-900 w-full h-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden rounded-lg" style={{ colorScheme: 'light' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              Lokasi Tempat {isWirausaha ? 'Usaha' : 'Kerja'}
            </h2>
            <span className="text-xs text-slate-500">· {state.applicant.fullName || 'Konsumen'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 bg-slate-50">
          {/* LEFT: Form */}
          <div className="space-y-4">
            {/* Address & Maps Link */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" /> Alamat & Lokasi
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Alamat Lengkap</label>
                  <textarea
                    value={a.companyAddress || ''}
                    onChange={e => onUpdate('companyAddress', e.target.value)}
                    placeholder="Jl. Contoh No. 123, Pangkalpinang"
                    rows={2}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Link Google Maps (full URL — untuk embed peta)
                  </label>
                  <input
                    type="text"
                    value={a.workplaceMapsLink || ''}
                    onChange={e => onUpdate('workplaceMapsLink', e.target.value)}
                    placeholder="https://maps.google.com/... atau https://www.google.com/maps/..."
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Buka Google Maps → klik kanan lokasi → copy link → paste di sini
                  </p>
                  {isShortLink && (
                    <p className="text-[10px] text-amber-600 mt-1 bg-amber-50 border border-amber-200 rounded p-1.5">
                      ⚠️ Link pendek (maps.app.goo.gl) mungkin menampilkan warning di peta. Untuk hasil terbaik, gunakan link full yang mengandung koordinat (contoh: <code>https://www.google.com/maps/@-2.123,106.456,17z</code>).
                    </p>
                  )}
                </div>
                {/* NEW: Short link field (string only, for bank requirement) */}
                <div>
                  <label className="text-xs text-slate-600 mb-1 block flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Short Link Google Maps (untuk bank)
                  </label>
                  <input
                    type="text"
                    value={a.workplaceMapsShortLink || ''}
                    onChange={e => onUpdate('workplaceMapsShortLink', e.target.value)}
                    placeholder="https://maps.app.goo.gl/xxxxx"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Short link <code>maps.app.goo.gl/...</code> — khusus untuk dikirim ke bank (tidak terhubung ke peta di sini)
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" /> Kontak
              </h3>
              <div className="space-y-3">
                {!isWirausaha && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Nama Atasan</label>
                        <input
                          type="text"
                          value={a.atasanName || ''}
                          onChange={e => onUpdate('atasanName', e.target.value)}
                          placeholder="Budi Santoso"
                          className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">No. HP Atasan</label>
                        <input
                          type="text"
                          value={a.atasanNip || ''}
                          onChange={e => onUpdate('atasanNip', e.target.value)}
                          placeholder="0812-xxxx-xxxx"
                          className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Jam Operasional</label>
                    <input
                      type="text"
                      value={a.workplaceJamOperasional || ''}
                      onChange={e => onUpdate('workplaceJamOperasional', e.target.value)}
                      placeholder="08:00 - 17:00"
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Waktu Bisa Dihubungi</label>
                    <input
                      type="text"
                      value={a.workplaceWaktuHubungi || ''}
                      onChange={e => onUpdate('workplaceWaktuHubungi', e.target.value)}
                      placeholder="Senin-Jumat, 12:00-13:00"
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload (depan + dalam only, no denah) */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-500" /> Foto Tempat {isWirausaha ? 'Usaha' : 'Kerja'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Tampak Depan */}
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Tampak Depan</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center hover:border-blue-500 transition-colors">
                    {a.workplaceFrontPhoto ? (
                      <img src={a.workplaceFrontPhoto} alt="Tampak Depan" className="w-full h-32 object-cover rounded" />
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                        <Upload className="w-6 h-6 mb-1" />
                        <p className="text-[10px]">Upload foto</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="workplace-front-modal"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload('workplaceFrontPhoto', f); e.target.value = '' }}
                    />
                    <button
                      onClick={() => document.getElementById('workplace-front-modal')?.click()}
                      className="mt-2 text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-600 hover:bg-blue-50"
                    >
                      {a.workplaceFrontPhoto ? 'Ganti' : 'Upload'}
                    </button>
                  </div>
                </div>
                {/* Tampak Dalam */}
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Tampak Dalam</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center hover:border-blue-500 transition-colors">
                    {a.workplaceInsidePhoto ? (
                      <img src={a.workplaceInsidePhoto} alt="Tampak Dalam" className="w-full h-32 object-cover rounded" />
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                        <Upload className="w-6 h-6 mb-1" />
                        <p className="text-[10px]">Upload foto</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="workplace-inside-modal"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload('workplaceInsidePhoto', f); e.target.value = '' }}
                    />
                    <button
                      onClick={() => document.getElementById('workplace-inside-modal')?.click()}
                      className="mt-2 text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-600 hover:bg-blue-50"
                    >
                      {a.workplaceInsidePhoto ? 'Ganti' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshot Peta Upload (manual fallback for map image in doc) */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" /> Screenshot Peta Google Maps (untuk dokumen)
              </h3>
              <p className="text-[10px] text-slate-500 mb-2">
                Screenshot peta dari Google Maps (PrtSc / Cmd+Shift+4) → upload di sini.
                Gambar ini akan ditempel di dokumen Lokasi Kerja.
                {hasMapsKey ? ' (Atau set GOOGLE_MAPS_API_KEY untuk auto-generate)' : ''}
              </p>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center hover:border-blue-500 transition-colors">
                {a.workplaceMapScreenshot ? (
                  <img src={a.workplaceMapScreenshot} alt="Screenshot Peta" className="w-full h-40 object-cover rounded" />
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                    <Upload className="w-6 h-6 mb-1" />
                    <p className="text-[10px]">Upload screenshot peta</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="workplace-map-screenshot"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload('workplaceMapScreenshot', f); e.target.value = '' }}
                />
                <button
                  onClick={() => document.getElementById('workplace-map-screenshot')?.click()}
                  className="mt-2 text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-600 hover:bg-blue-50"
                >
                  {a.workplaceMapScreenshot ? 'Ganti' : 'Upload'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview - Google Maps embed */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" /> Preview Lokasi
                </h3>
                {a.workplaceMapsLink && (
                  <a
                    href={a.workplaceMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Buka di Google Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200" style={{ height: '500px' }}>
                {mapsEmbed ? (
                  <iframe
                    src={mapsEmbed}
                    className="w-full h-full border-0"
                    title="Lokasi Tempat Kerja"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6">
                    <MapPin className="w-12 h-12 mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Belum ada lokasi</p>
                    <p className="text-xs mt-1 text-center">Paste Google Maps link (full URL) di form sebelah kiri untuk menampilkan peta.</p>
                  </div>
                )}
              </div>
              {/* Short link display (if filled) */}
              {a.workplaceMapsShortLink && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-[10px] text-blue-600 font-bold uppercase mb-0.5 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Short Link untuk Bank
                  </p>
                  <p className="text-[11px] font-mono text-blue-800 break-all">{a.workplaceMapsShortLink}</p>
                </div>
              )}
            </div>

            {/* Photo previews (depan + dalam only) */}
            {(a.workplaceFrontPhoto || a.workplaceInsidePhoto) && (
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-500" /> Foto Tempat
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {a.workplaceFrontPhoto && (
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Tampak Depan</p>
                      <img src={a.workplaceFrontPhoto} alt="Depan" className="w-full h-32 object-cover rounded" />
                    </div>
                  )}
                  {a.workplaceInsidePhoto && (
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Tampak Dalam</p>
                      <img src={a.workplaceInsidePhoto} alt="Dalam" className="w-full h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white px-5 py-3 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            💡 Data tersimpan otomatis ke form konsumen saat kamu menutup modal.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
