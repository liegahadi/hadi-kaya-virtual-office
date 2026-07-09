// Count and inventory all "dotted underline tab" fillable fields
// + identify their preceding label (for field mapping)
import PizZip from 'pizzip'
import fs from 'fs'

const docxPath = '/home/z/my-project/upload/Lampiran Memo SMD 8971 Ketentuan Realiasi KPR Sejahtera FLPP Tahun 2026.docx'
const buffer = fs.readFileSync(docxPath)
const zip = new PizZip(buffer)
const xml = zip.file('word/document.xml').asText()

// Match pattern: <w:r>...<w:rPr>...<w:u w:val="dotted"/>...</w:rPr>...<w:tab/>...</w:r>
// Use a non-greedy regex to find runs with dotted underline + tab
const dottedRunRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g

let match
const dottedRuns = []
let totalDotted = 0

while ((match = dottedRunRegex.exec(xml)) !== null) {
  const runXml = match[0]
  const runContent = match[1]
  // Check if this run has dotted underline AND contains a tab
  if (runContent.includes('<w:u w:val="dotted"') && runContent.includes('<w:tab/>')) {
    totalDotted++
    // Get the preceding text content (look back for the last <w:t>...</w:t> before this run)
    const before = xml.substring(Math.max(0, match.index - 1500), match.index)
    // Extract all <w:t>...</w:t> texts from before
    const textMatches = [...before.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    const precedingTexts = textMatches.map(m => m[1]).filter(t => t.trim())
    const lastFewTexts = precedingTexts.slice(-5).join(' ')

    // Get the position in document
    dottedRuns.push({
      index: match.index,
      precedingText: lastFewTexts,
    })
  }
}

console.log(`\n========== TOTAL DOTTED-UNDERLINE TAB RUNS: ${totalDotted} ==========\n`)

// Print each with its preceding text context
dottedRuns.forEach((r, i) => {
  console.log(`#${(i + 1).toString().padStart(3)} | idx=${r.index} | PRECEDING: "${r.precedingText.substring(-80)}"`)
})

// Also count literal "...." dots that aren't inside dotted-underline runs
const literalDotsRegex = /\.{3,}|\u2026{3,}/g
let dotsCount = 0
const dotsContexts = []
while ((match = literalDotsRegex.exec(xml)) !== null) {
  dotsCount++
  const before = xml.substring(Math.max(0, match.index - 300), match.index)
  const textMatches = [...before.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
  const precedingTexts = textMatches.map(m => m[1]).filter(t => t.trim())
  const lastText = precedingTexts.slice(-3).join(' ')
  dotsContexts.push({
    index: match.index,
    dots: match[0],
    precedingText: lastText,
  })
}

console.log(`\n========== LITERAL DOTS (...): ${dotsCount} ==========\n`)
dotsContexts.slice(0, 30).forEach((r, i) => {
  console.log(`#${(i + 1).toString().padStart(3)} | dots="${r.dots.substring(0, 30)}${r.dots.length > 30 ? '...' : ''}" | PRECEDING: "${r.precedingText.substring(-80)}"`)
})
