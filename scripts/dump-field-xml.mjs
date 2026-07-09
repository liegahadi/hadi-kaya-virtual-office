// Dump raw XML around key field labels to understand the run structure
import PizZip from 'pizzip'
import fs from 'fs'

const docxPath = '/home/z/my-project/upload/Lampiran Memo SMD 8971 Ketentuan Realiasi KPR Sejahtera FLPP Tahun 2026.docx'
const buffer = fs.readFileSync(docxPath)
const zip = new PizZip(buffer)
const xml = zip.file('word/document.xml').asText()

// Search for key labels and dump surrounding XML (formatted for readability)
const labels = [
  'Nama Lengkap',
  'No. KTP',
  'Tempat, Tanggal Lahir',
  'Pekerjaan',
  'Alamat',
  'Jabatan',
  'Nama Developer',
  'Alamat Perumahan',
  'proyek perumahan',
  'Nomor Rekening',
  'atas nama',
  'Menyetujui,',
]

function prettyPrintXml(xmlStr) {
  // Add newlines between tags for readability
  return xmlStr
    .replace(/></g, '>\n<')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n')
}

labels.forEach(label => {
  const idx = xml.indexOf(label)
  if (idx === -1) {
    console.log(`\n========== "${label}" NOT FOUND`)
    return
  }
  // Get a window of 2500 chars starting 200 before the label
  const start = Math.max(0, idx - 200)
  const end = Math.min(xml.length, idx + 2300)
  const chunk = xml.substring(start, end)
  console.log(`\n\n========== "${label}" (idx=${idx}) ==========`)
  console.log(prettyPrintXml(chunk))
})
