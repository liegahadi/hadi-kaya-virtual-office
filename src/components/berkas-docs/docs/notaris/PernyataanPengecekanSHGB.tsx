// PERNYATAAN PENGECEKAN SHGB
import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

function numberToWords(num: number): string {
  if (!num) return ''
  const u = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas']
  if (num < 12) return u[num]
  if (num < 20) return u[num-10]+' belas'
  if (num < 100) return u[Math.floor(num/10)]+' puluh'+(num%10?' '+u[num%10]:'')
  if (num < 200) return 'seratus'+(num-100>0?' '+numberToWords(num-100):'')
  if (num < 1000) return u[Math.floor(num/100)]+' ratus'+(num%100?' '+numberToWords(num%100):'')
  if (num < 2000) return 'seribu'+(num-1000>0?' '+numberToWords(num-1000):'')
  if (num < 1000000) return numberToWords(Math.floor(num/1000))+' ribu'+(num%1000?' '+numberToWords(num%1000):'')
  return ''
}

export function PernyataanPengecekanSHGB({ data }: { data: BerkasState }) {
  const { property, dateOfDocument } = data
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>SURAT PERNYATAAN</h2>
      </div>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Yang bertanda tangan dibawah ini, Kami:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{COMPANY_INFO.director}</strong> QQ PT. {COMPANY_INFO.name}</td></tr>
          <tr><td>NIK</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{(COMPANY_INFO as any).directorKtp || '...'}</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{COMPANY_INFO.city}</td></tr>
          <tr><td>Kewarganegaraan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Indonesia</td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Direktur</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Adalah pemilik tanah yang terletak di:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Desa/Kelurahan</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.certKelurahan || 'Jerambah Gantung'}</td></tr>
          <tr><td>Kecamatan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.certKecamatan || 'Gabek'}</td></tr>
          <tr><td>Kabupaten/Kota</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.certCity || 'Pangkalpinang'}</td></tr>
          <tr><td>Provinsi</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Kepulauan Bangka Belitung</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Keterangan mengenai Sertifikat:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nomor Blanko Sertipikat</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}></td></tr>
          <tr><td>Jenis/Nomor Hak</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Hak Guna Bangunan</td></tr>
          <tr><td>NIB</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.nibNumber || property.shmNumber || '...'}</td></tr>
          <tr><td>Luas</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.landSize || '...'} ({numberToWords(property.landSize || 0)} meter persegi)</td></tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Dengan ini menyatakan bahwa:</p>
      <p style={{ marginBottom: '10px', fontSize: '11pt', textAlign: 'justify', textIndent: '20px' }}>1. Sertifikat yang saya sampaikan dalam rangka Layanan Pengecekan adalah Asli yang diterbitkan oleh Kantor Pertanahan Kota Pangkalpinang dan nama yang tercantum dalam sertifikat tersebut merupakan nama pemegang hak yang sebenarnya.</p>
      <p style={{ marginBottom: '15px', fontSize: '11pt', textAlign: 'justify', textIndent: '20px' }}>2. Saya beritikad baik dan bertanggung jawab sepenuhnya atas penggunaan data yang diakses.</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt', textAlign: 'justify' }}>Demikianlah Surat Pernyataan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya, Apabila dalam pernyataan ini terdapat ketidakbenaran maka saya bertanggung jawab secara hukum.</p>
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <p style={{ fontSize: '11pt', marginRight: '60px' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '11pt', marginRight: '60px', marginBottom: '60px' }}>Yang Membuat Pernyataan</p>
        <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginRight: '60px' }}><strong>{COMPANY_INFO.director}</strong></p>
        <p style={{ fontSize: '11pt', marginRight: '60px' }}>QQ PT. {COMPANY_INFO.name}</p>
      </div>
    </DocumentLayout>
  )
}
