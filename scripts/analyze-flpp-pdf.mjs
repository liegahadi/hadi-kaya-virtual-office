// Analyze Form FLPP BTN PDF - extract text positions to identify fillable fields
// Run: node /home/z/my-project/scripts/analyze-flpp-pdf.mjs

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
// Use the legacy worker entry point
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdfPath = '/home/z/my-project/upload/Form FLPP BTN.pdf'
const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))

async function analyze() {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
  const pdf = await loadingTask.promise
  console.log(`Total pages: ${pdf.numPages}\n`)

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    console.log(`\n========== PAGE ${pageNum} ==========`)
    console.log(`Viewport: width=${viewport.width}, height=${viewport.height}`)

    const textContent = await page.getTextContent()
    console.log(`\nText items: ${textContent.items.length}\n`)

    // Group items by line (y position)
    const lines = {}
    textContent.items.forEach(item => {
      const y = Math.round(item.transform[5])
      const x = Math.round(item.transform[4])
      if (!lines[y]) lines[y] = []
      lines[y].push({
        text: item.str,
        x,
        y,
        width: Math.round(item.width),
        height: Math.round(item.height),
        fontName: item.fontName,
      })
    })

    // Sort lines by Y (top to bottom = high to low in PDF coords)
    const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)

    sortedYs.forEach(y => {
      const items = lines[y].sort((a, b) => a.x - b.x)
      const lineText = items.map(i => i.text).join('')
      // Only print lines that have content
      if (lineText.trim()) {
        console.log(`y=${y} | ${lineText}`)
      }
    })

    // Find placeholder patterns: lines with dots (....) or underscores (____)
    console.log(`\n--- POTENTIAL FILLABLE FIELDS (lines with dots/underscores) ---`)
    sortedYs.forEach(y => {
      const items = lines[y].sort((a, b) => a.x - b.x)
      const lineText = items.map(i => i.text).join('')
      if (/\.{2,}|_{2,}/.test(lineText) || lineText.includes(':')) {
        console.log(`y=${y} | ${lineText.substring(0, 120)}`)
        // Show item details
        items.forEach(i => {
          if (i.text.trim()) {
            console.log(`   x=${i.x} w=${i.width} "${i.text}"`)
          }
        })
      }
    })
  }

  await loadingTask.destroy()
}

analyze().catch(console.error)
