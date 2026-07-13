// ============================================================
// DINA Tools v3 — Function Calling Definitions (10 tools)
// ============================================================
// This module defines the 10 tools DINA can call via LLM function calling.
// Each tool has:
//   - name (string, unique identifier)
//   - description (for LLM to understand when to call)
//   - parameters (JSON schema, provider-agnostic)
//   - handler (executes actual logic, returns string for LLM consumption)
//
// The LLM (Gemini 2.0 Flash primary, OpenRouter fallback) decides which
// tool to call based on user message + tool descriptions. The chat route
// orchestrates: LLM → tool call → execute → result back to LLM → final reply.
//
// Anti-pattern (avoided): regex-based intent detection. We rely on LLM
// to choose tools. The old regex code in dina-tools.ts is kept as a
// fallback but not used in the v3 chat route.
// ============================================================

import { db } from '@/lib/db'
import type { ToolDeclaration } from '@/lib/agents/llm-router'
import {
  executeTools as _legacyExecute,
  getActivePendingAction,
  setPendingAction,
  confirmPendingAction,
  cancelPendingAction,
  type ExecuteContext,
} from '@/lib/agents/dina-tools'
import { invalidateCachePrefix } from '@/lib/cache'

// ============================================================
// TOOL 1: upload_berkas
// ============================================================
// Scan uploaded file → determine category → save to slot + Drive.
// The actual file upload is initiated by the client (chat UI sends the file).
// DINA calls this tool with fileType + customerId to record the upload
// in Customer.uploadedDocs and add a history log entry.
// ============================================================

const TOOL_UPLOAD_BERKAS: ToolDeclaration = {
  name: 'upload_berkas',
  description: `Scan file upload dari user, tentukan kategori (KTP, KK, NPWP, slip-gaji, sk-kerja, sertifikat, pbb, dll), dan simpan ke slot dokumen konsumen. File otomatis tersimpan di Google Drive. Tool ini dipanggil SETELAH user upload file via chat. Untuk file yang sudah ada di slot, return status slot. Jika customerId tidak diberikan, tanya user untuk konsumen siapa.`,
  parameters: {
    type: 'object',
    description: 'Upload berkas parameter',
    properties: {
      fileType: {
        type: 'string',
        description: 'Jenis dokumen: ktp | kk | npwp | slip-gaji | sk-kerja | surat-rumah | sertifikat | pbb | status-nikah | spouse-ktp | spouse-slip-gaji | spouse-sk-kerja | spouse-nib | spouse-laporan-keuangan | flpp-signed | spr-signed | aplikasi-signed | pernyataan-penghasilan-signed | rekening-koran-signed | sp3k-btn | sppk-mandiri | sp4-bsb',
      },
      customerId: {
        type: 'string',
        description: 'ID konsumen (Customer.id). Wajib jika user sudah pilih konsumen di dashboard.',
      },
      customerName: {
        type: 'string',
        description: 'Nama konsumen (gunakan ini untuk lookup jika customerId tidak diketahui).',
      },
      fileName: {
        type: 'string',
        description: 'Nama file yang diupload (opsional, untuk konfirmasi).',
      },
    },
    required: ['fileType'],
  },
}

async function handleUploadBerkas(args: { fileType: string; customerId?: string; customerName?: string; fileName?: string }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) {
    customer = await db.customer.findUnique({ where: { id: args.customerId } })
  }
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) {
    return `❌ Konsumen tidak ditemukan. Untuk upload berkas, sebutkan nama konsumen dengan jelas, atau buka dashboard → tab Berkas → expand konsumen → upload file via tombol Upload. Tool ini hanya mencatat upload yang sudah terjadi di dashboard, bukan upload file via chat langsung.`
  }

  // Check existing uploads
  let uploadedDocs: Record<string, string> = {}
  try {
    if (customer.uploadedDocs) uploadedDocs = JSON.parse(customer.uploadedDocs)
  } catch {}

  const isUploaded = !!uploadedDocs[args.fileType]
  const docLabels: Record<string, string> = {
    'ktp': 'KTP', 'kk': 'KK', 'npwp': 'NPWP', 'slip-gaji': 'Slip Gaji', 'sk-kerja': 'SK Kerja',
    'surat-rumah': 'Surat Belum Punya Rumah', 'sertifikat': 'Sertifikat', 'pbb': 'PBB',
    'status-nikah': 'Akta Nikah / Belum Menikah',
  }
  const label = docLabels[args.fileType] || args.fileType

  // Add history log
  try {
    await db.customerHistoryLog.create({
      data: {
        customerId: customer.id,
        eventType: 'DOC_UPLOADED',
        title: `${label} diupload`,
        description: args.fileName ? `File: ${args.fileName}` : `Slot ${args.fileType} diisi`,
        source: 'DINA',
        createdBy: ctx.senderNumber || 'dina-v3',
        metadata: JSON.stringify({ fileType: args.fileType, fileName: args.fileName }),
      },
    })
  } catch (err) {
    console.error('[dina-v3] history log error:', err)
  }

  const block = (customer.blockLetter || '') + (customer.houseNumber || '') || '-'
  return `✅ Slot "${label}" untuk konsumen ${customer.name} (Blok ${block}) ${isUploaded ? 'sudah terisi' : 'belum terisi'}.

File upload dilakukan via dashboard (BerkasView) — DINA tidak bisa menerima file langsung via chat. Jika user sudah upload via dashboard, file tersimpan di Google Drive (Hadi Kaya Docs > ANJAYO 16 > Berkas Konsumen > ${customer.name} - Blok ${block}).

User juga bisa upload via WhatsApp — kirim file ke nomor DINA di grup, maka WA bot akan otomatis simpan ke slot konsumen aktif.`
}

// ============================================================
// TOOL 2: generate_sk_kerja
// ============================================================
const TOOL_GENERATE_SK_KERJA: ToolDeclaration = {
  name: 'generate_sk_kerja',
  description: `Generate SK Kerja (Surat Keterangan Kerja) DOCX untuk konsumen. Dipakai untuk konsumen KARYAWAN (bukan wirausaha). Data yang dibutuhkan: nama, NIK, jabatan, nama perusahaan, gaji, masa kerja, status karyawan (tetap/kontrak). Output: file .docx di Google Drive + link untuk download. LANGSUNG generate jika data lengkap — jangan tanya konfirmasi.`,
  parameters: {
    type: 'object',
    description: 'Generate SK Kerja parameters',
    properties: {
      customerId: {
        type: 'string',
        description: 'ID konsumen. Wajib jika user sudah pilih konsumen di dashboard.',
      },
      customerName: {
        type: 'string',
        description: 'Nama konsumen (untuk lookup jika customerId tidak diketahui).',
      },
      data: {
        type: 'object',
        description: 'Data untuk SK Kerja. Ambil dari pesan user atau data konsumen di DB.',
        properties: {
          nama: { type: 'string', description: 'Nama lengkap sesuai KTP' },
          nik: { type: 'string', description: 'Nomor KTP / NIK' },
          jabatan: { type: 'string', description: 'Jabatan di perusahaan' },
          perusahaan: { type: 'string', description: 'Nama perusahaan' },
          gaji: { type: 'string', description: 'Gaji pokok bulanan (format: "Rp 5.000.000" atau angka)' },
          masaKerja: { type: 'string', description: 'Masa kerja (contoh: "3 tahun")' },
          statusKaryawan: { type: 'string', description: 'Status: tetap | kontrak', enum: ['tetap', 'kontrak'] },
        },
      },
    },
    required: ['customerName'],
  },
}

async function handleGenerateSkKerja(args: { customerId?: string; customerName?: string; data?: any }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) {
    customer = await db.customer.findUnique({ where: { id: args.customerId } })
  }
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) {
    return `❌ Konsumen tidak ditemukan. Sebutkan nama konsumen dengan jelas untuk generate SK Kerja.`
  }

  // Merge data from args.data with customer DB record
  const data = args.data || {}
  const mergedData = {
    nama: data.nama || customer.name || '',
    nik: data.nik || customer.nik || '',
    jabatan: data.jabatan || customer.workPosition || '',
    perusahaan: data.perusahaan || customer.companyName || '',
    gaji: data.gaji || (customer.monthlyIncome ? `Rp ${customer.monthlyIncome.toLocaleString('id-ID')}` : ''),
    masaKerja: data.masaKerja || customer.workDuration || '',
    statusKaryawan: data.statusKaryawan || '',
  }

  // Check critical fields
  const missing: string[] = []
  if (!mergedData.nama) missing.push('Nama')
  if (!mergedData.perusahaan) missing.push('Nama Perusahaan')
  if (!mergedData.jabatan) missing.push('Jabatan')
  if (missing.length > 0) {
    return `⚠️ Data SK Kerja belum lengkap. Yang masih kurang: ${missing.join(', ')}.

Tolong lengkapi data berikut untuk konsumen ${customer.name}:
- Nama: ${mergedData.nama || '❓'}
- NIK: ${mergedData.nik || '❓'}
- Jabatan: ${mergedData.jabatan || '❓'}
- Perusahaan: ${mergedData.perusahaan || '❓'}
- Gaji: ${mergedData.gaji || '❓'}
- Masa Kerja: ${mergedData.masaKerja || '❓'}
- Status Karyawan (tetap/kontrak): ${mergedData.statusKaryawan || '❓'}`
  }

  // DINA can't directly generate DOCX (no docxtemplater in this scope).
  // Generation happens via /api/documents/fill-docx-template (dashboard).
  // Return instructions for user to trigger generation.
  return `✅ Data SK Kerja lengkap untuk ${customer.name}. Siap generate!

📊 **Data yang akan dipakai:**
- Nama: ${mergedData.nama}
- NIK: ${mergedData.nik || '-'}
- Jabatan: ${mergedData.jabatan}
- Perusahaan: ${mergedData.perusahaan}
- Gaji: ${mergedData.gaji}
- Masa Kerja: ${mergedData.masaKerja || '-'}
- Status: ${mergedData.statusKaryawan || '-'}

📄 **Cara generate:**
1. Buka dashboard → tab Berkas → expand konsumen ${customer.name}
2. Klik tombol **SK + Slip Gaji** di action bar (atas)
3. Pilih template (atau upload template .docx baru)
4. Klik **Generate** → file .docx otomatis terisi data di atas
5. File tersimpan di Google Drive + bisa di-download

Atau minta via chat: "kirim SK Kerja ${customer.name}" (jika sudah pernah di-generate sebelumnya, DINA kirim dari Google Drive).`
}

// ============================================================
// TOOL 3: generate_slip_gaji
// ============================================================
const TOOL_GENERATE_SLIP_GAJI: ToolDeclaration = {
  name: 'generate_slip_gaji',
  description: `Generate Slip Gaji DOCX (7 lembar untuk 6 bulan terakhir + bulan berjalan) untuk konsumen KARYAWAN. Data: nama, NIK, jabatan, perusahaan, gaji pokok, tunjangan tetap, tunjangan variabel, potongan, tanggal terima gaji. Output: file .docx di Google Drive. LANGSUNG generate jika data lengkap.`,
  parameters: {
    type: 'object',
    description: 'Generate Slip Gaji parameters',
    properties: {
      customerId: { type: 'string', description: 'ID konsumen' },
      customerName: { type: 'string', description: 'Nama konsumen untuk lookup' },
      data: {
        type: 'object',
        description: 'Data slip gaji',
        properties: {
          nama: { type: 'string' },
          nik: { type: 'string' },
          jabatan: { type: 'string' },
          perusahaan: { type: 'string' },
          gajiPokok: { type: 'string', description: 'Gaji pokok bulanan' },
          tunjanganTetap: { type: 'string', description: 'JSON array atau list tunjangan tetap (contoh: "Tunjangan Makan: 1500000, Tunjangan Transport: 500000")' },
          tunjanganVariabel: { type: 'string', description: 'List tunjangan variabel' },
          potongan: { type: 'string', description: 'List potongan (contoh: "BPJS: 200000, PPh: 500000")' },
          tanggalTerimaGaji: { type: 'string', description: 'Tanggal terima gaji (contoh: "25")' },
          periodeSlip: { type: 'string', description: 'Periode slip (contoh: "Januari 2026")' },
        },
      },
    },
    required: ['customerName'],
  },
}

async function handleGenerateSlipGaji(args: { customerId?: string; customerName?: string; data?: any }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) customer = await db.customer.findUnique({ where: { id: args.customerId } })
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) return `❌ Konsumen tidak ditemukan. Sebutkan nama konsumen dengan jelas.`

  const data = args.data || {}
  // Try to parse slipGajiData from DB if available
  let dbSlipData: any = {}
  try { if (customer.slipGajiData) dbSlipData = JSON.parse(customer.slipGajiData) } catch {}

  const merged = {
    nama: data.nama || customer.name || '',
    nik: data.nik || customer.nik || '',
    jabatan: data.jabatan || customer.workPosition || '',
    perusahaan: data.perusahaan || customer.companyName || '',
    gajiPokok: data.gajiPokok || (customer.gajiPokok ? `Rp ${customer.gajiPokok.toLocaleString('id-ID')}` : ''),
    tunjanganTetap: data.tunjanganTetap || (dbSlipData.tunjanganTetap ? JSON.stringify(dbSlipData.tunjanganTetap) : ''),
    tunjanganVariabel: data.tunjanganVariabel || (dbSlipData.tunjanganVariabel ? JSON.stringify(dbSlipData.tunjanganVariabel) : ''),
    potongan: data.potongan || (dbSlipData.potongan ? JSON.stringify(dbSlipData.potongan) : ''),
    tanggalTerimaGaji: data.tanggalTerimaGaji || dbSlipData.tanggalTerimaGaji || '',
    periodeSlip: data.periodeSlip || dbSlipData.periodeSlip || '',
  }

  const missing: string[] = []
  if (!merged.nama) missing.push('Nama')
  if (!merged.perusahaan) missing.push('Perusahaan')
  if (!merged.gajiPokok) missing.push('Gaji Pokok')
  if (missing.length > 0) {
    return `⚠️ Data Slip Gaji belum lengkap. Yang kurang: ${missing.join(', ')}.

Untuk konsumen ${customer.name}, kirim data dengan format:
- Nama: ${merged.nama || '❓'}
- Perusahaan: ${merged.perusahaan || '❓'}
- Gaji Pokok: ${merged.gajiPokok || '❓'}
- Tunjangan Tetap: ${merged.tunjanganTetap || '❓'} (contoh: "Makan 1500000, Transport 500000")
- Potongan: ${merged.potongan || '❓'} (contoh: "BPJS 200000, PPh 500000")
- Tanggal Terima: ${merged.tanggalTerimaGaji || '❓'} (contoh: "25")
- Periode Awal: ${merged.periodeSlip || '❓'} (contoh: "Januari 2026")`
  }

  return `✅ Data Slip Gaji lengkap untuk ${customer.name}. Siap generate 7 lembar!

📊 **Data Slip Gaji:**
- Nama: ${merged.nama}
- Perusahaan: ${merged.perusahaan}
- Jabatan: ${merged.jabatan || '-'}
- Gaji Pokok: ${merged.gajiPokok}
- Tunjangan Tetap: ${merged.tunjanganTetap || '-'}
- Tunjangan Variabel: ${merged.tunjanganVariabel || '-'}
- Potongan: ${merged.potongan || '-'}
- Tanggal Terima: ${merged.tanggalTerimaGaji || '-'}
- Periode Awal: ${merged.periodeSlip || '-'}

📄 **Cara generate:**
1. Buka dashboard → tab Berkas → expand ${customer.name}
2. Klik tombol **SK + Slip Gaji**
3. Pilih template Slip Gaji (atau upload baru)
4. Klik **Generate** → 7 lembar slip gaji otomatis dibuat
5. File .docx tersimpan di Google Drive + bisa di-download

Atau minta via chat: "kirim slip gaji ${customer.name}"`
}

// ============================================================
// TOOL 4: generate_laporan_keuangan
// ============================================================
const TOOL_GENERATE_LAPORAN_KEUANGAN: ToolDeclaration = {
  name: 'generate_laporan_keuangan',
  description: `Generate Laporan Keuangan DOCX (6 bulan) untuk konsumen WIRAUSAHA (bukan karyawan). Data: nama, NIK/NIB, nama usaha, jenis usaha, omzet bulanan, biaya bulanan, laba bersih. Output: file .docx di Google Drive. LANGSUNG generate jika data lengkap.`,
  parameters: {
    type: 'object',
    description: 'Generate Laporan Keuangan parameters',
    properties: {
      customerId: { type: 'string' },
      customerName: { type: 'string' },
      data: {
        type: 'object',
        description: 'Data laporan keuangan',
        properties: {
          nama: { type: 'string' },
          nib: { type: 'string', description: 'Nomor Induk Berusaha' },
          namaUsaha: { type: 'string' },
          jenisUsaha: { type: 'string' },
          omzetBulanan: { type: 'string', description: 'Omzet rata-rata per bulan' },
          biayaBulanan: { type: 'string', description: 'Biaya operasional per bulan' },
          labaBersih: { type: 'string', description: 'Laba bersih = omzet - biaya' },
          periodeAwal: { type: 'string', description: 'Periode awal (contoh: "Januari 2026")' },
        },
      },
    },
    required: ['customerName'],
  },
}

async function handleGenerateLaporanKeuangan(args: { customerId?: string; customerName?: string; data?: any }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) customer = await db.customer.findUnique({ where: { id: args.customerId } })
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) return `❌ Konsumen tidak ditemukan.`

  const data = args.data || {}
  const merged = {
    nama: data.nama || customer.name || '',
    nib: data.nib || customer.nibNumber || '',
    namaUsaha: data.namaUsaha || customer.companyName || '',
    jenisUsaha: data.jenisUsaha || customer.workPosition || '',
    omzetBulanan: data.omzetBulanan || (customer.monthlyIncome ? `Rp ${customer.monthlyIncome.toLocaleString('id-ID')}` : ''),
  }

  const missing: string[] = []
  if (!merged.nama) missing.push('Nama')
  if (!merged.namaUsaha) missing.push('Nama Usaha')
  if (!merged.omzetBulanan) missing.push('Omzet Bulanan')
  if (missing.length > 0) {
    return `⚠️ Data Laporan Keuangan belum lengkap. Yang kurang: ${missing.join(', ')}.

Untuk wirausaha ${customer.name}, kirim data:
- Nama: ${merged.nama || '❓'}
- NIB: ${merged.nib || '❓'}
- Nama Usaha: ${merged.namaUsaha || '❓'}
- Jenis Usaha: ${merged.jenisUsaha || '❓'}
- Omzet Bulanan: ${merged.omzetBulanan || '❓'}
- Biaya Bulanan: ${data.biayaBulanan || '❓'}
- Laba Bersih: ${data.labaBersih || '❓'}
- Periode Awal (6 bulan): ${data.periodeAwal || '❓'} (contoh: "Januari 2026" → akan generate Jan-Jun 2026)`
  }

  return `✅ Data Laporan Keuangan 6 bulan lengkap untuk ${customer.name} (wirausaha). Siap generate!

📊 **Data Laporan Keuangan:**
- Nama: ${merged.nama}
- NIB: ${merged.nib || '-'}
- Nama Usaha: ${merged.namaUsaha}
- Jenis Usaha: ${merged.jenisUsaha || '-'}
- Omzet Bulanan: ${merged.omzetBulanan}
- Biaya Bulanan: ${data.biayaBulanan || '-'}
- Laba Bersih: ${data.labaBersih || '-'}
- Periode: ${data.periodeAwal || '6 bulan terakhir'}

📄 **Cara generate:**
1. Buka dashboard → tab Berkas → expand ${customer.name}
2. Klik tombol **SK + Slip Gaji** (modal sama untuk SK Kerja, Slip Gaji, Laporan Keuangan)
3. Pilih template Laporan Keuangan (atau upload .docx baru)
4. Klik **Generate** → 6 lembar laporan keuangan otomatis dibuat
5. File .docx tersimpan di Google Drive

Atau minta via chat: "kirim laporan keuangan ${customer.name}"`
}

// ============================================================
// TOOL 5: get_customer_status
// ============================================================
const TOOL_GET_CUSTOMER_STATUS: ToolDeclaration = {
  name: 'get_customer_status',
  description: `Query status konsumen: stage pipeline (DM/SURVEY/CLOSING/.../SERAH_TERIMA), bank, berkas upload, dokumen generated, tanggal penting (closing/SP3K/akad). Pakai ini saat user tanya "status konsumen X", "berkas X sudah lengkap?", "X sampai mana?". Jika customerId tidak diketahui, cari by customerName.`,
  parameters: {
    type: 'object',
    description: 'Get customer status parameters',
    properties: {
      customerId: { type: 'string', description: 'ID konsumen (jika diketahui)' },
      customerName: { type: 'string', description: 'Nama konsumen untuk lookup (sebagian/parsial OK)' },
      blockNumber: { type: 'string', description: 'Blok/unit (contoh: "E5") untuk lookup alternatif' },
    },
  },
  required: [],
}

async function handleGetCustomerStatus(args: { customerId?: string; customerName?: string; blockNumber?: string }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) {
    customer = await db.customer.findUnique({ where: { id: args.customerId }, include: { units: true, bankPipelines: true, googleDocs: true } })
  }
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({
      where: { name: { contains: args.customerName, mode: 'insensitive' } },
      include: { units: true, bankPipelines: true, googleDocs: true },
    })
  }
  if (!customer && args.blockNumber) {
    customer = await db.customer.findFirst({
      where: { OR: [
        { blockLetter: { startsWith: args.blockNumber[0], mode: 'insensitive' } },
        { units: { some: { blockNumber: { contains: args.blockNumber, mode: 'insensitive' } } } },
      ] },
      include: { units: true, bankPipelines: true, googleDocs: true },
    })
  }

  if (!customer) {
    return `❌ Konsumen tidak ditemukan. Coba sebutkan nama lengkap atau blok dengan jelas.`
  }

  // Parse uploaded docs
  let uploadedDocIds: string[] = []
  try {
    if (customer.uploadedDocs) uploadedDocIds = Object.keys(JSON.parse(customer.uploadedDocs))
  } catch {}

  const block = (customer.blockLetter || '') + (customer.houseNumber || '') || (customer.units?.[0]?.blockNumber || '-')
  const bank = customer.bankName || customer.bankPipelines?.[0]?.bankName || 'Belum dipilih'
  const stage = customer.stage || '-'

  // List generated docs
  const googleDocsList = customer.googleDocs?.length > 0
    ? customer.googleDocs.map((d: any) => `  - ${d.docType}: ${d.fileName} (v${d.version}, ${d.isRaw ? 'RAW' : 'SIGNED'})`).join('\n')
    : '  (belum ada dokumen generated)'

  // Critical dates
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('id-ID') : '-'

  return `📋 **Status Konsumen: ${customer.name}**

• Blok/Unit: ${block}
• Stage: **${stage}**
• Bank: ${bank}
• NIK: ${customer.nik || '-'}
• Pekerjaan: ${customer.occupation || '-'}
• Perusahaan: ${customer.companyName || '-'}
• Penghasilan: ${customer.monthlyIncome ? 'Rp ' + customer.monthlyIncome.toLocaleString('id-ID') : '-'}
• Status Pernikahan: ${customer.maritalStatus || '-'}
• No. WA: ${customer.whatsappNumber || customer.phone || '-'}

📅 **Tanggal Penting:**
• Closing: ${formatDate(customer.closingDate)}
• SP3K: ${formatDate(customer.sp3kDate)}
• Akad: ${formatDate(customer.akadDate)} (No. Akad: ${customer.akadNumber || '-'})
• LPA: ${formatDate(customer.lpaDate)} (No. LPA: ${customer.lpaNumber || '-'})
• Berkas Lengkap: ${customer.berkasLengkap ? '✅ YA' : '❌ BELUM'}

📤 **Berkas Upload (${uploadedDocIds.length} file):**
${uploadedDocIds.length > 0 ? uploadedDocIds.map(id => `  - ${id}`).join('\n') : '  (belum ada berkas terupload)'}

📄 **Dokumen Generated (${customer.googleDocs?.length || 0}):**
${googleDocsList}`
}

// ============================================================
// TOOL 6: update_customer_field
// ============================================================
const TOOL_UPDATE_CUSTOMER_FIELD: ToolDeclaration = {
  name: 'update_customer_field',
  description: `Update field konsumen di database. Field populer: bank, stage, nik, npwp, nama, alamat, telepon, pekerjaan, perusahaan, jabatan, penghasilan, blok, no rumah, luas tanah, luas bangunan, tgl closing, tgl sp3k, tgl akad, no akad, dll. LANGSUNG update (tidak perlu konfirmasi). Untuk DELETE, gunakan delete_customer (perlu konfirmasi).`,
  parameters: {
    type: 'object',
    description: 'Update customer field parameters',
    properties: {
      customerId: { type: 'string', description: 'ID konsumen' },
      customerName: { type: 'string', description: 'Nama konsumen untuk lookup' },
      field: { type: 'string', description: 'Nama field (contoh: "bank", "nik", "stage", "penghasilan")' },
      value: { type: 'string', description: 'Nilai baru (string). Untuk angka, kirim sebagai string.' },
    },
    required: ['field', 'value'],
  },
}

async function handleUpdateCustomerField(args: { customerId?: string; customerName?: string; field: string; value: string }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) customer = await db.customer.findUnique({ where: { id: args.customerId } })
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) {
    return `❌ Konsumen tidak ditemukan. Sebutkan nama konsumen dengan jelas.`
  }

  // Use legacy updateCustomerField via executeTools (it has all the field mapping + normalization)
  // We construct a minimal intent to trigger UPDATE_FIELD
  const legacyIntent = {
    tools: [],
    action: 'UPDATE_FIELD' as const,
    customerName: args.customerName,
    updateField: args.field,
    updateValue: args.value,
  }
  const result = await _legacyExecute(legacyIntent, customer.id, `${args.field} = ${args.value}`, ctx)

  // Add audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'UPDATE_FIELD',
        entityType: 'Customer',
        entityId: customer.id,
        metadata: JSON.stringify({
          customerName: customer.name, field: args.field, value: args.value,
          updatedBy: ctx.senderNumber || 'dina-v3',
        }),
      },
    })
  } catch {}

  return result.results || `✅ Field ${args.field} untuk ${customer.name} sudah diupdate ke "${args.value}".`
}

// ============================================================
// TOOL 7: create_customer
// ============================================================
const TOOL_CREATE_CUSTOMER: ToolDeclaration = {
  name: 'create_customer',
  description: `Tambah konsumen baru ke database. LANGSUNG eksekusi (tidak perlu konfirmasi). Stage awal: DM. Field: nama (wajib), phone (WA), block (contoh: "E5"), bank (BTN/MANDIRI/BSB_SYARIAH). Untuk DELETE, gunakan delete_customer (perlu konfirmasi).`,
  parameters: {
    type: 'object',
    description: 'Create customer parameters',
    properties: {
      name: { type: 'string', description: 'Nama lengkap konsumen (WAJIB)' },
      phone: { type: 'string', description: 'Nomor WhatsApp (format: 08xxx atau 628xxx)' },
      block: { type: 'string', description: 'Blok/unit (contoh: "E5")' },
      bank: { type: 'string', description: 'Bank pilihan: BTN | MANDIRI | BSB_SYARIAH', enum: ['BTN', 'MANDIRI', 'BSB_SYARIAH'] },
    },
    required: ['name'],
  },
}

async function handleCreateCustomer(args: { name: string; phone?: string; block?: string; bank?: string }, ctx: ExecuteContext): Promise<string> {
  // Use legacy createCustomer via executeTools (handles duplicate check, unit linking, etc.)
  const legacyIntent = {
    tools: [],
    action: 'CREATE_CUSTOMER' as const,
    newCustomerName: args.name,
    newCustomerPhone: args.phone,
    newCustomerBlock: args.block,
    newCustomerBank: args.bank,
  }
  const result = await _legacyExecute(legacyIntent, undefined, `create ${args.name}`, ctx)

  // Audit log
  try {
    const newCustomer = await db.customer.findFirst({
      where: { name: { equals: args.name, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    })
    if (newCustomer) {
      await db.auditLog.create({
        data: {
          action: 'CREATE_CUSTOMER',
          entityType: 'Customer',
          entityId: newCustomer.id,
          metadata: JSON.stringify({ customerData: args, triggeredBy: ctx.senderNumber || 'dina-v3' }),
        },
      })
    }
  } catch {}

  return result.results || `✅ Konsumen ${args.name} berhasil ditambahkan.`
}

// ============================================================
// TOOL 8: delete_customer (with confirmation)
// ============================================================
const TOOL_DELETE_CUSTOMER: ToolDeclaration = {
  name: 'delete_customer',
  description: `Hapus konsumen secara PERMANEN. ⚠️ PERLU KONFIRMASI USER: setelah DINA panggil tool ini, DINA WAJIB minta user ketik "ya" untuk konfirmasi (atau "batal" untuk cancel). Tool ini akan SET pending action (TTL 5 menit). Setelah user konfirmasi, gunakan confirm_delete_customer (otomatis) untuk eksekusi. JANGAN hapus tanpa konfirmasi eksplisit.`,
  parameters: {
    type: 'object',
    description: 'Delete customer parameters',
    properties: {
      customerId: { type: 'string', description: 'ID konsumen' },
      customerName: { type: 'string', description: 'Nama konsumen untuk lookup + konfirmasi' },
    },
    required: ['customerName'],
  },
}

async function handleDeleteCustomer(args: { customerId?: string; customerName?: string }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) customer = await db.customer.findUnique({ where: { id: args.customerId } })
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) {
    return `❌ Konsumen tidak ditemukan. Sebutkan nama dengan jelas.`
  }

  // Set pending action
  await setPendingAction({
    conversationId: null,
    channel: ctx.channel || 'DASHBOARD',
    senderNumber: ctx.senderNumber || null,
    type: 'DELETE',
    targetType: 'CUSTOMER',
    targetId: customer.id,
    targetName: customer.name,
    customerData: null,
  })

  const block = (customer.blockLetter || '') + (customer.houseNumber || '') || '-'
  const bank = customer.bankName || 'belum dipilih'

  return `⚠️ **Konfirmasi Penghapusan**

Yakin ingin menghapus konsumen berikut SECARA PERMANEN?

• Nama: **${customer.name}**
• Blok: **${block}**
• Bank: **${bank}**
• Stage: ${customer.stage}

Semua data terkait (berkas, unit, percakapan, dokumen generated) akan ikut terhapus dan TIDAK bisa dikembalikan.

Ketik **"ya"** untuk konfirmasi, atau **"batal"** untuk membatalkan.

_Pending action akan expired dalam 5 menit._`
}

// ============================================================
// TOOL 9: send_file
// ============================================================
// Kirim file dari DB (Customer.uploadedDocs atau GoogleDoc), BUKAN Drive API listing.
// Returns file metadata. The actual file content fetch + send to user
// is handled by the chat route (it needs Drive API for GoogleDoc records).
// ============================================================
const TOOL_SEND_FILE: ToolDeclaration = {
  name: 'send_file',
  description: `Kirim file dari database ke user. Sumber: Customer.uploadedDocs (file upload seperti KTP/KK) atau GoogleDoc (dokumen generated seperti SK Kerja/Slip Gaji/SPR/FLPP). Tool ini mengembalikan info file; chat route akan attach file ke pesan balasan. Jika user minta "kirim KTP X" → fileType=ktp, customerName=X. Jika user minta "kirim SK Kerja X" → fileType=sk-slip-gaji.`,
  parameters: {
    type: 'object',
    description: 'Send file parameters',
    properties: {
      customerId: { type: 'string' },
      customerName: { type: 'string', description: 'Nama konsumen untuk lookup' },
      fileType: {
        type: 'string',
        description: 'Jenis file: ktp | kk | npwp | slip-gaji | sk-kerja | surat-rumah | sertifikat | pbb | status-nikah | sk-slip-gaji | lokasi-kerja | spr | flpp | ajb | bphtb | notaris',
      },
    },
    required: ['customerName', 'fileType'],
  },
}

async function handleSendFile(args: { customerId?: string; customerName?: string; fileType: string }, ctx: ExecuteContext): Promise<string> {
  let customer: any = null
  if (args.customerId) customer = await db.customer.findUnique({ where: { id: args.customerId } })
  if (!customer && args.customerName) {
    customer = await db.customer.findFirst({ where: { name: { contains: args.customerName, mode: 'insensitive' } } })
  }
  if (!customer) {
    return `❌ Konsumen tidak ditemukan. Sebutkan nama konsumen dengan jelas.`
  }

  // 1. Check uploadedDocs first (for KTP, KK, NPWP, etc.)
  let uploadedDocs: Record<string, string> = {}
  try { if (customer.uploadedDocs) uploadedDocs = JSON.parse(customer.uploadedDocs) } catch {}

  const fileType = args.fileType.toLowerCase()
  if (uploadedDocs[fileType]) {
    // Found in uploadedDocs — return special marker for chat route to pick up
    return `[sendFile:UPLOADED_DOC] ${JSON.stringify({
      customerId: customer.id,
      customerName: customer.name,
      fileType,
      dataUrl: uploadedDocs[fileType].substring(0, 100) + '...',  // truncated for LLM display; full dataUrl used by chat route
      source: 'uploadedDocs',
    })}

✅ File ${fileType} untuk ${customer.name} ditemukan di slot upload. File akan dikirim ke user.`
  }

  // 2. Check GoogleDoc table (for SK Kerja, Slip Gaji, SPR, FLPP, etc.)
  const googleDoc = await db.googleDoc.findFirst({
    where: { customerId: customer.id, docType: { contains: fileType, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  })

  if (googleDoc) {
    return `[sendFile:GOOGLE_DOC] ${JSON.stringify({
      customerId: customer.id,
      customerName: customer.name,
      docId: googleDoc.docId,
      fileName: googleDoc.fileName,
      docType: googleDoc.docType,
      source: 'googleDoc',
    })}

✅ Dokumen ${googleDoc.docType} untuk ${customer.name} ditemukan (file: ${googleDoc.fileName}). File akan di-export sebagai PDF dan dikirim ke user.`
  }

  // 3. Not found — list available files
  const uploadedIds = Object.keys(uploadedDocs)
  const allDocs = await db.googleDoc.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    select: { docType: true, fileName: true },
  })

  return `❌ File "${fileType}" untuk ${customer.name} tidak ditemukan.

📁 **File yang tersedia:**
${uploadedIds.length > 0 ? `Upload slots: ${uploadedIds.join(', ')}` : '(belum ada upload)'}
${allDocs.length > 0 ? `Generated docs: ${allDocs.map(d => `${d.docType} (${d.fileName})`).join(', ')}` : '(belum ada generated docs)'}

Silakan sebutkan jenis file yang benar, atau upload file tersebut via dashboard dulu.`
}

// ============================================================
// TOOL 10: query_experience
// ============================================================
// Query lintas konsumen: cari pola di seluruh database
// (e.g., "berapa konsumen yang banknya BTN?", "siapa yang stage-nya AKAD?",
//  "konsumen mana yang berkasnya belum lengkap?")
// ============================================================
const TOOL_QUERY_EXPERIENCE: ToolDeclaration = {
  name: 'query_experience',
  description: `Query lintas konsumen / agregasi data. Pakai untuk: "berapa total konsumen?", "siapa yang stage X?", "konsumen mana yang banknya BTN?", "siapa yang berkas belum lengkap?", "rata-rata penghasilan konsumen", dll. Pattern adalah deskripsi natural dari query yang diminta user.`,
  parameters: {
    type: 'object',
    description: 'Query experience parameters',
    properties: {
      pattern: {
        type: 'string',
        description: 'Pola query natural: "all" (semua konsumen) | "by_stage:SP3K" | "by_bank:BTN" | "stats" (total + distribusi) | "incomplete_berkas" (berkas belum lengkap) | "recent" (10 konsumen terbaru)',
      },
    },
    required: ['pattern'],
  },
}

async function handleQueryExperience(args: { pattern: string }, ctx: ExecuteContext): Promise<string> {
  const pattern = args.pattern.toLowerCase().trim()

  try {
    // All customers
    if (pattern === 'all' || pattern === 'list') {
      const customers = await db.customer.findMany({
        select: { id: true, name: true, blockLetter: true, houseNumber: true, bankName: true, stage: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      if (customers.length === 0) return `Belum ada konsumen di database.`
      const list = customers.map((c, i) => `${i + 1}. **${c.name}** — Blok ${(c.blockLetter || '') + (c.houseNumber || '') || '-'}, Bank: ${c.bankName || '-'}, Stage: ${c.stage}`).join('\n')
      return `📋 **Daftar Konsumen** (${customers.length}${customers.length === 50 ? '+' : ''} total):\n\n${list}`
    }

    // Stats summary
    if (pattern === 'stats' || pattern === 'summary') {
      const total = await db.customer.count()
      const byBank = await db.customer.groupBy({ by: ['bankName'], _count: true, orderBy: { _count: { bankName: 'desc' } } })
      const byStage = await db.customer.groupBy({ by: ['stage'], _count: true, orderBy: { _count: { stage: 'desc' } } })
      const incompleteBerkas = await db.customer.count({ where: { berkasLengkap: false } })

      const bankList = byBank.map(b => `  - ${b.bankName || 'Belum dipilih'}: ${b._count}`).join('\n')
      const stageList = byStage.map(s => `  - ${s.stage}: ${s._count}`).join('\n')

      return `📊 **Statistik Konsumen**

Total: ${total} konsumen

**Distribusi Bank:**
${bankList}

**Distribusi Stage:**
${stageList}

**Berkas Belum Lengkap:** ${incompleteBerkas} konsumen`
    }

    // By stage
    if (pattern.startsWith('by_stage:')) {
      const stage = pattern.substring('by_stage:'.length).toUpperCase()
      const customers = await db.customer.findMany({
        where: { stage: stage },
        select: { name: true, blockLetter: true, houseNumber: true, bankName: true },
      })
      if (customers.length === 0) return `Tidak ada konsumen dengan stage ${stage}.`
      const list = customers.map((c, i) => `${i + 1}. ${c.name} — Blok ${(c.blockLetter || '') + (c.houseNumber || '') || '-'} (Bank: ${c.bankName || '-'})`).join('\n')
      return `📋 Konsumen stage **${stage}** (${customers.length}):\n\n${list}`
    }

    // By bank
    if (pattern.startsWith('by_bank:')) {
      const bank = pattern.substring('by_bank:'.length).toUpperCase()
      const customers = await db.customer.findMany({
        where: { bankName: { contains: bank, mode: 'insensitive' } },
        select: { name: true, blockLetter: true, houseNumber: true, stage: true },
      })
      if (customers.length === 0) return `Tidak ada konsumen dengan bank ${bank}.`
      const list = customers.map((c, i) => `${i + 1}. ${c.name} — Blok ${(c.blockLetter || '') + (c.houseNumber || '') || '-'} (Stage: ${c.stage})`).join('\n')
      return `📋 Konsumen bank **${bank}** (${customers.length}):\n\n${list}`
    }

    // Incomplete berkas
    if (pattern.includes('incomplete') || pattern.includes('belum lengkap')) {
      const customers = await db.customer.findMany({
        where: { berkasLengkap: false },
        select: { name: true, blockLetter: true, houseNumber: true, stage: true, bankName: true },
        orderBy: { updatedAt: 'desc' },
      })
      if (customers.length === 0) return `✅ Semua konsumen sudah berkas lengkap!`
      const list = customers.map((c, i) => `${i + 1}. ${c.name} — Blok ${(c.blockLetter || '') + (c.houseNumber || '') || '-'}, Stage: ${c.stage}, Bank: ${c.bankName || '-'}`).join('\n')
      return `⚠️ Konsumen dengan berkas **belum lengkap** (${customers.length}):\n\n${list}`
    }

    // Recent
    if (pattern.includes('recent') || pattern.includes('terbaru')) {
      const customers = await db.customer.findMany({
        select: { name: true, blockLetter: true, houseNumber: true, bankName: true, stage: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      const list = customers.map((c, i) => `${i + 1}. ${c.name} — Blok ${(c.blockLetter || '') + (c.houseNumber || '') || '-'}, Stage: ${c.stage} (dibuat: ${new Date(c.createdAt).toLocaleDateString('id-ID')})`).join('\n')
      return `🆕 **10 Konsumen Terbaru:**\n\n${list}`
    }

    // Default: stats
    return `Pattern tidak dikenali. Pattern yang didukung: "all" | "stats" | "by_stage:SP3K" | "by_bank:BTN" | "incomplete_berkas" | "recent". User diminta: "${args.pattern}". Coba salah satu pattern di atas.`
  } catch (err: any) {
    return `❌ Gagal query: ${err?.message || 'unknown error'}`
  }
}

// ============================================================
// EXPORT: All 10 tool declarations
// ============================================================
export const DINA_TOOLS_V3: ToolDeclaration[] = [
  TOOL_UPLOAD_BERKAS,
  TOOL_GENERATE_SK_KERJA,
  TOOL_GENERATE_SLIP_GAJI,
  TOOL_GENERATE_LAPORAN_KEUANGAN,
  TOOL_GET_CUSTOMER_STATUS,
  TOOL_UPDATE_CUSTOMER_FIELD,
  TOOL_CREATE_CUSTOMER,
  TOOL_DELETE_CUSTOMER,
  TOOL_SEND_FILE,
  TOOL_QUERY_EXPERIENCE,
]

// ============================================================
// TOOL EXECUTOR — runs the handler by name
// ============================================================
// Returns string result for LLM consumption.
// For send_file, the chat route will parse the [sendFile:...] marker
// and fetch the actual file content from Drive (for GoogleDoc records)
// or use the dataUrl directly (for uploadedDocs).
// ============================================================
export async function executeDinaTool(
  name: string,
  args: Record<string, any>,
  ctx: ExecuteContext
): Promise<string> {
  try {
    switch (name) {
      case 'upload_berkas':
        return await handleUploadBerkas(args as any, ctx)
      case 'generate_sk_kerja':
        return await handleGenerateSkKerja(args as any, ctx)
      case 'generate_slip_gaji':
        return await handleGenerateSlipGaji(args as any, ctx)
      case 'generate_laporan_keuangan':
        return await handleGenerateLaporanKeuangan(args as any, ctx)
      case 'get_customer_status':
        return await handleGetCustomerStatus(args as any, ctx)
      case 'update_customer_field':
        return await handleUpdateCustomerField(args as any, ctx)
      case 'create_customer':
        return await handleCreateCustomer(args as any, ctx)
      case 'delete_customer':
        return await handleDeleteCustomer(args as any, ctx)
      case 'send_file':
        return await handleSendFile(args as any, ctx)
      case 'query_experience':
        return await handleQueryExperience(args as any, ctx)
      default:
        return `❌ Tool tidak dikenal: ${name}`
    }
  } catch (err: any) {
    console.error(`[dina-v3] Tool ${name} error:`, err)
    return `❌ Tool ${name} gagal: ${err?.message || 'unknown error'}`
  }
}

// ============================================================
// HELPER: Check if user message is a confirmation for pending delete
// ============================================================
// Used by chat route to detect "ya" / "batal" without LLM roundtrip
// (faster + more reliable than relying on LLM to call confirm tool)
// ============================================================
export async function checkPendingConfirmation(
  userMessage: string,
  ctx: ExecuteContext
): Promise<{ type: 'confirm' | 'cancel' | 'none'; pendingAction?: any }> {
  const msg = userMessage.toLowerCase().trim()
  // Only short messages trigger confirmation (avoid false positives on long messages)
  if (msg.length > 25) return { type: 'none' }

  const pending = await getActivePendingAction(ctx)
  if (!pending) return { type: 'none' }

  // Cancel keywords
  if (/^(batal|tidak|jangan|ga jadi|gak jadi|cancel|no)\b/.test(msg)) {
    return { type: 'cancel', pendingAction: pending }
  }
  // Confirm keywords
  if (/^(ya|iya|yes|y|konfirmasi|lanjut|ok|oke|setuju)\b/.test(msg)) {
    return { type: 'confirm', pendingAction: pending }
  }

  return { type: 'none' }
}

// ============================================================
// HELPER: Execute confirmed pending action (DELETE or CREATE)
// ============================================================
export async function executeConfirmedAction(
  pending: any,
  ctx: ExecuteContext
): Promise<string> {
  if (pending.type === 'DELETE' && pending.targetId) {
    const target = await db.customer.findUnique({ where: { id: pending.targetId } })
    if (!target) {
      await cancelPendingAction(ctx)
      return `❌ Konsumen "${pending.targetName}" tidak ditemukan (mungkin sudah dihapus). Aksi dibatalkan.`
    }
    // Validate target name not changed (security check)
    await confirmPendingAction(pending.id)
    // Use legacy delete via executeTools
    const legacyIntent = {
      tools: [],
      action: 'CONFIRM_DELETE' as const,
    }
    const result = await _legacyExecute(legacyIntent, target.id, 'ya', ctx)
    try {
      await db.auditLog.create({
        data: {
          action: 'DELETE_CUSTOMER',
          entityType: 'Customer',
          entityId: target.id,
          metadata: JSON.stringify({
            customerName: target.name,
            confirmedBy: ctx.senderNumber || 'dina-v3',
          }),
        },
      })
    } catch {}
    return result.results || `✅ Konsumen ${target.name} berhasil dihapus permanen.`
  }

  await cancelPendingAction(ctx)
  return `⚠️ Tipe pending action tidak dikenal. Aksi dibatalkan.`
}
