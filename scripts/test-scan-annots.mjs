// Standalone test of the new pdfjs-based scan-annotations logic
// against the user's actual annotated PDFs.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const KEYWORD_SUGGESTIONS = [
  { keywords: ['nama debitur', 'nama konsumen', 'nama pemohon', 'nama lengkap'], mapping: 'customer.name', label: 'Nama Lengkap' },
  { keywords: ['nama pasangan', 'nama suami', 'nama istri'], mapping: 'customer.spouseName', label: 'Nama Pasangan' },
  { keywords: ['nik debitur', 'no ktp debitur', 'no.ktp debitur', 'nik konsumen'], mapping: 'customer.nik', label: 'NIK' },
  { keywords: ['nik pasangan', 'ktp pasangan'], mapping: 'customer.spouseNik', label: 'NIK Pasangan' },
  { keywords: ['ttl', 'tempat.tgl', 'tempat tanggal'], mapping: 'customer.pobDob', label: 'Tempat, Tgl Lahir' },
  { keywords: ['tanggal lahir', 'tgl lahir', 'dob'], mapping: 'customer.birthDate', label: 'Tanggal Lahir' },
  { keywords: ['tempat lahir'], mapping: 'customer.birthPlace', label: 'Tempat Lahir' },
  { keywords: ['jenis kelamin', 'gender', 'sex'], mapping: 'customer.gender', label: 'Jenis Kelamin' },
  { keywords: ['agama', 'religion'], mapping: 'customer.religion', label: 'Agama' },
  { keywords: ['status perkawinan', 'status kawin', 'menikah', 'marital'], mapping: 'customer.maritalStatus', label: 'Status Pernikahan' },
  { keywords: ['alamat ktp', 'alamat sesuai ktp', 'alamat debitur', 'alamat pemohon'], mapping: 'customer.ktpAddress', label: 'Alamat KTP' },
  { keywords: ['rt/rw', 'rtrw', 'rt rw', 'rt / rw'], mapping: 'customer.rtRw', label: 'RT/RW' },
  { keywords: ['kelurahan sertipikat', 'kelurahan sertifikat'], mapping: 'property.certificateKelurahan', label: 'Kelurahan Sertipikat' },
  { keywords: ['no sertipikat', 'no. sertipikat', 'nomor sertipikat', 'no sertifikat', 'no. sertifikat', 'nomor sertifikat'], mapping: 'property.certificateNumber', label: 'No Sertipikat' },
  { keywords: ['kelurahan', 'desa'], mapping: 'customer.kelurahan', label: 'Kelurahan' },
  { keywords: ['kecamatan'], mapping: 'customer.kecamatan', label: 'Kecamatan' },
  { keywords: ['kota', 'city'], mapping: 'customer.city', label: 'Kota' },
  { keywords: ['kode pos', 'postal', 'zipcode'], mapping: 'customer.postalCode', label: 'Kode Pos' },
  { keywords: ['no hp', 'no. hp', 'telepon', 'telp', 'hp debitur', 'phone', 'whatsapp'], mapping: 'customer.phone', label: 'No HP/Telp' },
  { keywords: ['npwp'], mapping: 'customer.npwpNumber', label: 'NPWP' },
  { keywords: ['rekening', 'no rek', 'no. rek'], mapping: 'customer.btnAccountNumber', label: 'No Rekening' },
  { keywords: ['pekerjaan debitur', 'pekerjaan pemohon', 'jabatan', 'job', 'position'], mapping: 'customer.workPosition', label: 'Pekerjaan' },
  { keywords: ['perusahaan debitur', 'tempat kerja', 'nama perusahaan'], mapping: 'customer.companyName', label: 'Nama Perusahaan' },
  { keywords: ['nama perumahan', 'nama proyek', 'perumahan', 'project name'], mapping: 'property.projectName', label: 'Nama Perumahan' },
  { keywords: ['blok', 'block'], mapping: 'property.blockLetter', label: 'Blok' },
  { keywords: ['no rumah', 'no. rumah', 'house', 'unit'], mapping: 'property.unitNumber', label: 'No Rumah' },
  { keywords: ['luas tanah', 'land'], mapping: 'property.landSize', label: 'Luas Tanah' },
  { keywords: ['luas bangunan', 'building'], mapping: 'property.buildingSize', label: 'Luas Bangunan' },
  { keywords: ['alamat perumahan', 'alamat properti', 'alamat rumah'], mapping: 'property.address', label: 'Alamat Properti' },
  { keywords: ['nama pt', 'nama developer', 'perusahaan developer'], mapping: 'company.companyName', label: 'Nama PT' },
  { keywords: ['nik direktur', 'no ktp direktur', 'ktp direktur'], mapping: 'company.directorNik', label: 'NIK Direktur' },
  { keywords: ['nama direktur', 'direktur'], mapping: 'company.directorName', label: 'Nama Direktur' },
  { keywords: ['tanggal hari ini', 'tanggal bulan tahun', 'tgl hari ini', 'today', 'date'], mapping: 'system.todayDate', label: 'Tanggal' },
]

function suggest(text) {
  const cleaned = text.toLowerCase().trim().replace(/^[\s\-\[\]()]+|[\s\-\[\]()]+$/g, '')
  for (const s of KEYWORD_SUGGESTIONS) {
    if (s.keywords.some(kw => cleaned.includes(kw))) return s.mapping
  }
  return null
}

function dedupe(items) {
  if (!items?.length) return ''
  const seen = []
  for (const it of items) {
    const t = String(it || '').trim()
    if (t && !seen.includes(t)) seen.push(t)
  }
  let j = seen.join(' ')
  if (j.length >= 4) {
    const h = Math.floor(j.length / 2)
    if (j.slice(0, h) === j.slice(h)) j = j.slice(0, h)
  }
  return j.trim()
}

const files = [
  '/home/z/my-project/upload/SPR MANDIRI.pdf',
  '/home/z/my-project/upload/SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI NEW 2025(1) (8).pdf',
]

for (const pdfPath of files) {
  console.log('\n\n' + '='.repeat(70))
  console.log('FILE:', pdfPath.split('/').pop())
  console.log('='.repeat(70))
  const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes, disableFontFace: true, isEvalSupported: false, useSystemFonts: true })
  const pdf = await loadingTask.promise
  console.log('Pages:', pdf.numPages)

  let totalFound = 0
  let autoMapped = 0

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 1 })
    let annots = []
    try { annots = await page.getAnnotations() } catch (e) { console.warn(`p${p} err:`, e.message) }
    console.log(`\n--- Page ${p} (${viewport.width}x${viewport.height}) — ${annots.length} annotations ---`)

    annots.forEach((ann, i) => {
      const subtype = String(ann.subtype || '')
      if (!/FreeText|Text|Widget|Stamp|Line|Square|Circle/i.test(subtype)) return
      const rect = ann.rect
      if (!rect || rect.length < 4) return
      const [x1, y1, x2, y2] = rect
      const absW = Math.abs(x2 - x1), absH = Math.abs(y2 - y1)
      if (absW < 5 || absH < 3) return

      const text = dedupe(ann.textContent) || ann.contents || ann.fieldName || ann.title || ''
      const mapping = text ? suggest(text) : null
      const relX = Math.min(x1, x2) / viewport.width
      const relY = 1 - (Math.min(y1, y2) + absH) / viewport.height
      const relW = absW / viewport.width
      const relH = absH / viewport.height

      totalFound++
      if (mapping) autoMapped++

      console.log(`  [${i}] "${text}" → ${mapping || '(no auto-match)'}`)
      console.log(`      rect=(${relX.toFixed(3)}, ${relY.toFixed(3)}, ${relW.toFixed(3)}, ${relH.toFixed(3)})  subtype=${subtype}`)
    })
  }

  console.log(`\n✅ TOTAL: ${totalFound} annotations, ${autoMapped} auto-mapped`)
  try { await loadingTask.destroy() } catch {}
}
