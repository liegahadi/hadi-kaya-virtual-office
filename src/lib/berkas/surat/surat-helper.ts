// ============================================================
// DINA v2: SURAT UMAH HELPER
// Generate surat menyurat umum (selain SK/Slip/Laporan)
// Folder: Drive/ANJAYO 16/Surat Menyurat/[Instansi]/
// ============================================================

import { db } from '@/lib/db'

// Mapping instansi → folder name
export const INSTANSI_FOLDER_MAP: Record<string, string> = {
  'BTN': 'BTN',
  'MANDIRI': 'Mandiri',
  'BSB_SYARIAH': 'BSB Syariah',
  'BSB': 'BSB Syariah',
  'KELURAHAN': 'Kelurahan',
  'NOTARIS': 'Notaris',
  'KECAMATAN': 'Kecamatan',
  'PUSKESMAS': 'Puskesmas',
  'KAPOLSEK': 'Kapolsek',
  'DINAS': 'Dinas',
  'CUSTOM': 'Lainnya',
}

/**
 * Detect instansi from text mention.
 */
export function detectInstansi(text: string): string | null {
  const t = text.toUpperCase()
  if (t.includes('BTN')) return 'BTN'
  if (t.includes('MANDIRI')) return 'MANDIRI'
  if (t.includes('BSB') || t.includes('SYARIAH')) return 'BSB_SYARIAH'
  if (t.includes('KELURAHAN')) return 'KELURAHAN'
  if (t.includes('NOTARIS') || t.includes('PPAT')) return 'NOTARIS'
  if (t.includes('KECAMATAN')) return 'KECAMATAN'
  if (t.includes('PUSKESMAS')) return 'PUSKESMAS'
  if (t.includes('KAPOLSEK') || t.includes('POLSEK')) return 'KAPOLSEK'
  if (t.includes('DINAS')) return 'DINAS'
  return null
}

/**
 * Common surat types that DINA can generate.
 */
export const SURAT_TYPES = [
  'Surat Keterangan Kerja',
  'Surat Keterangan Penghasilan',
  'Surat Keterangan Domisili',
  'Surat Keterangan Belum Memiliki Rumah',
  'Surat Pernyataan',
  'Surat Kuasa',
  'Surat Permohonan',
  'Surat Pengantar',
  'Surat Keterangan Tidak Mampu',
  'Surat Keterangan Usaha',
  'Surat Lamaran',
  'Surat Resmi Lainnya',
] as const

export type SuratType = typeof SURAT_TYPES[number]

/**
 * Build surat naming convention.
 * Format: "RAW - [Nama Debitur] - [Jenis Surat] - [Instansi] - v[N].docx"
 */
export function buildSuratFilename(
  customerName: string,
  suratType: string,
  instansi: string,
  version: number,
  extension: string = '.docx'
): string {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  const instansiLabel = INSTANSI_FOLDER_MAP[instansi] || instansi
  return `RAW - ${customerName} - ${suratType} - ${instansiLabel} v${version}${ext}`
}

/**
 * Prompt for Gemini to generate surat content.
 */
export function buildSuratPrompt(params: {
  suratType: string
  instansi: string
  customerName?: string
  customerData?: any
  customInstructions?: string
  tone?: 'formal' | 'semi-formal' | 'formal-bank'
}): string {
  const toneInstruction = params.tone === 'formal-bank'
    ? 'Gunakan bahasa formal bank (sangat resmi, struktur standar bank Indonesia).'
    : params.tone === 'semi-formal'
    ? 'Gunakan bahasa semi-formal (resmi tapi mudah dipahami).'
    : 'Gunakan bahasa formal Indonesia standar (EYD, resmi).'

  return `Anda adalah ahli surat menyurat resmi Indonesia. Buatkan draf surat berikut:

JENIS SURAT: ${params.suratType}
DITUJUKAN KEPADA: ${INSTANSI_FOLDER_MAP[params.instansi] || params.instansi}
${params.customerName ? `NAMA PEMOHON: ${params.customerName}` : ''}
${params.customerData ? `DATA PEMOHON:\n${JSON.stringify(params.customerData, null, 2)}` : ''}
${params.customInstructions ? `INSTRUKSI TAMBAHAN:\n${params.customInstructions}` : ''}

${toneInstruction}

STRUKTUR WAJIB:
1. Kop surat (PT. Marlindo Bangun Persada, Pangkalpinang, Bangka Belitung)
2. Tempat dan tanggal surat
3. Nomor surat (kosongkan untuk diisi manual)
4. Perihal
5. Tujuan (Kepada Yth.)
6. Isi surat (paragraf pembuka, isi, penutup)
7. Tanda tangan (Nama, Jabatan)

OUTPUT: Hanya isi surat (dalam format yang bisa langsung dipakai untuk .docx). Jangan tambahkan penjelasan.`
}

/**
 * Get list of common surat types for DINA to suggest.
 */
export function getSuratSuggestions(): Array<{ type: string; description: string }> {
  return [
    { type: 'Surat Keterangan Kerja', description: 'Untuk konsumen yang butuh keterangan kerja' },
    { type: 'Surat Keterangan Penghasilan', description: 'Untuk verifikasi penghasilan ke bank' },
    { type: 'Surat Keterangan Domisili', description: 'Keterangan domisili konsumen/usaha' },
    { type: 'Surat Keterangan Belum Memiliki Rumah', description: 'Syarat KPR subsidi' },
    { type: 'Surat Pernyataan', description: 'Pernyataan umum (tidak punya rumah, belum menikah, dll)' },
    { type: 'Surat Kuasa', description: 'Memberikan kuasa kepada seseorang' },
    { type: 'Surat Permohonan', description: 'Permohonan resmi ke instansi' },
    { type: 'Surat Pengantar', description: 'Pengantar dari RT/RW atau perusahaan' },
    { type: 'Surat Keterangan Usaha', description: 'Untuk wirausaha yang butuh keterangan usaha' },
    { type: 'Surat Lamaran', description: 'Surat lamaran kerja/resmi lainnya' },
  ]
}
