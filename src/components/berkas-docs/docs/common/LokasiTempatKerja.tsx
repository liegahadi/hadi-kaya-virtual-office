// LOKASI TEMPAT KERJA - Photo upload + Google Maps embed + form fields
import React from 'react'
import { BerkasState, JobType } from '@/lib/berkas/types'

export function LokasiTempatKerja({ state, onUpdate, onPhotoUpload }: {
  state: BerkasState
  onUpdate: (field: string, val: any) => void
  onPhotoUpload: (field: string, file: File) => void
}) {
  const a = state.applicant as any
  const isWirausaha = state.applicant.jobType === JobType.ENTREPRENEUR
  const mapsEmbed = a.workplaceMapsLink ? getMapsEmbed(a.workplaceMapsLink) : ''

  function getMapsEmbed(link: string): string {
    // Extract coordinates or place from Google Maps link
    const coordsMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (coordsMatch) return `https://maps.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}&z=16&output=embed`
    const placeMatch = link.match(/place\/([^\/]+)/)
    if (placeMatch) return `https://maps.google.com/maps?q=${decodeURIComponent(placeMatch[1])}&z=16&output=embed`
    return `https://maps.google.com/maps?q=${encodeURIComponent(link)}&z=16&output=embed`
  }

  return (
    <div className="space-y-4 p-3 rounded-lg border border-blue-500/30 bg-blue-950/10">
      <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2">Lokasi Tempat {isWirausaha ? 'Usaha' : 'Kerja'}</h4>

      {/* Photo uploads */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-muted-foreground">Foto Tampak Depan</label>
          <div className="mt-1 border-2 border-dashed border-blue-500/30 rounded-lg p-2 text-center">
            {a.workplaceFrontPhoto ? (
              <img src={a.workplaceFrontPhoto} alt="Tampak Depan" className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="h-32 flex items-center justify-center text-[10px] text-muted-foreground">Upload foto tampak depan</div>
            )}
            <input type="file" accept="image/*" className="hidden" id="workplace-front"
              onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoUpload('workplaceFrontPhoto', f); e.target.value = '' }} />
            <button onClick={() => document.getElementById('workplace-front')?.click()}
              className="mt-1 text-[9px] px-2 py-1 rounded border border-blue-500/30 text-blue-400">Upload</button>
          </div>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">Foto Tampak Dalam</label>
          <div className="mt-1 border-2 border-dashed border-blue-500/30 rounded-lg p-2 text-center">
            {a.workplaceInsidePhoto ? (
              <img src={a.workplaceInsidePhoto} alt="Tampak Dalam" className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="h-32 flex items-center justify-center text-[10px] text-muted-foreground">Upload foto tampak dalam</div>
            )}
            <input type="file" accept="image/*" className="hidden" id="workplace-inside"
              onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoUpload('workplaceInsidePhoto', f); e.target.value = '' }} />
            <button onClick={() => document.getElementById('workplace-inside')?.click()}
              className="mt-1 text-[9px] px-2 py-1 rounded border border-blue-500/30 text-blue-400">Upload</button>
          </div>
        </div>
      </div>

      {/* Google Maps link + embed */}
      <div>
        <label className="text-[9px] text-muted-foreground">Google Maps Link (paste dari Google Maps)</label>
        <input value={a.workplaceMapsLink || ''} onChange={e => onUpdate('workplaceMapsLink', e.target.value)}
          placeholder="https://maps.app.goo.gl/... atau https://maps.google.com/..."
          className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
        {mapsEmbed && (
          <iframe src={mapsEmbed} className="w-full h-48 mt-2 rounded-lg border border-blue-500/30" title="Lokasi" />
        )}
      </div>

      {/* Workplace info */}
      <div className="grid grid-cols-2 gap-2">
        {!isWirausaha && (
          <>
            <div>
              <label className="text-[9px] text-muted-foreground">Nama Atasan</label>
              <input value={a.atasanName || ''} onChange={e => onUpdate('atasanName', e.target.value)}
                className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">No. HP Atasan</label>
              <input value={a.atasanNip || ''} onChange={e => onUpdate('atasanNip', e.target.value)}
                className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
            </div>
          </>
        )}
        <div>
          <label className="text-[9px] text-muted-foreground">Jam Operasional</label>
          <input value={a.workplaceJamOperasional || ''} onChange={e => onUpdate('workplaceJamOperasional', e.target.value)}
            placeholder="08:00 - 17:00" className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">Waktu Bisa Dihubungi</label>
          <input value={a.workplaceWaktuHubungi || ''} onChange={e => onUpdate('workplaceWaktuHubungi', e.target.value)}
            placeholder="Senin-Jumat, 12:00-13:00" className="w-full mt-0.5 bg-background/50 border border-border rounded px-2 py-1 text-xs" />
        </div>
      </div>
    </div>
  )
}
