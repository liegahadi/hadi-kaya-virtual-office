import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const files = [
  '/home/z/my-project/upload/AJB BTN.pdf',
  '/home/z/my-project/upload/Surat LPA dan AKAD.pdf',
]

for (const pdfPath of files) {
  console.log('\n\n========================================')
  console.log('FILE:', pdfPath.split('/').pop())
  console.log('========================================')
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise
  console.log(`Total pages: ${pdf.numPages}`)
  let totalAnns = 0
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const anns = await page.getAnnotations()
    if (anns.length > 0) {
      totalAnns += anns.length
      console.log(`\n--- PAGE ${p}: ${anns.length} annotations ---`)
      const textContent = await page.getTextContent()
      const textItems = textContent.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
      
      anns.forEach((a, i) => {
        const [ax1, ay1, ax2, ay2] = a.rect
        const ax = (ax1 + ax2) / 2
        const sameLine = textItems.filter(t => Math.abs(t.y - ay1) < 8 && t.x < ax1).sort((a, b) => b.x - a.x)
        const labelText = sameLine.map(t => t.text).join(' ').trim()
        console.log(`  #${i+1} rect=[${a.rect.map(n => n.toFixed(1)).join(',')}] w=${(ax2-ax1).toFixed(1)} h=${(ay2-ay1).toFixed(1)} | label="${labelText.slice(-70)}"`)
      })
    }
  }
  console.log(`\nTotal annotations: ${totalAnns}`)
}
