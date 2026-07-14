// ============================================================
// IMPORT EXISTING TEMPLATES TO BANK BUILDER
// ============================================================
// Script ini:
// 1. Upload semua template PDF (BTN, Mandiri, BSB, BPHTB, Notaris) ke Google Drive
// 2. Convert field coords (absolute PDF pixels → relative 0-1)
// 3. Save ke BankConfig.documents.templates
//
// Run: DATABASE_URL="..." npx tsx scripts/import-templates.ts
// ============================================================

import { PrismaClient } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Import field configs
import { FLPP_FIELDS } from '../src/lib/berkas/flpp-overlay/fields'
import { AJB_DOCUMENTS } from '../src/lib/berkas/ajb-overlay/fields'
import { BSB_DOCUMENTS } from '../src/lib/berkas/bsb-overlay/fields'
import { MANDIRI_DOCUMENTS } from '../src/lib/berkas/mandiri-overlay/fields'

// FLPP fields are a flat array, others are grouped in DOCUMENTS
// Get FLPP as a single doc config
const FLPP_DOC = {
  id: 'flpp',
  name: 'FLPP BTN',
  templatePath: '/public/templates/btn-flpp-template.pdf',
  fields: FLPP_FIELDS,
}

// SPR Mandiri
import { SPR_MANDIRI_FIELDS } from '../src/lib/berkas/spr-mandiri-overlay/fields'
const SPR_MANDIRI_DOC = {
  id: 'spr-mandiri',
  name: 'SPR Mandiri',
  templatePath: '/public/templates/spr-mandiri.pdf',
  fields: SPR_MANDIRI_FIELDS,
}

// React component docs (no PDF template, but create placeholder entries)
const REACT_DOCS = [
  { id: 'spr-btn', name: 'SPR BTN (React)', bankCode: 'BTN', stage: 'entry', templatePath: null },
  { id: 'pernyataan-rumah', name: 'Surat Pernyataan Tidak Memiliki Rumah', bankCode: null, stage: 'entry', templatePath: null },
  { id: 'pernyataan-penghasilan', name: 'Surat Pernyataan Penghasilan', bankCode: null, stage: 'entry', templatePath: null },
  { id: 'bphtb-pernyataan', name: 'Surat Pernyataan BPHTB', bankCode: null, stage: 'bphtb', templatePath: null },
  { id: 'bphtb-kuasa', name: 'Surat Kuasa BPHTB', bankCode: null, stage: 'bphtb', templatePath: null },
  { id: 'notaris-bast', name: 'BAST Notaris', bankCode: null, stage: 'notaris', templatePath: null },
  { id: 'notaris-tanda-terima', name: 'Tanda Terima Notaris', bankCode: null, stage: 'notaris', templatePath: null },
  { id: 'notaris-pernyataan', name: 'Pernyataan Pengecekan SHGB', bankCode: null, stage: 'notaris', templatePath: null },
  { id: 'notaris-kuasa', name: 'Surat Kuasa Notaris', bankCode: null, stage: 'notaris', templatePath: null },
]

async function getPdfDimensions(pdfPath: string): Promise<{ width: number; height: number; numPages: number }> {
  const fullPath = path.join(process.cwd(), pdfPath.replace(/^\//, ''))
  if (!fs.existsSync(fullPath)) {
    throw new Error(`PDF not found: ${fullPath}`)
  }
  const bytes = fs.readFileSync(fullPath)
  const pdf = await PDFDocument.load(bytes)
  const page = pdf.getPages()[0]
  return {
    width: page.getWidth(),
    height: page.getHeight(),
    numPages: pdf.getPageCount(),
  }
}

function convertFieldsToAnnotations(fields: any[], pageWidth: number, pageHeight: number, numPages: number) {
  return fields.map((f, idx) => {
    // Convert absolute PDF coords to relative (0-1)
    // PDF: origin bottom-left, Y goes up
    // Bank Builder: origin top-left, Y goes down
    const x_rel = f.x / pageWidth
    const y_rel = 1 - ((f.y + f.height) / pageHeight) // flip Y
    const width_rel = f.width / pageWidth
    const height_rel = f.height / pageHeight

    // Map source+field to fieldMapping
    let fieldMapping = 'custom.text'
    if (f.source === 'applicant') {
      fieldMapping = `customer.${f.field}`
    } else if (f.source === 'spouse') {
      fieldMapping = `customer.spouse${f.field.charAt(0).toUpperCase() + f.field.slice(1)}`
    } else if (f.source === 'company') {
      fieldMapping = `company.${f.field}`
    } else if (f.source === 'property') {
      fieldMapping = `customer.${f.field}`
    } else if (f.source === 'computed') {
      fieldMapping = `computed.${f.field}`
    }

    return {
      id: `ann-import-${idx}`,
      page: f.page || 1,
      x: Math.max(0, Math.min(1, x_rel)),
      y: Math.max(0, Math.min(1, y_rel)),
      width: Math.max(0.02, Math.min(1, width_rel)),
      height: Math.max(0.01, Math.min(1, height_rel)),
      label: f.field || `Field ${idx + 1}`,
      fieldMapping,
      fieldType: 'text',
      fontSize: f.fontSize || 10,
    }
  })
}

async function importForBank(bankCode: string, docs: Array<{ id: string; name: string; templatePath: string; fields: any[] }>, stage: string = 'entry') {
  console.log(`\n=== Importing for ${bankCode} ===`)
  
  const bank = await prisma.bankConfig.findUnique({ where: { bankCode } })
  if (!bank) {
    console.log(`Bank ${bankCode} not found — skip`)
    return
  }

  let existingDocs: any = {}
  try {
    if (bank.documents) existingDocs = JSON.parse(bank.documents)
  } catch {}
  if (!existingDocs.templates) existingDocs.templates = []

  for (const doc of docs) {
    console.log(`  Processing: ${doc.name} (${doc.fields.length} fields)`)
    
    try {
      const dims = await getPdfDimensions(doc.templatePath)
      const annotations = convertFieldsToAnnotations(doc.fields, dims.width, dims.height, dims.numPages)
      
      const template = {
        id: `tpl-import-${bankCode}-${doc.id}`,
        name: doc.name,
        stage,
        fileId: null, // No Drive upload — template PDF stays in /public/templates/
        fileName: path.basename(doc.templatePath),
        templatePath: doc.templatePath, // Local path for overlay code
        webViewLink: null,
        version: 1,
        uploadedAt: new Date().toISOString(),
        annotations,
        imported: true, // Flag: imported from existing code
      }
      
      // Check if already imported
      const existing = existingDocs.templates.find((t: any) => t.id === template.id)
      if (existing) {
        console.log(`    Already imported — skip`)
        continue
      }
      
      existingDocs.templates.push(template)
      console.log(`    ✅ ${annotations.length} annotations added`)
    } catch (err: any) {
      console.log(`    ❌ Error: ${err.message}`)
    }
  }

  await prisma.bankConfig.update({
    where: { id: bank.id },
    data: { documents: JSON.stringify(existingDocs) },
  })
  console.log(`  Saved to BankConfig`)
}

async function main() {
  console.log('🚀 Importing existing templates to Bank Builder...\n')

  // === BTN ===
  await importForBank('BTN', [FLPP_DOC], 'entry')
  await importForBank('BTN', AJB_DOCUMENTS.map(d => ({ ...d, fields: (d as any).fields || [] })), 'post-sp3k')

  // === MANDIRI ===
  await importForBank('MANDIRI', [SPR_MANDIRI_DOC, ...MANDIRI_DOCUMENTS.map(d => ({ ...d, fields: (d as any).fields || [] }))], 'entry')

  // === BSB SYARIAH ===
  await importForBank('BSB_SYARIAH', BSB_DOCUMENTS.map(d => ({ ...d, fields: (d as any).fields || [] })), 'entry')

  // === React docs (placeholder entries — no PDF, no annotations) ===
  console.log('\n=== Importing React component docs (placeholder) ===')
  for (const rd of REACT_DOCS) {
    let bankCode = rd.bankCode
    let bank: any = null
    
    if (bankCode) {
      bank = await prisma.bankConfig.findUnique({ where: { bankCode } })
    } else {
      // For common docs, add to all banks
      const allBanks = await prisma.bankConfig.findMany()
      for (bank of allBanks) {
        let docs: any = {}
        try { if (bank.documents) docs = JSON.parse(bank.documents) } catch {}
        if (!docs.templates) docs.templates = []
        
        const tplId = `tpl-react-${rd.id}`
        if (docs.templates.find((t: any) => t.id === tplId)) continue
        
        docs.templates.push({
          id: tplId,
          name: rd.name,
          stage: rd.stage,
          fileId: null,
          fileName: null,
          templatePath: null,
          webViewLink: null,
          version: 1,
          uploadedAt: new Date().toISOString(),
          annotations: [],
          imported: true,
          isReact: true, // Flag: React component, not PDF overlay
        })
        
        await prisma.bankConfig.update({
          where: { id: bank.id },
          data: { documents: JSON.stringify(docs) },
        })
        console.log(`  ✅ ${rd.name} → ${bank.bankCode}`)
      }
      continue
    }
    
    if (!bank) continue
    let docs: any = {}
    try { if (bank.documents) docs = JSON.parse(bank.documents) } catch {}
    if (!docs.templates) docs.templates = []
    
    const tplId = `tpl-react-${rd.id}`
    if (docs.templates.find((t: any) => t.id === tplId)) continue
    
    docs.templates.push({
      id: tplId,
      name: rd.name,
      stage: rd.stage,
      fileId: null,
      fileName: null,
      templatePath: null,
      webViewLink: null,
      version: 1,
      uploadedAt: new Date().toISOString(),
      annotations: [],
      imported: true,
      isReact: true,
    })
    
    await prisma.bankConfig.update({
      where: { id: bank.id },
      data: { documents: JSON.stringify(docs) },
    })
    console.log(`  ✅ ${rd.name} → ${bank.bankCode}`)
  }

  // === Summary ===
  console.log('\n=== SUMMARY ===')
  const banks = await prisma.bankConfig.findMany()
  for (const b of banks) {
    if (!b.documents) { console.log(`${b.bankCode}: no documents`); continue }
    try {
      const docs = JSON.parse(b.documents)
      const tpls = docs.templates || []
      const totalAnn = tpls.reduce((s: number, t: any) => s + (t.annotations?.length || 0), 0)
      console.log(`${b.bankCode}: ${tpls.length} templates, ${totalAnn} total annotations`)
      tpls.forEach((t: any) => console.log(`  - ${t.name} (${t.annotations?.length || 0} anns, ${t.isReact ? 'React' : 'PDF'}, ${t.stage})`))
    } catch {
      console.log(`${b.bankCode}: parse error`)
    }
  }

  console.log('\n✅ Import complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
