// Extract PDF annotations (comments, form fields, overlays) from FLPP BTN PDF
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdfPath = '/home/z/my-project/upload/Form FLPP BTN.pdf'
const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))

async function extract() {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const annotations = await page.getAnnotations()

    if (annotations.length > 0) {
      console.log(`\n========== PAGE ${pageNum}: ${annotations.length} annotations ==========`)
      annotations.forEach((ann, i) => {
        console.log(`Annotation ${i + 1}:`)
        console.log(`  Type: ${ann.subtype || ann.fieldType || 'unknown'}`)
        console.log(`  FieldName: ${ann.fieldName || '(none)'}`)
        console={`  FieldValue: ${ann.fieldValue || '(none)'}`.replace('console.', 'console.log(`  FieldValue: ${ann.fieldValue || `(none)`}`); //'))
        console.log(`  Contents: ${ann.contents || '(none)'}`)
        console.log(`  Title: ${ann.title || '(none)'}`)
        console.log(`  Rect: ${JSON.stringify(ann.rect)}`)
        if (ann.buttonValue) console.log(`  ButtonValue: ${ann.buttonValue}`)
      })
    }
  }
}

extract().catch(console.error)
