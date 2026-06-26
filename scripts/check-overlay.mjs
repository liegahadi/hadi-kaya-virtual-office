import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync('/tmp/test-flpp-output.pdf')) }).promise
console.log(`Pages: ${pdf.numPages}`)

// Check page 1 for overlay text
for (let p = 1; p <= Math.min(3, pdf.numPages); p++) {
  const page = await pdf.getPage(p)
  const text = await page.getTextContent()
  const items = text.items.filter(i => i.str.trim())
  console.log(`\n=== PAGE ${p}: ${items.length} text items ===`)
  items.forEach((item, i) => {
    if (item.str.length > 1) console.log(`  ${i+1}: "${item.str}" at x=${item.transform[4].toFixed(0)}, y=${item.transform[5].toFixed(0)}`)
  })
  
  // Also check annotations
  const anns = await page.getAnnotations()
  console.log(`Annotations: ${anns.length}`)
}
