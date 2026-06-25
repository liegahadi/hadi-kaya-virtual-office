import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync('/home/z/my-project/public/templates/btn-ajb-bank.pdf')) }).promise
const page = await pdf.getPage(2)
const anns = await page.getAnnotations()
const textContent = await page.getTextContent()
const textItems = textContent.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], w: item.width }))

anns.forEach((a, i) => {
  const [ax1, ay1, ax2, ay2] = a.rect
  const sameLine = textItems.filter(t => Math.abs(t.y - ay1) < 6).sort((a, b) => a.x - b.x)
  const leftText = sameLine.filter(t => t.x < ax1).map(t => t.text).join(' ').trim()
  console.log(`  #${i+1} y=${ay1.toFixed(0)} x=${ax1.toFixed(0)} w=${(ax2-ax1).toFixed(0)} | LEFT: "${leftText.slice(-60)}"`)
})
