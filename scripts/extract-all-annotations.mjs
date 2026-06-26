import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync('/home/z/my-project/public/templates/btn-flpp-template.pdf')) }).promise
console.log(`Total pages: ${pdf.numPages}`)
let total = 0
const allFields = []

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p)
  const anns = await page.getAnnotations()
  if (anns.length > 0) {
    total += anns.length
    console.log(`\n========== PAGE ${p}: ${anns.length} annotations ==========`)
    anns.forEach((a, i) => {
      const rect = a.rect || []
      // Try to get text from RichText or contents
      let text = ''
      if (a.richContents && a.richContents.length > 0) {
        text = a.richContents.map(rc => rc.str || '').join(' ')
      }
      if (!text && a.contents) text = a.contents
      if (!text && a.alternativeText) text = a.alternativeText
      if (!text && a.fieldValue) text = String(a.fieldValue)
      
      console.log(`#${i+1} rect=[${rect.map(n => n.toFixed(2)).join(',')}] text="${text}" type=${a.subtype||a.fieldType||'?'} name=${a.fieldName||'-'}`)
      
      // Get text content near this annotation to identify the label
      allFields.push({ page: p, idx: i+1, rect, text })
    })
  }
}

console.log(`\n\nTotal annotations: ${total}`)

// For each annotation, find the nearest text label (look at text items above and to the left)
console.log('\n\n========== FIELD LABELS (text near each annotation) ==========')
for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p)
  const anns = await page.getAnnotations()
  if (anns.length === 0) continue
  
  const textContent = await page.getTextContent()
  const textItems = textContent.items.map(item => ({
    text: item.str,
    x: item.transform[4],
    y: item.transform[5],
    w: item.width,
    h: item.height,
  }))
  
  console.log(`\n--- PAGE ${p} ---`)
  anns.forEach((ann, i) => {
    const [ax1, ay1, ax2, ay2] = ann.rect
    const ax = (ax1 + ax2) / 2
    const ay = (ay1 + ay2) / 2
    
    // Find text items on same line (similar y) to the LEFT of annotation
    const sameLine = textItems.filter(t => 
      Math.abs(t.y - ay1) < 8 && t.x < ax1
    ).sort((a, b) => b.x - a.x)
    
    // Find text items just ABOVE the annotation (y slightly higher)
    const above = textItems.filter(t =>
      t.y > ay2 && t.y < ay2 + 20 && t.x < ax2 + 50
    ).sort((a, b) => b.y - a.y)
    
    const labelText = sameLine.map(t => t.text).join(' ').trim()
    const aboveText = above.map(t => t.text).join(' ').trim()
    
    let text = ''
    if (ann.richContents && ann.richContents.length > 0) {
      text = ann.richContents.map(rc => rc.str || '').join(' ')
    }
    if (!text && ann.contents) text = ann.contents
    
    console.log(`#${i+1} ann="${text}" | rect=[${ann.rect.map(n => n.toFixed(1)).join(',')}] | label="${labelText}" | above="${aboveText}"`)
  })
}
