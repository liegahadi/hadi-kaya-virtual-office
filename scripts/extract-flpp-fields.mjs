// Extract ALL fillable fields from FLPP PDF with positions
// Output: JSON map of fields with {page, x, y, width, type, label}

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdfPath = '/home/z/my-project/upload/Form FLPP BTN.pdf'
const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))

async function extractFields() {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
  const pdf = await loadingTask.promise
  const fields = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()

    // Group items by line (y position, rounded to nearest 2)
    const lines = {}
    textContent.items.forEach(item => {
      const y = Math.round(item.transform[5] / 2) * 2
      const x = Math.round(item.transform[4])
      if (!lines[y]) lines[y] = []
      lines[y].push({
        text: item.str,
        x,
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
        height: Math.round(item.height),
      })
    })

    // For each line, find label "..." patterns
    const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)

    sortedYs.forEach(y => {
      const items = lines[y].sort((a, b) => a.x - b.x)
      const fullLine = items.map(i => i.text).join('')

      // Pattern 1: "Label :" → field after colon
      // Pattern 2: "Label ………… " → field after dots
      // Pattern 3: "Rp. ………… " → numeric field

      // Find labels ending with ":" - field is everything after
      const colonMatch = fullLine.match(/^([^:]+):\s*$/)
      if (colonMatch) {
        const label = colonMatch[1].trim()
        // Find the colon position
        const colonItem = items.find(i => i.text === ':')
        if (colonItem) {
          fields.push({
            page: pageNum,
            label,
            type: 'text',
            x: colonItem.x + colonItem.width + 5,
            y: colonItem.y,
            width: viewport.width - colonItem.x - colonItem.width - 30,
            line: fullLine,
          })
        }
      }

      // Find lines with dots indicating fillable area
      // e.g. "proyek perumahan …………………………....………………….. Cluster"
      // We need to find each "……" segment and its preceding label
      const dotPattern = /[…\.]{3,}/g
      let match
      while ((match = dotPattern.exec(fullLine)) !== null) {
        const dotStart = match.index
        const dotEnd = dotStart + match[0].length

        // Find the label before the dots (last word/phrase before dots)
        const beforeDots = fullLine.substring(0, dotStart).trim()
        const lastWord = beforeDots.split(/[\s,]+/).filter(Boolean).slice(-2).join(' ')

        // Find x position of the dots by matching character positions
        let currentX = 0
        let dotX = 0
        for (const item of items) {
          const itemEnd = currentX + item.text.length
          if (dotStart >= currentX && dotStart < itemEnd) {
            // Dots start in this item
            dotX = item.x + (dotStart - currentX)
            break
          }
          currentX = itemEnd
        }

        fields.push({
          page: pageNum,
          label: lastWord || '(unnamed)',
          type: 'dots',
          x: dotX,
          y: Math.round(y),
          width: match[0].length * 2, // approximate
          line: fullLine.substring(0, 80),
        })
      }
    })
  }

  // Filter to only show meaningful fields
  const meaningful = fields.filter(f => {
    const label = f.label.toLowerCase()
    return (
      f.label.length > 2 &&
      !['ini:', 'ini', 'yang', 'dengan', 'atas', 'selaku'].includes(f.label.toLowerCase()) &&
      !label.startsWith('yang bertanda') &&
      !label.includes('coret')
    )
  })

  console.log(JSON.stringify(meaningful, null, 2))

  // Save to file
  fs.writeFileSync('/home/z/my-project/scripts/flpp-fields.json', JSON.stringify(meaningful, null, 2))
  console.error(`\nExtracted ${meaningful.length} fields → /home/z/my-project/scripts/flpp-fields.json`)

  await loadingTask.destroy()
}

extractFields().catch(console.error)
