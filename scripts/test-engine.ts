// Test engine output untuk debug Slip Gaji kosong
import { buildCombinedDocument } from '../src/lib/berkas/templates/engine'
import type { BerkasState } from '../src/lib/berkas/types'

const mockState: BerkasState = {
  applicant: {
    fullName: 'Budi Santoso',
    ktpNumber: '1971040409720004',
    pob: 'Jakarta',
    dob: '1972-04-04',
    address: 'Jl. Denpasar No. 256',
    phone: '08117176687',
    jobType: 'Karyawan' as any,
    jobTitle: 'Staff Administrasi',
    companyName: 'Anjayo Residence',
    companyAddress: 'Jl. Fatmawati, Pangkalpinang',
    monthlyIncome: 5000000,
    npwpNumber: '',
    btnAccountNumber: '',
    ktpNumber_legacy: '',
    gajiPokok: 4500000,
    tunjanganTetap: [
      { label: 'Tunjangan Makan', amount: 500000 },
      { label: 'Tunjangan Transport', amount: 300000 },
    ],
    tunjanganVariabel: [],
    potongan: [
      { label: 'BPJS', amount: 200000 },
    ],
    tanggalTerimaGaji: '25',
  } as any,
  property: {
    projectName: 'Anjayo Residence',
    houseAddress: 'Jl. Jerambah Gantung',
    houseSize: 36,
    landSize: 84,
    kavlingNumber: 'E-6',
    blockLetter: 'E',
    houseNumber: '6',
    shmNumber: '',
    certificateDate: '',
    certStreet: '',
    certKelurahan: '',
    certKecamatan: '',
    certCity: '',
    nibNumber: '',
    pbgNumber: '',
    pbgDate: '',
    price: 173000000,
    downPayment: 1730000,
    paidDP: 1730000,
    remainingDP: 0,
    sbumAmount: 4000000,
    kprPlafon: 167270000,
    kprTerm: 20,
    electricity: '1300',
    water: 'Sumur Bor',
    sprNumber: '',
    buildingYear: '',
  } as any,
  maritalStatus: 'Belum Menikah' as any,
  dateOfDocument: '2026-07-17',
  akadDate: '',
  akadNumber: '',
  lpaDate: '',
  lpaNumber: '',
  sp3kDate: '',
  spouse: null as any,
}

const html = buildCombinedDocument('combined-formal', mockState)
console.log('=== HTML LENGTH ===', html.length)
console.log('')
console.log('=== FIRST 2000 CHARS (SK section) ===')
console.log(html.substring(0, 2000))
console.log('')
console.log('=== SEARCH FOR SLIP SECTION ===')
const slipIdx = html.indexOf('SLIP GAJI')
console.log('SLIP GAJI found at index:', slipIdx)
if (slipIdx >= 0) {
  console.log('')
  console.log('=== SLIP SECTION (2000 chars from SLIP GAJI) ===')
  console.log(html.substring(slipIdx, slipIdx + 2000))
}
console.log('')
console.log('=== PAGE BREAKS COUNT ===')
const pbCount = (html.match(/page-break-after:\s*always/gi) || []).length
console.log('Page breaks:', pbCount)
console.log('')
console.log('=== HTML ENDING (last 1500 chars) ===')
console.log(html.substring(html.length - 1500))
