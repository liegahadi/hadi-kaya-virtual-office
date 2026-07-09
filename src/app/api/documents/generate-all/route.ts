import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/documents/generate-all
// Body: { customerId, bankName }
// Returns: merged PDF using pdf-lib only (no pdfkit font issues)

export async function POST(req: NextRequest) {
  try {
    const { customerId, bankName } = await req.json()
    if (!customerId || !bankName) {
      return NextResponse.json({ success: false, error: 'customerId and bankName required' }, { status: 400 })
    }

    const [customer, templates] = await Promise.all([
      db.customer.findUnique({ where: { id: customerId }, include: { project: true, units: true } }),
      db.documentTemplate.findMany({ where: { bankName, isActive: true, type: 'FORM' }, orderBy: { sortOrder: 'asc' } }),
    ])

    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })

    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const mergedPdf = await PDFDocument.create()
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold)

    // Helper: add text to page
    function addText(page: any, text: string, x: number, y: number, size: number = 10, bold: boolean = false) {
      try {
        page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) })
      } catch { /* skip if text can't be encoded */ }
    }

    // ============================================================
    // PAGE 1: Cover
    // ============================================================
    const cover = mergedPdf.addPage([595, 842]) // A4
    addText(cover, `${bankName} - Dokumen Pemberkasan`, 150, 750, 18, true)
    addText(cover, customer.project?.name || '', 200, 720, 14)
    addText(cover, `Konsumen: ${customer.name}`, 50, 670, 12)
    addText(cover, `NIK: ${customer.nik || '-'}`, 50, 650, 12)
    addText(cover, `Unit: ${customer.units[0]?.blockNumber || '-'}`, 50, 630, 12)
    addText(cover, `Bank: ${bankName}`, 50, 610, 12)
    addText(cover, `Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 50, 590, 12)
    addText(cover, `Total Dokumen: ${templates.length}`, 50, 570, 12)
    addText(cover, 'Dokumen yang termasuk:', 50, 530, 10, true)
    templates.forEach((t, i) => {
      addText(cover, `${i + 1}. ${t.templateName}`, 70, 510 - i * 20, 10)
    })

    // ============================================================
    // PAGE 2: Data Konsumen Summary
    // ============================================================
    const dataPage = mergedPdf.addPage([595, 842])
    addText(dataPage, 'DATA KONSUMEN (Auto-Fill)', 50, 780, 14, true)

    const fields: Array<[string, string | null]> = [
      ['Nama Lengkap', customer.name],
      ['NIK', customer.nik],
      ['Tempat Lahir', customer.birthPlace],
      ['Tanggal Lahir', customer.birthDate],
      ['Jenis Kelamin', customer.gender],
      ['Alamat KTP', customer.ktpAddress],
      ['RT/RW', customer.rtRw],
      ['Kelurahan', customer.kelurahan],
      ['Kecamatan', customer.kecamatan],
      ['Kota', customer.city],
      ['Kode Pos', customer.postalCode],
      ['Agama', customer.religion],
      ['Status Pernikahan', customer.maritalStatus],
      ['Pekerjaan', customer.occupation],
      ['Jabatan', customer.workPosition],
      ['Nama Perusahaan', customer.companyName],
      ['Alamat Perusahaan', customer.companyAddress],
      ['Penghasilan/Bulan', customer.monthlyIncome ? `Rp ${customer.monthlyIncome.toLocaleString('id-ID')}` : null],
      ['No. Telepon', customer.phone],
      ['Nama Pasangan', customer.spouseName],
      ['NIK Pasangan', customer.spouseNik],
      ['Pekerjaan Pasangan', customer.spouseOccupation],
      ['Nama Ibu Kandung', customer.motherMaidenName],
    ]

    let y = 740
    for (const [label, value] of fields) {
      addText(dataPage, `${label}:`, 50, y, 10, true)
      addText(dataPage, value || '-', 200, y, 10)
      y -= 20
    }

    // ============================================================
    // PAGE 3+: Each form template (auto-filled summary)
    // ============================================================
    for (const template of templates) {
      const formPage = mergedPdf.addPage([595, 842])
      addText(formPage, template.templateName, 50, 780, 14, true)
      addText(formPage, `Bank: ${template.bankName} | Kategori: ${template.category}`, 50, 760, 10)
      addText(formPage, template.description || '', 50, 730, 9)

      addText(formPage, '--- DATA TERISI OTOMATIS ---', 50, 690, 10, true)

      const fillFields: Array<[string, string | null]> = [
        ['Nama', customer.name],
        ['NIK', customer.nik],
        ['Tempat/Tgl Lahir', `${customer.birthPlace || ''}, ${customer.birthDate || ''}`],
        ['Pekerjaan', customer.occupation],
        ['Alamat', customer.ktpAddress],
        ['No. Telp', customer.phone],
        ['Pasangan', customer.spouseName],
        ['Penghasilan', customer.monthlyIncome ? `Rp ${customer.monthlyIncome.toLocaleString('id-ID')}` : '-'],
      ]

      let fy = 660
      for (const [label, value] of fillFields) {
        addText(formPage, `${label}:`, 50, fy, 10, true)
        addText(formPage, value || '-', 200, fy, 10)
        fy -= 25
      }

      addText(formPage, 'Catatan: Print dokumen ini, isi bagian yang masih kosong,', 50, 400, 9)
      addText(formPage, 'tandatangani, kemudian scan dan upload kembali sebagai arsip.', 50, 385, 9)
    }

    // ============================================================
    // Save & Return
    // ============================================================
    const mergedBytes = await mergedPdf.save()
    const outputFileName = `${bankName}_${customer.name.replace(/\s+/g, '_')}_pemberkasan.pdf`

    return new NextResponse(Buffer.from(mergedBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${outputFileName}"`,
        'Content-Length': mergedBytes.length.toString(),
      },
    })
  } catch (error) {
    console.error('Generate all error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
