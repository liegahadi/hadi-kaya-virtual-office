// SURAT KUASA PENGECEKAN NOTARIS
import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

export function SuratKuasaNotaris({ data, notarisName, notarisAddress }: { data: BerkasState; notarisName?: string; notarisAddress?: string }) {
  const { property, dateOfDocument } = data
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>SURAT KUASA</h2>
      </div>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Yang bertandatangan dibawah ini, saya:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{COMPANY_INFO.director}</strong> QQ PT. {COMPANY_INFO.name}</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{COMPANY_INFO.city}</td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Direktur</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}><strong>Selanjutnya disebut "Pemberi Kuasa"</strong></p>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Dengan ini memberi kuasa dengan hak Substitusi, kepada:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{notarisName || '...'}</strong></td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Notaris-PPAT Di Kota Pangkalpinang</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{notarisAddress || '...'}</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}><strong>Selanjutnya disebut "Penerima Kuasa"</strong></p>
      <p style={{ marginBottom: '15px', fontSize: '11pt', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>K H U S U S</p>
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Mewakili untuk dan atas nama Pemberi kuasa, untuk:</p>
      <ol style={{ marginBottom: '15px', fontSize: '11pt', paddingLeft: '20px' }}>
        <li style={{ marginBottom: '5px' }}>Mendaftarkan Akta Pemberian Hak Tanggungan (APHT) atau meroya Hak Tanggungan.</li>
        <li style={{ marginBottom: '5px' }}>Melakukan Pengecekan Sertifikat/Perubahan Data Yuridis.</li>
        <li style={{ marginBottom: '5px' }}>Mengurus balik nama/pemecahan/pengukuran/penggantian sertipikat baru Menurut SK.Meneg Agraria nomor: 10 tahun 1993.</li>
      </ol>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Hak Guna Bangunan Nomor: <strong>{property.shmNumber || '...'}</strong> /Kel. {property.certKelurahan || 'Jerambah Gantung'}, Kec. {property.certKecamatan || 'Gabek'} Kota {property.certCity || 'Pangkalpinang'}</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt', textAlign: 'justify' }}>Mengenai hak ini, maka Penerima kuasa berhak dan berwenang untuk menghadap kepada siapapun juga, termasuk pejabat Kantor Pertanahan, memberi Keterangan-keterangan, menandatangani surat-surat, menyerahkan dan/atau menerima surat/bukti hak, meminta atau memberikan tanda bukti penerimaan (kwitansi) serta melakukan segala tindakan yang dianggap perlu dan selaras dengan Peraturan Hukum tanpa tindakan yang dikecualikan.</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikianlah surat kuasa ini diberikan pada hari ini, {formatDate(dateOfDocument)}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Penerima Kuasa,</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{notarisName || '...'}</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Pemberi Kuasa,</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}><strong>{COMPANY_INFO.director}</strong></p>
          <p style={{ fontSize: '10pt' }}>QQ PT. {COMPANY_INFO.name}</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
