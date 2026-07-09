import PizZip from 'pizzip'
import fs from 'fs'

const templatePath = '/home/z/my-project/public/templates/btn-flpp.docx'
const buffer = fs.readFileSync(templatePath)
const zip = new PizZip(buffer)
const docFile = zip.file('word/document.xml')
if (!docFile) throw new Error('No document.xml')
let xml = docFile.asText()
console.log('XML length:', xml.length)

// Count dotted-underline-tab runs
const dottedRunRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g
let m, dottedCount = 0
while ((m = dottedRunRegex.exec(xml)) !== null) {
  if (m[1].includes('<w:u w:val="dotted"') && m[1].includes('<w:tab/>')) {
    dottedCount++
  }
}
console.log('Dotted underline tab runs:', dottedCount)

// Test: replace first dotted run with a test value
const matches = []
const re = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g
while ((m = re.exec(xml)) !== null) {
  if (m[1].includes('<w:u w:val="dotted"') && m[1].includes('<w:tab/>')) {
    matches.push({ fullMatch: m[0], startIndex: m.index, runContent: m[1] })
  }
}

// Replace first match
if (matches.length > 0) {
  const match = matches[0]
  // Get preceding text
  const beforeXml = xml.substring(Math.max(0, match.startIndex - 2000), match.startIndex)
  const textMatches = [...beforeXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
  const precedingText = textMatches.map(tm => tm[1]).join('')
  console.log('First field preceding text:', JSON.stringify(precedingText.slice(-100)))

  // Replace <w:tab/> with <w:t>TEST_VALUE</w:t>
  const newRunContent = match.runContent.replace('<w:tab/>', '<w:t xml:space="preserve">TEST_VALUE</w:t>')
  // Add bold
  let finalContent = newRunContent
  if (newRunContent.includes('<w:rPr>')) {
    finalContent = newRunContent.replace('<w:rPr>', '<w:rPr><w:b/>')
  } else {
    const rTagMatch = match.fullMatch.match(/<w:r([^>]*)>/)
    if (rTagMatch) {
      finalContent = `<w:r${rTagMatch[1]}><w:rPr><w:b/></w:rPr>${newRunContent}</w:r>`
      // Remove the closing </w:r> from newRunContent if present
    }
  }
  console.log('Sample new run (first 300 chars):', finalContent.substring(0, 300))
}

// Write modified XML back
zip.file('word/document.xml', xml)
const outputBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
fs.writeFileSync('/home/z/my-project/download/test-flpp-output.docx', Buffer.from(outputBuffer))
console.log('✓ Test DOCX saved to /home/z/my-project/download/test-flpp-output.docx')
console.log('✓ Size:', Buffer.from(outputBuffer).length, 'bytes')
