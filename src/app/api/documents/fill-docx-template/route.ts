// Fill a user-uploaded .docx template with form data using docxtemplater
// Placeholders: {nama}, {nik}, {jabatan}, {perusahaan}, {gaji_pokok}, etc.
// For slip-gaji: generates 7 sheets (6 months back + 1 forward) using {#slips}...{/slips} loop
import { NextRequest, NextResponse } from 'next/server'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
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
    // spouse info (if needed)
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

  // Build 7 slips (6 months back + current + 1 forward = 7)
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

    if (!templateFile) {
      return NextResponse.json({ error: 'Template file is required' }, { status: 400 })
    }
    if (!docType || !['sk-kerja', 'slip-gaji'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid docType' }, { status: 400 })
    }
    if (!stateJson) {
      return NextResponse.json({ error: 'State data is required' }, { status: 400 })
    }

    const state: BerkasState = JSON.parse(stateJson)
    const templateBuffer = Buffer.from(await templateFile.arrayBuffer())

    // Build data based on doc type
    const data = docType === 'sk-kerja' ? buildSkKerjaData(state) : buildSlipGajiData(state)

    // Load template into PizZip
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

    const filledDocx = doc.getZip().generate({ type: 'uint8array', compression: 'DEFLATE' })

    const fileName = docType === 'sk-kerja'
      ? `SK_Kerja_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.docx`
      : `Slip_Gaji_${state.applicant.fullName || 'Konsumen'}_${new Date().toISOString().split('T')[0]}.docx`

    // Wrap in Blob for NextResponse compatibility
    const blob = new Blob([filledDocx as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (err: any) {
    console.error('fill-docx-template error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to fill template' }, { status: 500 })
  }
}
