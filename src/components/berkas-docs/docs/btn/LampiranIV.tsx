// ============================================================
// LAMPIRAN IV - Surat Pernyataan Developer (BTN)
// FULL REPLICA
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatLongDate } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function LampiranIV_BTN({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data

  return (
    <DocumentLayout>
      <p style={{ fontSize: '9pt', textAlign: 'right' }}>Lampiran IV</p>
      <p style={{ fontSize: '9pt' }}>
        Memo SMD No. {'………'}/M/SMD/PPD/XII/2025 tanggal {'……'} Desember 2025
      </p>

      <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', margin: '20px 0 15px 0' }}>
        SURAT PERNYATAAN DEVELOPER
      </h2>

      <p style={{ marginBottom: '10px' }}>Yang bertanda tangan di bawah ini:</p>

      <table style={{ width: '100%', fontSize: '10pt', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td><td>: <strong>{COMPANY_INFO.director}</strong></td>
            <td style={{ width: '5%' }}></td>
            <td style={{ width: '20%' }}>No. KTP</td><td>: {'…………………'}</td>
          </tr>
          <tr>
            <td>Jabatan</td><td>: Direktur</td>
            <td></td>
            <td>Nama Developer</td><td>: <strong>{COMPANY_INFO.name}</strong></td>
          </tr>
          <tr>
            <td>Alamat</td><td colSpan={4}>: {COMPANY_INFO.city}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
        Dengan ini menyatakan bahwa debitur:
      </p>

      <table style={{ width: '100%', fontSize: '10pt', marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td><td>: <strong>{applicant.fullName || '…………'}</strong></td>
            <td style={{ width: '5%' }}></td>
            <td style={{ width: '20%' }}>No. KTP</td><td>: {applicant.ktpNumber || '…………'}</td>
          </tr>
          <tr>
            <td>Alamat Perumahan</td><td colSpan={4}>: {property.houseAddress} Blok {property.kavlingNumber || '……'}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
        Melaksanakan akad kredit di Bank BTN dengan kondisi saat ini fasilitas SBUM akan dibayarkan apabila telah dapat ditagihkan dan sesuai dengan ketentuan pada PKS SBUM TA 2026. Sehubungan dengan hal tersebut kami menyatakan tidak akan mengaitkan pembayaran SBUM debitur dimaksud kepada Bank BTN.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
        Demikian surat pernyataan ini dibuat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.
      </p>
      <p style={{ fontSize: '8pt', marginBottom: '10px' }}>*) coret salah yang tidak perlu</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Yang Menyatakan,</p>
          <p>{COMPANY_INFO.city}, {formatLongDate(dateOfDocument)}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {COMPANY_INFO.director} )</p>
          <p style={{ fontSize: '9pt' }}>Nama Lengkap Developer</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>Pihak Kedua</p>
          <p>{COMPANY_INFO.city}, {formatLongDate(dateOfDocument)}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( ................................. )</p>
          <p style={{ fontSize: '9pt' }}>Nama Lengkap, Jabatan dan Stempel</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
