// Analyze DOCX file - extract all text content with paragraph structure
// Run: node /home/z/my-project/scripts/analyze-docx.mjs <path-to-docx>

import mammoth from 'mammoth'
import PizZip from 'pizzip'
import fs from 'fs'

const docxPath = process.argv[2] || '/home/z/my-project/upload/FLPP_BTN.docx'

if (!fs.existsSync(docxPath)) {
  console.error(`File not found: ${docxPath}`)
  console.error('Usage: node analyze-docx.mjs <path-to-docx>')
  process.exit(1)
}

async function analyze() {
  console.log(`\n========== ANALYZING: ${docxPath} ==========\n`)
  const buffer = fs.readFileSync(docxPath)

  // Method 1: Use mammoth to extract HTML (preserves structure)
  console.log('--- METHOD 1: Mammoth HTML extraction ---')
  const htmlResult = await mammoth.convertToHtml({ buffer })
  console.log(`HTML length: ${htmlResult.value.length}`)
  console.log(`Messages: ${htmlResult.messages.length}`)

  // Save HTML for inspection
  fs.writeFileSync('/home/z/my-project/scripts/docx-output.html', htmlResult.value)
  console.log(`→ HTML saved to scripts/docx-output.html`)

  // Method 2: Use mammoth to extract raw text
  console.log('\n--- METHOD 2: Mammoth raw text extraction ---')
  const textResult = await mammoth.extractRawText({ buffer })
  const text = textResult.value
  console.log(`Text length: ${text.length}`)

  // Save raw text
  fs.writeFileSync('/home/z/my-project/scripts/docx-output.txt', text)
  console.log(`→ Raw text saved to scripts/docx-output.txt`)

  // Print text with line numbers, highlight lines with placeholder patterns
  console.log('\n--- TEXT WITH LINE NUMBERS (highlighting placeholders) ---')
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    const hasPlaceholder = /\.{2,}|_{2,}|:.*$/.test(line)
    const hasColon = line.includes(':')
    const marker = hasPlaceholder ? (hasColon ? '🔴' : '🟡') : '  '
    if (line.trim()) {
      console.log(`${marker} L${(i + 1).toString().padStart(3)}: ${line.substring(0, 150)}`)
    }
  })

  // Method 3: Inspect raw XML structure of document.xml
  console.log('\n--- METHOD 3: Raw XML structure ---')
  const zip = new PizZip(buffer)
  const docXml = zip.file('word/document.xml')
  if (docXml) {
    const xml = docXml.asText()
    console.log(`document.xml size: ${xml.length} chars`)

    // Count paragraphs, tables, runs
    const paragraphCount = (xml.match(/<w:p[ >]/g) || []).length
    const tableCount = (xml.match(/<w:tbl[ >]/g) || []).length
    const runCount = (xml.match(/<w:r[ >]/g) || []).length
    console.log(`Paragraphs: ${paragraphCount}, Tables: ${tableCount}, Runs: ${runCount}`)

    // List all files in the DOCX zip
    console.log('\nFiles in DOCX:')
    Object.keys(zip.files).forEach(name => {
      console.log(`  ${name} (${zip.files[name]._data?.uncompressedSize || 0} bytes)`)
    })
  }

  // Summary: identify likely fillable fields
  console.log('\n--- SUMMARY: Likely fillable fields ---')
  let fieldCount = 0
  lines.forEach((line, i) => {
    // Pattern: "Label :" or "Label ...." or "...."
    const colonMatch = line.match(/^([^:]{3,40}):\s*$/)
    const dotMatch = line.match(/(.{0,40})(\.{3,}|_{3,})/)

    if (colonMatch) {
      fieldCount++
      console.log(`L${i + 1} [COLON] "${colonMatch[1].trim()}"`)
    } else if (dotMatch) {
      fieldCount++
      console.log(`L${i + 1} [DOTS]  "${dotMatch[1].trim() || '(start of line)'}"`)
    }
  })
  console.log(`\nTotal potential fields: ${fieldCount}`)
}

analyze().catch(console.error)
