// Deep-inspect the second PDF — why does it return 0 annotations?
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdfPath = '/home/z/my-project/upload/SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI NEW 2025(1) (8).pdf'
const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))
const loadingTask = pdfjsLib.getDocument({ data: pdfBytes, disableFontFace: true, isEvalSupported: false, useSystemFonts: true })
const pdf = await loadingTask.promise

console.log('Pages:', pdf.numPages)

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p)
  const viewport = page.getViewport({ scale: 1 })
  console.log(`\n=== Page ${p} (${viewport.width}x${viewport.height}) ===`)

  let annots = []
  try {
    annots = await page.getAnnotations()
  } catch (e) {
    console.log('getAnnotations error:', e.message)
  }
  console.log(`Annotations count: ${annots.length}`)
  annots.forEach((a, i) => {
    console.log(`  [${i}] subtype=${a.subtype} rect=${JSON.stringify(a.rect)}`)
    console.log(`      contents=${JSON.stringify(a.contents || '').slice(0, 80)}`)
    console.log(`      textContent=${JSON.stringify(a.textContent || [])}`)
    console.log(`      fieldName=${JSON.stringify(a.fieldName || '')}`)
    console.log(`      ALL KEYS: ${Object.keys(a).join(', ')}`)
  })

  // Look at ALL text items — maybe annotations are actually rendered text in colored font
  const tc = await page.getTextContent()
  console.log(`\nText items: ${tc.items.length}`)
  // Show first 30 text items with their fonts
  tc.items.slice(0, 30).forEach((it, i) => {
    if (it.str) {
      console.log(`  [${i}] "${it.str.slice(0, 60)}" font=${it.fontName} color=${it.color ? Array.from(it.color).join(',') : 'n/a'} at (${Math.round(it.transform[4])},${Math.round(it.transform[5])})`)
    }
  })

  // Try operator list to look for colored text (blue ink = annotation)
  console.log('\nChecking for colored (non-black) text via operator list...')
  try {
    const ops = await page.getOperatorList()
    const fnArray = ops.fnArray
    const argsArray = ops.argsArray
    let colorChanges = 0
    let lastColor = null
    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i]
      // pdfjs.OPS.setFillFillColor = 68, setFillStrokeColor = 69 (rough)
      if (fn === 68 || fn === 69 || fn === 70 || fn === 71) { // color-related ops
        const c = argsArray[i]
        const sig = JSON.stringify(c)
        if (sig !== lastColor) {
          colorChanges++
          lastColor = sig
          if (colorChanges <= 10) console.log(`  op#${i} fn=${fn} color=${sig}`)
        }
      }
    }
    console.log(`Total color changes: ${colorChanges}`)
  } catch (e) {
    console.log('Operator list error:', e.message)
  }
}

await loadingTask.destroy()
