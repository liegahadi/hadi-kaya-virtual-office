// BAST NOTARIS - Berita Acara Serah Terima Sertifikat Tanah
import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

export function BastNotaris({ data, notarisName }: { data: BerkasState; notarisName?: string }) {
  const { applicant, property, dateOfDocument } = data
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'
  const formatShortDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '...'

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline' }}>BERITA ACARA PENYERAHAN SERTIFIKAT TANAH</h2>
      </div>
      <p style={{ marginBottom: '15px', fontSize: '11pt', textAlign: 'justify' }}>
        Pada hari ini {formatDate(dateOfDocument)} ({formatShortDate(dateOfDocument)}), kami yang bertanda tangan dibawah ini:
      </p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '25%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{COMPANY_INFO.director}</strong></td></tr>
          <tr><td>Jabatan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Direktur</td></tr>
          <tr><td></td><td></td><td style={{ borderBottom: '1px dotted #000' }}>{COMPANY_INFO.name}</td></tr>
          <tr><td colSpan={3} style={{ fontSize: '10pt', fontStyle: 'italic' }}>Selanjutnya disebut PIHAK DEVELOPER</td></tr>
          <tr><td style={{ paddingTop: '10px' }}>Nama</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{notarisName || '...'}</td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Notaris Wilayah Pangkalpinang</td></tr>
          <tr><td colSpan={3} style={{ fontSize: '10pt', fontStyle: 'italic' }}>Selanjutnya disebut PIHAK NOTARIS</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Bahwa dengan ini Pihak Developer telah menyerahkan kepada Pihak Notaris dan Pihak Notaris menyatakan telah menerima 1 (Satu) buku Sertifikat Hak Guna Bangunan/Milik No <strong>{property.shmNumber || '...'}</strong> tanggal {property.certificateDate ? formatDate(property.certificateDate) : '...'} Desa/Kelurahan {property.certKelurahan || 'Jerambah Gantung'} Kecamatan {property.certKecamatan || 'Gabek'} Kota {property.certCity || 'Pangkalpinang'} tercatat atas nama <strong>{COMPANY_INFO.name}</strong>.
      </p>
      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Penyerahan 1 (Satu) buku sertifikat tersebut oleh Pihak Developer adalah untuk proses cek bersih (clearence), balik nama dan pemasangan hak tanggungan di Kantor Pertanahan dalam jangka waktu 3 (tiga) bulan sejak berita acara ini ditandatangani. Apabila telah selesai, maka Pihak Notaris akan segera mengembalikan sertifikat tersebut kepada Pihak Developer.
      </p>
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian berita acara penyerahan sertifikat ini dibuat untuk dapat dipergunakan seperlunya.</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Pihak Notaris</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{notarisName || '...'}</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>Pangkalpinang, {dateOfDocument ? new Date(dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' }) : '...'} {new Date().getFullYear()}</p>
          <p style={{ margin: '0 0 40px 0' }}>Pihak Developer</p>
          <p style={{ fontWeight: 'bold' }}>{COMPANY_INFO.name}</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '15px' }}><strong>{COMPANY_INFO.director}</strong></p>
        </div>
      </div>
    </DocumentLayout>
  )
}
