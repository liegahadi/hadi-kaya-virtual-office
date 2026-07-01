// Remove annotations from SPR MANDIRI.pdf using pdf-lib low-level API
import { PDFDocument, PDFName, PDFArray } from 'pdf-lib'
import fs from 'fs'

async function main() {
  const inputPath = '/home/z/my-project/upload/SPR MANDIRI.pdf'
  const outputPath = '/home/z/my-project/public/templates/spr-mandiri.pdf'

  const pdfBytes = fs.readFileSync(inputPath)
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })

  const pages = pdfDoc.getPages()
  console.log(`Pages: ${pages.length}`)

  let totalRemoved = 0
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const node = page.node

    // Check for Annots in the page dictionary
    const annotsRef = node.dict.get(PDFName.of('Annots'))
    if (annotsRef) {
      let count = 0
      if (annotsRef instanceof PDFArray) {
        count = annotsRef.size()
        // Set Annots to empty array
        node.dict.set(PDFName.of('Annots'), PDFArray.withContext(pdfDoc.context))
      } else {
        // It's a reference - resolve it
        const annotsArray = pdfDoc.context.lookup(annotsRef)
        if (annotsArray instanceof PDFArray) {
          count = annotsArray.size()
        }
        // Delete the Annots entry entirely
        node.dict.delete(PDFName.of('Annots'))
      }
      console.log(`  Page ${i + 1}: ${count} annotations removed`)
      totalRemoved += count
    }

    // Also check for AcroForm in catalog
    const acroForm = pdfDoc.catalog.get(PDFName.of('AcroForm'))
    if (acroForm && i === 0) {
      console.log(`  AcroForm found in catalog - removing fields`)
      // Don't delete AcroForm entirely as it might break the PDF
      // Just clear the Fields array
      const acroFormObj = pdfDoc.context.lookup(acroForm)
      if (acroFormObj && acroFormObj.dict) {
        const fields = acroFormObj.dict.get(PDFName.of('Fields'))
        if (fields instanceof PDFArray) {
          console.log(`    AcroForm has ${fields.size()} fields - clearing`)
          acroFormObj.dict.set(PDFName.of('Fields'), PDFArray.withContext(pdfDoc.context))
        }
      }
    }
  }

  console.log(`Total annotations removed: ${totalRemoved}`)

  // Also need to flatten form fields (make them part of content stream)
  // pdf-lib doesn't support this directly, but removing Annots should be enough

  const output = await pdfDoc.save({ useObjectStreams: false })
  fs.writeFileSync(outputPath, output)
  console.log(`Template saved: ${outputPath} (${output.length} bytes)`)

  // Verify
  const verifyDoc = await PDFDocument.load(fs.readFileSync(outputPath))
  const verifyPages = verifyDoc.getPages()
  for (let i = 0; i < verifyPages.length; i++) {
    const annots = verifyPages[i].node.dict.get(PDFName.of('Annots'))
    console.log(`Verify page ${i + 1}: Annots ${annots ? 'still present' : 'removed'}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
