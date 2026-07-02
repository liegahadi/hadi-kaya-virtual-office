import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdfPath = '/home/z/my-project/upload/SPR MANDIRI.pdf'
const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise
console.log(`Pages: ${pdf.numPages}`)

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p)
  const viewport = page.getViewport({ scale: 1 })
  console.log(`\n=== PAGE ${p} (size: ${viewport.width} x ${viewport.height}) ===`)
  
  const anns = await page.getAnnotations()
  console.log(`Annotations: ${anns.length}`)
  
  // Get text content for label detection
  const textContent = await page.getTextContent()
  const textItems = textContent.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
  
  if (anns.length > 0) {
    console.log('\n--- Annotations ---')
    anns.forEach((a, i) => {
      const [ax1, ay1, ax2, ay2] = a.rect
      // Find label: text on same line, to the left of annotation
      const sameLine = textItems.filter(t => Math.abs(t.y - ay1) < 8 && t.x < ax1).sort((a, b) => b.x - a.x)
      const labelText = sameLine.map(t => t.text).join(' ').trim()
      // Also check text above (some labels are above the field)
      const aboveLine = textItems.filter(t => t.y > ay1 && t.y < ay1 + 15 && t.x < ax2).sort((a, b) => a.y - b.y)
      const aboveText = aboveLine.map(t => t.text).join(' ').trim()
      
      console.log(`  #${i+1} y=${ay1.toFixed(1)} x=${ax1.toFixed(1)} w=${(ax2-ax1).toFixed(1)} h=${(ay2-ay1).toFixed(1)} fieldName="${a.fieldName || ''}" | label="${labelText.slice(-60)}" | above="${aboveText.slice(-40)}"`)
    })
  }
  
  // Also print all text for reference
  console.log('\n--- All Text ---')
  textItems.forEach((t, i) => {
    if (t.text.trim()) console.log(`  [${i}] y=${t.y.toFixed(1)} x=${t.x.toFixed(1)} "${t.text}"`)
  })
}
