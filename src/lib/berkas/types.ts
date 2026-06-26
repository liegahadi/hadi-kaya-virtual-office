// ============================================================
// TYPES - Document Generator System
// ============================================================

export enum JobType {
  EMPLOYEE = 'Karyawan',
  ENTREPRENEUR = 'Wirausaha'
}

export enum MaritalStatus {
  SINGLE = 'Belum Menikah',
  MARRIED = 'Sudah Menikah'
}

export interface ApplicantData {
  fullName: string;
  ktpNumber: string;
  npwpNumber: string;
  btnAccountNumber: string;
  pob: string;
  dob: string;
  address: string;
  phone: string;
  jobType: JobType;
  jobTitle: string;
  companyName: string;
  companyAddress: string;
  monthlyIncome: number;
  // BSB Syariah specific
  domicileAddress?: string;
  email?: string;
  nip?: string;
  bendaharawanName?: string;
  bendaharawanNip?: string;
}

export type SpouseJobType = 'NGANGGUR' | 'KARYAWAN' | 'WIRAUSAHA'

export interface SpouseData {
  fullName: string;
  ktpNumber: string;
  pob: string;
  dob: string;
  job: string;
  address: string;
  isWorking: boolean;
  jobType: SpouseJobType;
}

export interface PropertyData {
  projectName: string;
  houseAddress: string;
  houseSize: number;
  landSize: number;
  kavlingNumber: string;
  blockLetter: string;
  houseNumber: string;
  shmNumber: string;
  nibNumber: string;
  certificateDate: string;
  pbgNumber: string;
  pbgDate: string;
  price: number;
  downPayment: number;
  paidDP: number;
  remainingDP: number;
  sbumAmount: number;
  kprPlafon: number;
  kprTerm: number;
  electricity: string;
  water: string;
  sprNumber: string;
  buildingYear: string;
}

export interface CompanyInfo {
  name: string;
  city: string;
  director: string;
  btnAccount: string;
  bankName: string;
  bankAddress: string;
}

export interface BerkasState {
  applicant: ApplicantData;
  maritalStatus: MaritalStatus;
  spouse?: SpouseData;
  property: PropertyData;
  dateOfDocument: string;
  documentCategory: 'pre-bank' | 'post-acc';
  closingDate?: string;
  berkasLengkapDate?: string;
  berkasMasukBankDate?: string;
  sp3kDate?: string;
  akadDate?: string;
  akadNumber?: string;
  lpaDate?: string;
  lpaNumber?: string;
  berkasLengkap?: boolean;
}
