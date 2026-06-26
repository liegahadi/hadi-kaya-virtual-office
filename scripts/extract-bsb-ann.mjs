import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const files = [
  '8. - BSB Syariah -  Form FLPP.pdf',
  '8. - BSB Syariah -  surat penawaran rumah (SUMSEL).pdf',
  '8. - BSB Syariah -  Form Permohonan Fasilitas Pembiayaan.pdf',
  'SURAT KUASA KEPADA BENDAHARAWAN.pdf',
  'SURAT PERNYATAAN.pdf',
  '8. - BSB Syariah -  SBUM (SUMSEL).pdf',
]

let totalAll = 0
for (const fname of files) {
  const fpath = `upload/${fname}`
  console.log(`\n\n========================================`)
  console.log(`FILE: ${fname}`)
  console.log(`========================================`)
  try {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(fpath)) }).promise
    console.log(`Pages: ${pdf.numPages}`)
    let fileTotal = 0
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const anns = await page.getAnnotations()
      if (anns.length > 0) {
        fileTotal += anns.length
        console.log(`\n--- PAGE ${p}: ${anns.length} annotations ---`)
        const textContent = await page.getTextContent()
        const textItems = textContent.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
        anns.forEach((a, i) => {
          const [ax1, ay1, ax2, ay2] = a.rect
          const sameLine = textItems.filter(t => Math.abs(t.y - ay1) < 8 && t.x < ax1).sort((a, b) => b.x - a.x)
          const labelText = sameLine.map(t => t.text).join(' ').trim()
          console.log(`  #${i+1} y=${ay1.toFixed(1)} x=${ax1.toFixed(1)} w=${(ax2-ax1).toFixed(1)} h=${(ay2-ay1).toFixed(1)} | label="${labelText.slice(-70)}"`)
        })
      }
    }
    console.log(`\nTotal annotations: ${fileTotal}`)
    totalAll += fileTotal
  } catch (e) { console.error(`Error: ${e.message.substring(0, 200)}`) }
}
console.log(`\n\n========== GRAND TOTAL: ${totalAll} annotations across ${files.length} files ==========`)
