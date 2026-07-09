import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import PizZip from 'pizzip'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/document-templates/[id]/autofill
// Body: { customerId: "xxx" }
// Returns: filled DOCX file (original layout preserved, only data filled in)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { customerId } = body

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 })
    }

    const [template, customer] = await Promise.all([
      db.documentTemplate.findUnique({ where: { id } }),
      db.customer.findUnique({
        where: { id: customerId },
        include: { project: true, units: true },
      }),
    ])

    if (!template) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })

    // Load template file
    const filePath = path.join(process.cwd(), template.templateUrl)
    let fileBuffer: Buffer
    try {
      fileBuffer = await fs.readFile(filePath) as Buffer
    } catch {
      return NextResponse.json({ success: false, error: 'Template file not found: ' + template.templateUrl }, { status: 404 })
    }

    const unit = customer.units[0]
    const project = customer.project

    // Build replacement data
    const data: Record<string, string> = {
      // Personal
      'NAMA': customer.name || '',
      'NAMA_LENGKAP': customer.name || '',
      'NIK': customer.nik || '',
      'NO_KTP': customer.nik || '',
      'TEMPAT_LAHIR': customer.birthPlace || '',
      'TGL_LAHIR': customer.birthDate || '',
      'TANGGAL_LAHIR': customer.birthDate || '',
      'TEMPAT_TGL_LAHIR': `${customer.birthPlace || ''}, ${customer.birthDate || ''}`,
      'PEKERJAAN': customer.occupation || '',
      'JABATAN': customer.workPosition || '',
      'ALAMAT': customer.ktpAddress || '',
      'ALAMAT_KTP': customer.ktpAddress || '',
      'RT_RW': customer.rtRw || '',
      'KELURAHAN': customer.kelurahan || '',
      'KECAMATAN': customer.kecamatan || '',
      'KOTA': customer.city || '',
      'KODE_POS': customer.postalCode || '',
      'AGAMA': customer.religion || '',
      'NO_TELP': customer.phone || customer.whatsappNumber || '',
      'NO_HP': customer.phone || customer.whatsappNumber || '',
      'STATUS': customer.maritalStatus === 'MENIKAH' ? 'Menikah' : customer.maritalStatus === 'SINGLE' ? 'Belum Menikah' : '',
      // Work
      'NAMA_PERUSAHAAN': customer.companyName || '',
      'ALAMAT_PERUSAHAAN': customer.companyAddress || '',
      'GAJI': customer.monthlyIncome ? customer.monthlyIncome.toLocaleString('id-ID') : '',
      'PENGHASILAN': customer.monthlyIncome ? customer.monthlyIncome.toLocaleString('id-ID') : '',
      // Spouse
      'NAMA_PASANGAN': customer.spouseName || '',
      'NIK_PASANGAN': customer.spouseNik || '',
      'PEKERJAAN_PASANGAN': customer.spouseOccupation || '',
      // Other
      'NAMA_IBU': customer.motherMaidenName || '',
      // Property
      'NAMA_PROYEK': project?.name || '',
      'BLOK': unit?.blockNumber || '',
      'UNIT': unit?.blockNumber || '',
      'HARGA': '173.000.000',
      'DP': unit ? unit.dpAmount.toLocaleString('id-ID') : '5.000.000',
      'TIPE': '36',
      'LUAS_TANAH': String(unit?.landSize || 84),
      // Bank
      'NAMA_BANK': template.bankName,
      'TANGGAL': new Date().toLocaleDateString('id-ID'),
    }

    // For DOCX files: use PizZip to modify XML
    if (template.templateUrl.endsWith('.docx')) {
      const zip = new PizZip(fileBuffer)

      // Process all XML files in the DOCX
      const filesToUpdate: string[] = []
      for (const f of Object.keys(zip.files)) {
        if (f.match(/\.(xml)$/)) {
          filesToUpdate.push(f)
        }
      }

      for (const fileName of filesToUpdate) {
        const file = zip.file(fileName)
        if (!file) continue
        let content = file.asText()

        // Strategy 1: Replace {PLACEHOLDER} patterns
        for (const [key, value] of Object.entries(data)) {
          // Try various placeholder formats
          const patterns = [
            `{${key}}`,
            `{{${key}}}`,
            `[$${key}$]`,
          ]
          for (const pattern of patterns) {
            content = content.split(pattern).join(value)
          }
        }

        // Strategy 2: Replace dotted lines after known labels
        // Indonesian bank forms typically use "...." or "........." as fill-in blanks
        const labelReplacements: Array<[RegExp, string]> = [
          [/Nama\s*(Lengkap)?\s*:\s*[.…\s]{2,}/gi, `Nama$1 : ${data.NAMA}`],
          [/No\.\s*KTP\s*[/:]?\s*[.…\s]{2,}/gi, `No. KTP : ${data.NIK}`],
          [/NIK\s*[/:]?\s*[.…\s]{2,}/gi, `NIK : ${data.NIK}`],
          [/Tempat[,/]\s*Tgl\s*Lahir\s*[:/]?\s*[.…\s]{2,}/gi, `Tempat/Tgl Lahir : ${data.TEMPAT_TGL_LAHIR}`],
          [/Tempat\s*Lahir\s*[:/]?\s*[.…\s]{2,}/gi, `Tempat Lahir : ${data.TEMPAT_LAHIR}`],
          [/Tgl\.\s*Lahir\s*[:/]?\s*[.…\s]{2,}/gi, `Tgl. Lahir : ${data.TGL_LAHIR}`],
          [/Pekerjaan\s*[:/]?\s*[.…\s]{2,}/gi, `Pekerjaan : ${data.PEKERJAAN}`],
          [/Jabatan\s*[:/]?\s*[.…\s]{2,}/gi, `Jabatan : ${data.JABATAN}`],
          [/Alamat\s*[:/]?\s*[.…\s]{2,}/gi, `Alamat : ${data.ALAMAT}`],
          [/No\.\s*Telp\s*[/:]?\s*[.…\s]{2,}/gi, `No. Telp : ${data.NO_TELP}`],
          [/No\.\s*HP\s*[/:]?\s*[.…\s]{2,}/gi, `No. HP : ${data.NO_HP}`],
          [/Agama\s*[:/]?\s*[.…\s]{2,}/gi, `Agama : ${data.AGAMA}`],
          [/Status\s*[:/]?\s*[.…\s]{2,}/gi, `Status : ${data.STATUS}`],
          [/Penghasilan\s*[:/]?\s*[.…\s]{2,}/gi, `Penghasilan : Rp ${data.PENGHASILAN}`],
          [/Gaji\s*[:/]?\s*[.…\s]{2,}/gi, `Gaji : Rp ${data.GAJI}`],
          [/Perusahaan\s*[:/]?\s*[.…\s]{2,}/gi, `Perusahaan : ${data.NAMA_PERUSAHAAN}`],
          [/Blok\s*[:/]?\s*[.…\s]{2,}/gi, `Blok : ${data.BLOK}`],
        ]

        for (const [pattern, replacement] of labelReplacements) {
          content = content.replace(pattern, replacement)
        }

        // Write back
        zip.file(fileName, content)
      }

      // Generate output DOCX
      const outputBuffer = zip.generate({ type: 'nodebuffer' })
      const outputFileName = `${template.bankName}_${template.templateName.replace(/\s+/g, '_')}_${customer.name.replace(/\s+/g, '_')}.docx`

      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${outputFileName}"`,
          'Content-Length': outputBuffer.length.toString(),
        },
      })
    }

    // For PDF files: return as-is (can't easily edit PDFs)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': template.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${template.templateName}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Auto-fill error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
