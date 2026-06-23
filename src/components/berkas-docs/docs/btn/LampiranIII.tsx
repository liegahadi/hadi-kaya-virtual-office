// ============================================================
// LAMPIRAN III - Surat Pernyataan Persetujuan Penyaluran KPR FLPP (BTN)
// FULL REPLICA dari: 9.-BTN- Kebutuhan Berkas awalan.docx (Lampiran III)
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'
import { DocumentLayout, DocHeader, SignatureBlock } from '../../DocumentLayout'

export function LampiranIII_BTN({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument, maritalStatus, spouse } = data

  return (
    <DocumentLayout>
      <p style={{ fontSize: '9pt', textAlign: 'right' }}>Lampiran III</p>
      <p style={{ fontSize: '9pt' }}>
        Memo SMD No. {'………'}/M/SMD/PPD/{new Date(dateOfDocument).getFullYear() === 2025 ? 'XII' : 'I'}/2025 tanggal {'……'} {new Date(dateOfDocument).toLocaleDateString('id-ID', { month: 'long' })} 2025
      </p>
      
      <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', margin: '20px 0 15px 0' }}>
        SURAT PERNYATAAN PERSETUJUAN<br/>PENYALURAN KPR SEJAHTERA FLPP TA 2025
      </h2>

      <p style={{ marginBottom: '10px' }}>Yang bertanda tangan di bawah ini:</p>

      {/* Pemohon */}
      <table style={{ width: '100%', fontSize: '10pt', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td><td>: <strong>{applicant.fullName || '…………'}</strong></td>
            <td style={{ width: '5%' }}></td>
            <td style={{ width: '20%' }}>No. KTP</td><td>: {applicant.ktpNumber || '…………'}</td>
          </tr>
          <tr>
            <td>Tempat, Tanggal Lahir</td><td>: {applicant.pob || '……'}, {formatLongDate(applicant.dob)}</td>
            <td></td>
            <td>Pekerjaan</td><td>: {applicant.jobType || '……'}</td>
          </tr>
          <tr>
            <td>Alamat</td><td colSpan={4}>: {applicant.address || '……………………'}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '10px' }}>Selaku pemohon.</p>

      {/* Pasangan */}
      {maritalStatus === 'Sudah Menikah' && spouse && (
        <>
          <table style={{ width: '100%', fontSize: '10pt', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%' }}>Nama Lengkap</td><td>: <strong>{spouse.fullName || '…………'}</strong></td>
                <td style={{ width: '5%' }}></td>
                <td style={{ width: '20%' }}>No. KTP</td><td>: {spouse.ktpNumber || '…………'}</td>
              </tr>
              <tr>
                <td>Tempat, Tanggal Lahir</td><td>: {spouse.pob || '……'}, {formatLongDate(spouse.dob)}</td>
                <td></td>
                <td>Pekerjaan</td><td>: {spouse.job || '……'}</td>
              </tr>
              <tr>
                <td>Alamat</td><td colSpan={4}>: {applicant.address || '……………………'}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginBottom: '10px' }}>Selaku istri/suami pemohon.</p>
        </>
      )}

      <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
        Menyatakan dengan sebenarnya bahwa sehubungan dengan kerja sama penyaluran Subsidi Bantuan Uang Muka Perumahan (SBUM) Tahun 2025 masih dalam proses kajian internal Kementerian PKR, maka atas fasilitas Kredit Pemilikan Rumah (KPR) Sejahtera FLPP yang Saya dan istri/suami ajukan maka Saya dan istri/suami:
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        1. Mengetahui dan menyetujui bahwa penyaluran KPR Sejahtera FLPP TA 2025 dimaksud atas pembelian rumah umum tapak pada proyek perumahan <strong>{property.projectName}</strong> Cluster {'……'} Blok/No. <strong>{property.kavlingNumber || '……'}</strong> yang dikembangkan oleh <strong>{COMPANY_INFO.name}</strong> dengan fasilitas SBUM yang akan dibayarkan apabila telah dapat ditagihkan dan sesuai dengan ketentuan pada PKS SBUM TA 2026.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        2. Bersedia dilakukan pemblokiran dana sebesar {formatCurrency(property.sbumAmount)} dan bersedia untuk dilakukan pemindahbukuan atas dana tersebut ke Rekening Developer dengan Nomor Rekening: <strong>{COMPANY_INFO.btnAccount}</strong> atas nama <strong>{COMPANY_INFO.name}</strong> sebagai pengganti Dana SBUM apabila fasilitas SBUM tidak dapat ditagihkan kepada Satker PUPR.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <p style={{ marginBottom: '10px' }}>Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>
      <p style={{ fontSize: '8pt', marginBottom: '10px' }}>*) coret salah yang tidak perlu</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Menyetujui,</p>
          <p>{COMPANY_INFO.city}, {formatLongDate(dateOfDocument)}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {spouse?.fullName || '……………………'} )</p>
          <p style={{ fontSize: '9pt' }}>Nama Lengkap Suami/Istri*</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>Menyetujui,</p>
          <p>{COMPANY_INFO.city}, {formatLongDate(dateOfDocument)}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {applicant.fullName || '……………………'} )</p>
          <p style={{ fontSize: '9pt' }}>Nama Lengkap Pemohon</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Mengetahui,</p>
          <p>Pengembang</p>
          <p>{COMPANY_INFO.name}</p>
          <div style={{ height: '60px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {COMPANY_INFO.director} )</p>
          <p style={{ fontSize: '9pt' }}>Nama Lengkap, Jabatan dan Stempel</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
