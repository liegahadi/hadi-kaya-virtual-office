// SPR Mandiri - Field configurations (from annotation coordinates)
// 18 fields extracted from SPR MANDIRI.pdf annotations
// Page size: 612 x 792 (letter)
// Coordinate system: bottom-left origin (pdf-lib standard)

export interface SprMandiriField {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  page: number
  source: 'applicant' | 'company' | 'property' | 'custom'
  field: string
  transform?: (val: any, state: any, company: any) => string
  fontSize?: number
}

export const SPR_MANDIRI_FIELDS: SprMandiriField[] = [
  // === Header: No. SPR ===
  // #1 y=692.1 x=268.2 - SPR number (after "No." before "/SPR/")
  { id: 'spr_num', label: 'No. SPR (urut)', x: 268.2, y: 692.1, width: 39.7, height: 12.2, page: 1, source: 'property', field: 'sprNumber', fontSize: 10 },
  // #2 y=691.7 x=308.5 - Month (between "/SPR/" and "/SPR-AJR/")
  { id: 'spr_month', label: 'Bulan (Romawi)', x: 308.5, y: 691.7, width: 90.6, height: 12.2, page: 1, source: 'custom', field: 'sprMonth', fontSize: 10,
    transform: (_v, state) => {
      const d = state.dateOfDocument ? new Date(state.dateOfDocument) : new Date()
      const months = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
      return months[d.getMonth()] || ''
    }
  },
  // #3 y=691.1 x=371.8 - Year (after "/SPR-AJR/")
  { id: 'spr_year', label: 'Tahun', x: 371.8, y: 691.1, width: 26.3, height: 12.2, page: 1, source: 'custom', field: 'sprYear', fontSize: 10,
    transform: (_v, state) => {
      const d = state.dateOfDocument ? new Date(state.dateOfDocument) : new Date()
      return String(d.getFullYear())
    }
  },

  // === 1. DATA PEMESAN ===
  // #4 y=612.1 x=197.6 - Nama
  { id: 'pemesan_nama', label: 'Nama Pemesan', x: 197.6, y: 612.1, width: 65.0, height: 12.2, page: 1, source: 'applicant', field: 'fullName', fontSize: 10 },
  // #5 y=598.5 x=196.9 - Nomor KTP
  { id: 'pemesan_ktp', label: 'Nomor KTP Pemesan', x: 196.9, y: 598.5, width: 73.4, height: 12.1, page: 1, source: 'applicant', field: 'ktpNumber', fontSize: 10 },
  // #6 y=586.0 x=196.7 - Pekerjaan
  { id: 'pemesan_pekerjaan', label: 'Pekerjaan Pemesan', x: 196.7, y: 586.0, width: 84.2, height: 12.1, page: 1, source: 'applicant', field: 'jobType', fontSize: 10 },
  // #7 y=573.4 x=196.0 - Alamat Sesuai KTP
  { id: 'pemesan_alamat', label: 'Alamat KTP Pemesan', x: 196.0, y: 573.4, width: 92.8, height: 12.1, page: 1, source: 'applicant', field: 'address', fontSize: 10 },
  // #8 y=561.0 x=196.0 - No Telpone/HP
  { id: 'pemesan_telp', label: 'No Telp/HP Pemesan', x: 196.0, y: 561.0, width: 67.7, height: 12.1, page: 1, source: 'applicant', field: 'phone', fontSize: 10 },

  // === 2. DATA PENJUAL ===
  // #9 y=508.4 x=196.3 - Nama (Penjual = director)
  { id: 'penjual_nama', label: 'Nama Penjual (Direktur)', x: 196.3, y: 508.4, width: 67.7, height: 12.1, page: 1, source: 'company', field: 'directorName', fontSize: 10 },
  // #10 y=495.2 x=195.8 - Nomor KTP/NIK (Penjual = director NIK)
  { id: 'penjual_nik', label: 'NIK Penjual (Direktur)', x: 195.8, y: 495.2, width: 76.4, height: 12.1, page: 1, source: 'company', field: 'directorNik', fontSize: 10 },
  // #11 y=482.1 x=195.4 - No Telpone/HP (Penjual)
  { id: 'penjual_telp', label: 'No Telp/HP Penjual', x: 195.4, y: 482.1, width: 197.8, height: 12.1, page: 1, source: 'custom', field: 'penjualTelp', fontSize: 10,
    transform: (_v, _s, company) => company.directorPhone || '(0717) xxxxx'
  },

  // === PIHAK PERUMAHAN ===
  // #12 y=456.4 x=428.6 - Nama Perumahan
  { id: 'perumahan_nama', label: 'Nama Perumahan', x: 428.6, y: 456.4, width: 85.3, height: 12.0, page: 1, source: 'property', field: 'projectName', fontSize: 10 },

  // === 3. DATA RUMAH ===
  // #13 y=366.2 x=219.1 - Blok / Nomor Rumah
  { id: 'rumah_blok', label: 'Blok / Nomor Rumah', x: 219.1, y: 366.2, width: 87.1, height: 12.2, page: 1, source: 'custom', field: 'blokRumah', fontSize: 10,
    transform: (_v, state) => `${state.property.blockLetter || ''}${state.property.houseNumber || ''}`
  },
  // #14 y=351.8 x=153.9 - No. Sertifikat part 1 (SHM) — LEFT side
  { id: 'sertifikat_1', label: 'No. Sertifikat (SHM)', x: 153.9, y: 351.8, width: 60.2, height: 12.2, page: 1, source: 'property', field: 'shmNumber', fontSize: 10 },
  // #15 y=352.8 x=279.8 - Kelurahan Sertipikat — RIGHT side
  { id: 'sertifikat_2', label: 'Kelurahan Sertipikat', x: 279.8, y: 352.8, width: 94.8, height: 12.2, page: 1, source: 'property', field: 'nibNumber', fontSize: 10 },
  // #16 y=328.3 x=120.6 - LT/LB
  { id: 'lt_lb', label: 'LT/LB', x: 120.6, y: 328.3, width: 140.2, height: 12.1, page: 1, source: 'custom', field: 'ltlb', fontSize: 10,
    transform: (_v, state) => `${state.property.landSize || ''} / ${state.property.houseSize || ''} M²`
  },
  // #17 y=314.3 x=122.7 - Alamat
  { id: 'rumah_alamat', label: 'Alamat Rumah', x: 122.7, y: 314.3, width: 88.7, height: 12.1, page: 1, source: 'property', field: 'houseAddress', fontSize: 10 },

  // === Tanggal ===
  // #18 y=183.6 x=460.3 - Date (after "Pangkalpinang,")
  { id: 'tanggal', label: 'Tanggal', x: 460.3, y: 183.6, width: 94.8, height: 12.1, page: 1, source: 'custom', field: 'tanggalDoc', fontSize: 10,
    transform: (_v, state) => {
      const d = state.dateOfDocument ? new Date(state.dateOfDocument) : new Date()
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    }
  },
]

export const SPR_MANDIRI_TEMPLATE_PATH = '/templates/spr-mandiri.pdf'
