// Generate sample .docx templates for SK Kerja and Slip Gaji with placeholders
// User downloads these → customizes in Word/Google Docs → uploads back
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import * as fs from 'fs'
import * as path from 'path'

// Build a minimal .docx from scratch using a simple XML template
// This produces a Word file the user can open and edit
function buildDocx(contentXml: string): Buffer {
  // Minimal .docx structure
  const docxTemplate = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
</w:styles>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${contentXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`,
  }

  const zip = new PizZip()
  for (const [filename, content] of Object.entries(docxTemplate)) {
    zip.file(filename, content)
  }
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

// XML helpers
function p(text: string, opts: { bold?: boolean; center?: boolean; underline?: boolean; size?: number } = {}): string {
  const rPr: string[] = []
  if (opts.bold) rPr.push('<w:b/>')
  if (opts.underline) rPr.push('<w:u w:val="single"/>')
  if (opts.center) rPr.unshift('<w:jc w:val="center"/>')
  if (opts.size) rPr.push(`<w:sz w:val="${opts.size * 2}"/>`)
  const rPrXml = rPr.length ? `<w:rPr>${rPr.join('')}</w:rPr>` : ''
  return `<w:p><w:pPr>${opts.center ? '<w:jc w:val="center"/>' : ''}</w:pPr><w:r>${rPrXml}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
}

// Paragraph with mixed runs (some bold, some normal) - for placeholders
function pMixed(runs: Array<{ text: string; bold?: boolean; underline?: boolean }>): string {
  const runsXml = runs.map(r => {
    const rPr: string[] = []
    if (r.bold) rPr.push('<w:b/>')
    if (r.underline) rPr.push('<w:u w:val="single"/>')
    const rPrXml = rPr.length ? `<w:rPr>${rPr.join('')}</w:rPr>` : ''
    return `<w:r>${rPrXml}<w:t xml:space="preserve">${r.text}</w:t></w:r>`
  }).join('')
  return `<w:p>${runsXml}</w:p>`
}

function spacer(): string {
  return '<w:p/>'
}

// Table row helper
function tRow(cells: Array<{ text: string; bold?: boolean }>): string {
  const cellsXml = cells.map(c => {
    const rPr = c.bold ? '<w:rPr><w:b/></w:rPr>' : ''
    return `<w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r>${rPr}<w:t xml:space="preserve">${c.text}</w:t></w:r></w:p></w:tc>`
  }).join('')
  return `<w:tr>${cellsXml}</w:tr>`
}

// =========================================================
// SK KERJA TEMPLATE
// =========================================================
function buildSkKerjaTemplate(): Buffer {
  const xml = [
    // Kop surat placeholder
    p('[KOP SURAT PERUSAHAAN - Edit di Word/Google Docs]', { center: true, size: 10 }),
    p('[Ganti dengan kop surat perusahaan Anda - boleh paste logo, nama perusahaan, alamat]', { center: true, size: 9 }),
    spacer(),
    p('SURAT KETERANGAN KERJA', { center: true, bold: true, underline: true, size: 14 }),
    p('No: .../SK/{bulan}/{tahun}', { center: true, size: 11 }),
    spacer(),
    p('Yang bertanda tangan di bawah ini:'),
    tRow([{ text: 'Nama' }, { text: ': Pimpinan {perusahaan}' }]),
    tRow([{ text: 'Jabatan' }, { text: ': Direktur / Pimpinan' }]),
    tRow([{ text: 'Perusahaan' }, { text: ': {perusahaan}' }]),
    tRow([{ text: 'Alamat' }, { text: ': {alamat_perusahaan}' }]),
    spacer(),
    p('Dengan ini menerangkan bahwa:'),
    tRow([{ text: 'Nama', bold: true }, { text: ': {nama}', bold: true }]),
    tRow([{ text: 'NIK' }, { text: ': {nik}' }]),
    tRow([{ text: 'Tempat/Tgl Lahir' }, { text: ': {tempat_lahir}, {tanggal_lahir}' }]),
    tRow([{ text: 'Jabatan' }, { text: ': {jabatan}' }]),
    tRow([{ text: 'Lama Bekerja' }, { text: ': {lama_bekerja} tahun' }]),
    tRow([{ text: 'Gaji per Bulan' }, { text: ': {gaji}' }]),
    spacer(),
    p('Benar bahwa yang bersangkutan adalah karyawan tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.'),
    spacer(),
    p('Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.'),
    spacer(),
    spacer(),
    p('{kota}, {tanggal}', { bold: false }),
    p('Pimpinan Perusahaan'),
    spacer(),
    spacer(),
    spacer(),
    pMixed([{ text: '( ............................. )', bold: true, underline: true }]),
  ].join('\n')
  return buildDocx(xml)
}

// =========================================================
// SLIP GAJI TEMPLATE - uses {#slips} loop for 7 months
// =========================================================
function buildSlipGajiTemplate(): Buffer {
  // We use {#slips}...{/slips} to loop 7 times (6 months back + 1 forward)
  // Inside the loop, all fields are accessible
  // For tunjangan/potongan, use inline loop syntax: {#items}text {label} {amount} {/items}
  const slipContent = [
    p('[KOP SURAT PERUSAHAAN - Edit di Word/Google Docs]', { center: true, size: 10 }),
    spacer(),
    p('SLIP GAJI', { center: true, bold: true, underline: true, size: 14 }),
    p('Periode: {periode}', { center: true, size: 11 }),
    spacer(),
    p('Nama: {nama}'),
    p('NIK: {nik}'),
    p('Jabatan: {jabatan}'),
    p('Perusahaan: {perusahaan}'),
    spacer(),
    // Income table
    p('PENDAPATAN', { bold: true }),
    p('Gaji Pokok: {gaji_pokok}'),
    // Inline loop for tunjangan tetap — docxtemplater renders each item inline
    p('{#tunjangan_tetap}{label}: {amount}{/tunjangan_tetap}'),
    p('Total Tunjangan Tetap: {total_tunjangan_tetap}'),
    p('{#tunjangan_variabel}{label}: {amount}{/tunjangan_variabel}'),
    p('Total Tunjangan Variabel: {total_tunjangan_variabel}'),
    spacer(),
    p('POTONGAN', { bold: true }),
    p('{#potongan}{label}: {amount}{/potongan}'),
    p('Total Potongan: {total_potongan}'),
    spacer(),
    p('Gaji Kotor: {gaji_kotor}', { bold: true }),
    p('Gaji Diterima (Bersih): {gaji_bersih}', { bold: true, size: 12 }),
    spacer(),
    spacer(),
    p('Tanggal Terima: {tanggal_terima}'),
    p('Bagian Keuangan'),
    spacer(),
    spacer(),
    spacer(),
    pMixed([{ text: '( ............................. )', bold: true, underline: true }]),
    // Page break between slips (except last)
    '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
  ]

  // Wrap entire slip content in {#slips}...{/slips} loop
  // The {#slips} tag goes in its own paragraph, {/slips} in its own paragraph
  const loopedContent = `<w:p><w:r><w:t xml:space="preserve">{#slips}</w:t></w:r></w:p>
${slipContent.join('\n')}
<w:p><w:r><w:t xml:space="preserve">{/slips}</w:t></w:r></w:p>`

  return buildDocx(loopedContent)
}

// =========================================================
// MAIN
// =========================================================
async function main() {
  const outputDir = path.join(process.cwd(), 'public', 'templates', 'samples')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  console.log('Generating SK Kerja sample template...')
  const skKerjaBuf = buildSkKerjaTemplate()
  fs.writeFileSync(path.join(outputDir, 'template-SK-Kerja.docx'), skKerjaBuf)
  console.log(`  -> ${path.join(outputDir, 'template-SK-Kerja.docx')} (${skKerjaBuf.length} bytes)`)

  console.log('Generating Slip Gaji sample template...')
  const slipGajiBuf = buildSlipGajiTemplate()
  fs.writeFileSync(path.join(outputDir, 'template-Slip-Gaji.docx'), slipGajiBuf)
  console.log(`  -> ${path.join(outputDir, 'template-Slip-Gaji.docx')} (${slipGajiBuf.length} bytes)`)

  // Verify by reading back
  const verifySk = new Docxtemplater(new PizZip(skKerjaBuf), { delimiters: { start: '{', end: '}' } })
  verifySk.render({
    nama: 'TEST USER', nik: '1234567890', perusahaan: 'PT TEST', alamat_perusahaan: 'JL TEST',
    gaji: 'Rp. 5.000.000,-', jabatan: 'Staff', tempat_lahir: 'Jakarta', tanggal_lahir: '1 Januari 1990',
    tanggal: '1 Januari 2025', kota: 'Pangkalpinang', bulan: '1', tahun: '2025',
    lama_bekerja: '3', atasan: 'Budi', nip_atasan: 'NIP001', nama_pasangan: '', nik_pasangan: '',
  })
  console.log('  -> SK Kerja template verified OK')

  const verifySlip = new Docxtemplater(new PizZip(slipGajiBuf), { delimiters: { start: '{', end: '}' } })
  verifySlip.render({
    slips: [{
      periode: 'Januari 2025', tanggal_terima: '25 Januari 2025',
      gaji_pokok: 'Rp. 5.000.000,-', total_tunjangan_tetap: 'Rp. 1.000.000,-',
      total_tunjangan_variabel: 'Rp. 500.000,-', total_potongan: 'Rp. 500.000,-',
      gaji_kotor: 'Rp. 6.500.000,-', gaji_bersih: 'Rp. 6.000.000,-',
      tunjangan_tetap: [{ label: 'Tunjangan Makan', amount: 'Rp. 500.000,-' }],
      tunjangan_variabel: [{ label: 'Bonus', amount: 'Rp. 500.000,-' }],
      potongan: [{ label: 'BPJS', amount: 'Rp. 500.000,-' }],
      nama: 'TEST USER', nik: '1234567890', jabatan: 'Staff', perusahaan: 'PT TEST',
    }],
  })
  console.log('  -> Slip Gaji template verified OK')

  console.log('\nDone! Sample templates saved to public/templates/samples/')
}

main().catch(err => { console.error(err); process.exit(1) })
