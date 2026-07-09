// Find XML patterns around placeholder dots to understand structure
// Run: node scripts/find-dot-patterns.mjs

import PizZip from 'pizzip'
import fs from 'fs'

const docxPath = '/home/z/my-project/upload/Lampiran Memo SMD 8971 Ketentuan Realiasi KPR Sejahtera FLPP Tahun 2026.docx'
const buffer = fs.readFileSync(docxPath)
const zip = new PizZip(buffer)
const xml = zip.file('word/document.xml').asText()

// Find all occurrences of "..." (3+ dots) or unicode ellipsis "…" in XML
// Print surrounding context (500 chars before + 500 after)
const patterns = [
  /\.{3,}/g,         // ASCII dots
  /\u2026+/g,        // Unicode ellipsis
]

let totalFound = 0
const allMatches = []

for (const pat of patterns) {
  let m
  while ((m = pat.exec(xml)) !== null) {
    allMatches.push({
      index: m.index,
      text: m[0],
      length: m[0].length,
    })
    totalFound++
  }
}

console.log(`Total placeholder matches: ${totalFound}\n`)

// Print first 30 matches with surrounding context
allMatches.slice(0, 30).forEach((match, i) => {
  const start = Math.max(0, match.index - 300)
  const end = Math.min(xml.length, match.index + match.length + 300)
  const before = xml.substring(start, match.index)
  const placeholder = match.text
  const after = xml.substring(match.index + match.length, end)

  // Clean up the XML for readability - extract just text content & key tags
  const extractReadable = (s) => {
    return s
      .replace(/<w:p[^>]*>/g, '\n[P]')
      .replace(/<\/w:p>/g, '')
      .replace(/<w:tr[^>]*>/g, '\n[ROW]')
      .replace(/<w:tc[^>]*>/g, ' [CELL] ')
      .replace(/<w:tbl[^>]*>/g, '\n[TABLE]')
      .replace(/<\/w:tbl>/g, '\n[/TABLE]')
      .replace(/<w:r[^>]*>/g, '')
      .replace(/<\/w:r>/g, '')
      .replace(/<w:t[^>]*>/g, '<T>')
      .replace(/<\/w:t>/g, '</T>')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  console.log(`\n========== MATCH ${i + 1} (idx=${match.index}, len=${match.length}) ==========`)
  console.log(`PLACEHOLDER: "${placeholder}"`)
  console.log(`BEFORE: ${extractReadable(before).substring(-200)}`)
  console.log(`AFTER:  ${extractReadable(after)}`)
})

// Save sample XML chunks for inspection
console.log('\n\n========== FULL XML CONTEXT (first 5 matches) ==========')
allMatches.slice(0, 5).forEach((match, i) => {
  const start = Math.max(0, match.index - 600)
  const end = Math.min(xml.length, match.index + match.length + 400)
  console.log(`\n--- MATCH ${i + 1} (raw XML) ---`)
  console.log(xml.substring(start, end))
})

// Also count how many distinct placeholder patterns exist
console.log('\n\n========== UNIQUE PLACEHOLDER PATTERNS ==========')
const uniquePatterns = {}
allMatches.forEach(m => {
  uniquePatterns[m.text] = (uniquePatterns[m.text] || 0) + 1
})
Object.entries(uniquePatterns).sort((a, b) => b[1] - a[1]).forEach(([pat, count]) => {
  console.log(`  "${pat}" × ${count}`)
})
