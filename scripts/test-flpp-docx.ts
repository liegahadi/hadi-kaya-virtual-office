// Test generate FLPP DOCX locally
import { generateFlppDocx } from '../src/lib/berkas/docx-template/flpp-generate'
import { INITIAL_STATE, DEFAULT_PROPERTY } from '../src/lib/berkas/constants'
import { MaritalStatus, JobType } from '../src/lib/berkas/types'
import fs from 'fs'

async function test() {
  const state = {
    ...INITIAL_STATE,
    applicant: {
      ...INITIAL_STATE.applicant,
      fullName: 'Budi Santoso Test',
      ktpNumber: '1234567890123456',
      npwpNumber: '99.888.777.6-555.000',
      pob: 'Pangkalpinang',
      dob: '1990-05-15',
      address: 'Jl. Test No. 123, Pangkalpinang',
      phone: '081234567890',
      jobType: JobType.EMPLOYEE,
      jobTitle: 'Karyawan Swasta',
      companyName: 'PT. Test',
      companyAddress: 'Jl. Test',
      monthlyIncome: 5000000,
      btnAccountNumber: '0123456789',
    },
    maritalStatus: MaritalStatus.MARRIED,
    spouse: {
      fullName: 'Siti Aminah Test',
      ktpNumber: '9876543210987654',
      pob: 'Jakarta',
      dob: '1992-08-20',
      job: 'Ibu Rumah Tangga',
      address: 'Jl. Test No. 123',
      isWorking: false,
      jobType: 'NGANGGUR' as const,
    },
    property: {
      ...DEFAULT_PROPERTY,
      projectName: 'Anjayo 16',
      kavlingNumber: 'A1',
      houseAddress: 'Jerambah Gantung, Pangkalpinang',
      landSize: 84,
      price: 173000000,
      downPayment: 5000000,
    },
    dateOfDocument: '2026-06-24',
    documentCategory: 'pre-bank' as const,
  }

  console.log('Generating FLPP DOCX...')
  const { buffer, replacedCount } = await generateFlppDocx(state as any)
  console.log(`✓ Replaced ${replacedCount} fields`)
  console.log(`✓ Output size: ${buffer.length} bytes`)

  const outPath = '/home/z/my-project/download/test-flpp-output.docx'
  fs.writeFileSync(outPath, buffer)
  console.log(`✓ Saved to ${outPath}`)
}

test().catch(e => { console.error(e); process.exit(1) })
