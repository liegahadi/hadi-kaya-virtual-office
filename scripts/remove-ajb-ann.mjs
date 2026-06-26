import { PDFDocument } from 'pdf-lib'
import fs from 'fs'

const file = 'public/templates/btn-ajb-bank.pdf'
const pdfBytes = fs.readFileSync(file)
const pdfDoc = await PDFDocument.load(pdfBytes)
const pages = pdfDoc.getPages()
let removed = 0
for (const page of pages) {
  const annots = page.node.Annots()
  if (annots) {
    const count = annots.size()
    if (count > 0) {
      removed += count
      for (let j = annots.size() - 1; j >= 0; j--) annots.remove(j)
    }
  }
}
const output = await pdfDoc.save()
fs.writeFileSync(file, output)
console.log(`${file}: removed ${removed} annotations, size ${output.length} bytes`)
