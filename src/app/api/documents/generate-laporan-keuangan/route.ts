// POST /api/documents/generate-laporan-keuangan
// AI Generate Laporan Keuangan untuk Wirausaha menggunakan z-ai-web-dev-sdk
//
// Input:
//   - jenisUsaha: string (e.g., "Laundry", "Softlens", "Camping", "Kusen Kayu")
//   - targetLabaMode: "range" | "perBulan"
//   - targetLabaMin, targetLabaMax: number (range mode)
//   - labaPerBulan: Array<{ bulan: string; laba: number }> (perBulan mode)
//   - periodeCount: 6 | 7 (jumlah bulan)
//   - biayaKhusus: string (optional, e.g., "gaji karyawan 1.3jt, listrik 500rb, no sewa")
//   - kopSurat: { namaUsaha, alamat, ig, logoUrl? }
//
// Output:
//   - html: string (HTML lengkap dengan 6-7 halaman, 1 per bulan, page-break-after)
//
// AI akan generate:
//   - Rincian penjualan per kategori produk (AI decide berdasarkan jenis usaha)
//   - HPP per kategori
//   - Biaya operasional rincian
//   - Fluktuasi nilai per bulan (natural, ga sama persis)
//   - Total yang match target laba bersih user

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120  // 2 menit untuk AI generate

// Hardcoded z-ai config (Vercel block filesystem access via "Removing unpermitted intrinsics")
// Supaya ga dependency ke .z-ai-config file di runtime
const ZAI_CONFIG = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f06846fc-648f-4dd5-adc6-1033ce58ef0c',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmU4MGI1YWMtNWM2ZC00ZjEzLWJjZjctMjI0NmFlZTUxNWFjIiwiY2hhdF9pZCI6ImNoYXQtZjA2ODQ2ZmMtNjQ4Zi00ZGQ1LWFkYzYtMTAzM2NlNThlZjBjIiwicGxhdGZvcm0iOiJ6YWkifQ.owCuUI9B-Qsh-n4v2Tnhh2Ivr3I_FuwPOtXkzpSzRyk',
  userId: 'fe80b5ac-5c6d-4f13-bcf7-2246aee515ac',
}

// Direct fetch to z-ai API (bypass SDK yang butuh filesystem access)
async function callZaiChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `${ZAI_CONFIG.baseUrl}/chat/completions`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_CONFIG.apiKey}`,
    'X-Z-AI-From': 'Z',
  }
  if (ZAI_CONFIG.chatId) headers['X-Chat-Id'] = ZAI_CONFIG.chatId
  if (ZAI_CONFIG.userId) headers['X-User-Id'] = ZAI_CONFIG.userId

  const body = {
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`ZAI API error ${res.status}: ${errText.substring(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

interface LaporanRequest {
  jenisUsaha: string
  targetLabaMode: 'range' | 'perBulan'
  targetLabaMin?: number
  targetLabaMax?: number
  labaPerBulan?: Array<{ bulan: string; laba: number }>
  periodeCount: 6 | 7
  biayaKhusus?: string
  kopSurat: {
    namaUsaha: string
    alamat: string
    ig?: string
    logoUrl?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: LaporanRequest = await req.json()
    const {
      jenisUsaha,
      targetLabaMode,
      targetLabaMin,
      targetLabaMax,
      labaPerBulan,
      periodeCount,
      biayaKhusus,
      kopSurat,
    } = body

    // Validation
    if (!jenisUsaha || !kopSurat?.namaUsaha) {
      return NextResponse.json(
        { error: 'jenisUsaha dan kopSurat.namaUsaha wajib diisi' },
        { status: 400 }
      )
    }

    // Build target laba description
    let targetLabaDesc: string
    if (targetLabaMode === 'range') {
      targetLabaDesc = `Target laba bersih (nett) per bulan: Rp ${targetLabaMin?.toLocaleString('id-ID')} - Rp ${targetLabaMax?.toLocaleString('id-ID')} (buat fluktuatif di dalam range ini, jangan sama persis tiap bulan)`
    } else if (targetLabaMode === 'perBulan' && labaPerBulan?.length) {
      const bulanList = labaPerBulan.map(b => `- ${b.bulan}: Rp ${b.laba.toLocaleString('id-ID')}`).join('\n')
      targetLabaDesc = `Target laba bersih (nett) per bulan (NILAI PASTI, harus match persis):\n${bulanList}`
    } else {
      return NextResponse.json(
        { error: 'targetLabaMode tidak valid atau labaPerBulan kosong' },
        { status: 400 }
      )
    }

    // Build biaya khusus description
    const biayaDesc = biayaKhusus?.trim()
      ? `Biaya khusus (WAJIB ikuti, jangan tambah biaya lain selain ini kalau disebut):\n${biayaKhusus}`
      : 'Biaya operasional: AI decide sendiri berdasarkan jenis usaha (gaji karyawan, listrik, transportasi, dll). Buat masuk akal untuk UMKM.'

    // Build periode list (6 atau 7 bulan terakhir)
    const now = new Date()
    const bulanList: string[] = []
    for (let i = periodeCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
      bulanList.push(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))
    }
    const periodeDesc = bulanList.join(', ')

    // Build AI prompt
    const systemPrompt = `Anda adalah auditor keuangan profesional yang ahli membuat laporan laba rugi untuk usaha kecil menengah (UMKM) di Indonesia.

Tugas Anda: generate laporan keuangan HTML untuk usaha wirausaha, dengan struktur yang rapih dan profesional.

ATURAN WAJIB:
1. Generate ${periodeCount} halaman terpisah (1 halaman per bulan)
2. Setiap halaman DIPISAH dengan <div style="page-break-after:always;break-after:page;min-height:90vh;padding:20px 0;"> ... </div>
3. Setiap halaman HARUS ada kop surat di atas (nama usaha, alamat, IG)
4. Setiap halaman HARUS ada signature block di bawah kanan: "{kota}, {tanggal}" lalu "Pemilik Usaha," lalu "( {nama_pemilik} )"
5. Bahasa: Indonesia formal
6. Currency format: "Rp. 1.234.567" (titik sebagai pemisah ribuan)
7. Nilai fluktuatif tiap bulan (jangan sama persis), tapi total laba bersih harus match target

STRUKTUR SETIAP HALAMAN (HTML):
\`\`\`html
<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;width:100%;min-height:90vh;padding:20px 0;page-break-after:always;break-after:page;">

<!-- KOP SURAT -->
<div style="border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:15px;text-align:center;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{NAMA USAHA}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{ALAMAT USAHA}</p>
<p style="font-size:9pt;color:#666;margin:0;">IG: @{ig}</p>
</div>

<!-- JUDUL -->
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">LAPORAN LABA RUGI</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">Bulan: {BULAN TAHUN}</p>

<!-- TABEL PENDAPATAN -->
<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;">
<thead>
<tr style="background:#16a34a;color:#fff;">
<th style="padding:8px 10px;border:1px solid #000;text-align:left;">PENDAPATAN</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;">Jumlah (Rp)</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Kategori Produk 1]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Kategori Produk 2]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr style="background:#f0fdf4;font-weight:bold;"><td style="padding:8px 10px;border:1.5px solid #000;">Total Pendapatan</td><td style="padding:8px 10px;border:1.5px solid #000;text-align:right;">Rp. xxx</td></tr>
</tbody>
</table>

<!-- TABEL HPP -->
<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;">
<thead>
<tr style="background:#f59e0b;color:#fff;">
<th style="padding:8px 10px;border:1px solid #000;text-align:left;">HPP (Harga Pokok Penjualan)</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;">Jumlah (Rp)</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Bahan Baku/Modal Barang]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr style="background:#fef3c7;font-weight:bold;"><td style="padding:8px 10px;border:1.5px solid #000;">Total HPP</td><td style="padding:8px 10px;border:1.5px solid #000;text-align:right;">Rp. xxx</td></tr>
</tbody>
</table>

<!-- LABA KOTOR -->
<p style="text-align:right;font-size:12pt;font-weight:bold;margin:10px 0;background:#fef9c3;padding:8px;border:1.5px solid #000;">LABA KOTOR: Rp. xxx</p>

<!-- TABEL BIAYA OPERASIONAL -->
<table style="width:100%;font-size:11pt;border-collapse:collapse;margin-bottom:15px;border:1.5px solid #000;">
<thead>
<tr style="background:#dc2626;color:#fff;">
<th style="padding:8px 10px;border:1px solid #000;text-align:left;">BIAYA OPERASIONAL</th>
<th style="padding:8px 10px;border:1px solid #000;text-align:right;">Jumlah (Rp)</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Gaji Karyawan]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Listrik & Air]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Transportasi]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr><td style="padding:6px 10px;border:1px solid #999;">[Pemasaran]</td><td style="padding:6px 10px;border:1px solid #999;text-align:right;">Rp. xxx</td></tr>
<tr style="background:#fef2f2;font-weight:bold;"><td style="padding:8px 10px;border:1.5px solid #000;">Total Biaya Operasional</td><td style="padding:8px 10px;border:1.5px solid #000;text-align:right;">Rp. xxx</td></tr>
</tbody>
</table>

<!-- LABA BERSIH (highlight) -->
<div style="border:2px solid #1e3a8a;background:#e6f3ff;padding:12px;margin:15px 0;text-align:center;">
<p style="margin:0;font-size:14pt;font-weight:bold;color:#1e3a8a;">LABA BERSIH (NETT)</p>
<p style="margin:5px 0 0 0;font-size:16pt;font-weight:bold;color:#1e3a8a;">Rp. xxx</p>
</div>

<!-- SIGNATURE -->
<div style="margin-top:40px;text-align:right;">
<p style="margin:0 0 6px 0;">Pangkalpinang, {TANGGAL}</p>
<p style="margin:0 0 80px 0;">Pemilik Usaha,</p>
<p style="margin:0;font-weight:bold;text-decoration:underline;display:inline-block;border-top:1px solid #000;padding-top:6px;min-width:200px;text-align:center;">( {NAMA PEMILIK} )</p>
</div>

</div>
\`\`\`

OUTPUT: HANYA HTML code, tanpa markdown code blocks (\`\`\`), tanpa penjelasan, tanpa teks tambahan. Langsung HTML mulai dari <div> pertama sampai </div> terakhir.`

    const userPrompt = `Buatkan laporan keuangan untuk usaha berikut:

JENIS USAHA: ${jenisUsaha}
NAMA USAHA: ${kopSurat.namaUsaha}
ALAMAT USAHA: ${kopSurat.alamat}
IG: ${kopSurat.ig || '-'}
NAMA PEMILIK: Pemilik
PERIODE: ${periodeDesc} (${periodeCount} bulan)

${targetLabaDesc}

${biayaDesc}

INGAT:
- Generate ${periodeCount} halaman terpisah, masing-masing untuk 1 bulan
- Bulan: ${bulanList.join(' → ')}
- Setiap halaman punya kop surat + judul + tabel pendapatan + tabel HPP + laba kotor + tabel biaya operasional + laba bersih + signature
- Pisah antar halaman dengan <div style="page-break-after:always;...">
- Nilai fluktuatif tiap bulan (natural)
- LABA BERSIH harus match target (range atau per bulan)
- Output: HANYA HTML, tanpa penjelasan, tanpa markdown`

    // Call z-ai API directly (hardcoded config, no filesystem dependency)
    const aiResponse = await callZaiChat(systemPrompt, userPrompt)

    let html = aiResponse

    // Clean up: remove markdown code blocks if AI added them
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '')
    html = html.trim()

    // Basic validation
    if (!html.includes('<div') || !html.includes('page-break')) {
      return NextResponse.json(
        { error: 'AI output tidak valid (tidak ada page break atau div). Coba lagi.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      html,
      meta: {
        jenisUsaha,
        periodeCount,
        bulanList,
        targetLabaMode,
      },
    })
  } catch (err: any) {
    console.error('[generate-laporan-keuangan] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to generate laporan keuangan' },
      { status: 500 }
    )
  }
}
