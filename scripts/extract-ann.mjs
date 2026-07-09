import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync('/home/z/my-project/upload/Form FLPP BTN.pdf')) }).promise
let total = 0
for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p)
  const anns = await page.getAnnotations()
  if (anns.length > 0) {
    total += anns.length
    console.log(`PAGE ${p}: ${anns.length} annotations`)
    anns.forEach((a, i) => {
      console.log(`  #${i+1} type=${a.subtype||a.fieldType||'?'} name=${a.fieldName||'-'} value=${JSON.stringify(a.fieldValue||'')} contents=${JSON.stringify(a.contents||'')} rect=${JSON.stringify(a.rect)}`)
    })
  }
}
console.log(`\nTotal annotations: ${total}`)
