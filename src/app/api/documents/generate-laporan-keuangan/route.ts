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
    'X-Chat-Id': ZAI_CONFIG.chatId,
    'X-User-Id': ZAI_CONFIG.userId,
    'X-Token': ZAI_CONFIG.token,
  }

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

    // Build AI prompt — SIMPLIFIED (short system prompt to avoid timeout)
    const systemPrompt = `Anda adalah auditor keuangan UMKM Indonesia. Buat laporan laba rugi dalam format HTML.

Aturan:
1. Buat ${periodeCount} halaman, 1 halaman per bulan: ${bulanList.join(', ')}
2. Setiap halaman dipisah: <div style="page-break-after:always;min-height:90vh;padding:20px 0;">
3. Setiap halaman punya: judul "LAPORAN LABA RUGI" + "Periode: [bulan]" + tabel pendapatan + tabel HPP + laba kotor + tabel biaya operasional + laba bersih + signature
4. Pakai <table border="1"> dengan width 100%
5. Currency: "Rp. 1.234.567"
6. Nilai fluktuatif tiap bulan, laba bersih harus match target
7. Output: HANYA HTML, tanpa penjelasan`

    const userPrompt = `Buat laporan keuangan ${periodeCount} bulan untuk:
- Usaha: ${jenisUsaha}
- Nama: ${kopSurat.namaUsaha}
- Alamat: ${kopSurat.alamat}
- IG: ${kopSurat.ig || '-'}

${targetLabaDesc}

${biayaDesc}

Bulan: ${bulanList.join(' → ')}
Output: HANYA HTML mulai dari <div> pertama.`

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
    console.error('[generate-laporan-keuangan] error:', err?.message || err)
    console.error('[generate-laporan-keuangan] stack:', err?.stack)
    return NextResponse.json(
      { error: err?.message || 'Failed to generate laporan keuangan', details: String(err?.cause || err) },
      { status: 500 }
    )
  }
}
