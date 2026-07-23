// Inspect what kind of annotations are inside the user's annotated PDFs
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const files = [
  '/home/z/my-project/upload/SPR MANDIRI.pdf',
  '/home/z/my-project/upload/SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI NEW 2025(1) (8).pdf',
]

for (const pdfPath of files) {
  console.log('\n\n##################################################')
  console.log('FILE:', pdfPath)
  console.log('##################################################')
  const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise
  console.log('Pages:', pdf.numPages)

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    console.log(`\n--- Page ${pageNum} (${viewport.width} x ${viewport.height}) ---`)

    const annotations = await page.getAnnotations()
    console.log(`Annotations found: ${annotations.length}`)

    annotations.forEach((ann, i) => {
      console.log(`  [${i}] subtype=${ann.subtype} fieldType=${ann.fieldType || '-'}`)
      console.log(`      rect=${JSON.stringify(ann.rect)}`)
      console.log(`      contents=${JSON.stringify(ann.contents || '')}`)
      console.log(`      fieldName=${JSON.stringify(ann.fieldName || '')}`)
      console.log(`      fieldValue=${JSON.stringify(ann.fieldValue || '')}`)
      console.log(`      title=${JSON.stringify(ann.title || '')}`)
      if (ann.textContent) console.log(`      textContent=${JSON.stringify(ann.textContent).slice(0, 200)}`)
      if (ann.richText) console.log(`      richText keys=${Object.keys(ann.richText).join(',')}`)
      // Dump all keys for the first annotation of each subtype we haven't seen
      console.log(`      ALL KEYS: ${Object.keys(ann).join(', ')}`)
    })

    // Also try getTextContent to see all text on page (in case "annotations" are actually text)
    if (pageNum === 1) {
      const tc = await page.getTextContent()
      const textItems = tc.items.filter(it => !!it.str).map(it => ({
        str: it.str,
        x: Math.round(it.transform[4]),
        y: Math.round(it.transform[5]),
        w: Math.round(it.width),
        h: Math.round(it.height),
        fontName: it.fontName,
      }))
      // Group by y to see lines
      console.log(`\n  Text items on page 1: ${textItems.length}`)
      // Print items that look like annotation labels (short, blue text would be in color but pdfjs text doesn't expose color easily)
      // Just print first 30 to see structure
      textItems.slice(0, 30).forEach(t => {
        console.log(`    "${t.str}" at (${t.x},${t.y}) w=${t.w} h=${t.h} font=${t.fontName}`)
      })
    }
  }
}
