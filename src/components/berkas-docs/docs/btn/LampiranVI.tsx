// ============================================================
// LAMPIRAN VI - Surat Pernyataan Pemohon KPR Bersubsidi (BTN)
// FULL REPLICA dari PDF: 9.-BTN- SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function LampiranVI_BTN({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument, maritalStatus, spouse } = data

  return (
    <DocumentLayout>
      <p style={{ fontSize: '9pt', textAlign: 'right' }}>Lampiran VI</p>

      <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', margin: '20px 0 20px 0' }}>
        SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI
      </h2>

      <p style={{ marginBottom: '15px' }}>Yang bertandatangan di bawah ini:</p>

      {/* Pemohon */}
      <table style={{ width: '100%', fontSize: '10pt', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%' }}>1. Nama</td>
            <td>: <strong>{applicant.fullName || '………………………'}</strong></td>
          </tr>
          <tr>
            <td>Tempat / Tgl Lahir</td>
            <td>: {applicant.pob || '………'}, {formatLongDate(applicant.dob)}</td>
          </tr>
          <tr>
            <td>Pekerjaan</td>
            <td>: {applicant.jobType || '………'}</td>
          </tr>
          <tr>
            <td>No. KTP / NIK</td>
            <td>: {applicant.ktpNumber || '………………………'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>: {applicant.address || '………………………'}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px' }}>Selaku Pemohon</p>

      {/* Pasangan */}
      {maritalStatus === 'Sudah Menikah' && spouse && (
        <>
          <table style={{ width: '100%', fontSize: '10pt', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '30%' }}>2. Nama</td>
                <td>: <strong>{spouse.fullName || '………………………'}</strong></td>
              </tr>
              <tr>
                <td>Tempat / Tgl Lahir</td>
                <td>: {spouse.pob || '………'}, {formatLongDate(spouse.dob)}</td>
              </tr>
              <tr>
                <td>Pekerjaan</td>
                <td>: {spouse.job || '………'}</td>
              </tr>
              <tr>
                <td>No. KTP / NIK</td>
                <td>: {spouse.ktpNumber || '………………………'}</td>
              </tr>
              <tr>
                <td>Alamat</td>
                <td>: {applicant.address || '………………………'}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginBottom: '15px' }}>Selaku suami / istri pemohon.</p>
        </>
      )}

      <p style={{ marginBottom: '15px' }}>Menyatakan dengan sesunguhnya bahwa:</p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        1. Saya memiliki gaji/upah pokok/penghasilan bersih/upah rata-rata per bulan sebesar <strong>{formatCurrency(applicant.monthlyIncome)}</strong> ({applicant.monthlyIncome ? '' : '......................................'}).
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        2. Saya dan (istri/suami) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        3. Saya dan (istri/suami) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan pembangunan Rumah Swadaya.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        4. Saya membeli Rumah Umum Tapak dengan harga <strong>{formatCurrency(property.price)}</strong> dari <strong>{COMPANY_INFO.name}</strong>.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', paddingLeft: '20px' }}>
        5. Saya dan (istri/suami) akan menggunakan Rumah Umum Tapak sebagai tempat tinggal saya dan/ataau keluarga saya, dan tidak akan mengalihkan kepada pihak lain dalam jangka waktu 5 (lima) tahun sejak serah terima.
      </p>

      <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima dan dapat diajukan tuntutan pidana sesuai peraturan perundang-undangan yang berlaku.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Mengetahui,</p>
          <p>Pimpinan Tempat Bekerja/Kepala Desa/Lurah*</p>
          <p>{applicant.address?.split(',').pop()?.trim() || '........................'}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( ................................. )</p>
          <p style={{ fontSize: '9pt' }}>Nama Lengkap, Jabatan dan Stempel</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>{COMPANY_INFO.city}, {formatLongDate(dateOfDocument)}</p>
          <p>Yang membuat pernyataan,</p>
          <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ border: '1px solid #999', padding: '8px 16px', fontSize: '9pt', color: '#666' }}>Materai 10.000</div>
          </div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {applicant.fullName || '........................'} )</p>
        </div>
      </div>
      <p style={{ fontSize: '8pt', marginTop: '5px' }}>*) coret yang tidak perlu</p>
    </DocumentLayout>
  )
}
