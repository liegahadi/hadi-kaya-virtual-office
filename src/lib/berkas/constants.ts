// ============================================================
// CONSTANTS - Company & Property defaults
// ============================================================

import { CompanyInfo, PropertyData, JobType, MaritalStatus } from './types'

export const COMPANY_INFO: CompanyInfo = {
  name: 'PT. Marlindo Bangun Persada',
  city: 'Pangkalpinang',
  director: 'Andrian Bong',
  btnAccount: '00209 0130 000 3316',
  bankName: 'BTN Cabang Pangkalpinang',
  bankAddress: 'Jl. Jenderal Sudirman No. 10, Pangkalpinang',
}

export const DEFAULT_PROPERTY: PropertyData = {
  projectName: 'ANJAYO 16',
  houseAddress: 'Jl. Kelompok, Jerambah Gantung, Kerabut',
  houseSize: 36,
  landSize: 84,
  kavlingNumber: '',
  nibNumber: '',
  certificateDate: '',
  pbgNumber: 'SK-PBG-197106-24112023-001',
  pbgDate: '2023-11-24',
  price: 173000000,
  downPayment: 1730000,
  paidDP: 1730000,
  remainingDP: 0,
  sbumAmount: 4000000,
  kprPlafon: 167270000,
  kprTerm: 20,
  electricity: '1300 Watt',
  water: 'Sumur Bor Besar',
  sprNumber: '',
  buildingYear: new Date().getFullYear().toString(),
}

export const INITIAL_STATE = {
  applicant: {
    fullName: '',
    ktpNumber: '',
    npwpNumber: '',
    btnAccountNumber: '',
    pob: '',
    dob: '',
    address: '',
    phone: '',
    jobType: JobType.EMPLOYEE,
    jobTitle: '',
    companyName: '',
    companyAddress: '',
    monthlyIncome: 0,
  },
  maritalStatus: MaritalStatus.SINGLE,
  spouse: undefined,
  property: { ...DEFAULT_PROPERTY },
  dateOfDocument: new Date().toISOString().split('T')[0],
  documentCategory: 'pre-bank' as const,
}
