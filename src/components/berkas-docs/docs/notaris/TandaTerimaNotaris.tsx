// TANDA TERIMA SERTIFIKAT KE NOTARIS
import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

export function TandaTerimaNotaris({ data, notarisName }: { data: BerkasState; notarisName?: string }) {
  const { property, dateOfDocument } = data
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'
  const romans = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase' }}>TANDA TERIMA</h2>
        <p style={{ fontSize: '11pt', fontWeight: 'bold' }}>001/MBP/STT/{romans[new Date(dateOfDocument).getMonth()]}/{new Date(dateOfDocument).getFullYear()}</p>
      </div>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama Penerima</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}>{notarisName || '...'}</td></tr>
          <tr><td>Instansi Penerima</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{notarisName || '...'} (Notaris)</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Dengan ini kami menyerahkan sertifikat SHGB Asli sebagai berikut:</p>
      <p style={{ marginBottom: '15px', fontSize: '11pt', textAlign: 'justify', paddingLeft: '20px' }}>
        ASLI SHGB <strong>{property.shmNumber || '...'}</strong> an. PT {COMPANY_INFO.name} {property.houseAddress || '...'} – Blok {property.blockLetter}{property.houseNumber}
      </p>
      <div style={{ textAlign: 'right', marginBottom: '15px' }}>
        <p style={{ fontSize: '11pt', marginRight: '60px' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Diserahkan Oleh,</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}><strong>{COMPANY_INFO.director}</strong></p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Diterima Oleh,</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{notarisName || '...'}</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
