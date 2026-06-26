import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync('/home/z/my-project/public/templates/btn-surat-lpa-akad.pdf')) }).promise

for (const p of [1, 2]) {
  console.log(`\n========== PAGE ${p} ==========`)
  const page = await pdf.getPage(p)
  const anns = await page.getAnnotations()
  const textContent = await page.getTextContent()
  const textItems = textContent.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], w: item.width }))
  
  anns.forEach((a, i) => {
    const [ax1, ay1, ax2, ay2] = a.rect
    // Get ALL text on same line (within 8pt y)
    const sameLine = textItems.filter(t => Math.abs(t.y - ay1) < 8).sort((a, b) => a.x - b.x)
    const fullLine = sameLine.map(t => t.text).join('').trim()
    // Get text items just above (y slightly higher, within 15pt)
    const above = textItems.filter(t => t.y > ay2 && t.y < ay2 + 15 && t.x < ax2 + 50).sort((a, b) => b.y - a.y)
    const aboveText = above.map(t => t.text).join(' ').trim()
    
    console.log(`\n  #${i+1} y=${ay1.toFixed(1)} x=${ax1.toFixed(1)} w=${(ax2-ax1).toFixed(1)} h=${(ay2-ay1).toFixed(1)}`)
    console.log(`    FULL LINE: "${fullLine.substring(0, 120)}"`)
    console.log(`    ABOVE: "${aboveText.substring(0, 80)}"`)
  })
}
