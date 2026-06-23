// ============================================================
// SURAT PERNYATAAN TIDAK BEKERJA (Pasangan) - BTN
// FULL REPLICA - BLANK VERSION (data lama sudah dihapus)
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { formatLongDate } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function SuratTidakBekerja_BTN({ data }: { data: BerkasState }) {
  const { spouse, dateOfDocument } = data

  return (
    <DocumentLayout>
      <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', margin: '30px 0 30px 0' }}>
        SURAT PERNYATAAN TIDAK BEKERJA
      </h2>

      <p style={{ marginBottom: '20px' }}>Yang bertandatangan di bawah ini:</p>

      <table style={{ width: '100%', fontSize: '10pt', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%' }}>Nama</td>
            <td>: <strong>{spouse?.fullName || '…………………………………'}</strong></td>
          </tr>
          <tr>
            <td>Tempat/tgl lahir</td>
            <td>: {spouse?.pob || '………………'}, {formatLongDate(spouse?.dob || '')}</td>
          </tr>
          <tr>
            <td>Pekerjaan</td>
            <td>: Mengurus Rumah Tangga</td>
          </tr>
          <tr>
            <td>No. KTP/Passport</td>
            <td>: {spouse?.ktpNumber || '…………………………………'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>: {data.applicant.address || '…………………………………'}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
        menyatakan dengan sebenarnya bahwa saya tidak memiliki pekerjaan dan saat ini sedang mengurus rumah tangga.
      </p>

      <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Mengetahui,</p>
          <p>Kepala Desa/Lurah,</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( ................................. )</p>
          <p style={{ fontSize: '9pt' }}>Nama lengkap dan jabatan</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>Pangkalpinang, {formatLongDate(dateOfDocument)}</p>
          <p>Yang membuat pernyataan,</p>
          <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ border: '1px solid #999', padding: '8px 16px', fontSize: '9pt', color: '#666' }}>Materai 10.000</div>
          </div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( {spouse?.fullName || '........................'} )</p>
          <p style={{ fontSize: '9pt' }}>Nama lengkap</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
