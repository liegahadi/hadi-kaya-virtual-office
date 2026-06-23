// ============================================================
// BTN DOCUMENTS INDEX
// Semua dokumen BTN, dikelompokkan: pre-bank & post-acc
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { SPR_BTN } from './SPR'
import { LampiranIII_BTN } from './LampiranIII'
import { LampiranIV_BTN } from './LampiranIV'
import { LampiranVI_BTN } from './LampiranVI'
import { SuratTidakBekerja_BTN } from './SuratTidakBekerja'
import { SuratTidakPunyaRumah_BTN } from './SuratTidakPunyaRumah'
import { KwitansiDP_BTN } from './KwitansiDP'

export interface DocDef {
  id: string
  name: string
  category: 'pre-bank' | 'post-acc'
  component: React.FC<{ data: BerkasState }>
  showWhenMarried?: boolean // hanya tampil kalau status menikah
}

export const BTN_DOCUMENTS: DocDef[] = [
  // === PRE-BANK (sebelum diajukan ke bank) ===
  { id: 'spr', name: 'SPR (Surat Pemesanan Rumah)', category: 'pre-bank', component: SPR_BTN },
  { id: 'lampiran-iii', name: 'Lampiran III - Persetujuan Penyaluran KPR FLPP', category: 'pre-bank', component: LampiranIII_BTN },
  { id: 'lampiran-iv', name: 'Lampiran IV - Surat Pernyataan Developer', category: 'pre-bank', component: LampiranIV_BTN },
  { id: 'lampiran-vi', name: 'Lampiran VI - Surat Pernyataan Pemohon KPR Bersubsidi', category: 'pre-bank', component: LampiranVI_BTN },
  { id: 'surat-tidak-punya-rumah', name: 'Surat Pernyataan Tidak Memiliki Rumah', category: 'pre-bank', component: SuratTidakPunyaRumah_BTN },
  { id: 'surat-tidak-bekerja', name: 'Surat Pernyataan Tidak Bekerja (Pasangan)', category: 'pre-bank', component: SuratTidakBekerja_BTN, showWhenMarried: true },
  { id: 'kwitansi-dp', name: 'Kwitansi Pembayaran DP', category: 'pre-bank', component: KwitansiDP_BTN },
  // === POST-ACC (setelah SP3K, akan ditambahkan nanti) ===
  // Standing Instruction LPA, Standing Instruction Pencairan, Surat Kuasa Debitur,
  // Surat Pernyataan dan Kuasa Pemblokiran, Surat Pernyataan Debitur - PBG,
  // Surat Pernyataan Debitur (Terbaru), Berita Acara Penyerahan Sertifikat,
  // PSU Jalan dan Listrik
]

export function getBtnDocuments(category: 'pre-bank' | 'post-acc', maritalStatus?: string): DocDef[] {
  return BTN_DOCUMENTS.filter(doc => {
    if (doc.category !== category) return false
    if (doc.showWhenMarried && maritalStatus !== 'Sudah Menikah') return false
    return true
  })
}
