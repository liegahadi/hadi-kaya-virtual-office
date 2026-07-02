// Preview a user-uploaded .docx template filled with form data, returns HTML for inline preview
import { NextRequest, NextResponse } from 'next/server'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import mammoth from 'mammoth'
import { BerkasState } from '@/lib/berkas/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface SlipItem { label: string; amount: number }

function formatRupiah(n: number): string {
  return 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'
}

function formatDateID(d: string | Date): string {
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    if (isNaN(date.getTime())) return '...'
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return '...' }
}

function buildSkKerjaData(state: BerkasState) {
  const a = state.applicant as any
  return {
    nama: a.fullName || '',
    nik: a.ktpNumber || '',
    tempat_lahir: a.pob || '',
    tanggal_lahir: formatDateID(a.dob),
    jabatan: a.jobTitle || '',
    perusahaan: a.companyName || '',
    alamat_perusahaan: a.companyAddress || '',
    gaji: formatRupiah(a.monthlyIncome || 0),
    gaji_pokok: formatRupiah(a.gajiPokok || a.monthlyIncome || 0),
    tanggal: formatDateID(state.dateOfDocument),
    kota: 'Pangkalpinang',
    tahun: new Date().getFullYear().toString(),
    bulan: (new Date().getMonth() + 1).toString(),
    lama_bekerja: a.workDuration || '...',
    atasan: a.atasanName || '',
    nip_atasan: a.atasanNip || '',
    nama_pasangan: state.spouse?.fullName || '',
    nik_pasangan: state.spouse?.ktpNumber || '',
  }
}

function buildSlipGajiData(state: BerkasState) {
  const a = state.applicant as any
  const gajiPokok = a.gajiPokok || a.monthlyIncome || 0
  const tunjanganTetap: SlipItem[] = a.tunjanganTetap || []
  const tunjanganVariabel: SlipItem[] = a.tunjanganVariabel || []
  const potongan: SlipItem[] = a.potongan || []
  const tanggalTerima = a.tanggalTerimaGaji ? parseInt(a.tanggalTerimaGaji) : 25

  const totalTunjanganTetap = tunjanganTetap.reduce((s, t) => s + (t.amount || 0), 0)
  const totalTunjanganVariabel = tunjanganVariabel.reduce((s, t) => s + (t.amount || 0), 0)
  const totalPotongan = potongan.reduce((s, p) => s + (p.amount || 0), 0)
  const gajiKotor = gajiPokok + totalTunjanganTetap + totalTunjanganVariabel
  const gajiBersih = gajiKotor - totalPotongan

  const now = new Date()
  const slips: any[] = []
  for (let i = 6; i >= 0; i--) {
    const slipDate = new Date(now.getFullYear(), now.getMonth() - 6 + i, tanggalTerima)
    slips.push({
      periode: slipDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      tanggal_terima: formatDateID(slipDate),
      gaji_pokok: formatRupiah(gajiPokok),
      total_tunjangan_tetap: formatRupiah(totalTunjanganTetap),
      total_tunjangan_variabel: formatRupiah(totalTunjanganVariabel),
      total_potongan: formatRupiah(totalPotongan),
      gaji_kotor: formatRupiah(gajiKotor),
      gaji_bersih: formatRupiah(gajiBersih),
      tunjangan_tetap: tunjanganTetap.map(t => ({ label: t.label, amount: formatRupiah(t.amount) })),
      tunjangan_variabel: tunjanganVariabel.map(t => ({ label: t.label, amount: formatRupiah(t.amount) })),
      potongan: potongan.map(p => ({ label: p.label, amount: formatRupiah(p.amount) })),
      nama: a.fullName || '',
      nik: a.ktpNumber || '',
      jabatan: a.jobTitle || '',
      perusahaan: a.companyName || '',
    })
  }

  return { slips }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const templateFile = formData.get('template') as File | null
    const docType = formData.get('docType') as string
    const stateJson = formData.get('state') as string

    if (!templateFile) return NextResponse.json({ error: 'Template file is required' }, { status: 400 })
    if (!docType || !['sk-kerja', 'slip-gaji', 'combined'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid docType' }, { status: 400 })
    }
    if (!stateJson) return NextResponse.json({ error: 'State data is required' }, { status: 400 })

    const state: BerkasState = JSON.parse(stateJson)
    const templateBuffer = Buffer.from(await templateFile.arrayBuffer())

    // Build data based on doc type
    let data: Record<string, any>
    if (docType === 'sk-kerja') {
      data = buildSkKerjaData(state)
    } else if (docType === 'slip-gaji') {
      data = buildSlipGajiData(state)
    } else {
      // combined: SK fields at top level + slips array (each slip inherits top-level fields for kop surat consistency)
      const skData = buildSkKerjaData(state)
      const slipData = buildSlipGajiData(state)
      const slips = slipData.slips.map((slip: any) => ({
        ...slip,
        perusahaan: skData.perusahaan,
        alamat_perusahaan: skData.alamat_perusahaan,
        kota: skData.kota,
      }))
      data = { ...skData, slips }
    }

    const zip = new PizZip(templateBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' },
      nullGetter: () => '',
    })

    try {
      doc.render(data)
    } catch (renderErr: any) {
      console.error('Template render error:', renderErr)
      const errMsg = renderErr?.properties?.errors?.map((e: any) => e.message).join('; ') || renderErr?.message || 'Unknown render error'
      return NextResponse.json({ error: `Template error: ${errMsg}` }, { status: 400 })
    }

    const filledDocx = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })

    // Convert filled .docx to HTML via mammoth (Node.js uses `buffer`)
    const { value: html } = await mammoth.convertToHtml(
      { buffer: filledDocx },
      {
        styleMap: [
          "p[style-name='Title'] => h1.doc-title:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
        ],
      }
    )

    // Wrap HTML with print-friendly styles (A4)
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Preview ${docType}</title>
<style>
  @page { size: A4; margin: 1.5cm 2cm; }
  body { font-family: 'Times New Roman', 'Noto Serif', serif; font-size: 11pt; line-height: 1.5; color: #000; max-width: 800px; margin: 0 auto; padding: 20px; background: #fff; }
  h1, h2, h3 { font-weight: bold; }
  h1.doc-title { font-size: 14pt; text-align: center; text-decoration: underline; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  td, th { border: 1px solid #000; padding: 4px 8px; font-size: 11pt; }
  img { max-width: 100%; }
  p { margin: 6px 0; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>${html}</body>
</html>`

    return new NextResponse(fullHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('preview-docx-template error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to preview template' }, { status: 500 })
  }
}
