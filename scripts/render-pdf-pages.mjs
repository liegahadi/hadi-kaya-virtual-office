// Render PDF pages to PNG images using pdfjs-dist
// Run: node scripts/render-pdf-pages.mjs <pdf-path> <page-numbers>
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
import 'canvas'

const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdfPath = process.argv[2] || '/home/z/my-project/upload/Form FLPP BTN.pdf'
const pageArg = process.argv[3] || '1,2'
const pages = pageArg.split(',').map(n => parseInt(n.trim()))

const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))

async function render() {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
  const pdf = await loadingTask.promise

  for (const pageNum of pages) {
    if (pageNum < 1 || pageNum > pdf.numPages) {
      console.error(`Page ${pageNum} out of range`)
      continue
    }
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = await page.render({ canvasContext: null, viewport }).promise
    // Actually we need a canvas - use pdfjs NodeCanvasFactory approach
    console.log(`Page ${pageNum} not yet rendered (need canvas factory)`)
  }
}

// Simpler: use pdftoppm if available
import { execSync } from 'child_process'

for (const pageNum of pages) {
  const outPath = `/home/z/my-project/download/flpp-page-${pageNum}.png`
  try {
    execSync(`pdftoppm -png -r 150 -f ${pageNum} -l ${pageNum} "${pdfPath}" "/tmp/flpp-page"`, { stdio: 'inherit' })
    const tmpFile = `/tmp/flpp-page-${pageNum.toString().padStart(2, '0')}.png`
    if (fs.existsSync(tmpFile)) {
      fs.copyFileSync(tmpFile, outPath)
      console.log(`✓ Page ${pageNum} saved to ${outPath}`)
    }
  } catch (e) {
    console.error(`Failed page ${pageNum}:`, e.message)
  }
}
