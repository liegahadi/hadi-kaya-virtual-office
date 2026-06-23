// ============================================================
// KWITANSI DP - Bukti Pembayaran Uang Muka
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate, numberToWords } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function KwitansiDP_BTN({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data
  const dpAmount = property.paidDP || property.downPayment

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{COMPANY_INFO.name}</h1>
        <div style={{ borderBottom: '2px solid black', margin: '5px 0' }}></div>
      </div>

      <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', margin: '20px 0 20px 0' }}>
        KWITANSI
      </h2>

      <p style={{ marginBottom: '15px' }}>Sudah diterima uang dari:</p>

      <table style={{ width: '100%', fontSize: '10pt', marginBottom: '15px' }}>
        <tbody>
          <tr><td style={{ width: '25%' }}>Nama</td><td>: <strong>{applicant.fullName || '………………'}</strong></td></tr>
          <tr><td>Sebagai</td><td>: Pembayaran Uang Muka (DP) Rumah {property.projectName}</td></tr>
          <tr><td>Unit</td><td>: Blok {property.kavlingNumber || '……'} Type {property.houseSize}/{property.landSize}</td></tr>
          <tr><td>Terbilang</td><td>: {numberToWords(dpAmount)} Rupiah</td></tr>
          <tr><td>Untuk Pembayaran</td><td>: {formatCurrency(dpAmount)}</td></tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <div></div>
        <div style={{ textAlign: 'center' }}>
          <p>{COMPANY_INFO.city}, {formatLongDate(dateOfDocument)}</p>
          <p style={{ marginTop: '5px' }}>{COMPANY_INFO.name}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {COMPANY_INFO.director} )</p>
          <p style={{ fontSize: '9pt' }}>Direktur</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
