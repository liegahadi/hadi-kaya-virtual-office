// Remove all annotations from PDF template (we already have coordinates saved)
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'

async function removeAnnotations() {
  const pdfPath = '/home/z/my-project/public/templates/btn-flpp-template.pdf'
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  
  const pages = pdfDoc.getPages()
  let totalRemoved = 0
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const node = page.node
    
    // Access the Annots array
    const annots = node.Annots()
    if (annots) {
      const count = annots.size()
      if (count > 0) {
        console.log(`Page ${i + 1}: removing ${count} annotations`)
        totalRemoved += count
        // Clear all annotations
        for (let j = annots.size() - 1; j >= 0; j--) {
          annots.remove(j)
        }
      }
    }
  }
  
  console.log(`\nTotal annotations removed: ${totalRemoved}`)
  
  const outputBytes = await pdfDoc.save()
  fs.writeFileSync(pdfPath, outputBytes)
  console.log(`✓ Saved cleaned PDF to ${pdfPath}`)
  console.log(`  Size: ${outputBytes.length} bytes (was ${pdfBytes.length} bytes)`)
}

removeAnnotations().catch(console.error)
